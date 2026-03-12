import assert from "assert";
import { parseIdCode, calcAge, totalDays } from "../js/utils.js";

// A couple of sample Estonian personal identification codes for testing
// source: public examples

describe("utils - isikukood", () => {
  describe("parseIdCode", () => {
    it("recognises a valid code and extracts birth date", () => {
      const parsed = parseIdCode("38401170216");
      assert.strictEqual(parsed.valid, true);
      assert.strictEqual(parsed.born.y, 1984);
      assert.strictEqual(parsed.born.m, 1);
      assert.strictEqual(parsed.born.d, 17);
      assert.strictEqual(parsed.gender, "male");
      assert(parsed.checksumOk);
    });

    it("flags invalid checksum", () => {
      const parsed = parseIdCode("38401170217");
      assert.strictEqual(parsed.valid, false);
    });
  });

  describe("age calculations", () => {
    it("totalDays returns positive days difference", () => {
      const born = { y: 2000, m: 1, d: 1 };
      const ref = { y: 2000, m: 1, d: 31 };
      assert.strictEqual(totalDays(born, ref), 30);
    });

    it("calcAge computes year-month-day breakdown", () => {
      const born = { y: 1990, m: 6, d: 15 };
      const ref = { y: 2020, m: 6, d: 14 };
      const age = calcAge(born, ref);
      assert.deepStrictEqual(age, { y: 29, m: 11, d: 30 });
    });
  });
});
