// Builds a single self-contained HTML preview (hash-routed) from the same components.
// Usage: node preview/build.mjs  ->  preview/dist/index.html
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "preview/dist");
fs.mkdirSync(out, { recursive: true });

const result = await build({
  entryPoints: [path.join(root, "preview/entry.tsx")],
  bundle: true,
  minify: true,
  write: false,
  outdir: out,
  jsx: "automatic",
  format: "iife",
  target: "es2020",
  tsconfig: path.join(root, "tsconfig.json"),
  alias: {
    "next/link": path.join(root, "preview/shims/link.tsx"),
    "next/navigation": path.join(root, "preview/shims/navigation.tsx"),
  },
  external: ["/banner.jpg", "/logo.png"],
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_DEMO_WALLET": '"1"',
    "process.env.NEXT_PUBLIC_DEMO_DATA": '"1"',
  },
  logLevel: "error",
});

const uri = (f, mime) => `data:${mime};base64,${fs.readFileSync(path.join(root, "public", f)).toString("base64")}`;
const logo = uri("logo.png", "image/png");
const banner = uri("banner.jpg", "image/jpeg");
const swap = (s) => s.split("/logo.png").join(logo).split("/banner.jpg").join(banner);

let js = "", css = "";
for (const f of result.outputFiles) {
  if (f.path.endsWith(".js")) js = f.text;
  if (f.path.endsWith(".css")) css = f.text;
}

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Aritoham Protocol</title>
<style>${swap(css)}</style></head>
<body><div id="root"></div>
<script>${swap(js).replace(/<\/script/gi, "<\\/script")}</script></body></html>`;

fs.writeFileSync(path.join(out, "index.html"), html);
console.log("preview/dist/index.html", (html.length / 1024).toFixed(0) + " KB");
