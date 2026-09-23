// api/resolve.js

export default async function handler(req, res) {
  // Set CORS headers to allow requests from your GitHub Pages frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle CORS preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing required query parameter: url' });
  }

  try {
    const upstreamUrl = `https://yt-link-vid-resolve.vercel.app/api/video/open?url=${encodeURIComponent(url)}`;
    
    // Server-to-server request (not restricted by browser CORS)
    const apiResponse = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!apiResponse.ok) {
      return res.status(apiResponse.status).json({
        error: `Upstream API error: ${apiResponse.status}`
      });
    }

    const data = await apiResponse.json();

    // Return the untouched API response to the frontend
    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ error: 'Failed to connect to resolving server' });
  }
}
