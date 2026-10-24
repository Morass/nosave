const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { isSaveOverlay, start, HIDDEN } = require("../src/nosave.js");

// Both fixtures were copied from a live, signed-in Google Images page (Czech UI).
const TILE = fs.readFileSync(path.join(__dirname, "fixtures/tile-cs.html"), "utf8");
const SIDE = fs.readFileSync(path.join(__dirname, "fixtures/side-panel-cs.html"), "utf8");

function page() {
  const dom = new JSDOM("<!doctype html><html><body><main id=grid></main></body></html>");
  start(dom.window.document);
  return dom.window.document;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const isHidden = (el) => el.hasAttribute(HIDDEN) && el.style.getPropertyValue("display") === "none";

test("hides the hover Save button when Google inserts it into a result tile", async () => {
  const doc = page();
  doc.getElementById("grid").innerHTML = TILE;
  await settle();
  const button = doc.querySelector('[role="button"][jsname="CL9xOb"]');
  assert.ok(button, "fixture carries the overlay button");
  assert.ok(isHidden(button));
  assert.equal(button.style.getPropertyPriority("display"), "important");
});

test("leaves every other button in the tile alone", async () => {
  const doc = page();
  doc.getElementById("grid").innerHTML = TILE;
  await settle();
  const hidden = doc.querySelectorAll(`[${HIDDEN}]`);
  assert.equal(hidden.length, 1);
  assert.equal(hidden[0].textContent.trim(), "Uložit");
});

test("leaves the Save button in the opened preview panel alone", async () => {
  const doc = page();
  doc.getElementById("grid").innerHTML = SIDE;
  await settle();
  assert.equal(doc.querySelectorAll(`[${HIDDEN}]`).length, 0);
  assert.equal(doc.querySelector(".UEbcze").textContent.trim(), "Uložit");
});

test("leaves icon-only save controls without visible text alone", async () => {
  const doc = page();
  doc.getElementById("grid").innerHTML =
    '<div role="button" aria-label="Uložit Nature photography - Wikipedia"><svg aria-hidden="true"></svg></div>';
  await settle();
  assert.equal(doc.querySelectorAll(`[${HIDDEN}]`).length, 0);
});

test("hides a button whose text arrives after insertion", async () => {
  const doc = page();
  const button = doc.createElement("div");
  button.setAttribute("role", "button");
  button.setAttribute("aria-label", "Save Mountain lake at dawn");
  const inner = doc.createElement("div");
  button.append(inner);
  doc.getElementById("grid").append(button);
  await settle();
  assert.ok(!isHidden(button));
  inner.textContent = "Save";
  await settle();
  assert.ok(isHidden(button));
});

test("hides a button whose label arrives after insertion", async () => {
  const doc = page();
  const button = doc.createElement("div");
  button.setAttribute("role", "button");
  button.textContent = "Save";
  doc.getElementById("grid").append(button);
  await settle();
  assert.ok(!isHidden(button));
  button.setAttribute("aria-label", "Save Mountain lake at dawn");
  await settle();
  assert.ok(isHidden(button));
});

test("hides buttons already on the page when the script starts", () => {
  const dom = new JSDOM(`<!doctype html><body>${TILE}</body>`);
  start(dom.window.document);
  assert.ok(isHidden(dom.window.document.querySelector('[jsname="CL9xOb"]')));
});

test("recognises the overlay in other languages", () => {
  const { document } = new JSDOM("").window;
  for (const [word, title] of [
    ["Save", "Mountain lake"],
    ["Speichern", "Bergsee"],
    ["Enregistrer", "Lac de montagne"],
    ["保存", "山の湖"],
  ]) {
    const el = document.createElement("div");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", `${word} ${title}`);
    el.textContent = word;
    assert.ok(isSaveOverlay(el), word);
  }
});

test("does not match look-alikes", () => {
  const { document } = new JSDOM("").window;
  const cases = [
    { text: "Save", label: "Save" },
    { text: "Save", label: "" },
    { text: "Uložené", label: "Uložené obrázky" },
    { text: "Saved", label: "Saved Mountain lake" },
    { text: "Navštívit", label: "Navštívit Pexels" },
    { text: "Save", label: "Save Mountain lake", role: "link" },
  ];
  for (const c of cases) {
    const el = document.createElement("div");
    el.setAttribute("role", c.role || "button");
    if (c.label) el.setAttribute("aria-label", c.label);
    el.textContent = c.text;
    assert.ok(!isSaveOverlay(el), JSON.stringify(c));
  }
});
