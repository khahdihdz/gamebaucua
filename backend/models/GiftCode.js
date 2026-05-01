const mongoose = require('mongoose');

const giftCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1000
  },
  maxUses: {
    type: Number,
    default: 1,   // 1 = dùng 1 lần, 0 = không giới hạn
    min: 0
  },
  usedCount: {
    type: Number,
    default: 0
  },
  usedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null   // null = không hết hạn
  },
  note: {
    type: String,
    default: ''
  },
  createdAt: { type: Date, default: Date.now }
});

// Kiểm tra code có còn dùng được không
giftCodeSchema.virtual('isValid').get(function () {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  if (this.maxUses > 0 && this.usedCount >= this.maxUses) return false;
  return true;
});

module.exports = mongoose.model('GiftCode', giftCodeSchema);
