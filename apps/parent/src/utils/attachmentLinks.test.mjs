// Run: node --experimental-detect-module --test <this file>
import { test } from "node:test";
import assert from "node:assert/strict";

import { safeHttpUrl, attachmentLinks } from "./attachmentLinks.js";

test("safeHttpUrl keeps only absolute http(s) URLs", () => {
  assert.equal(
    safeHttpUrl("https://cdn.example.com/a.pdf"),
    "https://cdn.example.com/a.pdf",
  );
  assert.equal(safeHttpUrl(" http://x.test/f "), "http://x.test/f");
  for (const bad of [
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,<b>x</b>",
    "/relative/path",
    "ftp://x.test/f",
    "",
    null,
    undefined,
    42,
  ]) {
    assert.equal(safeHttpUrl(bad), null, String(bad));
  }
});

test("attachmentLinks drops unsafe entries and names the rest", () => {
  const links = attachmentLinks([
    { _id: "a1", name: "Timetable.pdf", url: "https://cdn.example.com/t.pdf" },
    { _id: "a2", name: "Evil", url: "javascript:alert(1)" },
    { url: "https://cdn.example.com/x.png" },
    null,
  ]);
  assert.deepEqual(links, [
    { key: "a1", name: "Timetable.pdf", href: "https://cdn.example.com/t.pdf" },
    { key: "2", name: "Attachment", href: "https://cdn.example.com/x.png" },
  ]);
  assert.deepEqual(attachmentLinks(undefined), []);
  assert.deepEqual(attachmentLinks("nope"), []);
});
