const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

// ─── SePay bank config ─────────────────────────────────────────────────────────
const BANK_CONFIG = {
  bankCode: process.env.SEPAY_BANK_CODE || 'MB',      // MBBank
  accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || '',
  accountName: process.env.SEPAY_ACCOUNT_NAME || 'BAUCUA CASINO',
  template: 'compact'
};

// ─── Generate deposit request ──────────────────────────────────────────────────
async function createDepositRequest({ userId, amount }) {
  const shortId = userId.toString().slice(-6).toUpperCase();
  const random  = Math.random().toString(36).slice(2, 6).toUpperCase();
  const content = `NAP${shortId}${random}`; // e.g. NAP1A2B3CXYZ1

  const vietQRUrl = buildVietQRUrl({ amount, content });
  const qrDataUrl = await QRCode.toDataURL(vietQRUrl, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 2
  });

  return {
    content,
    amount,
    bankCode: BANK_CONFIG.bankCode,
    accountNumber: BANK_CONFIG.accountNumber,
    accountName: BANK_CONFIG.accountName,
    qrDataUrl,
    vietQRUrl,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 min expiry
  };
}

// ─── VietQR URL builder ────────────────────────────────────────────────────────
function buildVietQRUrl({ amount, content }) {
  const base = 'https://img.vietqr.io/image';
  return `${base}/${BANK_CONFIG.bankCode}-${BANK_CONFIG.accountNumber}-${BANK_CONFIG.template}.png` +
    `?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`;
}

// ─── Verify SePay webhook signature ───────────────────────────────────────────
function verifyWebhookSignature(rawBody, signature) {
  const crypto = require('crypto');
  const secret = process.env.SEPAY_SECRET;
  if (!secret) return true; // Skip in dev

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature || '', 'hex'),
    Buffer.from(expected, 'hex')
  );
}

// ─── Parse SePay webhook payload ─────────────────────────────────────────────
function parseWebhookPayload(body) {
  // SePay sends: { id, content, transferAmount, transferType, referenceCode, ... }
  try {
    const data = typeof body === 'Buffer' ? JSON.parse(body.toString()) : body;
    return {
      sepayId:    data.id?.toString(),
      content:    data.content || data.description || '',
      amount:     parseInt(data.transferAmount || data.amount || 0),
      bankCode:   data.bankCode || data.gateway || '',
      referenceCode: data.referenceCode || data.id?.toString(),
      raw: data
    };
  } catch {
    return null;
  }
}

module.exports = {
  createDepositRequest,
  verifyWebhookSignature,
  parseWebhookPayload,
  BANK_CONFIG
};
