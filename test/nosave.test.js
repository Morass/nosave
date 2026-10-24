const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { isSaveOverlay, isSavedOverlay, start, HIDDEN } = require("../src/nosave.js");

// Both fixtures were copied from a live, signed-in Google Images page (Czech UI).
const TILE = fs.readFileSync(path.join(__dirname, "fixtures/tile-cs.html"), "utf8");
const SIDE = fs.readFileSync(path.join(__dirname, "fixtures/side-panel-cs.html"), "utf8");

function page() {
  const dom = new JSDOM("<!doctype html><html><body><main id=grid></main></body></html>");
  start(dom.window.document);
  return dom.window.document;
}

// A minimal result tile: a picture and an overlay container, as on the live page.
function tile(doc, buttonHtml) {
  const wrap = doc.createElement("div");
  wrap.innerHTML = `<img src="data:,"><div class="overlay">${buttonHtml}</div>`;
  return wrap;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const isHidden = (el) => el.hasAttribute(HIDDEN);

test("hides the hover Save button when Google inserts it into a result tile", async () => {
  const doc = page();
  doc.getElementById("grid").innerHTML = TILE;
  await settle();
  const button = doc.querySelector('[role="button"][jsname="CL9xOb"]');
  assert.ok(button, "fixture carries the overlay button");
  assert.ok(isHidden(button));
});

test("leaves every other button in the tile alone", async () => {
  const doc = page();
  doc.getElementById("grid").innerHTML = TILE;
  await settle();
  const hidden = [...doc.querySelectorAll(`[${HIDDEN}]`)].map((el) => el.getAttribute("jsname"));
  assert.deepEqual(hidden, ["CL9xOb", "TomQf"]);
  const buttons = doc.querySelectorAll('[role="button"]').length;
  assert.ok(buttons > hidden.length, "the tile has other buttons that stay");
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
  const wrap = tile(doc, '<div role="button" aria-label="Save Mountain lake at dawn"><div></div></div>');
  const button = wrap.querySelector('[role="button"]');
  const inner = button.firstChild;
  doc.getElementById("grid").append(wrap);
  await settle();
  assert.ok(!isHidden(button));
  inner.textContent = "Save";
  await settle();
  assert.ok(isHidden(button));
});

test("hides a button whose label arrives after insertion", async () => {
  const doc = page();
  const wrap = tile(doc, '<div role="button">Save</div>');
  const button = wrap.querySelector('[role="button"]');
  doc.getElementById("grid").append(wrap);
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
    tile(document, "").querySelector(".overlay").append(el);
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
    tile(document, "").querySelector(".overlay").append(el);
    assert.ok(!isSaveOverlay(el), JSON.stringify(c));
  }
});

test("leaves a Save button that is not on a picture alone", async () => {
  const doc = page();
  doc.getElementById("grid").innerHTML =
    '<section><div role="button" aria-label="Save job Senior gardener">Save</div></section>';
  await settle();
  assert.equal(doc.querySelectorAll(`[${HIDDEN}]`).length, 0);
});

test("hides the Saved overlay that replaces Save once a picture is saved", async () => {
  const doc = page();
  doc.getElementById("grid").innerHTML = TILE;
  await settle();
  const saved = doc.querySelector('[jsname="TomQf"]');
  assert.ok(saved, "fixture carries the Saved overlay");
  assert.ok(isSavedOverlay(saved));
  saved.style.display = "";
  await settle();
  assert.ok(isHidden(saved), "the attribute, not the inline style, does the hiding");
});

test("hides a Saved overlay inserted after the Save button", async () => {
  const doc = page();
  const wrap = tile(doc, '<div role="button" aria-label="Save Mountain lake">Save</div>');
  doc.getElementById("grid").append(wrap);
  await settle();
  const saved = doc.createElement("div");
  saved.innerHTML = '<div role="button" aria-label="Saved. Edit saves for Mountain lake">Saved</div>';
  wrap.querySelector(".overlay").append(saved);
  await settle();
  assert.ok(isHidden(saved.firstChild));
});

test("un-hides a button Google reuses for something else", async () => {
  const doc = page();
  const wrap = tile(doc, '<div role="button" aria-label="Save Mountain lake">Save</div>');
  doc.getElementById("grid").append(wrap);
  await settle();
  const button = wrap.querySelector('[role="button"]');
  assert.ok(isHidden(button));
  button.textContent = "Share";
  button.setAttribute("aria-label", "Share Mountain lake");
  await settle();
  assert.ok(!isHidden(button));
});

test("matches Save words the same way under a Turkish locale", () => {
  const original = String.prototype.toLocaleLowerCase;
  String.prototype.toLocaleLowerCase = function () {
    return original.call(this, "tr");
  };
  try {
    const { document } = new JSDOM("").window;
    const el = document.createElement("div");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", "I-Save Mountain lake");
    el.textContent = "I-Save";
    tile(document, "").querySelector(".overlay").append(el);
    assert.ok(isSaveOverlay(el));
  } finally {
    String.prototype.toLocaleLowerCase = original;
  }
});

test("starting twice on one page attaches one observer", async () => {
  const dom = new JSDOM("<!doctype html><body></body>");
  const doc = dom.window.document;
  let observers = 0;
  const Real = dom.window.MutationObserver;
  dom.window.MutationObserver = class extends Real {
    constructor(cb) { super(cb); observers++; }
  };
  start(doc);
  start(doc);
  assert.equal(observers, 1);
});
