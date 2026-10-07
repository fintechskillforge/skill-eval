const fs = require("fs");
const path = require("path");

const PLATFORM_ROOT = path.resolve(__dirname, "..");
const BASELINE_DIR = path.join(PLATFORM_ROOT, "eval-baseline");
const SKILLS_DIR = path.join(PLATFORM_ROOT, "skills");
const REGISTRY_PATH = path.join(PLATFORM_ROOT, "field-registry.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function parseScalar(text) {
  if (text === "true") return true;
  if (text === "false") return false;
  if (text === "null" || text === "~") return null;
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text);
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function parseYaml(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return null;
      return { indent: line.match(/^ */)[0].length, text: trimmed };
    })
    .filter(Boolean);

  function parseBlock(start, indent) {
    if (
      lines[start] &&
      lines[start].indent === indent &&
      lines[start].text.startsWith("- ")
    ) {
      const list = [];
      let index = start;
      while (
        index < lines.length &&
        lines[index].indent === indent &&
        lines[index].text.startsWith("- ")
      ) {
        list.push(parseScalar(lines[index].text.slice(2).trim()));
        index += 1;
      }
      return { value: list, next: index };
    }
    const obj = {};
    let index = start;
    while (index < lines.length && lines[index].indent === indent) {
      const matched = lines[index].text.match(/^([^:]+):\s*(.*)$/);
      if (!matched) throw new Error("无法解析 YAML: " + lines[index].text);
      const key = matched[1].trim();
      const rest = matched[2].trim();
      index += 1;
      if (!rest) {
        if (!lines[index] || lines[index].indent <= indent) {
          obj[key] = {};
          continue;
        }
        const child = parseBlock(index, lines[index].indent);
        obj[key] = child.value;
        index = child.next;
      } else {
        obj[key] = parseScalar(rest);
      }
    }
    return { value: obj, next: index };
  }

  if (!lines.length) return {};
  return parseBlock(0, lines[0].indent).value;
}

function loadRegistry() {
  const registry = readJson(REGISTRY_PATH);
  if (!registry.fields) throw new Error("field-registry.json 缺少 fields");
  return registry;
}

function assertField(name, registry) {
  if (!registry.fields[name]) {
    throw new Error(`error: field ${name} not found in registry`);
  }
}

function assertFactFields(facts, registry) {
  Object.keys(facts || {}).forEach((name) => assertField(name, registry));
}

function parseRef(ref) {
  const matched = String(ref).match(/^([a-z0-9/-]+)@(\d+\.\d+\.\d+)$/);
  if (!matched || matched[1].includes("..")) {
    throw new Error("baselineRef 不合法: " + ref);
  }
  return { id: matched[1], version: matched[2] };
}

function loadBaseline(ref) {
  const parsed = parseRef(ref);
  const file = path.join(BASELINE_DIR, parsed.id + ".json");
  if (!fs.existsSync(file)) throw new Error("评测基准不存在: " + ref);
  const baseline = readJson(file);
  if (baseline.baselineId !== parsed.id) {
    throw new Error(`评测基准 ${ref} 的 baselineId 是 ${baseline.baselineId}`);
  }
  if (baseline.version !== parsed.version) {
    throw new Error(
      `评测基准 ${parsed.id} 当前版本是 ${baseline.version}，技能锁定 ${parsed.version}`,
    );
  }
  return baseline;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        if (value[key] !== undefined) acc[key] = stable(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function contentKey(testCase) {
  return JSON.stringify(
    stable({
      facts: testCase.facts,
      expect: testCase.expect,
      sources: testCase.sources,
      cumulativeAvailable:
        testCase.cumulativeAvailable === undefined
          ? null
          : testCase.cumulativeAvailable,
    }),
  );
}

function normalizeCase(raw, meta) {
  if (!raw || !raw.id) throw new Error("用例缺少 id");
  const facts = raw.facts ? { ...raw.facts } : {};
  [
    "payment_amount",
    "cumulative_amount",
    "counterparty_country",
    "customer_risk_level",
    "fund_code",
  ].forEach((key) => {
    if (raw[key] != null && facts[key] == null) facts[key] = raw[key];
  });
  const shorthand =
    !raw.facts &&
    (raw.payment_amount != null || raw.cumulative_amount != null);
  if (shorthand) {
    if (facts.payment_amount == null) facts.payment_amount = 100000;
    if (facts.cumulative_amount == null && raw.cumulativeAvailable !== false) {
      facts.cumulative_amount = 0;
    }
    if (facts.counterparty_country == null) facts.counterparty_country = "US";
    if (facts.customer_risk_level == null) facts.customer_risk_level = "R4";
  }
  if (raw.cumulativeAvailable === false) delete facts.cumulative_amount;

  let expect;
  if (typeof raw.expect === "string") expect = { decision: raw.expect };
  else expect = { ...(raw.expect || {}) };
  if (!Object.prototype.hasOwnProperty.call(expect, "decision")) {
    throw new Error("用例缺少 expect.decision: " + raw.id);
  }

  const tags = [...(raw.tags || [])];
  if (raw.cumulativeAvailable === false && !tags.includes("degradation")) {
    tags.push("degradation");
  }
  if (raw.degradation === true && !tags.includes("degradation")) {
    tags.push("degradation");
  }

  return {
    id: String(raw.id),
    title: raw.title || String(raw.id),
    facts,
    expect,
    sources: raw.sources || null,
    cumulativeAvailable: raw.cumulativeAvailable,
    tags,
    origin: meta.origin,
    baselineId: meta.baselineId || null,
  };
}

function listSkillIds() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(SKILLS_DIR, name, "skill.yaml")))
    .sort();
}

function load(skillId) {
  const skillDir = path.join(SKILLS_DIR, skillId);
  const yamlPath = path.join(skillDir, "skill.yaml");
  if (!fs.existsSync(yamlPath)) throw new Error("技能不存在: " + skillId);
  const skill = parseYaml(fs.readFileSync(yamlPath, "utf8"));
  const meta = skill.meta || {};
  if (meta.skillId !== skillId) {
    throw new Error(`skill.yaml 的 skillId 是 ${meta.skillId}，目录是 ${skillId}`);
  }
  const evalConfig = skill.eval || {};
  const refs = evalConfig.baselineRefs || [];
  if (!refs.length) throw new Error(skillId + " 没有声明 baselineRefs");

  const registry = loadRegistry();
  const mustNot = [];
  const sensitive = [];
  const factRules = [];
  const degradeRules = [];
  const platformCases = [];
  const seenPlatform = new Map();

  refs.forEach((ref) => {
    const baseline = loadBaseline(ref);
    (baseline.words || []).forEach((word) => {
      if (!mustNot.includes(word)) mustNot.push(word);
    });
    (baseline.fields || []).forEach((field) => {
      assertField(field.fieldId, registry);
      sensitive.push(field);
    });
    (baseline.rules || []).forEach((rule) => {
      if (rule.source) factRules.push(rule);
      else if (rule.condition) degradeRules.push(rule);
    });
    (baseline.cases || []).forEach((raw) => {
      const testCase = normalizeCase(raw, {
        origin: "platform",
        baselineId: baseline.baselineId,
      });
      assertFactFields(testCase.facts, registry);
      Object.keys(testCase.sources || {}).forEach((name) =>
        assertField(name, registry),
      );
      if (seenPlatform.has(testCase.id)) {
        throw new Error("平台基准用例 id 重复: " + testCase.id);
      }
      seenPlatform.set(testCase.id, testCase);
      platformCases.push(testCase);
    });
  });

  const selfPath = path.join(skillDir, evalConfig.selfEvalPath || "eval-cases.json");
  if (!fs.existsSync(selfPath)) throw new Error("作者自测集不存在: " + selfPath);
  const selfRaw = readJson(selfPath);
  if (!Array.isArray(selfRaw)) throw new Error("作者自测集必须是数组");

  const warnings = [];
  const selfCases = [];
  const seenSelf = new Set();
  selfRaw.forEach((raw) => {
    const testCase = normalizeCase(raw, { origin: "self", baselineId: null });
    assertFactFields(testCase.facts, registry);
    Object.keys(testCase.sources || {}).forEach((name) =>
      assertField(name, registry),
    );
    if (seenSelf.has(testCase.id)) {
      throw new Error("自测集用例 id 重复: " + testCase.id);
    }
    seenSelf.add(testCase.id);
    const platformCase = seenPlatform.get(testCase.id);
    if (platformCase) {
      if (contentKey(platformCase) !== contentKey(testCase)) {
        warnings.push(
          `自测集用例 ${testCase.id} 与平台基准同 id 但内容不同，采用平台基准版本`,
        );
      }
      return;
    }
    selfCases.push(testCase);
  });

  return {
    skillId,
    version: String(meta.version),
    domain: meta.domain || "",
    skillType: evalConfig.skillType,
    ruleRef: (skill.collab || {}).ruleRef,
    baselineRefs: refs,
    thresholds: evalConfig.thresholds || {},
    mustNot,
    sensitive,
    factRules,
    degradeRules,
    cases: platformCases.concat(selfCases),
    counts: {
      platform: platformCases.length,
      selfKept: selfCases.length,
      selfFile: selfRaw.length,
      baselineDeps: refs.length,
    },
    warnings,
  };
}

module.exports = {
  PLATFORM_ROOT,
  load,
  listSkillIds,
  parseYaml,
  normalizeCase,
  contentKey,
};
