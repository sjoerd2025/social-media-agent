import request from "supertest";
import { SocialAuthServer } from "./auth-server";
import { Application } from "express";

describe("SocialAuthServer Security", () => {
  let app: Application;

  beforeAll(() => {
    // Mock required environment variables
    process.env.TWITTER_API_KEY = "mock_key";
    process.env.TWITTER_API_KEY_SECRET = "mock_secret";
    process.env.LINKEDIN_CLIENT_ID = "mock_linkedin_id";
    process.env.LINKEDIN_CLIENT_SECRET = "mock_linkedin_secret";
    process.env.SESSION_SECRET = "mock_session_secret";

    const server = new SocialAuthServer(0);
    app = (server as any).app;
  });

  afterAll(() => {
    // Clean up
    delete process.env.TWITTER_API_KEY;
    delete process.env.TWITTER_API_KEY_SECRET;
    delete process.env.LINKEDIN_CLIENT_ID;
    delete process.env.LINKEDIN_CLIENT_SECRET;
    delete process.env.SESSION_SECRET;
  });

  it("should set security headers (Helmet)", async () => {
    const response = await request(app).get("/");

    // Check for standard Helmet headers
    expect(response.headers["x-dns-prefetch-control"]).toBe("off");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["strict-transport-security"]).toBeDefined();
    expect(response.headers["x-download-options"]).toBe("noopen");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["referrer-policy"]).toBe("no-referrer");
    expect(response.headers["cross-origin-opener-policy"]).toBe("same-origin");
  });
});
