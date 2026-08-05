import assert from "node:assert/strict";
import test from "node:test";

test("ambiente dedicado de integração", { skip: !process.env.TEST_DATABASE_URL }, () => {
  assert.match(process.env.TEST_DATABASE_URL, /^postgres(?:ql)?:\/\//);
  assert.notEqual(process.env.TEST_DATABASE_URL, process.env.DATABASE_URL);
});
