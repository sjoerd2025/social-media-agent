import request from "supertest";
import { SocialAuthServer } from "./auth-server.js";
import { Application } from "express";

describe("SocialAuthServer Cookie Security", () => {
  let app: Application;
  let server: SocialAuthServer;

  // Helper to setup app with specific NODE_ENV
  const setupApp = (nodeEnv: string) => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = nodeEnv;

    // Mock required environment variables
    process.env.TWITTER_API_KEY = "mock_key";
    process.env.TWITTER_API_KEY_SECRET = "mock_secret";
    process.env.LINKEDIN_CLIENT_ID = "mock_linkedin_id";
    process.env.LINKEDIN_CLIENT_SECRET = "mock_linkedin_secret";
    process.env.SESSION_SECRET = "mock_session_secret";

    server = new SocialAuthServer(0);
    app = (server as any).app;

    return () => {
        process.env.NODE_ENV = originalNodeEnv;
        delete process.env.TWITTER_API_KEY;
        delete process.env.TWITTER_API_KEY_SECRET;
        delete process.env.LINKEDIN_CLIENT_ID;
        delete process.env.LINKEDIN_CLIENT_SECRET;
        delete process.env.SESSION_SECRET;
    };
  };

  test("should set secure cookie in production", async () => {
    const cleanup = setupApp("production");

    // We must trust proxy and send X-Forwarded-Proto for secure cookies to work without https connection in test
    const response = await request(app)
      .get("/")
      .set("X-Forwarded-Proto", "https");

    const cookies = response.headers["set-cookie"] as unknown as string[];
    expect(cookies).toBeDefined();

    const sessionCookie = cookies.find((c: string) => c.startsWith("connect.sid"));
    expect(sessionCookie).toBeDefined();
    // This expects Secure flag
    expect(sessionCookie).toContain("Secure");

    cleanup();
  });

  test("should NOT set secure cookie in development", async () => {
    const cleanup = setupApp("development");

    const response = await request(app).get("/");

    const cookies = response.headers["set-cookie"] as unknown as string[];
    expect(cookies).toBeDefined();
    const sessionCookie = cookies.find((c: string) => c.startsWith("connect.sid"));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).not.toContain("Secure");

    cleanup();
  });
});
