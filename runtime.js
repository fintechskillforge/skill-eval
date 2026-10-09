const path = require("path");
const SKILL_RUNTIME = path.resolve(__dirname, "../skill-runtime");
const { decide, loadSkill } = require(path.join(SKILL_RUNTIME, "src/runtime"));
const narrators = require(path.join(SKILL_RUNTIME, "src/narration"));
const { assertRulePin } = require("./rule-engine");

// 门禁里的技能名和运行时目录名不必相同。基金诊断的运行时实现仍是 wealth-fund-diagnosis。
const RUNTIME_SKILL = {
  "aml-large-transfer": "aml-large-transfer",
  "fund-diagnosis": "wealth-fund-diagnosis",
};

function templateNarrate(runtimeId, result) {
  const narrator = narrators[runtimeId];
  if (!narrator) throw new Error("没有讲解模板: " + runtimeId);
  return narrator.narrate(result, result.facts);
}

// 模型网关还没接。基金诊断用固定模板模拟模型：只许引用算子和规则已经给出的值。
function mockModelNarrate(runtimeId, result) {
  return templateNarrate(runtimeId, result);
}

async function execute(skillId, input = {}) {
  const runtimeId = RUNTIME_SKILL[skillId];
  if (!runtimeId) throw new Error("技能尚未接入运行时: " + skillId);
  assertRulePin(input.ruleRef);
  const loaded = loadSkill(runtimeId);
  const facts = { ...(input.facts || {}) };
  const sources = { ...(input.sources || {}) };
  if (input.cumulativeAvailable === false) {
    delete facts.cumulative_amount;
    sources.cumulative_amount = "missing";
  }
  // 用例里写的算子类事实（如 cumulative_amount）是固化值，评测不连数据源，基准不随算子漂移
  const actual = await decide(loaded, { facts, sources }, { fixtureFacts: facts });
  const narration =
    input.skillType === "model-based"
      ? mockModelNarrate(runtimeId, actual)
      : templateNarrate(runtimeId, actual);
  return {
    decision: actual.decision,
    code: actual.code,
    narration,
    outputs: actual.outputs || {},
    facts: actual.facts || facts,
  };
}

module.exports = { execute, mockModelNarrate, RUNTIME_SKILL };
