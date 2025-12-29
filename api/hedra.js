export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    console.log('[PROXY] OPTIONS request');
    return res.status(204).end();
  }

  try {
    const hedraPath = req.query.path || '';
    const hedraUrl = `https://api.hedra.com/web-app/public/${hedraPath}`;
    
    console.log(`[PROXY] ${req.method} -> ${hedraUrl}`);

    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing X-API-Key header' });
    }

    const hedraHeaders = { 'X-API-Key': apiKey };
    let body = null;

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const contentType = req.headers['content-type'] || '';
      if (contentType) {
        hedraHeaders['Content-Type'] = contentType;
      }
      
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
      console.log(`[PROXY] Body: ${body.length} bytes`);
    }

    const hedraRes = await fetch(hedraUrl, {
      method: req.method,
      headers: hedraHeaders,
      body: body && body.length > 0 ? body : undefined,
    });

    console.log(`[PROXY] Hedra: ${hedraRes.status}`);

    const data = await hedraRes.text();
    const ct = hedraRes.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    
    return res.status(hedraRes.status).send(data);

  } catch (err) {
    console.error(`[PROXY] Error: ${err.message}`);
    return res.status(500).json({ error: err.message });
  }
}
