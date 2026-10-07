const fs = require("fs");
const path = require("path");

// 规则正文在 sibling rule-engine/01_rules，不在技能包里。
// 这里只做版本锁定校验。求值走 skill-runtime，它内部使用同一套 Evaluator。
const RULES_DIR = path.resolve(__dirname, "../rule-engine/01_rules");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".json")) out.push(full);
  });
  return out;
}

function loadRule(ruleId) {
  const files = walk(RULES_DIR);
  for (const file of files) {
    const rule = JSON.parse(fs.readFileSync(file, "utf8"));
    if (rule && rule.ruleId === ruleId) return rule;
  }
  throw new Error("规则不存在: " + ruleId);
}

function assertRulePin(ruleRef) {
  const matched = String(ruleRef || "").match(/^(.+)@(\d+\.\d+\.\d+)$/);
  if (!matched) throw new Error("ruleRef 不合法: " + ruleRef);
  const rule = loadRule(matched[1]);
  if (rule.version !== matched[2]) {
    throw new Error(
      `规则 ${matched[1]} 当前版本是 ${rule.version}，技能锁定 ${matched[2]}`,
    );
  }
  return rule;
}

module.exports = { loadRule, assertRulePin, RULES_DIR };
