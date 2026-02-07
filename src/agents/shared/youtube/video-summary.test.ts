import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Define mocks before importing the modules under test
jest.unstable_mockModule("@langchain/langgraph", () => ({
  interrupt: jest.fn(),
}));

jest.unstable_mockModule("../nodes/youtube.utils.js", () => ({
  getChannelInfo: jest.fn(),
  getVideoThumbnailUrl: jest.fn(),
  getYouTubeVideoDuration: jest.fn(),
}));

jest.unstable_mockModule("../../should-exclude.js", () => ({
  shouldExcludeYouTubeContent: jest.fn(),
  LANGCHAIN_DOMAINS: [],
}));

jest.unstable_mockModule("@langchain/google-vertexai-web", () => {
  return {
    ChatVertexAI: jest.fn().mockImplementation(() => ({
      withConfig: jest.fn().mockReturnThis(),
      invoke: (jest.fn() as any).mockResolvedValue({ content: "summary" }),
    })),
  };
});

describe("getVideoSummary", () => {
  let getVideoSummary: any;
  let interrupt: any;
  let getChannelInfo: any;
  let getVideoThumbnailUrl: any;
  let getYouTubeVideoDuration: any;
  let shouldExcludeYouTubeContent: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Import modules dynamically to ensure mocks are applied
    const langGraph = await import("@langchain/langgraph");
    interrupt = langGraph.interrupt;

    const youtubeUtils = await import("../nodes/youtube.utils.js");
    getChannelInfo = youtubeUtils.getChannelInfo;
    getVideoThumbnailUrl = youtubeUtils.getVideoThumbnailUrl;
    getYouTubeVideoDuration = youtubeUtils.getYouTubeVideoDuration;

    const exclusion = await import("../../should-exclude.js");
    shouldExcludeYouTubeContent = exclusion.shouldExcludeYouTubeContent;

    const videoSummaryModule = await import("./video-summary.js");
    getVideoSummary = videoSummaryModule.getVideoSummary;

    (shouldExcludeYouTubeContent as any).mockReturnValue(false);
    (getChannelInfo as any).mockResolvedValue({
      channelName: "Test Channel",
    });
    (getVideoThumbnailUrl as any).mockResolvedValue("https://thumbnail.com");
    (getYouTubeVideoDuration as any).mockResolvedValue(100);
  });

  it("should return summary for short videos", async () => {
    const result = await getVideoSummary("https://youtube.com/video");
    expect(result.summary).toBe("summary");
    expect(interrupt).not.toHaveBeenCalled();
  });

  it("should call interrupt for long videos", async () => {
    (getYouTubeVideoDuration as any).mockResolvedValue(1900); // > 30 min
    (interrupt as any).mockReturnValue([{ type: "accept" }]);

    const result = await getVideoSummary("https://youtube.com/video");

    expect(interrupt).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          description: expect.stringContaining("30 minutes"),
        }),
      ])
    );
    expect(result.summary).toBe("summary");
  });

  it("should return empty if user ignores interrupt", async () => {
    (getYouTubeVideoDuration as any).mockResolvedValue(1900);
    (interrupt as any).mockReturnValue([{ type: "ignore" }]);

    const result = await getVideoSummary("https://youtube.com/video");

    expect(result.summary).toBe("");
    expect(result.thumbnail).toBe("");
  });
});
