const fs = require("fs");
const path = require("path");
const { METRIC_KEYS, METRIC_LABELS, thresholdText } = require("./metrics");
const { PLATFORM_ROOT } = require("./loader");

function shanghaiParts(date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
}

function stamp(date = new Date()) {
  const parts = shanghaiParts(date);
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return {
    file: `${parts.year}${parts.month}${parts.day}-${hour}${parts.minute}${parts.second}`,
    display: `${parts.year}-${parts.month}-${parts.day} ${hour}:${parts.minute}:${parts.second}`,
    iso: date.toISOString().replace(/\.\d{3}Z$/, "Z"),
  };
}

function percent(detail) {
  const [passed, total] = detail.split("/").map(Number);
  if (!total) return "0%";
  return `${Math.round((passed / total) * 100)}%`;
}

function resultDocument(report, when) {
  return {
    skillId: report.skillId,
    version: report.version,
    skillType: report.skillType,
    evaluatedAt: when.iso,
    baselineRefs: report.baselineRefs,
    totalCases: report.totalCases,
    platformCases: report.platformCases,
    selfCases: report.selfCases,
    metrics: report.metrics,
    overallPassed: report.overallPassed,
    failedCases: report.failedCases,
    publishDecision: report.publishDecision,
    warnings: report.warnings,
  };
}

function reportMarkdown(report, when) {
  const header = METRIC_KEYS.map((key) => {
    const metric = report.metrics[key];
    const status = metric.passed ? "✅" : "❌";
    return `| ${METRIC_LABELS[key]} | ${percent(metric.detail)} (${metric.detail}) | ${thresholdText(key, metric.threshold)} | ${status} |`;
  }).join("\n");
  const deps = report.baselineRefs.map((ref) => `- ${ref}`).join("\n");
  const decision = report.overallPassed
    ? "✅ **通过**，允许发布。"
    : "❌ **不通过**，阻断发布。";
  const failed = report.failedCases.length
    ? report.failedCases
        .map((item) => {
          const reasons = item.reasons.map((reason) => `  - ${reason}`).join("\n");
          return `- **${item.id}**（${item.title}）\n${reasons}\n  - 讲解：${item.actual.narration}`;
        })
        .join("\n")
    : "无。";
  const warnings = report.warnings.length
    ? `\n## 加载警告\n\n${report.warnings.map((item) => `- ${item}`).join("\n")}\n`
    : "";
  return `# Eval 评测报告

**Skill**: ${report.skillId}
**版本**: ${report.version}
**评测时间**: ${when.display}
**评测类型**: ${report.skillType}

## 评测基准依赖

${deps}

## 评测结果

| 指标 | 得分 | 阈值 | 状态 |
|:---|:---|:---|:---|
${header}

## 发布建议

${decision}
${warnings}
## 失败用例

${failed}
`;
}

function write(report, date = new Date()) {
  const when = stamp(date);
  const base = `${report.skillId}-v${report.version}-${when.file}`;
  const resultAbs = path.join(PLATFORM_ROOT, "eval-results", `${base}.json`);
  const reportAbs = path.join(PLATFORM_ROOT, "eval-reports", `${base}.md`);
  fs.mkdirSync(path.dirname(resultAbs), { recursive: true });
  fs.mkdirSync(path.dirname(reportAbs), { recursive: true });
  fs.writeFileSync(
    resultAbs,
    JSON.stringify(resultDocument(report, when), null, 2) + "\n",
  );
  fs.writeFileSync(reportAbs, reportMarkdown(report, when));
  return {
    when,
    resultFile: path.relative(PLATFORM_ROOT, resultAbs),
    reportFile: path.relative(PLATFORM_ROOT, reportAbs),
  };
}

function detailCell(detail) {
  const text = detail.length >= 5 ? detail : detail.padStart(4).padEnd(5);
  return text;
}

function print(report, written) {
  const counts = report.counts;
  const line = "========================================";
  console.log(line);
  console.log(`Skill: ${report.skillId} v${report.version}`);
  console.log(`类型: ${report.skillType}`);
  console.log(
    `评测基准: ${counts.baselineDeps}个依赖，${counts.platform}条平台用例`,
  );
  const dropped = counts.selfFile - counts.selfKept;
  const selfLine =
    dropped > 0
      ? `自测集: ${counts.selfFile}条，纳入 ${counts.selfKept} 条`
      : `自测集: ${counts.selfKept}条`;
  console.log(selfLine);
  console.log(line);
  console.log("");
  METRIC_KEYS.forEach((key) => {
    const metric = report.metrics[key];
    const mark = metric.passed ? "✅" : "❌";
    const pct = percent(metric.detail).padStart(4);
    console.log(
      `[${METRIC_LABELS[key]}]   ${detailCell(metric.detail)} = ${pct} ${mark} (阈值${thresholdText(key, metric.threshold)})`,
    );
  });
  console.log("");
  console.log("----------------------------------------");
  console.log(
    report.overallPassed
      ? "总判定: ✅ 通过，可发布"
      : "总判定: ❌ 不通过，阻断发布",
  );
  console.log("----------------------------------------");
  if (report.failedCases.length) {
    console.log("失败用例:");
    report.failedCases.forEach((item) => {
      console.log(`- ${item.id}: ${item.reasons.join("；")}`);
    });
  }
  console.log(`报告已生成: ${written.reportFile}`);
  console.log(`结果已归档: ${written.resultFile}`);
}

module.exports = { write, print, stamp, reportMarkdown };
