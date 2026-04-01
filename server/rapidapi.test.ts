import { describe, it, expect } from "vitest";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_TIKTOK_KEY = process.env.RAPIDAPI_TIKTOK_KEY || RAPIDAPI_KEY;

describe("RapidAPI Keys Validation", () => {
  it("should have RAPIDAPI_KEY configured", () => {
    expect(RAPIDAPI_KEY).toBeTruthy();
    expect(RAPIDAPI_KEY.length).toBeGreaterThan(10);
  });

  it("should have RAPIDAPI_TIKTOK_KEY configured", () => {
    expect(RAPIDAPI_TIKTOK_KEY).toBeTruthy();
    expect(RAPIDAPI_TIKTOK_KEY.length).toBeGreaterThan(10);
  });

  it("should be able to call Instagram Scraper Stable API", async () => {
    // Use v2 endpoint with a known stable shortcode
    const response = await fetch(
      `https://instagram-scraper-stable-api.p.rapidapi.com/get_media_data_v2.php?media_code=${encodeURIComponent("CyGEFpToo62")}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": "instagram-scraper-stable-api.p.rapidapi.com",
          "x-rapidapi-key": RAPIDAPI_KEY,
        },
      }
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveProperty("video_url");
    expect(json.video_url).toContain("http");
  }, 15000);

  it("should be able to call TikTok Scraper API", async () => {
    const response = await fetch(
      `https://tiktok-scraper7.p.rapidapi.com/?url=${encodeURIComponent("https://www.tiktok.com/@tiktok/video/7516594811734854943")}&hd=1`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": "tiktok-scraper7.p.rapidapi.com",
          "x-rapidapi-key": RAPIDAPI_TIKTOK_KEY,
        },
      }
    );
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.code).toBe(0);
    expect(json.data).toHaveProperty("play");
    expect(json.data.play).toContain("http");
  }, 15000);
});
