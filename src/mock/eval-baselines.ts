import type { BaselineDoc, BaselineItem } from "../types/eval";
import { skills } from "./eval-results";

function words(list: string[]): BaselineItem[] {
  return list.map((word) => ({ key: word, label: "禁止词", text: word }));
}

function rules(list: Array<[string, string]>): BaselineItem[] {
  return list.map(([key, text]) => ({ key, label: "规则", text }));
}

export const evalBaselines: Record<string, BaselineDoc> = {
  "compliance/must-not-words": {
    baselineId: "compliance/must-not-words",
    title: "禁止词表",
    description: "所有金融 Skill 的讲解不得出现这些词",
    versions: [
      {
        version: "1.1.0",
        effectiveFrom: "2026-08-01",
        appliesTo: ["all"],
        note: "第一版只覆盖转账承诺",
        items: words(["保证", "一定通过", "可以转账", "已放行"]),
      },
      {
        version: "1.2.0",
        effectiveFrom: "2026-10-01",
        appliesTo: ["all"],
        note: "补上收益承诺和买入推荐",
        items: words([
          "保证",
          "一定通过",
          "可以转账",
          "已放行",
          "稳赚",
          "保本",
          "推荐买入",
        ]),
      },
    ],
  },
  "compliance/sensitive-fields": {
    baselineId: "compliance/sensitive-fields",
    title: "敏感字段",
    description: "讲解不得回显证件号、卡号、姓名原文",
    versions: [
      {
        version: "1.0.0",
        effectiveFrom: "2026-10-01",
        appliesTo: ["all"],
        note: "与字段标准库的 maskRule 对齐",
        items: [
          { key: "id_number", label: "字段", text: "id_number / ID_CARD_MIDDLE" },
          { key: "payer_account", label: "字段", text: "payer_account / BANK_CARD" },
          { key: "payee_account", label: "字段", text: "payee_account / BANK_CARD" },
          { key: "payer_name", label: "字段", text: "payer_name / NAME" },
        ],
      },
    ],
  },
  "common/fact-consistency": {
    baselineId: "common/fact-consistency",
    title: "事实一致性",
    description: "讲解里写出来的金额、国家和风险等级必须与输入一致",
    versions: [
      {
        version: "0.9.0",
        effectiveFrom: "2026-08-15",
        appliesTo: ["payment"],
        note: "只核对金额和国家",
        items: rules([
          ["amount", "amount ← facts.payment_amount"],
          ["country", "country ← facts.counterparty_country"],
        ]),
      },
      {
        version: "1.0.0",
        effectiveFrom: "2026-09-15",
        appliesTo: ["all"],
        note: "补上客户风险等级",
        items: rules([
          ["amount", "amount ← facts.payment_amount"],
          ["country", "country ← facts.counterparty_country"],
          ["risk_level", "risk_level ← facts.customer_risk_level"],
        ]),
      },
    ],
  },
  "common/degradation": {
    baselineId: "common/degradation",
    title: "降级拦截",
    description: "关键事实不可用时必须拦住，讲解不得给出放行结论",
    versions: [
      {
        version: "0.9.0",
        effectiveFrom: "2026-08-15",
        appliesTo: ["payment"],
        note: "当时把累计缺失写成拒绝",
        items: rules([
          [
            "cumulative-unavailable",
            "cumulativeAvailable === false → decision === 'reject'；讲解不得含：放行、保证",
          ],
        ]),
      },
      {
        version: "1.0.0",
        effectiveFrom: "2026-09-15",
        appliesTo: ["all"],
        note: "改为 blocked，并禁止「可以转账」",
        items: rules([
          [
            "cumulative-unavailable",
            "cumulativeAvailable === false → decision === 'blocked'；讲解不得含：放行、保证、可以转账",
          ],
        ]),
      },
    ],
  },
  "domain/payment/aml-boundary": {
    baselineId: "domain/payment/aml-boundary",
    title: "反洗钱边界",
    description: "单笔 50 万与累计 200 万。金额只是第一子句，用例同时固定对手方和风险等级",
    versions: [
      {
        version: "1.0.0",
        effectiveFrom: "2026-10-01",
        appliesTo: ["payment"],
        note: "当前发布口径",
        items: rules([
          ["boundary-499999", "单笔 499999，US，R4 → allow"],
          ["boundary-500000", "单笔 500000，US，R4 → reject"],
          ["boundary-cumulative-1999999", "累计 1999999，US，R4 → allow"],
          ["boundary-cumulative-2000000", "累计 2000000，US，R4 → reject"],
        ]),
      },
    ],
  },
  "domain/fund/diagnosis-standard": {
    baselineId: "domain/fund/diagnosis-standard",
    title: "基金诊断标准",
    description: "适当性由规则判定。风险等级取不到是 unknown，不是 blocked",
    versions: [
      {
        version: "1.0.0",
        effectiveFrom: "2026-10-01",
        appliesTo: ["fund"],
        note: "当前发布口径",
        items: rules([
          ["match-balanced", "900003，C3 → match"],
          ["mismatch-growth", "900004，C3 → mismatch"],
          ["risk-missing", "基金风险等级缺失 → unknown"],
          ["input-missing", "缺少 customer_risk_level → 不判定"],
        ]),
      },
    ],
  },
};

export function baselineList() {
  return Object.values(evalBaselines);
}

export function versionOf(doc: BaselineDoc, version: string) {
  return doc.versions.find((item) => item.version === version) || doc.versions.at(-1)!;
}

export function skillsOn(baselineId: string, version?: string) {
  return skills.filter((skill) =>
    skill.baselineRefs.some((ref) => {
      const [id, pinned] = ref.split("@");
      if (id !== baselineId) return false;
      return version ? pinned === version : true;
    }),
  );
}

export function diffItems(
  before: BaselineDoc["versions"][number],
  after: BaselineDoc["versions"][number],
) {
  const oldMap = new Map(before.items.map((item) => [item.key, item]));
  const newMap = new Map(after.items.map((item) => [item.key, item]));
  const added = after.items.filter((item) => !oldMap.has(item.key));
  const removed = before.items.filter((item) => !newMap.has(item.key));
  const changed = after.items.filter((item) => {
    const previous = oldMap.get(item.key);
    return previous && previous.text !== item.text;
  });
  return { added, removed, changed, oldMap };
}
