export type SkillType = "rule-based" | "model-based";
export type PublishDecision = "allow" | "block" | "rollback";
export type FailureType = "decision" | "narration" | "fact" | "degradation";
export type MetricKey =
  | "decisionAcc"
  | "narrationCompliance"
  | "factConsistency"
  | "degradationBlock";

export interface Metric {
  score: number;
  threshold: number;
  passed: boolean;
  detail: string;
}

export interface FailedCaseSummary {
  caseId: string;
  title: string;
  expected: string;
  actual: string;
  failureType: FailureType;
  reason: string;
}

export interface SkillRecord {
  skillId: string;
  skillName: string;
  version: string;
  skillType: SkillType;
  owner: string;
  baselineRefs: string[];
}

export interface EvalRun {
  id: string;
  skillId: string;
  skillName: string;
  version: string;
  skillType: SkillType;
  owner: string;
  evaluatedAt: string;
  baselineRefs: string[];
  metrics: Record<MetricKey, Metric>;
  overallPassed: boolean;
  publishDecision: PublishDecision;
  failedCases: FailedCaseSummary[];
  latest?: boolean;
}

export interface CaseRow {
  caseId: string;
  title: string;
  expected: string;
  actual: string;
  decisionOk: boolean;
  narrationOk: boolean;
  factOk: boolean;
  degradationOk: boolean | null;
  facts: Record<string, string | number | boolean>;
  expectedOutput: string;
  actualOutput: string;
  narration: string;
  reasons: string[];
}

export interface BaselineItem {
  key: string;
  label: string;
  text: string;
}

export interface BaselineVersion {
  version: string;
  effectiveFrom: string;
  appliesTo: string[];
  note: string;
  items: BaselineItem[];
}

export interface BaselineDoc {
  baselineId: string;
  title: string;
  description: string;
  versions: BaselineVersion[];
}

export const METRIC_KEYS: MetricKey[] = [
  "decisionAcc",
  "narrationCompliance",
  "factConsistency",
  "degradationBlock",
];

export const METRIC_LABELS: Record<MetricKey, string> = {
  decisionAcc: "决定准确率",
  narrationCompliance: "讲解合规率",
  factConsistency: "事实一致性",
  degradationBlock: "降级拦截率",
};

export const FAILURE_LABELS: Record<FailureType, string> = {
  decision: "决定错误",
  narration: "讲解违规",
  fact: "事实不一致",
  degradation: "降级未拦截",
};
