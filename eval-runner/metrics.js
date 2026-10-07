const METRIC_KEYS = [
  "decisionAcc",
  "narrationCompliance",
  "factConsistency",
  "degradationBlock",
];

const METRIC_LABELS = {
  decisionAcc: "决定准确率",
  narrationCompliance: "讲解合规率",
  factConsistency: "事实一致性",
  degradationBlock: "降级拦截率",
};

const DEFAULT_THRESHOLDS = {
  "rule-based": {
    decisionAcc: 1,
    narrationCompliance: 1,
    factConsistency: 1,
    degradationBlock: 1,
  },
  "model-based": {
    decisionAcc: 0.9,
    narrationCompliance: 1,
    factConsistency: 1,
    degradationBlock: 1,
  },
};

function resolveThresholds(skillType, declared) {
  const defaults = DEFAULT_THRESHOLDS[skillType];
  if (!defaults) throw new Error("未知评测类型: " + skillType);
  const thresholds = { ...defaults, ...(declared || {}) };
  METRIC_KEYS.forEach((key) => {
    const value = Number(thresholds[key]);
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error("阈值不合法: " + key);
    }
    thresholds[key] = value;
  });
  return thresholds;
}

function meets(passed, total, threshold) {
  if (total === 0) return false;
  return passed / total + 1e-12 >= threshold;
}

function summarize(caseResults, thresholds) {
  const metrics = {};
  METRIC_KEYS.forEach((key) => {
    const subset =
      key === "degradationBlock"
        ? caseResults.filter((item) => item.degradationApplicable)
        : caseResults;
    const flag = {
      decisionAcc: "decisionOk",
      narrationCompliance: "narrationOk",
      factConsistency: "factOk",
      degradationBlock: "degradationOk",
    }[key];
    const passed = subset.filter((item) => item[flag]).length;
    const total = subset.length;
    const score = total === 0 ? 0 : passed / total;
    metrics[key] = {
      score,
      threshold: thresholds[key],
      passed: meets(passed, total, thresholds[key]),
      detail: `${passed}/${total}`,
    };
  });
  return metrics;
}

function thresholdText(key, threshold) {
  const pct = `${Math.round(threshold * 100)}%`;
  if (key === "decisionAcc" && threshold < 1) return `≥${pct}`;
  return `=${pct}`;
}

module.exports = {
  METRIC_KEYS,
  METRIC_LABELS,
  DEFAULT_THRESHOLDS,
  resolveThresholds,
  summarize,
  thresholdText,
};
