import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges tailwind classes, later wins on conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("ignores falsy values", () => {
    expect(cn("a", null, false, undefined, "b")).toBe("a b");
  });

  it("joins multiple classes with a space", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
  });
});
