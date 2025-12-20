// Hedra API Proxy with full CORS support
// Handles all request types including multipart file uploads

export const config = {
  api: {
    bodyParser: false, // Required for handling file uploads
  },
};

export default async function handler(req, res) {
  // Set CORS headers FIRST - before anything else
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight OPTIONS request immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the path after /api/hedra/
    const { path } = req.query;
    const hedraPath = Array.isArray(path) ? path.join('/') : path;
    const hedraUrl = `https://api.hedra.com/web-app/public/${hedraPath}`;

    console.log(`[HEDRA PROXY] ${req.method} ${hedraUrl}`);

    // Get API key from request header
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing X-API-Key header' });
    }

    // Prepare headers for Hedra
    const hedraHeaders = {
      'X-API-Key': apiKey,
    };

    // Handle the request body
    let body;
    const contentType = req.headers['content-type'] || '';

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (contentType.includes('multipart/form-data')) {
        // For file uploads, pass through the raw body and content-type
        hedraHeaders['Content-Type'] = contentType;
        body = await getRawBody(req);
      } else if (contentType.includes('application/json')) {
        // For JSON, parse and re-stringify
        hedraHeaders['Content-Type'] = 'application/json';
        body = await getRawBody(req);
      } else {
        // Other content types
        hedraHeaders['Content-Type'] = contentType;
        body = await getRawBody(req);
      }
    }

    // Make request to Hedra
    const hedraResponse = await fetch(hedraUrl, {
      method: req.method,
      headers: hedraHeaders,
      body: body,
    });

    // Get response data
    const responseText = await hedraResponse.text();
    
    // Log response status
    console.log(`[HEDRA PROXY] Response: ${hedraResponse.status}`);

    // Forward Hedra's content-type
    const hedraContentType = hedraResponse.headers.get('content-type');
    if (hedraContentType) {
      res.setHeader('Content-Type', hedraContentType);
    }

    // Return response with same status code
    return res.status(hedraResponse.status).send(responseText);

  } catch (error) {
    console.error('[HEDRA PROXY] Error:', error);
    return res.status(500).json({ 
      error: 'Proxy error', 
      message: error.message 
    });
  }
}

// Helper function to get raw request body
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
