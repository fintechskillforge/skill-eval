#!/usr/bin/env node
// 把 skills/<skill>/fact-specs.json 里的用例交给真实算子补齐事实，固化写进 eval-cases.json（按 id 覆盖或追加）。
// 评测运行时只读固化值；算子行为变了，重跑本脚本、看 diff、再提交——变化必须被人看见。
const fs = require("fs");
const path = require("path");
const { buildFacts } = require("./facts-builder");

const SKILLS_DIR = path.resolve(__dirname, "../skills");

async function main() {
  const skillId = process.argv[2];
  if (!skillId) throw new Error("用法：node eval-runner/freeze-facts.js <skillId>");
  const dir = path.join(SKILLS_DIR, skillId);
  const specPath = path.join(dir, "fact-specs.json");
  const casesPath = path.join(dir, "eval-cases.json");
  if (!fs.existsSync(specPath)) throw new Error(`没有用例规格：${specPath}`);

  const specs = JSON.parse(fs.readFileSync(specPath, "utf8"));
  const cases = fs.existsSync(casesPath) ? JSON.parse(fs.readFileSync(casesPath, "utf8")) : [];

  for (const spec of specs) {
    const { facts, provenance } = await buildFacts({ skillId, id: spec.id, facts: spec.facts });
    const frozen = {
      id: spec.id,
      title: spec.title,
      facts,
      expect: spec.expect,
      // traceId 每次都变，不进固化文件，免得每次重跑都产生无意义的 diff
      frozenFrom: provenance.map(({ fact, operator, asOf, freshness }) => ({ fact, operator, asOf, freshness })),
    };
    const at = cases.findIndex((c) => c.id === spec.id);
    if (at >= 0) cases[at] = frozen;
    else cases.push(frozen);
    const got = provenance.map((p) => `${p.fact}=${facts[p.fact]}（${p.operator}，asOf ${p.asOf}，traceId ${p.traceId}）`).join("；");
    console.log(`固化 ${spec.id}：${got}`);
  }

  fs.writeFileSync(casesPath, `${JSON.stringify(cases, null, 2)}\n`);
  console.log(`已写入 ${path.relative(process.cwd(), casesPath)}，共 ${cases.length} 条用例`);
}

main().catch((err) => {
  console.error(`固化失败：${err.message}`);
  process.exit(1);
});
