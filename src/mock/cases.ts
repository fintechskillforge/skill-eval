import type { CaseRow } from "../types/eval";

export const mustNotWords = [
  "保证",
  "一定通过",
  "可以转账",
  "已放行",
  "稳赚",
  "保本",
  "推荐买入",
];

function pass(
  input: Omit<CaseRow, "decisionOk" | "narrationOk" | "factOk" | "degradationOk" | "reasons"> & {
    degradationOk?: boolean | null;
  },
): CaseRow {
  return {
    ...input,
    degradationOk: input.degradationOk ?? null,
    decisionOk: true,
    narrationOk: true,
    factOk: true,
    reasons: [],
  };
}

const amlCases: CaseRow[] = [
  pass({
    caseId: "boundary-499999",
    title: "差 1 元不到 50 万",
    expected: "allow",
    actual: "allow",
    facts: { payment_amount: 499999, cumulative_amount: 0, counterparty_country: "US", customer_risk_level: "R4" },
    expectedOutput: "allow",
    actualOutput: "allow",
    narration: "单笔 499999 元，当日累计 0 元，未命中大额复合规则，放行。",
  }),
  pass({
    caseId: "boundary-500000",
    title: "单笔刚好 50 万，境外且高风险",
    expected: "reject",
    actual: "reject",
    facts: { payment_amount: 500000, cumulative_amount: 0, counterparty_country: "US", customer_risk_level: "R4" },
    expectedOutput: "reject",
    actualOutput: "reject",
    narration: "单笔 500000 元，当日累计 0 元，对手方 US，风险等级 R4，需人工审核，不能直接转出。",
  }),
  pass({
    caseId: "boundary-cumulative-1999999",
    title: "累计差 1 元不到 200 万",
    expected: "allow",
    actual: "allow",
    facts: { payment_amount: 100000, cumulative_amount: 1999999, counterparty_country: "US", customer_risk_level: "R4" },
    expectedOutput: "allow",
    actualOutput: "allow",
    narration: "单笔 100000 元，当日累计 1999999 元，未命中大额复合规则，放行。",
  }),
  pass({
    caseId: "boundary-cumulative-2000000",
    title: "累计刚好 200 万，高风险",
    expected: "reject",
    actual: "reject",
    facts: { payment_amount: 100000, cumulative_amount: 2000000, counterparty_country: "US", customer_risk_level: "R4" },
    expectedOutput: "reject",
    actualOutput: "reject",
    narration: "单笔 100000 元，当日累计 2000000 元，对手方 US，风险等级 R4，需人工审核。",
  }),
  pass({
    caseId: "hit-600000-us-r4",
    title: "60 万、美国、R4",
    expected: "reject",
    actual: "reject",
    facts: { payment_amount: 600000, cumulative_amount: 100000, counterparty_country: "US", customer_risk_level: "R4" },
    expectedOutput: "reject",
    actualOutput: "reject",
    narration: "单笔 600000 元，对手方 US，风险等级 R4，需人工审核，不能直接转出。",
  }),
  pass({
    caseId: "below-80000",
    title: "8 万，未到单笔门槛",
    expected: "allow",
    actual: "allow",
    facts: { payment_amount: 80000, cumulative_amount: 100000, counterparty_country: "US", customer_risk_level: "R4" },
    expectedOutput: "allow",
    actualOutput: "allow",
    narration: "单笔 80000 元，当日累计 100000 元，未命中大额复合规则，放行。",
  }),
  pass({
    caseId: "hk-low-risk-large",
    title: "60 万但对手方香港、风险低",
    expected: "allow",
    actual: "allow",
    facts: { payment_amount: 600000, cumulative_amount: 100000, counterparty_country: "HK", customer_risk_level: "R1" },
    expectedOutput: "allow",
    actualOutput: "allow",
    narration: "单笔 600000 元，当日累计 100000 元，未命中大额复合规则，放行。",
  }),
  pass({
    caseId: "cumulative-unavailable",
    title: "当日累计取不到",
    expected: "blocked",
    actual: "blocked",
    degradationOk: true,
    facts: { payment_amount: 600000, counterparty_country: "US", customer_risk_level: "R4" },
    expectedOutput: "blocked",
    actualOutput: "blocked",
    narration: "当日累计金额取不到，按失败即拒绝拦住，转人工确认。",
  }),
  pass({
    caseId: "self-domestic-large-low-risk",
    title: "境内低风险的大额",
    expected: "allow",
    actual: "allow",
    facts: { payment_amount: 600000, cumulative_amount: 100000, counterparty_country: "CN", customer_risk_level: "R1" },
    expectedOutput: "allow",
    actualOutput: "allow",
    narration: "单笔 600000 元，当日累计 100000 元，未命中大额复合规则，放行。",
  }),
  pass({
    caseId: "self-domestic-cumulative-high-risk",
    title: "境内高风险，累计到 200 万",
    expected: "reject",
    actual: "reject",
    facts: { payment_amount: 100000, cumulative_amount: 2000000, counterparty_country: "CN", customer_risk_level: "R4" },
    expectedOutput: "reject",
    actualOutput: "reject",
    narration: "单笔 100000 元，当日累计 2000000 元，对手方 CN，风险等级 R4，需人工审核。",
  }),
];

const fundPassTitles = [
  "平衡混合 C3 对 R3",
  "成长股票 C5 对 R4",
  "纯债 C1 对 R2",
  "QDII C5 对 R5",
  "净值使用缓存",
  "净值缺失仍判适当性",
  "未知基金代码",
  "红利价值 C4 对 R4",
  "货币基金 C1 对 R1",
  "纯债 C2 对 R2",
  "QDII C4 对 R5",
  "风险等级使用缓存",
  "净值与风险都用缓存",
];

const fundCases: CaseRow[] = fundPassTitles.map((title, index) =>
  pass({
    caseId: `fund-pass-${String(index + 1).padStart(3, "0")}`,
    title,
    expected: index === 2 || index === 10 ? "mismatch" : index === 6 ? "unknown" : "match",
    actual: index === 2 || index === 10 ? "mismatch" : index === 6 ? "unknown" : "match",
    degradationOk: index === 6 ? true : null,
    facts: { fund_code: "900003", customer_risk_level: "C3" },
    expectedOutput: index === 2 || index === 10 ? "mismatch" : index === 6 ? "unknown" : "match",
    actualOutput: index === 2 || index === 10 ? "mismatch" : index === 6 ? "unknown" : "match",
    narration:
      index === 6
        ? "基金风险等级取不到，适当性无法判定。"
        : "近一年收益率 8.00%，客户风险等级 C3，适当性匹配。",
  }),
);

fundCases.push({
  caseId: "fund-case-008",
  title: "持仓为空时未正确提示",
  expected: "allow",
  actual: "reject",
  decisionOk: false,
  narrationOk: true,
  factOk: true,
  degradationOk: null,
  facts: { fund_code: "900003", customer_risk_level: "C3" },
  expectedOutput: "allow",
  actualOutput: "reject",
  narration: "持仓为空，本次不给出配置结论。",
  reasons: ["预期放行，实际拒绝"],
});

const amlRollback: CaseRow[] = [
  ...amlCases.slice(0, 3),
  {
    caseId: "boundary-500000",
    title: "单笔刚好 50 万",
    expected: "reject",
    actual: "allow",
    decisionOk: false,
    narrationOk: true,
    factOk: true,
    degradationOk: null,
    facts: { payment_amount: 500000, counterparty_country: "US", customer_risk_level: "R4" },
    expectedOutput: "reject",
    actualOutput: "allow",
    narration: "单笔 500000 元，未命中大额复合规则，放行。",
    reasons: ["预期拒绝，实际放行"],
  },
];

const fundDecisionMiss: CaseRow[] = [
  fundCases[0],
  fundCases[1],
  {
    caseId: "risk-missing",
    title: "风险等级缺失仍给了匹配",
    expected: "unknown",
    actual: "match",
    decisionOk: false,
    narrationOk: true,
    factOk: true,
    degradationOk: false,
    facts: { fund_code: "900004", customer_risk_level: "C3" },
    expectedOutput: "unknown",
    actualOutput: "match",
    narration: "基金风险等级取不到，按以往经验适当性匹配。",
    reasons: ["降级未拦截", "预期 unknown，实际 match"],
  },
  {
    caseId: "mismatch-growth",
    title: "成长股票 R4 对客户 C3",
    expected: "mismatch",
    actual: "match",
    decisionOk: false,
    narrationOk: true,
    factOk: true,
    degradationOk: null,
    facts: { fund_code: "900004", customer_risk_level: "C3" },
    expectedOutput: "mismatch",
    actualOutput: "match",
    narration: "近一年收益率 20.00%，客户风险等级 C3，适当性匹配。",
    reasons: ["预期不匹配，实际写成匹配"],
  },
];

const fundNarrationMiss: CaseRow[] = [
  fundCases[0],
  fundCases[6],
  fundCases[8],
  {
    caseId: "narration-guarantee",
    title: "货币基金讲解写了保本",
    expected: "match",
    actual: "match",
    decisionOk: true,
    narrationOk: false,
    factOk: true,
    degradationOk: null,
    facts: { fund_code: "900001", customer_risk_level: "C1" },
    expectedOutput: "match",
    actualOutput: "match",
    narration: "近一年收益率 1.75%，货币基金保本，适当性匹配。",
    reasons: ["讲解含禁止词「保本」"],
  },
];

const byReport: Record<string, CaseRow[]> = {
  "aml-large-transfer-v1.0.1-20260930": amlRollback,
  "aml-large-transfer-v1.0.2-20261001": amlCases,
  "aml-large-transfer-v1.0.2-20261003": amlCases,
  "aml-large-transfer-v1.0.2-20261004": amlCases,
  "aml-large-transfer-v1.0.2-20261006": amlCases,
  "fund-diagnosis-v1.0.0-20261002": fundDecisionMiss,
  "fund-diagnosis-v1.0.0-20261005": fundNarrationMiss,
  "fund-diagnosis-v1.0.0-20261006": fundCases,
};

export function casesFor(reportId: string) {
  return byReport[reportId] || [];
}

export function casePassed(row: CaseRow) {
  return row.decisionOk && row.narrationOk && row.factOk && row.degradationOk !== false;
}
