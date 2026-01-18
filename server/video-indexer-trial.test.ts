import { describe, expect, it } from "vitest";

describe("Video Indexer Trial API", () => {
  const VI_API_URL = 'https://api.videoindexer.ai';
  const VI_LOCATION = 'trial';
  const VI_ACCOUNT_ID = '6281b6ac-b928-4dd3-b59d-f76415cf0421';
  const VI_API_KEY = '48da1830da71434583b5274424508857';

  it("should get access token from Trial account", async () => {
    const url = `${VI_API_URL}/Auth/${VI_LOCATION}/Accounts/${VI_ACCOUNT_ID}/AccessToken?allowEdit=false`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': VI_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 100));
    
    expect(response.ok).toBe(true);
  });
});
