import type { MetricKey, PublishDecision, SkillType } from "../types/eval";

export function formatTime(iso: string) {
  const text = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
  return text.replace(/\//g, "-");
}

export function formatDay(iso: string) {
  return formatTime(iso).slice(0, 10);
}

export function percent(score: number) {
  const value = Math.round(score * 1000) / 10;
  return Number.isInteger(value) ? `${value.toFixed(0)}%` : `${value}%`;
}

export function thresholdText(key: MetricKey, threshold: number) {
  const text = percent(threshold);
  if (key === "decisionAcc" && threshold < 1) return `≥${text}`;
  return `=${text}`;
}

export function skillTypeLabel(skillType: SkillType) {
  return skillType === "rule-based" ? "规则型" : "模型型";
}

export function decisionLabel(decision: PublishDecision) {
  if (decision === "allow") return "通过";
  if (decision === "block") return "阻断";
  return "回退";
}
