const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");

class FakeElement {
  constructor(attributes = {}) {
    this.attributes = new Map(Object.entries(attributes));
    this.listeners = new Map();
    this.classes = new Set();
    this.hidden = false;
    this.classList = {
      add: (name) => this.classes.add(name),
      contains: (name) => this.classes.has(name),
      remove: (name) => this.classes.delete(name),
      toggle: (name, force) => {
        const shouldAdd = force ?? !this.classes.has(name);
        if (shouldAdd) this.classes.add(name);
        else this.classes.delete(name);
        return shouldAdd;
      },
    };
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  click() {
    this.listeners.get("click")?.({ target: this });
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
}

const loadNotFoundInteraction = () => {
  const root = new FakeElement();
  const art = new FakeElement();
  const image = new FakeElement({ "src": "assets/images/404-pixel-face.png" });
  image.dataset = {
    smileSrc: "assets/images/404-pixel-face.png",
    rawrSrc: "assets/images/404-pixel-face-rawr.png",
  };
  const button = new FakeElement({
    "aria-expanded": "false",
    "aria-label": "Make the pixel face say rawr",
  });
  button.querySelector = (selector) => selector === "img" ? image : null;
  const reveal = new FakeElement();
  reveal.hidden = true;
  const elements = new Map([
    [".not-found-art", art],
    [".not-found-art-toggle", button],
    [".not-found-reveal", reveal],
  ]);
  const document = {
    documentElement: root,
    querySelector: (selector) => elements.get(selector) ?? null,
    querySelectorAll: () => [],
  };
  const window = {
    BLOG_POSTS: [],
    matchMedia: () => ({ matches: false }),
  };

  vm.runInNewContext(script, {
    document,
    window,
    localStorage: { getItem: () => null, setItem: () => {} },
  });

  return { art, button, image, reveal };
};

test("404 image click toggles the pixel face and announces its matching action", () => {
  const { art, button, image, reveal } = loadNotFoundInteraction();

  assert.equal(button.getAttribute("aria-label"), "Make the pixel face say rawr");
  assert.equal(image.getAttribute("src"), "assets/images/404-pixel-face.png");

  button.click();
  assert.equal(art.classList.contains("is-awake"), true);
  assert.equal(image.getAttribute("src"), "assets/images/404-pixel-face-rawr.png");
  assert.equal(button.getAttribute("aria-expanded"), "true");
  assert.equal(button.getAttribute("aria-label"), "Restore the smiling pixel face");
  assert.equal(reveal.hidden, false);

  button.click();
  assert.equal(art.classList.contains("is-awake"), false);
  assert.equal(image.getAttribute("src"), "assets/images/404-pixel-face.png");
  assert.equal(button.getAttribute("aria-expanded"), "false");
  assert.equal(button.getAttribute("aria-label"), "Make the pixel face say rawr");
  assert.equal(reveal.hidden, true);
});
