import type {
  EvalRun,
  Metric,
  MetricKey,
  SkillRecord,
} from "../types/eval";

const amlRefs = [
  "compliance/must-not-words@1.2.0",
  "compliance/sensitive-fields@1.0.0",
  "common/fact-consistency@1.0.0",
  "common/degradation@1.0.0",
  "domain/payment/aml-boundary@1.0.0",
];

const fundRefs = [
  "compliance/must-not-words@1.2.0",
  "compliance/sensitive-fields@1.0.0",
  "common/fact-consistency@1.0.0",
  "common/degradation@1.0.0",
  "domain/fund/diagnosis-standard@1.0.0",
];

export const skills: SkillRecord[] = [
  {
    skillId: "aml-large-transfer",
    skillName: "反洗钱大额转账",
    version: "1.0.2",
    skillType: "rule-based",
    owner: "合规部",
    baselineRefs: amlRefs,
  },
  {
    skillId: "fund-diagnosis",
    skillName: "基金智能诊断",
    version: "1.0.0",
    skillType: "model-based",
    owner: "投研",
    baselineRefs: fundRefs,
  },
  {
    skillId: "payment-limit",
    skillName: "支付限额",
    version: "0.1.0",
    skillType: "rule-based",
    owner: "支付",
    baselineRefs: [],
  },
];

function metric(
  passedCount: number,
  total: number,
  threshold: number,
): Metric {
  const score = total === 0 ? 0 : passedCount / total;
  return {
    score,
    threshold,
    passed: total > 0 && score + 1e-12 >= threshold,
    detail: `${passedCount}/${total}`,
  };
}

function metrics(input: Record<MetricKey, [number, number, number]>) {
  return {
    decisionAcc: metric(...input.decisionAcc),
    narrationCompliance: metric(...input.narrationCompliance),
    factConsistency: metric(...input.factConsistency),
    degradationBlock: metric(...input.degradationBlock),
  };
}

export const reports: EvalRun[] = [
  {
    id: "aml-large-transfer-v1.0.1-20260930",
    skillId: "aml-large-transfer",
    skillName: "反洗钱大额转账",
    version: "1.0.1",
    skillType: "rule-based",
    owner: "合规部",
    evaluatedAt: "2026-09-30T02:00:00Z",
    baselineRefs: amlRefs,
    metrics: metrics({
      decisionAcc: [3, 4, 1],
      narrationCompliance: [4, 4, 1],
      factConsistency: [4, 4, 1],
      degradationBlock: [1, 1, 1],
    }),
    overallPassed: false,
    publishDecision: "rollback",
    failedCases: [
      {
        caseId: "boundary-500000",
        title: "单笔刚好 50 万",
        expected: "reject",
        actual: "allow",
        failureType: "decision",
        reason: "预期拒绝，实际放行",
      },
    ],
  },
  {
    id: "aml-large-transfer-v1.0.2-20261001",
    skillId: "aml-large-transfer",
    skillName: "反洗钱大额转账",
    version: "1.0.2",
    skillType: "rule-based",
    owner: "合规部",
    evaluatedAt: "2026-10-01T02:00:00Z",
    baselineRefs: amlRefs,
    metrics: metrics({
      decisionAcc: [10, 10, 1],
      narrationCompliance: [10, 10, 1],
      factConsistency: [10, 10, 1],
      degradationBlock: [1, 1, 1],
    }),
    overallPassed: true,
    publishDecision: "allow",
    failedCases: [],
  },
  {
    id: "fund-diagnosis-v1.0.0-20261002",
    skillId: "fund-diagnosis",
    skillName: "基金智能诊断",
    version: "1.0.0",
    skillType: "model-based",
    owner: "投研",
    evaluatedAt: "2026-10-02T02:00:00Z",
    baselineRefs: fundRefs,
    metrics: metrics({
      decisionAcc: [2, 4, 0.9],
      narrationCompliance: [4, 4, 1],
      factConsistency: [4, 4, 1],
      degradationBlock: [0, 1, 1],
    }),
    overallPassed: false,
    publishDecision: "block",
    failedCases: [
      {
        caseId: "risk-missing",
        title: "风险等级缺失仍给了匹配",
        expected: "unknown",
        actual: "match",
        failureType: "degradation",
        reason: "降级未拦截",
      },
      {
        caseId: "mismatch-growth",
        title: "成长股票 R4 对客户 C3",
        expected: "mismatch",
        actual: "match",
        failureType: "decision",
        reason: "预期不匹配，实际写成匹配",
      },
    ],
  },
  {
    id: "aml-large-transfer-v1.0.2-20261003",
    skillId: "aml-large-transfer",
    skillName: "反洗钱大额转账",
    version: "1.0.2",
    skillType: "rule-based",
    owner: "合规部",
    evaluatedAt: "2026-10-03T02:00:00Z",
    baselineRefs: amlRefs,
    metrics: metrics({
      decisionAcc: [10, 10, 1],
      narrationCompliance: [10, 10, 1],
      factConsistency: [10, 10, 1],
      degradationBlock: [1, 1, 1],
    }),
    overallPassed: true,
    publishDecision: "allow",
    failedCases: [],
  },
  {
    id: "aml-large-transfer-v1.0.2-20261004",
    skillId: "aml-large-transfer",
    skillName: "反洗钱大额转账",
    version: "1.0.2",
    skillType: "rule-based",
    owner: "合规部",
    evaluatedAt: "2026-10-04T02:00:00Z",
    baselineRefs: amlRefs,
    metrics: metrics({
      decisionAcc: [10, 10, 1],
      narrationCompliance: [10, 10, 1],
      factConsistency: [10, 10, 1],
      degradationBlock: [1, 1, 1],
    }),
    overallPassed: true,
    publishDecision: "allow",
    failedCases: [],
  },
  {
    id: "fund-diagnosis-v1.0.0-20261005",
    skillId: "fund-diagnosis",
    skillName: "基金智能诊断",
    version: "1.0.0",
    skillType: "model-based",
    owner: "投研",
    evaluatedAt: "2026-10-05T02:00:00Z",
    baselineRefs: fundRefs,
    metrics: metrics({
      decisionAcc: [4, 4, 0.9],
      narrationCompliance: [3, 4, 1],
      factConsistency: [4, 4, 1],
      degradationBlock: [1, 1, 1],
    }),
    overallPassed: false,
    publishDecision: "block",
    failedCases: [
      {
        caseId: "narration-guarantee",
        title: "货币基金讲解写了保本",
        expected: "match",
        actual: "match",
        failureType: "narration",
        reason: "讲解含禁止词「保本」",
      },
    ],
  },
  {
    id: "aml-large-transfer-v1.0.2-20261006",
    skillId: "aml-large-transfer",
    skillName: "反洗钱大额转账",
    version: "1.0.2",
    skillType: "rule-based",
    owner: "合规部",
    evaluatedAt: "2026-10-06T15:30:00Z",
    baselineRefs: amlRefs,
    metrics: metrics({
      decisionAcc: [10, 10, 1],
      narrationCompliance: [10, 10, 1],
      factConsistency: [10, 10, 1],
      degradationBlock: [1, 1, 1],
    }),
    overallPassed: true,
    publishDecision: "allow",
    failedCases: [],
    latest: true,
  },
  {
    id: "fund-diagnosis-v1.0.0-20261006",
    skillId: "fund-diagnosis",
    skillName: "基金智能诊断",
    version: "1.0.0",
    skillType: "model-based",
    owner: "投研",
    evaluatedAt: "2026-10-06T15:30:00Z",
    baselineRefs: fundRefs,
    metrics: metrics({
      decisionAcc: [14, 15, 0.9],
      narrationCompliance: [15, 15, 1],
      factConsistency: [15, 15, 1],
      degradationBlock: [1, 1, 1],
    }),
    overallPassed: true,
    publishDecision: "allow",
    failedCases: [
      {
        caseId: "fund-case-008",
        title: "持仓为空时未正确提示",
        expected: "allow",
        actual: "reject",
        failureType: "decision",
        reason: "预期放行，实际拒绝",
      },
    ],
    latest: true,
  },
];

export const evalResults = reports.filter((item) => item.latest);

export function latestOf(skillId: string) {
  return [...reports]
    .reverse()
    .find((item) => item.skillId === skillId && item.latest);
}

export function reportOf(reportId: string) {
  return reports.find((item) => item.id === reportId);
}

export function dailyPassRate() {
  const byDay = new Map<string, { pass: number; total: number }>();
  reports.forEach((item) => {
    const day = item.evaluatedAt.slice(0, 10);
    const cell = byDay.get(day) || { pass: 0, total: 0 };
    cell.total += 1;
    if (item.overallPassed) cell.pass += 1;
    byDay.set(day, cell);
  });
  return [...byDay.entries()].sort().map(([date, cell]) => ({
    date: date.slice(5),
    rate: cell.pass / cell.total,
    detail: `${cell.pass}/${cell.total}`,
  }));
}
