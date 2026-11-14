import { describe, expect, it } from "vitest";
import { appendDesignBrief, MAX_DESIGN_BRIEF_LENGTH } from "./design-brief";

describe("appendDesignBrief", () => {
  it("acumula la idea inicial y el ajuste", () => {
    expect(appendDesignBrief("una selva", "hazla realista")).toBe("una selva. hazla realista");
  });

  it("no supera el máximo permitido", () => {
    const result = appendDesignBrief("x".repeat(1100), "y".repeat(500));

    expect(result).toHaveLength(MAX_DESIGN_BRIEF_LENGTH);
  });
});
