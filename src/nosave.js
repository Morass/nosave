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

  const HIDDEN = "data-nosave-hidden";

  function isSaveOverlay(el) {
    if (el.nodeType !== 1 || el.getAttribute("role") !== "button") return false;
    const text = el.textContent.trim();
    if (!SAVE_WORDS.has(text.toLocaleLowerCase())) return false;
    const label = (el.getAttribute("aria-label") || "").trim();
    return label.length > text.length + 1 && label.startsWith(text + " ");
  }

  function hide(el) {
    if (el.hasAttribute(HIDDEN)) return;
    el.setAttribute(HIDDEN, "");
    el.style.setProperty("display", "none", "important");
  }

  function sweep(root) {
    if (root.nodeType !== 1) return;
    if (isSaveOverlay(root)) hide(root);
    for (const el of root.querySelectorAll('[role="button"][aria-label]')) {
      if (isSaveOverlay(el)) hide(el);
    }
  }

  function onMutations(mutations) {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) sweep(node);
      }
      // Text or a label filled in after the button was inserted.
      const target = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      const button = target && target.closest('[role="button"][aria-label]');
      if (button && isSaveOverlay(button)) hide(button);
    }
  }

  function start(doc) {
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
    module.exports = { isSaveOverlay, sweep, start, SAVE_WORDS, HIDDEN };
  } else {
    start(document);
  }
})();
