# Eval 评测报告

**Skill**: aml-large-transfer
**版本**: 1.0.2
**评测时间**: 2026-10-06 23:01:49
**评测类型**: rule-based

## 评测基准依赖

- compliance/must-not-words@1.2.0
- compliance/sensitive-fields@1.0.0
- common/fact-consistency@1.0.0
- common/degradation@1.0.0
- domain/payment/aml-boundary@1.0.0

## 评测结果

| 指标 | 得分 | 阈值 | 状态 |
|:---|:---|:---|:---|
| 决定准确率 | 100% (10/10) | =100% | ✅ |
| 讲解合规率 | 100% (10/10) | =100% | ✅ |
| 事实一致性 | 100% (10/10) | =100% | ✅ |
| 降级拦截率 | 100% (1/1) | =100% | ✅ |

## 发布建议

✅ **通过**，允许发布。

## 加载警告

- 自测集用例 boundary-499999 与平台基准同 id 但内容不同，采用平台基准版本

## 失败用例

无。
