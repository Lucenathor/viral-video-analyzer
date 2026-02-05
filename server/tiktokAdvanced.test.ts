import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("TikTok RapidAPI Advanced Integration", () => {
  it("should have RAPIDAPI_TIKTOK_KEY configured", () => {
    expect(ENV.RAPIDAPI_TIKTOK_KEY).toBeDefined();
    expect(ENV.RAPIDAPI_TIKTOK_KEY.length).toBeGreaterThan(10);
  });

  it("should be able to call TikTok Scraper API with filters", async () => {
    const response = await fetch(
      "https://tiktok-scraper7.p.rapidapi.com/feed/search?keywords=peluqueria&region=es&count=5&publish_time=180&sort_type=1",
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "tiktok-scraper7.p.rapidapi.com",
          "x-rapidapi-key": ENV.RAPIDAPI_TIKTOK_KEY,
        },
      }
    );

    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toBeDefined();
    // API returns code 0 on success
    expect(data.code).toBe(0);
    expect(data.data).toBeDefined();
    expect(data.data.videos).toBeDefined();
    expect(Array.isArray(data.data.videos)).toBe(true);
  }, 30000);
});
