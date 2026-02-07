import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule("@langchain/anthropic", () => {
  return {
    ChatAnthropic: jest.fn(),
  };
});

jest.unstable_mockModule("langsmith/traceable", () => ({
  traceable: (fn: any) => fn,
}));

describe("verifyContentIsRelevant", () => {
  let verifyContentIsRelevant: any;
  let RELEVANCY_SCHEMA: any;
  let ChatAnthropic: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const anthropicModule = await import("@langchain/anthropic");
    ChatAnthropic = anthropicModule.ChatAnthropic;

    const verifyContentModule = await import("./verify-content.js");
    verifyContentIsRelevant = verifyContentModule.verifyContentIsRelevant;
    RELEVANCY_SCHEMA = verifyContentModule.RELEVANCY_SCHEMA;
  });

  it("should return true when content is relevant", async () => {
    const mockInvoke = (jest.fn() as any).mockResolvedValue({
      relevant: true,
      reasoning: "Relevant because..."
    });

    (ChatAnthropic as any).mockImplementation(() => ({
      withStructuredOutput: jest.fn().mockReturnValue({
        invoke: mockInvoke
      })
    }));

    const result = await verifyContentIsRelevant("Some content", {
      systemPrompt: "System prompt",
      schema: RELEVANCY_SCHEMA
    });

    expect(result).toBe(true);
    expect(ChatAnthropic).toHaveBeenCalled();
  });

  it("should return false when content is not relevant", async () => {
     const mockInvoke = (jest.fn() as any).mockResolvedValue({
      relevant: false,
      reasoning: "Not relevant because..."
    });

    (ChatAnthropic as any).mockImplementation(() => ({
      withStructuredOutput: jest.fn().mockReturnValue({
        invoke: mockInvoke
      })
    }));

    const result = await verifyContentIsRelevant("Some content", {
      systemPrompt: "System prompt",
      schema: RELEVANCY_SCHEMA
    });

    expect(result).toBe(false);
  });
});
