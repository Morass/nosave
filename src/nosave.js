(() => {
  "use strict";

  // Google's class names are minified and change without notice, so the button is
  // recognised by what it says: its visible text is the word "Save" in the page
  // language, and its aria-label is that word followed by the picture's title.
  // The Save button in the preview panel has no such label and is left alone.
  const SAVE_WORDS = new Set([
    "save", "uložit", "uložiť", "speichern", "enregistrer", "guardar", "desar",
    "gorde", "salva", "salvar", "salvare", "salvează", "zapisz", "opslaan",
    "bewaren", "spara", "gem", "lagre", "tallenna", "vista", "salvesta",
    "saglabāt", "išsaugoti", "mentés", "shrani", "spremi", "sačuvaj", "сачувај",
    "запази", "сохранить", "зберегти", "захаваць", "αποθήκευση", "kaydet",
    "שמירה", "حفظ", "ذخیره", "บันทึก", "lưu", "simpan", "i-save", "hifadhi",
    "保存", "儲存", "저장", "सहेजें", "সংরক্ষণ করুন", "சேமி", "సేవ్ చేయి",
  ]);

  // The attribute is what hides the button, through src/nosave.css: Google shows and
  // hides these buttons by rewriting their inline style, which would undo an inline hide.
  const HIDDEN = "data-nosave-hidden";
  const BUTTON = '[role="button"][aria-label]';
  const TILE_DEPTH = 6;

  function label(el) {
    return (el.getAttribute("aria-label") || "").trim();
  }

  function insideImageTile(el) {
    let node = el.parentElement;
    for (let i = 0; node && i < TILE_DEPTH; i++, node = node.parentElement) {
      if (node.querySelector("img")) return true;
    }
    return false;
  }

  // Returns the picture title the button's label names, or null.
  function saveOverlayTitle(el) {
    if (el.nodeType !== 1 || el.getAttribute("role") !== "button") return null;
    const name = label(el);
    if (!name) return null;
    const text = el.textContent.trim();
    if (!SAVE_WORDS.has(text.toLowerCase())) return null;
    if (name.length <= text.length + 1 || !name.startsWith(text + " ")) return null;
    if (!insideImageTile(el)) return null;
    return name.slice(text.length + 1);
  }

  function isSaveOverlay(el) {
    return saveOverlayTitle(el) !== null;
  }

  // Once a picture is saved, Google swaps the overlay for a "Saved ▾" button in the
  // same corner. Its label ends with the same picture title, in any language.
  function isSavedOverlay(el) {
    if (el.nodeType !== 1 || el.getAttribute("role") !== "button") return false;
    const name = label(el);
    if (!name) return false;
    let node = el.parentElement;
    for (let i = 0; node && i < 3; i++, node = node.parentElement) {
      for (const other of node.querySelectorAll(BUTTON)) {
        if (other === el || other.contains(el) || el.contains(other)) continue;
        const title = saveOverlayTitle(other);
        if (title && name !== label(other) && name.endsWith(" " + title)) return true;
      }
    }
    return false;
  }

  const shouldHide = (el) => isSaveOverlay(el) || isSavedOverlay(el);

  function reconcile(el) {
    if (shouldHide(el)) el.setAttribute(HIDDEN, "");
    else if (el.hasAttribute(HIDDEN)) el.removeAttribute(HIDDEN);
  }

  function sweep(root) {
    if (root.nodeType !== 1 || !root.isConnected) return;
    if (root.matches(BUTTON)) reconcile(root);
    for (const el of root.querySelectorAll(BUTTON)) reconcile(el);
  }

  function onMutations(mutations) {
    const roots = new Set();
    const buttons = new Set();
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) roots.add(node);
      }
      const target = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      if (!target) continue;
      const button = target.closest('[role="button"]');
      if (button) buttons.add(button);
      // A Save button that gains its label or text late can reveal a Saved sibling.
      if (button && button.parentElement) roots.add(button.parentElement.parentElement || button.parentElement);
    }
    for (const root of roots) {
      let covered = false;
      for (let a = root.parentElement; a; a = a.parentElement) {
        if (roots.has(a)) { covered = true; break; }
      }
      if (!covered) sweep(root);
    }
    for (const button of buttons) {
      if (button.isConnected) reconcile(button);
    }
  }

  function start(doc) {
    if (doc[HIDDEN]) return;
    doc[HIDDEN] = true;
    new doc.defaultView.MutationObserver(onMutations).observe(doc, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "role"],
    });
    if (doc.documentElement) sweep(doc.documentElement);
  }

  if (typeof module === "object" && module.exports) {
    module.exports = { isSaveOverlay, isSavedOverlay, sweep, start, SAVE_WORDS, HIDDEN };
  } else {
    start(document);
  }
})();
