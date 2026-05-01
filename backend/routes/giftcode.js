const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const GiftCode = require('../models/GiftCode');
const User = require('../models/User');

// ─────────────────────────────────────────
// USER: POST /api/giftcode/redeem
// Body: { code: "ABC123" }
// ─────────────────────────────────────────
router.post('/redeem', requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Vui lòng nhập mã quà tặng' });
    }

    const gc = await GiftCode.findOne({ code: code.toUpperCase().trim() });
    if (!gc) return res.status(404).json({ error: 'Mã không tồn tại' });
    if (!gc.isActive) return res.status(400).json({ error: 'Mã đã bị vô hiệu hóa' });
    if (gc.expiresAt && gc.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Mã đã hết hạn' });
    }
    if (gc.maxUses > 0 && gc.usedCount >= gc.maxUses) {
      return res.status(400).json({ error: 'Mã đã hết lượt sử dụng' });
    }

    // Kiểm tra user đã dùng code này chưa
    const alreadyUsed = gc.usedBy.some(u => u.userId.toString() === req.user._id.toString());
    if (alreadyUsed) {
      return res.status(400).json({ error: 'Bạn đã sử dụng mã này rồi' });
    }

    // Cộng tiền + đánh dấu đã dùng
    await User.findByIdAndUpdate(req.user._id, { $inc: { balance: gc.amount } });
    gc.usedCount += 1;
    gc.usedBy.push({ userId: req.user._id });
    await gc.save();

    res.json({
      success: true,
      message: `🎉 Nhận thành công ${gc.amount.toLocaleString('vi-VN')}đ!`,
      amount: gc.amount
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────
// ADMIN: GET /admin/giftcodes
// ─────────────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, active } = req.query;
    const filter = {};
    if (active === 'true') filter.isActive = true;
    if (active === 'false') filter.isActive = false;

    const codes = await GiftCode.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await GiftCode.countDocuments(filter);
    res.json({ codes, total, page: parseInt(page) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────
// ADMIN: POST /admin/giftcodes  — tạo code mới
// Body: { code, amount, maxUses, expiresAt, note }
// ─────────────────────────────────────────
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { code, amount, maxUses = 1, expiresAt, note } = req.body;

    if (!code || !amount) {
      return res.status(400).json({ error: 'Thiếu code hoặc amount' });
    }
    if (typeof amount !== 'number' || amount < 1000) {
      return res.status(400).json({ error: 'Số tiền tối thiểu 1,000đ' });
    }

    const gc = await GiftCode.create({
      code: code.toUpperCase().trim(),
      amount,
      maxUses: parseInt(maxUses),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      note: note || ''
    });

    res.status(201).json({ success: true, giftCode: gc });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Mã code đã tồn tại' });
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────
// ADMIN: PATCH /admin/giftcodes/:id/toggle — bật/tắt
// ─────────────────────────────────────────
router.patch('/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const gc = await GiftCode.findById(req.params.id);
    if (!gc) return res.status(404).json({ error: 'Không tìm thấy' });
    gc.isActive = !gc.isActive;
    await gc.save();
    res.json({ success: true, isActive: gc.isActive });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────
// ADMIN: DELETE /admin/giftcodes/:id
// ─────────────────────────────────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await GiftCode.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
