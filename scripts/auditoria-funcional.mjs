import fs from "node:fs";
import path from "node:path";

const roots = ["app", "components", "features"];
const extensions = new Set([".tsx", ".ts"]);
const files = [];

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name))) files.push(full);
  }
}

for (const root of roots) walk(root);

const findings = {
  files: files.length,
  buttons: 0,
  explicitDisabled: [],
  localOnlyMessages: [],
  unfinishedMessages: [],
  englishVisibleCandidates: [],
};

const patterns = {
  button: /<(?:Button|button)\b/g,
  explicitDisabled: /disabled\s*:\s*true|disabled=\{true\}/g,
  localOnly: /localmente|neste dispositivo|Cadastro Local|não será alterado automaticamente/gi,
  unfinished: /ainda não está disponível|em breve|não implementad|indisponível neste ciclo/gi,
  english: /["'`](Dashboard|Pipeline|Search|Save|Cancel|Delete|Edit|Create|Update|Settings|Profile)["'`]/g,
};

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  findings.buttons += [...content.matchAll(patterns.button)].length;
  if (patterns.explicitDisabled.test(content)) findings.explicitDisabled.push(file);
  patterns.explicitDisabled.lastIndex = 0;
  if (patterns.localOnly.test(content)) findings.localOnlyMessages.push(file);
  patterns.localOnly.lastIndex = 0;
  if (patterns.unfinished.test(content)) findings.unfinishedMessages.push(file);
  patterns.unfinished.lastIndex = 0;
  if (patterns.english.test(content)) findings.englishVisibleCandidates.push(file);
  patterns.english.lastIndex = 0;
}

console.log(JSON.stringify(findings, null, 2));
