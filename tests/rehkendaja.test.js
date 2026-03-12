import assert from "assert";
import {
  parseAmount,
  extractAmounts,
  countDecimals,
  unitShort,
} from "../js/rehkendaja-utils.js";

// minimal smoke tests covering parsing/normalisation logic

describe("rehkendaja-utils", () => {
  describe("parseAmount", () => {
    it("converts various formatted numbers", () => {
      assert.strictEqual(parseAmount("1 234,56"), 1234.56);
      assert.strictEqual(parseAmount("1.234,56"), 1234.56);
      assert.strictEqual(parseAmount("1,234.56"), 1234.56);
      assert.strictEqual(parseAmount("1234"), 1234);
      assert.strictEqual(parseAmount("0,0002"), 0.0002);
      assert.strictEqual(parseAmount("foo"), null);
    });
  });

  describe("countDecimals", () => {
    it("counts decimal places correctly", () => {
      assert.strictEqual(countDecimals("123"), 0);
      assert.strictEqual(countDecimals("123,45"), 2);
      assert.strictEqual(countDecimals("1.234,567"), 3);
    });
  });

  describe("extractAmounts", () => {
    it("finds euro amounts in text", () => {
      const items = extractAmounts("EUR 5,00 and 10 €", "eur");
      assert.strictEqual(items.length, 2);
      assert.strictEqual(items[0].amount, 5);
      assert.strictEqual(items[1].amount, 10);
    });

    it("finds gram quantities", () => {
      const items = extractAmounts("7 g, 0,5g", "g");
      assert.strictEqual(items.length, 2);
      assert.strictEqual(items[0].amount, 7);
      assert.strictEqual(items[1].amount, 0.5);
    });
  });

  describe("unitShort", () => {
    it("returns correct symbol for mode", () => {
      assert.strictEqual(unitShort("eur"), "€");
      assert.strictEqual(unitShort("g"), "g");
      assert.strictEqual(unitShort("x"), "");
    });
  });
});
