import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { baselineList, skillsOn, versionOf } from "../mock/eval-baselines";

export function BaselineManager() {
  const docs = baselineList();
  const [selected, setSelected] = useState(docs[0].baselineId);
  const doc = docs.find((item) => item.baselineId === selected) || docs[0];
  const [version, setVersion] = useState(doc.versions.at(-1)!.version);
  const current = versionOf(doc, doc.versions.some((item) => item.version === version) ? version : doc.versions.at(-1)!.version);
  const groups = useMemo(() => {
    const map = new Map<string, typeof docs>();
    docs.forEach((item) => {
      const group = item.baselineId.split("/")[0];
      map.set(group, [...(map.get(group) || []), item]);
    });
    return [...map.entries()];
  }, [docs]);
  const referenced = skillsOn(doc.baselineId, current.version);

  const choose = (baselineId: string) => {
    const next = docs.find((item) => item.baselineId === baselineId)!;
    setSelected(baselineId);
    setVersion(next.versions.at(-1)!.version);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-semibold">评测基准</h1>
        <label className="flex items-center gap-2 text-sm">
          版本
          <select
            value={current.version}
            onChange={(event) => setVersion(event.target.value)}
            className="rounded-[6px] border border-line bg-white px-2 py-1"
          >
            {doc.versions.map((item) => (
              <option key={item.version} value={item.version}>
                {item.version}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-lg border border-line bg-white p-3 shadow-card">
          {groups.map(([group, items]) => (
            <div key={group} className="mb-3">
              <p className="px-2 py-1 text-xs text-muted">{group}/</p>
              {items.map((item) => (
                <button
                  key={item.baselineId}
                  type="button"
                  onClick={() => choose(item.baselineId)}
                  className={`block w-full rounded px-2 py-2 text-left text-sm ${
                    item.baselineId === doc.baselineId ? "bg-[#E6F4FF] text-primary" : ""
                  }`}
                >
                  {item.baselineId.slice(group.length + 1)}
                </button>
              ))}
            </div>
          ))}
        </aside>
        <section className="space-y-4">
          <article className="rounded-lg border border-line bg-white p-4 shadow-card">
            <h2 className="text-base font-semibold">{doc.title}</h2>
            <dl className="mt-3 grid gap-2 text-sm md:grid-cols-2">
              <div>baselineId：{doc.baselineId}</div>
              <div>version：{current.version}</div>
              <div>effectiveFrom：{current.effectiveFrom}</div>
              <div>appliesTo：{current.appliesTo.join(", ")}</div>
            </dl>
            <p className="mt-3 text-sm text-muted">{doc.description} {current.note}</p>
          </article>
          <article className="rounded-lg border border-line bg-white p-4 shadow-card">
            <h2 className="text-base font-semibold">内容</h2>
            <p className="mt-1 text-xs text-muted">只读。改词表走基准仓库的版本，不在这个页面上直接改。</p>
            <pre className="mt-3 overflow-auto rounded bg-canvas p-3 text-xs">
              {JSON.stringify(current.items, null, 2)}
            </pre>
          </article>
          <article className="rounded-lg border border-line bg-white p-4 shadow-card">
            <h2 className="text-base font-semibold">引用于 {current.version}</h2>
            {!referenced.length && <p className="mt-3 text-sm text-muted">没有技能锁在这个版本。</p>}
            <ul className="mt-3 space-y-2 text-sm">
              {referenced.map((skill) => (
                <li key={skill.skillId}>
                  <Link className="text-primary" to={`/eval/${skill.skillId}`}>
                    {skill.skillName}
                  </Link>
                  <span className="ml-2 text-xs text-muted">{skill.skillId}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-lg border border-line bg-white p-4 shadow-card">
            <h2 className="text-base font-semibold">版本历史</h2>
            <ol className="mt-4 space-y-4 border-l border-line pl-4">
              {[...doc.versions].reverse().map((item) => (
                <li key={item.version}>
                  <button type="button" className="text-sm text-primary" onClick={() => setVersion(item.version)}>
                    {item.version}
                  </button>
                  <p className="text-xs text-muted">{item.effectiveFrom} · {item.note}</p>
                </li>
              ))}
            </ol>
          </article>
        </section>
      </div>
    </div>
  );
}
