import { useState } from "react";
import { Link } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MiniProgress } from "../components/MiniProgress";
import { formatTime, skillTypeLabel } from "../lib/format";
import { casesFor } from "../mock/cases";
import { baselineList } from "../mock/eval-baselines";
import { dailyPassRate, latestOf, skills } from "../mock/eval-results";
import { METRIC_KEYS } from "../types/eval";

export function EvalOverview() {
  const [queued, setQueued] = useState<string[]>([]);
  const evaluated = skills.filter((skill) => latestOf(skill.skillId));
  const passedToday = evaluated.filter((skill) => latestOf(skill.skillId)?.overallPassed).length;
  const pendingFailures = evaluated.reduce((sum, skill) => {
    const latest = latestOf(skill.skillId);
    if (!latest) return sum;
    return sum + casesFor(latest.id).filter((row) => !row.decisionOk || !row.narrationOk || !row.factOk || row.degradationOk === false).length;
  }, 0);
  const versionCount = baselineList().reduce((sum, doc) => sum + doc.versions.length, 0);
  const trend = dailyPassRate();
  const cards = [
    { label: "已评测 / 总技能", value: `${evaluated.length} / ${skills.length}` },
    { label: "今日通过率", value: evaluated.length ? `${Math.round((passedToday / evaluated.length) * 100)}%` : "—" },
    { label: "待处理失败用例", value: String(pendingFailures) },
    { label: "评测基准版本数", value: String(versionCount) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold">评测概览</h1>
        <p className="mt-1 text-xs text-muted">页面数字来自演示样本。实跑归档在本项目的 eval-results/，两者不要当成同一份结果。</p>
      </div>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-lg border border-line bg-white p-4 shadow-card">
            <p className="text-xs text-muted">{card.label}</p>
            <p className="mt-3 text-[20px] font-semibold">{card.value}</p>
          </article>
        ))}
      </section>
      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-line">
                {["技能", "版本", "类型", "状态", "四项指标", "最近评测", "操作"].map((head) => (
                  <th key={head} className="px-4 py-3 font-normal">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => {
                const latest = latestOf(skill.skillId);
                return (
                  <tr key={skill.skillId} className="border-b border-[#F0F0F0]">
                    <td className="px-4 py-4">
                      <div className="font-semibold">{skill.skillName}</div>
                      <div className="text-xs text-muted">{skill.skillId}</div>
                    </td>
                    <td className="px-4 py-4">{skill.version}</td>
                    <td className="px-4 py-4">{skillTypeLabel(skill.skillType)}</td>
                    <td className="px-4 py-4">
                      {!latest && "⏳ 未评测"}
                      {latest?.overallPassed && "✅ 通过"}
                      {latest && !latest.overallPassed && "❌ 不通过"}
                    </td>
                    <td className="px-4 py-4">
                      {latest ? (
                        <div className="grid w-40 gap-1">
                          {METRIC_KEYS.map((key) => (
                            <MiniProgress
                              key={key}
                              value={latest.metrics[key].score}
                              threshold={latest.metrics[key].threshold}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted">尚无指标</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-muted">{latest ? formatTime(latest.evaluatedAt) : "—"}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-3">
                        <Link className="text-primary" to={`/eval/${skill.skillId}`}>
                          查看详情
                        </Link>
                        <button
                          type="button"
                          className="text-primary"
                          onClick={() => setQueued((current) => (current.includes(skill.skillId) ? current : [...current, skill.skillId]))}
                        >
                          {queued.includes(skill.skillId) ? "已入队" : "重新评测"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="rounded-lg border border-line bg-white p-4 shadow-card">
        <h2 className="text-base font-semibold">最近 7 天通过率</h2>
        <p className="mt-1 text-xs text-muted">按当天已评测技能计算，通过数 / 评测数。红线不在这张图上，阈值看每行进度条。</p>
        <div className="mt-4 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#8C8C8C" }} />
              <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(Number(value) * 100)}%`} tick={{ fontSize: 12, fill: "#8C8C8C" }} width={48} />
              <Tooltip formatter={(value) => [`${Math.round(Number(value) * 100)}%`, "通过率"]} />
              <Line type="monotone" dataKey="rate" stroke="#1677FF" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
