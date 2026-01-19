import { describe, it, expect } from 'vitest';

describe('Coconut API Key Validation', () => {
  it('should have a valid COCONUT_API_KEY', async () => {
    const apiKey = process.env.COCONUT_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).not.toBe('');
    expect(apiKey?.startsWith('k-')).toBe(true);
  });

  it('should be able to authenticate with Coconut API', async () => {
    const apiKey = process.env.COCONUT_API_KEY;
    
    // Test authentication by calling the API info endpoint
    const response = await fetch('https://api.coconut.co/v2/metadata', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          url: 'https://storage.googleapis.com/coconut-demo/spring.mp4'
        }
      })
    });
    
    // 200 = success, 402 = payment required (but auth works), 401 = invalid key
    expect(response.status).not.toBe(401);
    console.log('Coconut API response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Coconut API metadata response:', JSON.stringify(data, null, 2));
    }
  });
});
