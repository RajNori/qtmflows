#!/usr/bin/env node
/**
 * Concatenates flow-*.html into public/flows/index.offline.html so the canvas
 * works from file:// (fetch() cannot load sibling files there).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const flowsDir = path.join(__dirname, "..", "public", "flows");

const FLOW_FILES = [
  "flow-01-onboarding.html",
  "flow-02-post-job.html",
  "flow-03-match.html",
  "flow-04-service.html",
  "flow-05-chat.html",
  "flow-06-payments.html",
  "flow-07-disputes.html",
  "flow-08-admin.html",
  "flow-09-notifications.html",
  "flow-10-state.html",
  "flow-11-journey.html",
  "flow-12-blueprint.html",
];

for (const f of FLOW_FILES) {
  const p = path.join(flowsDir, f);
  if (!fs.existsSync(p)) {
    console.error("Missing:", f);
    process.exit(1);
  }
}

const concat = FLOW_FILES.map((f) =>
  fs.readFileSync(path.join(flowsDir, f), "utf8"),
).join("\n");

const indexSrc = fs.readFileSync(path.join(flowsDir, "index.html"), "utf8");

const withoutLoader = indexSrc.replace(
  /\n<!-- Inject flow sub-files[\s\S]*?<\/script>\n/ms,
  "\n",
);

const out = withoutLoader.replace(
  '<div id="injected-flows"></div>',
  `<div id="injected-flows">\n${concat}\n</div>`,
);

const outPath = path.join(flowsDir, "index.offline.html");
fs.writeFileSync(outPath, out, "utf8");
console.log("Wrote", outPath);
