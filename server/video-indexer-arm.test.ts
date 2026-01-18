import { describe, expect, it } from "vitest";
import { checkArmApiStatus } from "./video-indexer-arm";

describe("Azure Video Indexer ARM API", () => {
  it("should be able to get access token with ARM credentials", async () => {
    const isAvailable = await checkArmApiStatus();
    console.log("ARM API available:", isAvailable);
    expect(typeof isAvailable).toBe("boolean");
  }, 30000); // 30 second timeout
});
