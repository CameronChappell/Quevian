import assert from "node:assert/strict";
import test from "node:test";
import {existsSync} from "node:fs";
import {request} from "./support/render-worker.mjs";

test("production HTML has product metadata and excludes development fixtures", async () => {
  const response = await request('/');

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html=await response.text();
  assert.match(html,/<html[^>]*lang="en"/);
  assert.match(html,/<title>[^<]*Quevian[^<]*<\/title>/);
  assert.match(html,/<meta[^>]*name="viewport"[^>]*width=device-width/);
  assert.doesNotMatch(html,/codex-preview|__audit__|Isolated UI fixture/);
  assert.equal(existsSync('dist/client/__audit__'),false,'Test fixtures must never be published');
});
