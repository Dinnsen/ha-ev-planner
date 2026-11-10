/* Danish and English: every text is in both languages, with the same {placeholders}. */

import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { launch, openPage, serve } from "./lib/setup.mjs";

let browser;
let server;
let texts;

before(async () => {
  browser = await launch();
  server = await serve();
  const { page, context } = await openPage(browser, server.url);
  // The real modules, loaded as a browser loads them: nothing is guessed from the source.
  texts = await page.evaluate(async () => {
    const cards = await window.harness.loadCards();
    const panel = await window.harness.loadPanel();
    return { panel: panel.TEXT, cards: cards.CARD_TEXT };
  });
  await context.close();
});

after(async () => {
  await browser?.close();
  await server?.close();
});

const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

for (const where of ["panel", "cards"]) {
  test(`${where}: the same keys in Danish and English`, () => {
    const { da, en } = texts[where];
    assert.deepEqual(Object.keys(texts[where]).sort(), ["da", "en"]);
    assert.ok(Object.keys(en).length > 5, "the texts were read");
    assert.deepEqual(Object.keys(da).filter((key) => !(key in en)), [], "Danish texts without an English one");
    assert.deepEqual(Object.keys(en).filter((key) => !(key in da)), [], "English texts without a Danish one");
  });

  test(`${where}: no empty text, and the same placeholders in both languages`, () => {
    const { da, en } = texts[where];
    const wrong = [];
    for (const key of Object.keys(en)) {
      if (!(key in da)) continue;
      for (const [lang, text] of [["da", da[key]], ["en", en[key]]]) {
        if (typeof text !== "string" || !text.trim()) wrong.push(`${key} (${lang}) is empty`);
      }
      if (placeholders(da[key]) !== placeholders(en[key])) wrong.push(`${key}: {${placeholders(da[key])}} in Danish, {${placeholders(en[key])}} in English`);
    }
    assert.deepEqual(wrong, []);
  });
}

test("the cards' names are not also among the panel's texts", () => {
  assert.deepEqual(Object.keys(texts.cards.en).filter((key) => key in texts.panel.en), []);
});
