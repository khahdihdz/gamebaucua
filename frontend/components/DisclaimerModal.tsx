'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'baucua_disclaimer_v1';

export default function DisclaimerModal() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(STORAGE_KEY);
      if (!accepted) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const accept = () => {
    if (!checked) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setOpen(false);
  };

  const decline = () => {
    window.location.href = 'https://google.com';
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-lg rounded-2xl border border-yellow-500/20 shadow-2xl overflow-hidden"
              style={{ background: 'rgba(10,10,18,0.98)' }}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">⚠️</span>
                  <div>
                    <h2 className="font-display text-xl font-black text-yellow-400">
                      Tuyên Bố Miễn Trừ Trách Nhiệm
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Vui lòng đọc kỹ trước khi tiếp tục</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto text-sm text-gray-300 leading-relaxed">

                {/* Age warning */}
                <div className="flex gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <span className="text-xl shrink-0">🔞</span>
                  <div>
                    <p className="font-bold text-red-400 mb-1">Chỉ dành cho người từ 18 tuổi trở lên</p>
                    <p className="text-gray-400 text-xs">
                      Nếu bạn chưa đủ 18 tuổi, vui lòng rời khỏi trang web này ngay lập tức.
                    </p>
                  </div>
                </div>

                {/* Entertainment only */}
                <div className="flex gap-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-xl shrink-0">🎮</span>
                  <div>
                    <p className="font-bold text-yellow-400 mb-1">Mục đích giải trí thuần túy</p>
                    <p className="text-gray-400 text-xs">
                      Đây là dự án mã nguồn mở dùng cho mục đích <strong className="text-yellow-300">học tập và giải trí</strong>.
                      Không phải sòng bạc thực sự, không đại diện cho bất kỳ tổ chức tài chính nào.
                    </p>
                  </div>
                </div>

                {/* Legal */}
                <div className="flex gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <span className="text-xl shrink-0">⚖️</span>
                  <div>
                    <p className="font-bold text-blue-400 mb-1">Tuân thủ pháp luật địa phương</p>
                    <p className="text-gray-400 text-xs">
                      Bạn có trách nhiệm tự kiểm tra xem việc tham gia có hợp pháp tại quốc gia/khu vực của bạn không.
                      Chúng tôi không chịu trách nhiệm nếu bạn vi phạm pháp luật địa phương.
                    </p>
                  </div>
                </div>

                {/* No liability */}
                <div className="flex gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <span className="text-xl shrink-0">🛡️</span>
                  <div>
                    <p className="font-bold text-purple-400 mb-1">Giới hạn trách nhiệm</p>
                    <p className="text-gray-400 text-xs">
                      Nhà phát triển <strong className="text-purple-300">không chịu bất kỳ trách nhiệm nào</strong> về
                      tổn thất tài chính, tâm lý hoặc các thiệt hại khác phát sinh từ việc sử dụng ứng dụng này.
                      Sử dụng hoàn toàn theo rủi ro của bản thân.
                    </p>
                  </div>
                </div>

                {/* Gambling warning */}
                <div className="flex gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <span className="text-xl shrink-0">🆘</span>
                  <div>
                    <p className="font-bold text-orange-400 mb-1">Cảnh báo cờ bạc có hại</p>
                    <p className="text-gray-400 text-xs">
                      Cờ bạc có thể gây nghiện và gây hại. Nếu bạn hoặc người thân đang gặp vấn đề,
                      hãy liên hệ đường dây hỗ trợ sức khỏe tâm thần tại địa phương.
                      <strong className="text-orange-300"> Đặt giới hạn và biết dừng đúng lúc.</strong>
                    </p>
                  </div>
                </div>

                {/* Open source */}
                <div className="p-3 rounded-xl bg-white/3 border border-white/10 text-xs text-gray-500">
                  <p>
                    <strong className="text-gray-400">Mã nguồn mở MIT License.</strong>{' '}
                    Dự án này được tạo ra với mục đích học tập lập trình web, minh hoạ các công nghệ
                    Next.js, Node.js, MongoDB, Redis và tích hợp thanh toán. Không phục vụ mục đích
                    kinh doanh cờ bạc bất hợp pháp.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 pt-4 border-t border-white/5">
                {/* Checkbox */}
                <motion.label
                  animate={shake ? { x: [-6, 6, -6, 6, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="flex items-start gap-3 mb-5 cursor-pointer group"
                >
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => setChecked(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      checked
                        ? 'bg-yellow-500 border-yellow-500'
                        : 'border-gray-600 group-hover:border-yellow-500/50'
                    }`}>
                      {checked && <span className="text-black text-xs font-black">✓</span>}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 leading-snug">
                    Tôi đã đọc, hiểu và đồng ý với tất cả các điều khoản trên.
                    Tôi xác nhận <strong className="text-gray-200">đủ 18 tuổi</strong> và
                    việc tham gia là <strong className="text-gray-200">hợp pháp</strong> tại nơi tôi sinh sống.
                  </span>
                </motion.label>

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={decline}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-500 text-sm font-semibold hover:bg-white/5 hover:text-gray-300 transition"
                  >
                    Rời khỏi trang
                  </button>
                  <button
                    onClick={accept}
                    className={`flex-1 py-2.5 rounded-xl font-black text-sm transition shadow-lg ${
                      checked
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500'
                        : 'bg-yellow-500/20 text-yellow-600 cursor-not-allowed'
                    }`}
                  >
                    Tôi đồng ý & Tiếp tục
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
