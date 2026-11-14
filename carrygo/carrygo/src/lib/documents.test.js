import { describe, it, expect } from "vitest";
import { validateDocument, DOC_MAX_BYTES } from "./documents";

const f = (type, size) => ({ type, size });
describe("validateDocument", () => {
  it("accepts pdf, jpg and png under the limit", () => {
    expect(validateDocument(f("application/pdf", 1000))).toBeNull();
    expect(validateDocument(f("image/jpeg", 1000))).toBeNull();
    expect(validateDocument(f("image/png", DOC_MAX_BYTES))).toBeNull();
  });
  it("rejects missing, empty, oversized and wrong-type files", () => {
    expect(validateDocument(null)).toMatch(/choose a file/i);
    expect(validateDocument(f("image/png", 0))).toMatch(/empty/i);
    expect(validateDocument(f("image/png", DOC_MAX_BYTES + 1))).toMatch(/5 MB/);
    expect(validateDocument(f("text/html", 100))).toMatch(/PDF, JPG or PNG/);
    expect(validateDocument(f("application/x-msdownload", 100))).toMatch(/PDF, JPG or PNG/);
  });
});
