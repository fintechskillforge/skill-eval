import { useState } from "react";
import { Link } from "react-router-dom";
import { baselineList, diffItems, skillsOn, versionOf } from "../mock/eval-baselines";

export function BaselineDiff() {
  const docs = baselineList();
  const [baselineId, setBaselineId] = useState("compliance/must-not-words");
  const doc = docs.find((item) => item.baselineId === baselineId) || docs[0];
  const versions = doc.versions;
  const [oldVersion, setOldVersion] = useState(versions[0].version);
  const [newVersion, setNewVersion] = useState(versions.at(-1)!.version);
  const before = versionOf(doc, versions.some((item) => item.version === oldVersion) ? oldVersion : versions[0].version);
  const after = versionOf(doc, versions.some((item) => item.version === newVersion) ? newVersion : versions.at(-1)!.version);
  const diff = diffItems(before, after);
  const stuck = skillsOn(doc.baselineId, before.version);

  const switchDoc = (id: string) => {
    const next = docs.find((item) => item.baselineId === id)!;
    setBaselineId(id);
    setOldVersion(next.versions[0].version);
    setNewVersion(next.versions.at(-1)!.version);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-[20px] font-semibold">基准版本对比</h1>
      <div className="flex flex-wrap gap-3 rounded-lg border border-line bg-white p-4 shadow-card">
        <label className="text-sm">
          基准
          <select className="ml-2 rounded-[6px] border border-line px-2 py-1" value={doc.baselineId} onChange={(event) => switchDoc(event.target.value)}>
            {docs.map((item) => (
              <option key={item.baselineId} value={item.baselineId}>
                {item.baselineId}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          旧版本
          <select className="ml-2 rounded-[6px] border border-line px-2 py-1" value={before.version} onChange={(event) => setOldVersion(event.target.value)}>
            {versions.map((item) => (
              <option key={item.version}>{item.version}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          新版本
          <select className="ml-2 rounded-[6px] border border-line px-2 py-1" value={after.version} onChange={(event) => setNewVersion(event.target.value)}>
            {versions.map((item) => (
              <option key={item.version}>{item.version}</option>
            ))}
          </select>
        </label>
      </div>
      <section className="space-y-3 rounded-lg border border-line bg-white p-4 shadow-card">
        <h2 className="text-base font-semibold">
          {before.version} → {after.version}
        </h2>
        {before.version === after.version && <p className="text-sm text-muted">两个版本相同，没有差异。</p>}
        {diff.added.map((item) => (
          <p key={`add-${item.key}`} className="rounded bg-[#F6FFED] px-3 py-2 text-sm">
            新增 {item.label}：{item.text}
          </p>
        ))}
        {diff.removed.map((item) => (
          <p key={`del-${item.key}`} className="rounded bg-[#FFF2F0] px-3 py-2 text-sm line-through">
            删除 {item.label}：{item.text}
          </p>
        ))}
        {diff.changed.map((item) => (
          <div key={`chg-${item.key}`} className="rounded bg-[#FFFBE6] px-3 py-2 text-sm">
            <p>修改 {item.label}：{item.key}</p>
            <p className="mt-1 text-muted line-through">{diff.oldMap.get(item.key)?.text}</p>
            <p className="mt-1">{item.text}</p>
          </div>
        ))}
        {before.version !== after.version && !diff.added.length && !diff.removed.length && !diff.changed.length && (
          <p className="text-sm text-muted">条目没有变化。</p>
        )}
      </section>
      <section className="rounded-lg border border-line bg-white p-4 shadow-card">
        <h2 className="text-base font-semibold">仍锁在旧版本的技能</h2>
        <p className="mt-1 text-xs text-muted">这些技能升级引用后需要重新评测。已经锁到新版本的不在这里。</p>
        {!stuck.length && <p className="mt-3 text-sm text-muted">没有技能还停在 {before.version}。</p>}
        <ul className="mt-3 space-y-2 text-sm">
          {stuck.map((skill) => (
            <li key={skill.skillId}>
              <Link className="text-primary" to={`/eval/${skill.skillId}`}>
                {skill.skillName}
              </Link>
              <span className="ml-2 text-xs text-muted">{skill.skillId}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
