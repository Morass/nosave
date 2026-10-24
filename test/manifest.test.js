const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

test("is a Manifest V3 extension with no permissions and no background code", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.permissions, undefined);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.optional_permissions, undefined);
  assert.equal(manifest.background, undefined);
  assert.equal(manifest.web_accessible_resources, undefined);
});

test("runs only on Google search pages", () => {
  assert.equal(manifest.content_scripts.length, 1);
  const [script] = manifest.content_scripts;
  assert.ok(script.matches.length > 100);
  for (const pattern of script.matches) {
    assert.match(pattern, /^https:\/\/www\.google\.[a-z.]+\/search\?\*$/);
  }
  assert.ok(script.matches.includes("https://www.google.com/search?*"));
  assert.ok(script.matches.includes("https://www.google.cz/search?*"));
  assert.equal(new Set(script.matches).size, script.matches.length);
});

test("the injected stylesheet hides only marked elements", () => {
  const [script] = manifest.content_scripts;
  assert.deepEqual(script.css, ["src/nosave.css"]);
  const css = fs.readFileSync(path.join(root, "src/nosave.css"), "utf8");
  const selectors = [...css.matchAll(/([^{}]+)\{/g)].map((m) => m[1].trim());
  assert.deepEqual(selectors, ["[data-nosave-hidden]"]);
});

test("every referenced file exists", () => {
  const files = [
    ...manifest.content_scripts.flatMap((s) => [...s.js, ...s.css]),
    ...Object.values(manifest.icons),
  ];
  for (const file of files) assert.ok(fs.existsSync(path.join(root, file)), file);
});

test("package and manifest versions agree", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  assert.equal(pkg.version, manifest.version);
});
