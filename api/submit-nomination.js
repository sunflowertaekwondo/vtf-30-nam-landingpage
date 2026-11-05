// Vercel Serverless Function: /api/submit-nomination
// Centralized intake endpoint for VTF 30th Anniversary Nominations (038/TB-VTF) & Yearbook Photos (CV 128/VTF-VP)
import crypto from 'node:crypto';

const recentCloudSubmissions = [];
const MAX_CLOUD_BUFFER = 200;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      count: recentCloudSubmissions.length,
      submissions: recentCloudSubmissions.slice(0, 50),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const {
      id,
      fullName,
      phone,
      email,
      organization,
      submissionType,
      submissionTypeLabel,
      yearsContributed,
      estimatedScore,
      estimatedRank,
      messageOrAchievement,
      photoAlbumUrl,
      photoCaptions,
      consentAccepted,
    } = body;

    if (!fullName || !phone || !email || !organization || !messageOrAchievement) {
      return res.status(400).json({
        ok: false,
        error: 'Thiếu trường thông tin bắt buộc trong hồ sơ.',
      });
    }

    const nowIso = new Date().toISOString();
    const recordId = id || `VTF30-${Math.floor(1000 + Math.random() * 9000)}`;
    const signatureRaw = `${recordId}|${fullName}|${phone}|${organization}|${nowIso}`;
    const serverReceiptHash =
      'VTF-SIG-' +
      crypto.createHash('sha256').update(signatureRaw).digest('hex').slice(0, 10).toUpperCase();

    const verifiedRecord = {
      id: recordId,
      serverReceivedAt: nowIso,
      serverReceiptHash,
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      email: String(email).trim(),
      organization: String(organization).trim(),
      submissionType: submissionType || 'nomination_b',
      submissionTypeLabel: submissionTypeLabel || 'Hồ sơ 30 năm VTF',
      yearsContributed: Number(yearsContributed) || 5,
      estimatedScore: estimatedScore !== undefined ? Number(estimatedScore) : undefined,
      estimatedRank: estimatedRank ? String(estimatedRank) : undefined,
      messageOrAchievement: String(messageOrAchievement).trim(),
      photoAlbumUrl: photoAlbumUrl ? String(photoAlbumUrl).trim() : '',
      photoCaptions: photoCaptions ? String(photoCaptions).trim() : '',
      consentAccepted: Boolean(consentAccepted),
    };

    recentCloudSubmissions.unshift(verifiedRecord);
    if (recentCloudSubmissions.length > MAX_CLOUD_BUFFER) {
      recentCloudSubmissions.pop();
    }

    // Optional forwarding to VTF Google Sheets / Apps Script Webhook if configured
    let webhookForwarded = false;
    const webhookUrl = process.env.VTF_GOOGLE_SHEET_WEBHOOK;
    if (webhookUrl && webhookUrl.startsWith('https://')) {
      try {
        const whRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verifiedRecord),
        });
        webhookForwarded = whRes.ok;
      } catch {
        webhookForwarded = false;
      }
    }

    return res.status(200).json({
      ok: true,
      id: recordId,
      serverReceivedAt: nowIso,
      serverReceiptHash,
      webhookForwarded,
      secretariatEmail: 'tkdvn1996@gmail.com',
      secretariatHotline: '0909 576 776',
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Internal Server Error',
    });
  }
}
