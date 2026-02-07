import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { GenerateThreadState } from "../state.js";

// Mock ChatOpenAI
const mockInvoke = jest.fn<any>();

jest.unstable_mockModule("@langchain/openai", () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: mockInvoke,
  })),
}));

// Dynamic import after mocking
const { parseTotalPosts, extractTotalPostsWithLLM, generateThreadPlan } =
  await import("./generate-thread-plan.js");

describe("generate-thread-plan", () => {
  beforeEach(() => {
    mockInvoke.mockClear();
  });

  describe("parseTotalPosts", () => {
    it("should parse total posts when tag is present", () => {
      const plan =
        "Some plan content\n<total-posts>5</total-posts>\nMore content";
      expect(parseTotalPosts(plan)).toBe(5);
    });

    it("should return undefined when tag is missing", () => {
      const plan = "Some plan content without tags";
      expect(parseTotalPosts(plan)).toBeUndefined();
    });

    it("should return undefined when content is not a number", () => {
      const plan = "<total-posts>five</total-posts>";
      expect(parseTotalPosts(plan)).toBeUndefined();
    });
  });

  describe("extractTotalPostsWithLLM", () => {
    it("should extract number from LLM response", async () => {
      mockInvoke.mockResolvedValue({ content: "The number of posts is 7." });
      const result = await extractTotalPostsWithLLM("some plan");
      expect(result).toBe(7);
      expect(mockInvoke).toHaveBeenCalled();
    });

    it("should return undefined if no number found", async () => {
      mockInvoke.mockResolvedValue({ content: "I cannot find the number." });
      const result = await extractTotalPostsWithLLM("some plan");
      expect(result).toBeUndefined();
    });
  });

  describe("generateThreadPlan", () => {
    const mockState: GenerateThreadState = {
      reports: ["Report 1"],
    } as any;

    it("should use regex parsing if successful", async () => {
      mockInvoke.mockResolvedValueOnce({
        content: "Plan content <total-posts>3</total-posts>",
      });

      const result = await generateThreadPlan(mockState);
      expect(result.totalPosts).toBe(3);
      // invoked once for generation
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it("should fallback to LLM if regex fails", async () => {
      // First call (generation) returns plan without tags
      mockInvoke.mockResolvedValueOnce({
        content: "Plan content without tags. There are 4 posts.",
      });
      // Second call (fallback) extracts the number
      mockInvoke.mockResolvedValueOnce({
        content: "4",
      });

      const result = await generateThreadPlan(mockState);
      expect(result.totalPosts).toBe(4);
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });

    it("should throw error if both regex and fallback fail", async () => {
      mockInvoke.mockResolvedValueOnce({
        content: "Plan content without tags.",
      });
      mockInvoke.mockResolvedValueOnce({
        content: "I don't know.",
      });

      await expect(generateThreadPlan(mockState)).rejects.toThrow(
        "Could not parse total posts from generation",
      );
    });
  });
});
