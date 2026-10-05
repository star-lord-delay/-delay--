const Otp = require('../models/Otp');

exports.requestOtp = async (req, res) => {
  try {
    const { email, usageType } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'email は必須です。' });
    }
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create(null, email, otpCode, usageType || 0, new Date(Date.now() + 600000));
    res.json({ success: true, message: 'ワンタイムコードを送信しました。' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otpCode, usageType } = req.body;
    const otpRecord = await Otp.verify(email, otpCode, usageType || 0);
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: '無効または有効期限切れのコードです。' });
    }
    await Otp.markAsUsed(otpRecord.otp_id);
    res.json({ success: true, message: '認証に成功しました。' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
