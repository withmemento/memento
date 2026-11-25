// usage: node tools/check-deploy.mjs https://with-memento.com/
// Requests every asset the site needs from the LIVE url and reports anything that is not a 200.
import { readFileSync, readdirSync } from "node:fs";
const base = (process.argv[2] || "https://with-memento.com/").replace(/\/?$/, "/");
const paths = new Set(["", "css/style.css", "js/app.js"]);
const add = (p) => { if (typeof p === "string" && !/^(https?:|data:|mailto:|#)/.test(p)) paths.add(p.replace(/^\//, "")); };
for (const m of readFileSync("index.html", "utf8").matchAll(/(?:href|src)="([^"]+)"/g)) add(m[1]);
for (const m of readFileSync("css/style.css", "utf8").matchAll(/url\("\.\.\/([^")]+)"\)/g)) add(m[1]);
const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === "object") Object.values(o).forEach(walk);
  else if (typeof o === "string" && o.startsWith("images/")) { add(o); if (/^images\/(gallery|booth)\/[^/]+\.webp$/.test(o) && !o.endsWith("-sm.webp")) add(o.replace(/\.webp$/, "-sm.webp")); } };
for (const f of readdirSync("content")) { add(`content/${f}`); if (f.endsWith(".json")) walk(JSON.parse(readFileSync(`content/${f}`, "utf8"))); }
let bad = 0;
for (const p of [...paths].sort()) {
  const r = await fetch(base + p, { method: "GET" }).catch((e) => ({ status: "ERR " + e.message, headers: new Map() }));
  if (r.arrayBuffer) await r.arrayBuffer();
  if (r.status !== 200) { bad++; console.log(r.status, base + p); }
}
console.log(bad ? `\n${bad} problem(s) of ${paths.size} checked` : `all ${paths.size} assets OK on ${base}`);
process.exit(bad ? 1 : 0);
