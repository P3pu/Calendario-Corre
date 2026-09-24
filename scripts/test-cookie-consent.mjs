import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
const consentScript = new Script(scripts[0]);
const bannerScript = new Script(scripts.at(-1));
const storageKey = 'calendario-corre-cookie-choice-v1';

function createPage(savedChoice = null) {
  const values = new Map(savedChoice ? [[storageKey, savedChoice]] : []);
  const appended = [];
  const elements = Object.fromEntries(
    ['cookie-banner', 'cookie-details', 'cookie-more', 'cookie-accept', 'cookie-reject', 'cookie-settings']
      .map((id) => [id, {
        hidden: id === 'cookie-banner' || id === 'cookie-details',
        handlers: {},
        attributes: {},
        addEventListener(type, handler) { this.handlers[type] = handler; },
        setAttribute(name, value) { this.attributes[name] = value; },
        focus() { this.focused = true; }
      }])
  );
  let reloads = 0;
  const context = {
    document: {
      head: { appendChild(script) { appended.push(script); } },
      createElement() { return {}; },
      querySelector(selector) { return elements[selector.slice(1)]; }
    },
    localStorage: {
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, value) { values.set(key, value); }
    },
    location: { reload() { reloads += 1; } },
    Date,
    Object
  };
  context.window = context;
  const vm = createContext(context);
  consentScript.runInContext(vm);
  bannerScript.runInContext(vm);
  return { context, elements, values, appended, get reloads() { return reloads; } };
}

const fresh = createPage();
assert.equal(fresh.elements['cookie-banner'].hidden, false);
assert.equal(fresh.appended.length, 0, 'GTM must not load before a choice');
assert.equal(fresh.context.dataLayer[0][1], 'default');
assert.equal(fresh.context.dataLayer[0][2].analytics_storage, 'denied');
fresh.elements['cookie-more'].handlers.click();
assert.equal(fresh.elements['cookie-details'].hidden, false);
fresh.elements['cookie-accept'].handlers.click();
assert.equal(fresh.values.get(storageKey), 'accepted');
assert.equal(fresh.elements['cookie-banner'].hidden, true);
assert.equal(fresh.appended.length, 1);
assert.match(fresh.appended[0].src, /GTM-PXKPSLRJ/);
assert.equal(fresh.context.dataLayer[1][2].analytics_storage, 'granted');
fresh.elements['cookie-settings'].handlers.click();
assert.equal(fresh.elements['cookie-banner'].hidden, false);
assert.equal(fresh.elements['cookie-reject'].focused, true);
fresh.elements['cookie-reject'].handlers.click();
assert.equal(fresh.values.get(storageKey), 'rejected');
assert.equal(fresh.reloads, 1, 'Revoking consent reloads to stop loaded tags');

const rejected = createPage('rejected');
assert.equal(rejected.elements['cookie-banner'].hidden, true);
assert.equal(rejected.appended.length, 0);

const accepted = createPage('accepted');
assert.equal(accepted.elements['cookie-banner'].hidden, true);
assert.equal(accepted.appended.length, 1);
assert.equal(accepted.context.dataLayer[1][2].analytics_storage, 'granted');

console.log('Cookie consent: first visit, accept, reject, revoke and saved choice passed.');
