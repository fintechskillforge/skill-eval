const { execute } = require("../runtime");
const { resolveThresholds, summarize } = require("./metrics");

function readSource(facts, source) {
  const matched = String(source || "").match(/^facts\.([A-Za-z0-9_]+)$/);
  if (!matched) return undefined;
  return facts[matched[1]];
}

function hasNumber(text, value) {
  const token = String(value);
  return new RegExp(`(?<!\\d)${token}(?!\\d)`).test(text);
}

function conditionMatches(condition, testCase) {
  const matched = String(condition).match(/^(\w+)\s*===\s*(.+)$/);
  if (!matched) return false;
  let expected = matched[2].trim();
  if (expected === "false") expected = false;
  else if (expected === "true") expected = true;
  else if (expected === "null") expected = null;
  else expected = expected.replace(/^['"]|['"]$/g, "");
  return testCase[matched[1]] === expected;
}

function expectMatches(expression, actual) {
  const matched = String(expression).match(/^(\w+)\s*===\s*'([^']*)'$/);
  if (!matched) return false;
  return String(actual[matched[1]]) === matched[2];
}

function isDegradation(testCase) {
  return (testCase.tags || []).includes("degradation");
}

function checkDecision(testCase, actual) {
  if (actual.decision !== testCase.expect.decision) {
    return `decision 应为 ${String(testCase.expect.decision)}，实际 ${String(actual.decision)}`;
  }
  if (
    testCase.expect.code != null &&
    actual.code !== testCase.expect.code
  ) {
    return `code 应为 ${testCase.expect.code}，实际 ${String(actual.code)}`;
  }
  return "";
}

function checkNarration(text, testCase, bundle) {
  const problems = [];
  if (!text) problems.push("讲解为空");
  bundle.mustNot.forEach((word) => {
    if (text.includes(word)) problems.push(`讲解含禁止词「${word}」`);
  });
  bundle.sensitive.forEach((field) => {
    const raw = testCase.facts[field.fieldId];
    if (raw == null || raw === "") return;
    if (text.includes(String(raw))) {
      problems.push(`讲解回显敏感字段 ${field.fieldId}`);
    }
  });
  return problems;
}

function checkFacts(text, testCase, actual, bundle) {
  const problems = [];
  const facts = { ...testCase.facts, ...(actual.facts || {}) };
  const degradation = isDegradation(testCase);
  bundle.factRules.forEach((rule) => {
    const value = readSource(facts, rule.source);
    if (value == null || value === "") return;
    if (rule.field === "amount") {
      const cited = text.match(/单笔\s*(\d+(?:\.\d+)?)/);
      if (cited && Number(cited[1]) !== Number(value)) {
        problems.push(`单笔金额 ${cited[1]} 与事实 ${value} 不一致`);
      }
      if (!degradation && !hasNumber(text, value)) {
        problems.push(`讲解未写明单笔金额 ${value}`);
      }
    } else if (rule.field === "country") {
      const cited = text.match(/对手方\s*([A-Z]{2})/);
      if (cited && cited[1] !== String(value)) {
        problems.push(`对手方 ${cited[1]} 与事实 ${value} 不一致`);
      }
    } else if (rule.field === "risk_level") {
      const customer = [
        ...text.matchAll(/客户风险等级\s*([CR][1-5])/g),
      ].map((item) => item[1]);
      customer.forEach((token) => {
        if (token !== String(value)) {
          problems.push(`客户风险等级 ${token} 与事实 ${value} 不一致`);
        }
      });
      const generic = [
        ...text.matchAll(/(?<!客户)(?<!基金)风险等级\s*([CR][1-5])/g),
      ].map((item) => item[1]);
      generic.forEach((token) => {
        if (token !== String(value)) {
          problems.push(`风险等级 ${token} 与事实 ${value} 不一致`);
        }
      });
      if (facts.fund_risk_level != null) {
        const fundRisk = [
          ...text.matchAll(/基金风险等级\s*([CR][1-5])/g),
        ].map((item) => item[1]);
        fundRisk.forEach((token) => {
          if (token !== String(facts.fund_risk_level)) {
            problems.push(
              `基金风险等级 ${token} 与事实 ${facts.fund_risk_level} 不一致`,
            );
          }
        });
      }
    }
  });
  const cumulative = text.match(/当日累计\s*(\d+(?:\.\d+)?)/);
  if (
    cumulative &&
    facts.cumulative_amount != null &&
    Number(cumulative[1]) !== Number(facts.cumulative_amount)
  ) {
    problems.push(
      `当日累计 ${cumulative[1]} 与事实 ${facts.cumulative_amount} 不一致`,
    );
  }
  return problems;
}

function checkDegradation(text, testCase, actual, bundle) {
  if (!isDegradation(testCase)) {
    return { applicable: false, ok: true, problems: [] };
  }
  const problems = [];
  bundle.degradeRules.forEach((rule) => {
    if (!conditionMatches(rule.condition, testCase)) return;
    if (!expectMatches(rule.expect, actual)) {
      problems.push(`降级规则未满足 ${rule.expect}`);
    }
    (rule.mustNotNarrate || []).forEach((word) => {
      if (text.includes(word)) problems.push(`降级讲解含「${word}」`);
    });
  });
  if (actual.decision !== testCase.expect.decision) {
    problems.push(
      `降级 decision 应为 ${String(testCase.expect.decision)}，实际 ${String(actual.decision)}`,
    );
  }
  return { applicable: true, ok: problems.length === 0, problems };
}

async function run(bundle, options = {}) {
  const thresholds = resolveThresholds(bundle.skillType, bundle.thresholds);
  const caseResults = [];
  for (const testCase of bundle.cases) {
    const actual = await execute(bundle.skillId, {
      facts: testCase.facts,
      sources: testCase.sources || {},
      cumulativeAvailable: testCase.cumulativeAvailable,
      ruleRef: bundle.ruleRef,
      skillType: bundle.skillType,
    });
    const text = actual.narration || "";
    const decisionProblem = checkDecision(testCase, actual);
    const narrationProblems = checkNarration(text, testCase, bundle);
    const factProblems = checkFacts(text, testCase, actual, bundle);
    const degradation = checkDegradation(text, testCase, actual, bundle);
    const reasons = [
      decisionProblem,
      ...narrationProblems,
      ...factProblems,
      ...degradation.problems,
    ].filter(Boolean);
    const row = {
      id: testCase.id,
      title: testCase.title,
      origin: testCase.origin,
      baselineId: testCase.baselineId,
      decisionOk: !decisionProblem,
      narrationOk: narrationProblems.length === 0 && Boolean(text),
      factOk: factProblems.length === 0 && Boolean(text),
      degradationApplicable: degradation.applicable,
      degradationOk: degradation.ok,
      expect: testCase.expect,
      actual: {
        decision: actual.decision,
        code: actual.code,
        narration: text,
      },
      reasons,
    };
    caseResults.push(row);
    if (options.verbose) {
      const mark = reasons.length ? "FAIL" : "pass";
      console.log(
        `[${mark}] ${row.id}  decision=${String(actual.decision)}  ${reasons.join("；")}`,
      );
    }
  }

  const metrics = summarize(caseResults, thresholds);
  const overallPassed = Object.values(metrics).every((item) => item.passed);
  const failedCases = caseResults
    .filter((item) => item.reasons.length)
    .map((item) => ({
      id: item.id,
      title: item.title,
      origin: item.origin,
      expect: item.expect,
      actual: {
        decision: item.actual.decision,
        code: item.actual.code,
        narration: item.actual.narration,
      },
      reasons: item.reasons,
    }));

  return {
    skillId: bundle.skillId,
    version: bundle.version,
    skillType: bundle.skillType,
    baselineRefs: bundle.baselineRefs,
    counts: bundle.counts,
    warnings: bundle.warnings,
    totalCases: caseResults.length,
    platformCases: bundle.counts.platform,
    selfCases: bundle.counts.selfKept,
    metrics,
    overallPassed,
    failedCases,
    publishDecision: overallPassed ? "allow" : "block",
    caseResults,
  };
}

module.exports = { run };
