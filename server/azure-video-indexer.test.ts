import { describe, expect, it } from "vitest";

const AZURE_ACCOUNT_ID = process.env.AZURE_VIDEO_INDEXER_ACCOUNT_ID;
const AZURE_LOCATION = process.env.AZURE_VIDEO_INDEXER_LOCATION;
const AZURE_API_KEY = process.env.AZURE_VIDEO_INDEXER_API_KEY;

describe("Azure Video Indexer credentials", () => {
  it("should have all required environment variables set", () => {
    expect(AZURE_ACCOUNT_ID).toBeDefined();
    expect(AZURE_ACCOUNT_ID).not.toBe("");
    expect(AZURE_LOCATION).toBeDefined();
    expect(AZURE_LOCATION).not.toBe("");
    expect(AZURE_API_KEY).toBeDefined();
    expect(AZURE_API_KEY).not.toBe("");
  });

  it("should be able to get an access token from Azure Video Indexer", async () => {
    // Skip if credentials are not set
    if (!AZURE_ACCOUNT_ID || !AZURE_LOCATION || !AZURE_API_KEY) {
      console.warn("Skipping Azure Video Indexer test - credentials not set");
      return;
    }

    // Get access token using the API key
    const tokenUrl = `https://api.videoindexer.ai/Auth/${AZURE_LOCATION}/Accounts/${AZURE_ACCOUNT_ID}/AccessToken?allowEdit=true`;
    
    const response = await fetch(tokenUrl, {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_API_KEY,
      },
    });

    // Check if we got a valid response
    expect(response.status).toBe(200);
    
    const token = await response.text();
    // Token should be a JWT string (starts with quotes in the response)
    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(10);
    
    console.log("Successfully obtained Azure Video Indexer access token");
  });
});
