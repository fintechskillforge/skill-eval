// 调真实算子构造用例事实。只在固化用例时用（npm run fixtures:*），评测运行时不调算子：
// 算子一改、测试数据跟着悄悄变，评测还照样「通过」，基准就失去意义了。
const path = require("path");

const SKILL_RUNTIME = path.resolve(__dirname, "../../skill-runtime");
const { loadSkill } = require(path.join(SKILL_RUNTIME, "src/runtime"));
const operatorsClient = require(path.join(SKILL_RUNTIME, "src/operators-client"));
const { RUNTIME_SKILL } = require("../runtime");

function bindingInput(spec, facts) {
  const out = {};
  Object.entries(spec || {}).forEach(([key, expr]) => {
    const m = /^\$\{facts\.([A-Za-z0-9_]+)\}$/.exec(String(expr));
    const value = m ? facts[m[1]] : expr;
    if (value != null && value !== "") out[key] = value;
  });
  return out;
}

// caseDef: { skillId, facts }。按技能场景契约里 source=operator 的绑定逐个调算子，
// 返回补齐后的 facts 和每个事实的来源（算子、数据日期、traceId）。
async function buildFacts(caseDef) {
  const runtimeId = RUNTIME_SKILL[caseDef.skillId];
  if (!runtimeId) throw new Error(`技能尚未接入运行时：${caseDef.skillId}`);
  const status = operatorsClient.status();
  if (!status.ok) throw new Error(status.error);

  const { sceneRule } = loadSkill(runtimeId);
  const bindings = (sceneRule && sceneRule.factBindings) || {};
  const facts = { ...(caseDef.facts || {}) };
  const provenance = [];
  for (const [fact, binding] of Object.entries(bindings)) {
    if (!binding || binding.source !== "operator") continue;
    const [operatorId, version] = String(binding.operatorRef).split("@");
    const traceId = caseDef.traceId || operatorsClient.newTraceId();
    let res;
    try {
      res = await operatorsClient.callOperator(operatorId, version, bindingInput(binding.input, facts), {
        caller: "eval",
        traceId,
      });
    } catch (err) {
      const wrapped = new Error(`用例 ${caseDef.id || ""} 取 ${fact} 失败：${err.code || ""} ${err.message}`);
      wrapped.code = err.code;
      throw wrapped;
    }
    facts[fact] = res.facts[fact];
    provenance.push({
      fact,
      operator: binding.operatorRef,
      asOf: res.meta.asOf,
      freshness: res.meta.freshness,
      traceId: res.meta.traceId,
    });
  }
  return { facts, provenance };
}

module.exports = { buildFacts };
