'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'baucua_disclaimer_accepted';
const DISCLAIMER_VERSION = '1.0'; // Tăng version để force hiện lại khi update

export function DisclaimerModal() {
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (accepted !== DISCLAIMER_VERSION) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    if (!checked) return;
    localStorage.setItem(STORAGE_KEY, DISCLAIMER_VERSION);
    setShow(false);
  };

  const handleDecline = () => {
    // Redirect ra khỏi trang
    window.location.href = 'https://www.google.com';
  };

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop — không cho click ra ngoài */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative w-full max-w-lg bg-casino-card border border-casino-border rounded-2xl shadow-card overflow-hidden"
          >
            {/* Top warning bar */}
            <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-5 py-3 flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              <span className="text-yellow-400 font-bold text-sm uppercase tracking-wider">
                Thông Báo Quan Trọng
              </span>
            </div>

            <div className="p-6 space-y-5">
              {/* Logo */}
              <div className="text-center">
                <span className="text-4xl">🎲</span>
                <h2 className="text-xl font-black text-white mt-2">Bầu Cua Casino</h2>
                <p className="text-gray-400 text-sm">Vui lòng đọc kỹ trước khi tiếp tục</p>
              </div>

              {/* Disclaimer content */}
              <div className="bg-casino-surface border border-casino-border rounded-xl p-4 space-y-3 text-sm text-gray-300 max-h-64 overflow-y-auto">

                <Section title="🎮 Tính Chất Giải Trí">
                  Bầu Cua Casino là nền tảng game giải trí trực tuyến.
                  Các vật phẩm trong game (xu, điểm) <strong className="text-white">không có giá trị tiền tệ thực</strong> và
                  không thể quy đổi ra tiền mặt hoặc tài sản thực tế.
                </Section>

                <Section title="🔞 Giới Hạn Độ Tuổi">
                  Dịch vụ này <strong className="text-white">chỉ dành cho người từ 18 tuổi trở lên</strong>.
                  Nếu bạn chưa đủ 18 tuổi, vui lòng rời khỏi trang web ngay lập tức.
                </Section>

                <Section title="⚖️ Miễn Trừ Trách Nhiệm Pháp Lý">
                  Nhà phát triển không chịu trách nhiệm về bất kỳ tổn thất, thiệt hại hoặc tranh chấp
                  phát sinh từ việc sử dụng dịch vụ này. Người dùng tự chịu trách nhiệm hoàn toàn
                  về hành vi của mình trong quá trình sử dụng.
                </Section>

                <Section title="🏛️ Tuân Thủ Pháp Luật">
                  Người dùng có trách nhiệm tự tìm hiểu và tuân thủ các quy định pháp luật
                  tại địa phương của mình liên quan đến game trực tuyến.
                  Dịch vụ này <strong className="text-white">không khuyến khích</strong> bất kỳ hành vi vi phạm pháp luật nào.
                </Section>

                <Section title="🔒 Bảo Mật Tài Khoản">
                  Bạn có trách nhiệm bảo mật thông tin tài khoản của mình.
                  Nhà phát triển không chịu trách nhiệm nếu tài khoản bị xâm phạm do lỗi của người dùng.
                </Section>

                <Section title="🚫 Nghiêm Cấm">
                  Nghiêm cấm sử dụng dịch vụ để rửa tiền, gian lận, hoặc bất kỳ hoạt động bất hợp pháp nào.
                  Vi phạm sẽ bị khóa tài khoản vĩnh viễn và có thể bị báo cáo đến cơ quan có thẩm quyền.
                </Section>

              </div>

              {/* Checkbox confirm */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => setChecked(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                    ${checked
                      ? 'bg-casino-gold border-casino-gold'
                      : 'border-casino-border bg-casino-surface group-hover:border-gray-500'
                    }`}
                  >
                    {checked && <span className="text-casino-bg text-xs font-black">✓</span>}
                  </div>
                </div>
                <span className="text-sm text-gray-300 leading-relaxed">
                  Tôi đã đọc và đồng ý với các điều khoản trên. Tôi xác nhận rằng tôi{' '}
                  <strong className="text-white">từ 18 tuổi trở lên</strong> và tự chịu trách nhiệm
                  về việc sử dụng dịch vụ này.
                </span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleAccept}
                  disabled={!checked}
                  className="flex-1 btn-casino py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ✅ Tôi Đồng Ý — Vào Game
                </motion.button>
                <button
                  onClick={handleDecline}
                  className="px-4 py-3 border border-casino-border rounded-xl text-sm text-gray-500
                             hover:border-gray-500 hover:text-gray-300 transition-colors"
                >
                  Rời Đi
                </button>
              </div>

              <p className="text-center text-xs text-gray-600">
                Bằng cách tiếp tục, bạn xác nhận đã đọc và hiểu{' '}
                <span className="text-gray-500">Điều Khoản Sử Dụng</span> của chúng tôi.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-bold text-white mb-1">{title}</p>
      <p className="text-gray-400 leading-relaxed">{children}</p>
    </div>
  );
}
