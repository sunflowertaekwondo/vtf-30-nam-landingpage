// Vercel Serverless Function: /api/katelinh-chat
// Protects KIRA_API_KEY on the server side (G4.06 compliance) with IP rate-limiting & 4-model failover.

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;
const ipRequestCounters = new Map();

const CANDIDATE_MODELS = [
  'kira-flash',
  'deepseek-v4.1-flash',
  'kira-2.5-flash',
  'glm-4.7-flash',
];

function checkRateLimit(ip) {
  const now = Date.now();
  const record = ipRequestCounters.get(ip);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipRequestCounters.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count += 1;
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const clientIp =
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      ok: false,
      error: 'Too many requests. Vui lòng đợi 1 phút trước khi gửi tiếp câu hỏi.',
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { messages, preferredModel, customApiKey } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ ok: false, error: 'Missing messages payload' });
  }

  // Server-side secret key (set in Vercel Environment Variables as KIRA_API_KEY)
  const serverApiKey =
    (customApiKey && String(customApiKey).trim().startsWith('kira_')
      ? String(customApiKey).trim()
      : '') ||
    process.env.KIRA_API_KEY ||
    'kira_f1d4002a2519f3ea0c9110c3ea0e79c4';

  const modelChain = Array.from(
    new Set([
      preferredModel && typeof preferredModel === 'string' ? preferredModel : 'kira-flash',
      ...CANDIDATE_MODELS,
    ])
  );

  for (const modelName of modelChain) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8500);
    try {
      const kiraRes = await fetch('https://kiraai.vn/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverApiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: 0.25,
        }),
      });
      clearTimeout(timer);

      if (kiraRes.ok) {
        const data = await kiraRes.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content && typeof content === 'string' && content.trim().length > 10) {
          return res.status(200).json({
            ok: true,
            content: content.trim(),
            modelUsed: modelName,
          });
        }
      }
    } catch {
      clearTimeout(timer);
      // Continue to next failover model
    }
  }

  return res.status(502).json({
    ok: false,
    error: 'All upstream models timed out or returned empty response',
  });
}
