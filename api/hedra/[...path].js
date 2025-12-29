// Hedra API Proxy with full CORS support
// File: api/hedra/[...path].js

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  // Set CORS headers FIRST
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract path from the URL directly
    // URL will be like: /api/hedra/assets or /api/hedra/assets/123/upload
    const urlPath = req.url || '';
    const hedraPath = urlPath.replace(/^\/api\/hedra\/?/, '').split('?')[0];
    
    const hedraUrl = `https://api.hedra.com/web-app/public/${hedraPath}`;
    
    console.log(`[HEDRA PROXY] ${req.method} -> ${hedraUrl}`);

    // Get API key
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing X-API-Key header' });
    }

    // Build headers for Hedra
    const hedraHeaders = {
      'X-API-Key': apiKey,
    };

    // Handle request body for non-GET requests
    let body = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const contentType = req.headers['content-type'] || '';
      
      // Get raw body
      body = await getRawBody(req);
      
      // Pass through content-type
      if (contentType) {
        hedraHeaders['Content-Type'] = contentType;
      }
      
      console.log(`[HEDRA PROXY] Body size: ${body.length} bytes, Content-Type: ${contentType}`);
    }

    // Make request to Hedra
    const fetchOptions = {
      method: req.method,
      headers: hedraHeaders,
    };
    
    if (body && body.length > 0) {
      fetchOptions.body = body;
    }

    const hedraResponse = await fetch(hedraUrl, fetchOptions);
    
    console.log(`[HEDRA PROXY] Hedra responded: ${hedraResponse.status}`);

    // Get response
    const responseData = await hedraResponse.text();

    // Forward content-type
    const responseContentType = hedraResponse.headers.get('content-type');
    if (responseContentType) {
      res.setHeader('Content-Type', responseContentType);
    }

    return res.status(hedraResponse.status).send(responseData);

  } catch (error) {
    console.error('[HEDRA PROXY] Error:', error.message);
    return res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
}
