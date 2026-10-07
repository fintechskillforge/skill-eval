const { load, listSkillIds } = require("./loader");
const { run } = require("./executor");
const reporter = require("./reporter");

function parseArgs(argv) {
  let skillId = "";
  let all = false;
  let verbose = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--all") all = true;
    else if (arg === "--verbose") verbose = true;
    else if (arg === "--skill") {
      skillId = argv[i + 1] || "";
      i += 1;
    } else if (arg.startsWith("--")) {
      throw new Error("未知参数: " + arg);
    } else if (!skillId) skillId = arg;
    else throw new Error("多余参数: " + arg);
  }
  return { skillId, all, verbose };
}

function usage() {
  return [
    "用法:",
    "  node index.js aml-large-transfer",
    "  node index.js --all",
    "  node index.js --skill aml-large-transfer --verbose",
  ].join("\n");
}

async function main(argv) {
  const options = parseArgs(argv);
  const skillIds = options.all ? listSkillIds() : [options.skillId];
  if (!options.all && !options.skillId) {
    console.log(usage());
    return 1;
  }
  if (!skillIds.length) throw new Error("没有可评测的技能");
  let ok = true;
  for (let index = 0; index < skillIds.length; index += 1) {
    const skillId = skillIds[index];
    if (!skillId) throw new Error("缺少 skillId");
    const bundle = load(skillId);
    bundle.warnings.forEach((warning) => console.log("警告: " + warning));
    const report = await run(bundle, { verbose: options.verbose });
    const written = reporter.write(report);
    reporter.print(report, written);
    if (index < skillIds.length - 1) console.log("");
    ok = ok && report.overallPassed;
  }
  return ok ? 0 : 1;
}

if (require.main === module) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}

module.exports = { main, parseArgs };
