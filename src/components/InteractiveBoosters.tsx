import React, { useState } from 'react';
import { Award, Calculator, CheckCircle2, Flame, ShieldCheck, Sparkles, Trophy, ArrowRight } from 'lucide-react';
import './DetailCalcLink.css';

export interface CalculatorTransferPayload {
  branch: 'nomination_a' | 'nomination_b';
  years: number;
  totalScore: number;
  rankLabel: string;
  summaryText: string;
}

interface InteractiveBoostersProps {
  onApplyScoreToForm: (payload: CalculatorTransferPayload) => void;
}

interface KickCandidate {
  id: string;
  athlete: string;
  event: string;
  kickName: string;
  description: string;
  votes: number;
}

const INITIAL_KICK_POLL: KickCandidate[] = [
  {
    id: 'kick-sydney-2000',
    athlete: 'Trần Hiếu Ngân',
    event: 'Olympic Sydney 2000 (−57kg nữ)',
    kickName: 'Đòn đá vòng cầu Dollyo Chagi mở toang cánh cửa Olympic lịch sử',
    description: 'Chiến thắng bán kết nghẹt thở đưa Thể thao Việt Nam lần đầu tiên chạm tay vào tấm Huy chương Thế vận hội.',
    votes: 4820,
  },
  {
    id: 'kick-asiad-1994',
    athlete: 'Trần Quang Hạ',
    event: 'ASIAD 12 Hiroshima 1994',
    kickName: 'Đòn phản công quyết định mang về tấm HCV Á vận hội đầu tiên',
    description: 'Cú đá lịch sử tại Hiroshima khai mở vị thế cường quốc Taekwondo của Việt Nam trên đấu trường châu lục.',
    votes: 3190,
  },
  {
    id: 'kick-poomsae-world',
    athlete: 'Châu Tuyết Vân & ĐT Quyền QG',
    event: 'Giải Vô địch Quyền Thế giới (2013 – 2024)',
    kickName: 'Tổ hợp đá bay cao trên không trung (Acrobatic Freestyle Kick) đạt điểm tuyệt đối',
    description: 'Đòn kỹ thuật biểu diễn thương hiệu đưa Poomsae Việt Nam 10 lần bước lên ngôi vô địch Thế giới.',
    votes: 3945,
  },
  {
    id: 'kick-asiad-2024',
    athlete: 'Bạc Thị Khiêm',
    event: 'Giải VĐ Châu Á 2024 & SEA Games 33 (2025)',
    kickName: 'Đòn đá chẻ tầm cao (Neryo Chagi) vào giáp điện tử ở giây cuối chung kết',
    description: 'Minh chứng cho sự trở lại đầy uy lực của thế hệ võ sĩ đối kháng Việt Nam hướng tới Olympic 2028.',
    votes: 2860,
  },
];

const QUIZ_QUESTIONS = [
  {
    q: 'Liên đoàn Taekwondo Việt Nam (VTF) được Thủ tướng Chính phủ cho phép thành lập theo Quyết định nào và Đại hội lần I diễn ra vào mốc thời gian nào?',
    options: [
      'Quyết định 358/TTg (28/05/1996) & Đại hội lần I ngày 22/12/1996',
      'Quyết định 111/TTg (15/08/1994) & Đại hội lần I tháng 10/1994',
      'Quyết định 500/TTg (02/09/2000) & Đại hội lần I tháng 12/2000',
    ],
    correctIndex: 0,
    explanation: 'Quyết định số 358/TTg ký ngày 28/05/1996 và Đại hội Đại biểu toàn quốc lần thứ I diễn ra ngày 22/12/1996.',
  },
  {
    q: 'Ai là người Việt Nam đầu tiên và duy nhất được Viện Hàn lâm Taekwondo Thế giới (Kukkiwon) trao chứng nhận Cửu đẳng Huyền đai (9 Dan)?',
    options: [
      'Đại võ sư Trương Ngọc Để – Chủ tịch Liên đoàn Taekwondo Việt Nam',
      'Chuyên gia Kim Kil Tae – Đội tuyển Taekwondo Quốc gia',
      'Võ sĩ Nguyễn Văn Hùng – Nhà vô địch 5 kỳ SEA Games liên tiếp',
    ],
    correctIndex: 0,
    explanation: 'Đại võ sư Trương Ngọc Để – Chủ tịch VTF 3 nhiệm kỳ IV, V, VI – là người Việt Nam đầu tiên đạt Cửu đẳng Huyền đai Kukkiwon.',
  },
  {
    q: 'Theo Bản tiêu chí số 036/VTF (04/04/2026), ứng viên đạt từ bao nhiêu điểm trên thang 100 điểm sẽ được xếp vào HẠNG ĐẶC BIỆT cấp Quốc gia?',
    options: [
      'Từ 90 đến 100 điểm (và đạt tối thiểu 70% phiếu đồng ý của Hội đồng Quốc gia)',
      'Từ 75 đến 89 điểm',
      'Chỉ cần có 30 năm tập luyện không cần chấm điểm',
    ],
    correctIndex: 0,
    explanation: 'Hạng Đặc Biệt yêu cầu đạt 90–100 điểm ở Hệ A hoặc Hệ B và được ≥70% thành viên Hội đồng cấp Quốc gia bỏ phiếu thông qua.',
  },
];

export const InteractiveBoosters: React.FC<InteractiveBoostersProps> = ({ onApplyScoreToForm }) => {
  const [activeTab, setActiveTab] = useState<'calculator' | 'fan_interactive'>('calculator');

  // Branch selector: Hệ A (Thành tích đỉnh cao) vs Hệ B (Cống hiến Di sản)
  const [branch, setBranch] = useState<'A' | 'B'>('B');

  // --- HỆ A STATES (Theo đúng Bản tiêu chí 036/VTF trang 3-5) ---
  const [aAxis1Medal, setAAxis1Medal] = useState<number>(45); // Olympic HCV 50, HCB 45, ASIAD/World HCV 45...
  const [aAxis1Label, setAAxis1Label] = useState<string>('HCB Olympic / HCV ASIAD / HCV Thế giới (45đ)');
  const [aAxis2Accumulated, setAAxis2Accumulated] = useState<number>(20); // >=3 HC: 20, 2 HC: 15, 1 HC: 10, 0: 0
  const [aYears, setAYears] = useState<number>(18); // >=15: 15, 10-14: 10, 5-9: 5
  const [aAxis4Training, setAAxis4Training] = useState<number>(10); // HC QT: 10, ĐTQG: 7, HC QG: 5, 0: 0
  const [aAxis4Management, setAAxis4Management] = useState<number>(5); // Cấp QG: 5, Tỉnh: 3, 0: 0

  // --- HỆ B STATES (Theo đúng Bản tiêu chí 036/VTF trang 5-7) ---
  const [bYears, setBYears] = useState<number>(30); // >=30: 30, 20-29: 25, 10-19: 15, 5-9: 10
  const [bAxis2Club, setBAxis2Club] = useState<number>(20); // >=100 VS: 20, 50-99 VS: 15, <50 VS: 10
  const [bAxis2System, setBAxis2System] = useState<number>(10); // Mở rộng cấp tỉnh: 10, Duy trì >=10 năm: 7, Hỗ trợ: 5
  const [bAxis3Athletes, setBAxis3Athletes] = useState<number>(10); // >=1 VĐV QT: 10, >=3 ĐTQG: 8, >=5 Tỉnh: 5
  const [bAxis3Coaches, setBAxis3Coaches] = useState<number>(10); // >=10 HLV/TT: 10, 5-9 HLV/TT: 7, Giảng dạy: 5
  const [bRole1, setBRole1] = useState<number>(15); // UV BCH VTF 20, BCH Tỉnh 15, HĐKT 15, TTQT 15, HLV Trưởng Tỉnh 10, HLV PT 5
  const [bRole2, setBRole2] = useState<number>(5); // Tối đa 2 vai trò, tổng trần Trục 4 = 20đ

  // --- FAN POLL & QUIZ STATES ---
  const [kickCandidates, setKickCandidates] = useState<KickCandidate[]>(INITIAL_KICK_POLL);
  const [votedKickId, setVotedKickId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [visitorName, setVisitorName] = useState<string>('Nguyễn Văn Võ Sinh');
  const [visitorStartYear, setVisitorStartYear] = useState<number>(2010);
  const [visitorDan, setVisitorDan] = useState<string>('4 Đẳng Huyền Đai VTF');

  // --- COMPUTE SCORES ---
  const aAxis3Score = aYears >= 15 ? 15 : aYears >= 10 ? 10 : 5;
  const aAxis4Score = Math.min(15, aAxis4Training + aAxis4Management);
  const totalScoreA = Math.min(100, aAxis1Medal + aAxis2Accumulated + aAxis3Score + aAxis4Score);

  const bAxis1Score = bYears >= 30 ? 30 : bYears >= 20 ? 25 : bYears >= 10 ? 15 : 10;
  const bAxis2Score = Math.min(30, bAxis2Club + bAxis2System);
  const bAxis3Score = Math.min(20, bAxis3Athletes + bAxis3Coaches);
  const bAxis4Score = Math.min(20, bRole1 + bRole2);
  const totalScoreB = Math.min(100, bAxis1Score + bAxis2Score + bAxis3Score + bAxis4Score);

  const activeTotalScore = branch === 'A' ? totalScoreA : totalScoreB;
  const activeYears = branch === 'A' ? aYears : bYears;

  const getRankInfo = (score: number) => {
    if (score >= 90) {
      return {
        title: 'HẠNG ĐẶC BIỆT (90 – 100 điểm)',
        badgeColor: 'rank-special',
        desc: 'Đủ tiêu chuẩn xét vinh danh Hạng Đặc Biệt cấp Quốc gia và đề cử Hội đồng Vietnam Taekwondo Hall of Fame (Class of 2026).',
        medalShape: 'Kỷ niệm chương Bát Giác Vàng 30 Năm & Đề cử Đại sảnh Danh vọng',
      };
    }
    if (score >= 75) {
      return {
        title: 'HẠNG XUẤT SẮC (75 – 89 điểm)',
        badgeColor: 'rank-excellent',
        desc: 'Có thành tích quốc tế mạnh hoặc đóng góp xây dựng hệ thống rõ ràng, bền vững qua nhiều thập kỷ.',
        medalShape: 'Kỷ niệm chương Hình Thoi Vinh Danh Xuất Sắc 20–30 Năm',
      };
    }
    if (score >= 60) {
      return {
        title: 'HẠNG TIÊU BIỂU (60 – 74 điểm)',
        badgeColor: 'rank-typical',
        desc: 'Đóng góp tốt và có vai trò hệ thống cụ thể tại địa phương, câu lạc bộ hoặc đội tuyển.',
        medalShape: 'Kỷ niệm chương Hình Giọt Nước Tri Ân Cống Hiến',
      };
    }
    if (score >= 50) {
      return {
        title: 'HẠNG GHI NHẬN (50 – 59 điểm)',
        badgeColor: 'rank-recognized',
        desc: 'Được ghi nhận đóng góp trong tiến trình 30 năm phát triển phong trào Taekwondo Việt Nam.',
        medalShape: 'Giấy Chứng nhận Ghi nhận Đóng góp 30 Năm VTF',
      };
    }
    return {
      title: 'CHƯA ĐẠT NGƯỠNG XÉT DUYỆT (< 50 điểm)',
      badgeColor: 'rank-below',
      desc: 'Cần bổ sung thêm minh chứng thành tích hoặc thời gian công tác theo quy định tại Bản tiêu chí 036/VTF.',
      medalShape: 'Thẻ Hành trình Đại biểu tham dự Lễ kỷ niệm',
    };
  };

  const currentRank = getRankInfo(activeTotalScore);

  const handleTransferToForm = () => {
    const summaryText =
      branch === 'A'
        ? `[Tự chấm Hệ A - 036/VTF: ${totalScoreA}/100đ - ${currentRank.title}] Trục 1 (${aAxis1Label}): ${aAxis1Medal}đ | Trục 2 (Tích lũy): ${aAxis2Accumulated}đ | Trục 3 (${aYears} năm): ${aAxis3Score}đ | Trục 4 (Hệ thống): ${aAxis4Score}đ.`
        : `[Tự chấm Hệ B - 036/VTF: ${totalScoreB}/100đ - ${currentRank.title}] Trục 1 (${bYears} năm cộng dồn): ${bAxis1Score}đ | Trục 2 (CLB & Hệ thống): ${bAxis2Score}đ | Trục 3 (Đào tạo VĐV/HLV): ${bAxis3Score}đ | Trục 4 (Vai trò quản lý/chuyên môn): ${bAxis4Score}đ.`;

    onApplyScoreToForm({
      branch: branch === 'A' ? 'nomination_a' : 'nomination_b',
      years: activeYears,
      totalScore: activeTotalScore,
      rankLabel: currentRank.title,
      summaryText,
    });
  };

  const handleVoteKick = (id: string) => {
    if (votedKickId) return;
    setVotedKickId(id);
    setKickCandidates((prev) =>
      prev.map((item) => (item.id === id ? { ...item, votes: item.votes + 1 } : item))
    );
  };

  const totalVotes = kickCandidates.reduce((acc, item) => acc + item.votes, 0);
  const quizScore = QUIZ_QUESTIONS.reduce(
    (acc, q, idx) => (quizAnswers[idx] === q.correctIndex ? acc + 1 : acc),
    0
  );

  return (
    <section id="cong-cu-tuong-tac" className="section-block section-alt" aria-label="Công cụ tương tác xét vinh danh 036/VTF">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow-pill">
            <Calculator size={15} /> CÔNG CỤ TƯƠNG TÁC SỐ HÓA · BẢN TIÊU CHÍ SỐ 036/VTF & THÔNG BÁO 038/TB-VTF
          </span>
          <h2>Hệ Thống Tự Chấm Điểm Vinh Danh 100 Điểm & Bình Chọn Di Sản 30 Năm</h2>
          <p className="section-sub">
            Áp dụng nguyên bản công thức lượng hóa 2 phân hệ độc lập do Ban Chấp hành Liên đoàn Taekwondo Việt Nam ban hành ngày 04/04/2026 — Minh bạch, không so sánh chéo, tự động xác định hạng vinh danh và kết nối thẳng xuống biểu mẫu đề cử.
          </p>
          <div className="detail-calc-cta">
            <a className="btn-primary-gold" href="/tinh-diem/index.html">
              <Calculator size={18} />
              <span>Máy tính chấm điểm chi tiết</span>
            </a>
            <p className="detail-calc-note">
              Kiểm tra từng bậc điểm theo 036/VTF, lưu lịch sử hồ sơ, xuất Excel và in phiếu chấm điểm A4. Có thể tải về dùng không cần mạng.
            </p>
            <p className="detail-calc-note">
              Máy tính bên dưới chỉ là bản chấm nhanh (chưa kiểm điều kiện nền và minh chứng). Hồ sơ đề xuất chính thức nên chấm bằng máy tính chi tiết.
            </p>
          </div>
        </div>

        <div className="booster-tabs" role="tablist" aria-label="Chọn công cụ tương tác">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'calculator'}
            className={`booster-tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
            onClick={() => setActiveTab('calculator')}
          >
            <Calculator size={18} />
            <span>1. Máy Tính Chấm Điểm Vinh Danh (Hệ A & Hệ B – 036/VTF)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'fan_interactive'}
            className={`booster-tab-btn ${activeTab === 'fan_interactive' ? 'active' : ''}`}
            onClick={() => setActiveTab('fan_interactive')}
          >
            <Flame size={18} />
            <span>2. Bình Chọn "Cú Đá 30 Năm" & Cấp Thẻ Hành Trình VTF_TID</span>
          </button>
        </div>

        {activeTab === 'calculator' ? (
          <div className="calculator-grid">
            <div className="calc-controls-card">
              <div className="branch-switcher">
                <button
                  type="button"
                  className={`branch-btn ${branch === 'B' ? 'active-branch-b' : ''}`}
                  onClick={() => setBranch('B')}
                >
                  <span className="branch-tag">PHÂN HỆ B · DI SẢN PHONG TRÀO</span>
                  <strong>Võ Sư, Cán Bộ, HĐKT, Trọng Tài, HLV CLB</strong>
                  <small>Không bắt buộc huy chương quốc tế · Tính năm cộng dồn</small>
                </button>
                <button
                  type="button"
                  className={`branch-btn ${branch === 'A' ? 'active-branch-a' : ''}`}
                  onClick={() => setBranch('A')}
                >
                  <span className="branch-tag">PHÂN HỆ A · THÀNH TÍCH ĐỈNH CAO</span>
                  <strong>VĐV & HLV Đào Tạo Trực Tiếp ĐTQG</strong>
                  <small>Điều kiện nền: Tối thiểu 01 HCV SEA Games trở lên</small>
                </button>
              </div>

              {branch === 'B' ? (
                <div className="axes-form">
                  <div className="axis-group">
                    <div className="axis-label-row">
                      <label htmlFor="b-years-range">
                        <strong>Trục 1 – Thời gian cống hiến cộng dồn có xác minh:</strong>{' '}
                        <span className="mono-highlight">{bYears} năm</span>
                      </label>
                      <span className="axis-points-badge">{bAxis1Score} / 30 điểm</span>
                    </div>
                    <input
                      id="b-years-range"
                      type="range"
                      min={5}
                      max={50}
                      step={1}
                      value={bYears}
                      onChange={(e) => setBYears(Number(e.target.value))}
                      aria-label="Số năm cống hiến cộng dồn Hệ B"
                    />
                    <div className="range-Scale-labels">
                      <span>05–09 năm (10đ)</span>
                      <span>10–19 năm (15đ)</span>
                      <span>20–29 năm (25đ)</span>
                      <span>≥30 năm Di sản (30đ)</span>
                    </div>
                  </div>

                  <div className="axis-group">
                    <div className="axis-label-row">
                      <label htmlFor="b-club-select">
                        <strong>Trục 2 – Xây dựng CLB & Phát triển hệ thống địa phương:</strong>
                      </label>
                      <span className="axis-points-badge">{bAxis2Score} / 30 điểm</span>
                    </div>
                    <div className="dual-select-row">
                      <div>
                        <span className="sub-label">Quy mô xây dựng CLB (Tối đa 20đ):</span>
                        <select
                          id="b-club-select"
                          value={bAxis2Club}
                          onChange={(e) => setBAxis2Club(Number(e.target.value))}
                        >
                          <option value={20}>CLB ≥100 võ sinh, hoạt động ổn định ≥5 năm (20đ)</option>
                          <option value={15}>CLB 50–99 võ sinh, hoạt động ổn định ≥5 năm (15đ)</option>
                          <option value={10}>Duy trì CLB ổn định ≥5 năm quy mô cơ sở (10đ)</option>
                          <option value={0}>Không trực tiếp đứng lớp CLB (0đ)</option>
                        </select>
                      </div>
                      <div>
                        <span className="sub-label">Phát triển hệ thống Tỉnh/Thành (Tối đa 10đ):</span>
                        <select
                          aria-label="Phát triển hệ thống cấp tỉnh thành"
                          value={bAxis2System}
                          onChange={(e) => setBAxis2System(Number(e.target.value))}
                        >
                          <option value={10}>Tham gia xây dựng, mở rộng hệ thống cấp Tỉnh/Thành (10đ)</option>
                          <option value={7}>Duy trì phong trào ổn định tại địa phương ≥10 năm (7đ)</option>
                          <option value={5}>Đóng góp hỗ trợ hoạt động hệ thống chuyên môn (5đ)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="axis-group">
                    <div className="axis-label-row">
                      <label htmlFor="b-train-vdv">
                        <strong>Trục 3 – Đào tạo & Phát triển lực lượng kế cận:</strong>
                      </label>
                      <span className="axis-points-badge">{bAxis3Score} / 20 điểm</span>
                    </div>
                    <div className="dual-select-row">
                      <div>
                        <span className="sub-label">Đào tạo Vận động viên (Tối đa 10đ):</span>
                        <select
                          id="b-train-vdv"
                          value={bAxis3Athletes}
                          onChange={(e) => setBAxis3Athletes(Number(e.target.value))}
                        >
                          <option value={10}>Đào tạo ≥01 VĐV đạt huy chương quốc tế (10đ)</option>
                          <option value={8}>Đào tạo ≥03 VĐV cấp đội tuyển quốc gia (8đ)</option>
                          <option value={5}>Đào tạo ≥05 VĐV cấp tỉnh/thành phố (5đ)</option>
                          <option value={0}>Tập trung quản lý / trọng tài (0đ)</option>
                        </select>
                      </div>
                      <div>
                        <span className="sub-label">Đào tạo HLV & Trọng tài (Tối đa 10đ):</span>
                        <select
                          aria-label="Đào tạo huấn luyện viên và trọng tài"
                          value={bAxis3Coaches}
                          onChange={(e) => setBAxis3Coaches(Number(e.target.value))}
                        >
                          <option value={10}>Đào tạo ≥10 HLV hoặc Trọng tài trong hệ thống (10đ)</option>
                          <option value={7}>Đào tạo 5–9 HLV hoặc Trọng tài (7đ)</option>
                          <option value={5}>Tham gia giảng dạy, tập huấn chuyên môn (5đ)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="axis-group">
                    <div className="axis-label-row">
                      <label htmlFor="b-role-1">
                        <strong>Trục 4 – Vai trò quản lý & chuyên môn (Tối đa 2 vai trò cao nhất, trần 20đ):</strong>
                      </label>
                      <span className="axis-points-badge">{bAxis4Score} / 20 điểm</span>
                    </div>
                    <div className="dual-select-row">
                      <div>
                        <span className="sub-label">Vai trò chính thứ 1:</span>
                        <select
                          id="b-role-1"
                          value={bRole1}
                          onChange={(e) => setBRole1(Number(e.target.value))}
                        >
                          <option value={20}>Ủy viên Ban Chấp hành Liên đoàn Quốc gia VTF (20đ)</option>
                          <option value={15}>Ủy viên BCH cấp Tỉnh/Thành hoặc Thành viên HĐKT QG (15đ)</option>
                          <option value={15}>Trọng tài Quốc tế WT (15đ)</option>
                          <option value={10}>Huấn luyện viên trưởng cấp Tỉnh/Thành/Ngành (10đ)</option>
                          <option value={5}>Huấn luyện viên phong trào CLB (5đ)</option>
                        </select>
                      </div>
                      <div>
                        <span className="sub-label">Vai trò kiêm nhiệm thứ 2 (nếu có):</span>
                        <select
                          aria-label="Vai trò kiêm nhiệm thứ hai"
                          value={bRole2}
                          onChange={(e) => setBRole2(Number(e.target.value))}
                        >
                          <option value={15}>Thành viên HĐKT / Trọng tài Quốc tế / UV BCH Tỉnh (15đ)</option>
                          <option value={10}>HLV trưởng cấp Tỉnh/Thành (10đ)</option>
                          <option value={5}>HLV xây dựng phong trào cơ sở (5đ)</option>
                          <option value={0}>Không kiêm nhiệm vai trò thứ 2 (0đ)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="axes-form">
                  <div className="axis-group">
                    <div className="axis-label-row">
                      <label htmlFor="a-medal-select">
                        <strong>Trục 1 – Thành tích Quốc tế cao nhất (VĐV hoặc HLV trực tiếp):</strong>
                      </label>
                      <span className="axis-points-badge">{aAxis1Medal} / 50 điểm</span>
                    </div>
                    <select
                      id="a-medal-select"
                      value={aAxis1Label}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAAxis1Label(val);
                        if (val.includes('(50đ)')) setAAxis1Medal(50);
                        else if (val.includes('(45đ)')) setAAxis1Medal(45);
                        else if (val.includes('(40đ)')) setAAxis1Medal(40);
                        else if (val.includes('(35đ)')) setAAxis1Medal(35);
                        else setAAxis1Medal(30);
                      }}
                    >
                      <option value="HCV Olympic (50đ)">Huy chương Vàng Thế vận hội Olympic (50đ)</option>
                      <option value="HCB Olympic / HCV ASIAD / HCV Thế giới (45đ)">
                        HCB Olympic (Sydney 2000) / HCV ASIAD / HCV Vô địch Thế giới (45đ)
                      </option>
                      <option value="HCĐ Olympic / HCB ASIAD / HCB Thế giới / HCV Châu Á (40đ)">
                        HCĐ Olympic / HCB ASIAD / HCB Thế giới / HCV Châu Á (40đ)
                      </option>
                      <option value="HCĐ ASIAD / HCĐ Thế giới / HCB Châu Á / HCV SEA Games (35đ)">
                        HCĐ ASIAD / HCĐ Thế giới / HCB Châu Á / HCV SEA Games (35đ)
                      </option>
                      <option value="HCĐ Châu Á / HCB SEA Games (30đ)">
                        HCĐ Châu Á / HCB SEA Games (kèm điều kiện nền có HCV SEA Games) (30đ)
                      </option>
                    </select>
                  </div>

                  <div className="axis-group">
                    <div className="axis-label-row">
                      <label htmlFor="a-accum-select">
                        <strong>Trục 2 – Thành tích tích lũy trong sự nghiệp (không tính trùng Trục 1):</strong>
                      </label>
                      <span className="axis-points-badge">{aAxis2Accumulated} / 20 điểm</span>
                    </div>
                    <select
                      id="a-accum-select"
                      value={aAxis2Accumulated}
                      onChange={(e) => setAAxis2Accumulated(Number(e.target.value))}
                    >
                      <option value={20}>Đạt ≥ 03 huy chương quốc tế (từ cấp SEA Games trở lên) (20đ)</option>
                      <option value={15}>Đạt 02 huy chương quốc tế trong hệ thống chính thức (15đ)</option>
                      <option value={10}>Đạt 01 huy chương quốc tế bổ sung (10đ)</option>
                      <option value={0}>Chỉ có 01 thành tích duy nhất đã tính ở Trục 1 (0đ)</option>
                    </select>
                  </div>

                  <div className="axis-group">
                    <div className="axis-label-row">
                      <label htmlFor="a-years-range">
                        <strong>Trục 3 – Thời gian tham gia thi đấu, huấn luyện có xác minh:</strong>{' '}
                        <span className="mono-highlight">{aYears} năm</span>
                      </label>
                      <span className="axis-points-badge">{aAxis3Score} / 15 điểm</span>
                    </div>
                    <input
                      id="a-years-range"
                      type="range"
                      min={5}
                      max={35}
                      step={1}
                      value={aYears}
                      onChange={(e) => setAYears(Number(e.target.value))}
                      aria-label="Số năm cống hiến Hệ A"
                    />
                    <div className="range-Scale-labels">
                      <span>05–09 năm (5đ)</span>
                      <span>10–14 năm (10đ)</span>
                      <span>Từ 15 năm trở lên (15đ)</span>
                    </div>
                  </div>

                  <div className="axis-group">
                    <div className="axis-label-row">
                      <label htmlFor="a-sys-train">
                        <strong>Trục 4 – Đóng góp cho hệ thống sau hoặc song song thi đấu:</strong>
                      </label>
                      <span className="axis-points-badge">{aAxis4Score} / 15 điểm</span>
                    </div>
                    <div className="dual-select-row">
                      <div>
                        <span className="sub-label">Đào tạo & phát triển lực lượng (Tối đa 10đ):</span>
                        <select
                          id="a-sys-train"
                          value={aAxis4Training}
                          onChange={(e) => setAAxis4Training(Number(e.target.value))}
                        >
                          <option value={10}>Đào tạo VĐV đạt huy chương quốc tế (10đ)</option>
                          <option value={7}>Đào tạo VĐV tham gia đội tuyển quốc gia (7đ)</option>
                          <option value={5}>Đào tạo VĐV đạt huy chương quốc gia trở lên (5đ)</option>
                          <option value={0}>Đang là VĐV thi đấu trực tiếp (0đ)</option>
                        </select>
                      </div>
                      <div>
                        <span className="sub-label">Công tác chuyên môn & quản lý (Tối đa 5đ):</span>
                        <select
                          aria-label="Tham gia công tác chuyên môn Hệ A"
                          value={aAxis4Management}
                          onChange={(e) => setAAxis4Management(Number(e.target.value))}
                        >
                          <option value={5}>Tham gia ĐTQG hoặc Ban chuyên môn / HĐKT cấp Quốc gia (5đ)</option>
                          <option value={3}>Tham gia công tác huấn luyện/đào tạo cấp Tỉnh/Thành (3đ)</option>
                          <option value={0}>Chưa tham gia quản lý chuyên môn (0đ)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="calc-result-card">
              <div className="result-header-badge">
                <ShieldCheck size={18} /> KẾT QUẢ LƯỢNG HÓA THEO BẢN TIÊU CHÍ 036/VTF
              </div>
              <div className="score-circle-wrap">
                <div className="score-number">
                  <span className="big-score">{activeTotalScore}</span>
                  <span className="score-max">/ 100 ĐIỂM</span>
                </div>
                <div className={`rank-pill ${currentRank.badgeColor}`}>{currentRank.title}</div>
              </div>

              <div className="result-breakdown">
                <div className="breakdown-item">
                  <span>Phân hệ xét duyệt độc lập:</span>
                  <strong>{branch === 'A' ? 'Hệ A – Thành tích Đỉnh cao' : 'Hệ B – Cống hiến Di sản'}</strong>
                </div>
                <div className="breakdown-item">
                  <span>Vật phẩm biểu trưng dự kiến:</span>
                  <strong>{currentRank.medalShape}</strong>
                </div>
                <div className="breakdown-item">
                  <span>Quy trình thẩm định 3 cấp:</span>
                  <strong>CLB Cơ sở → Liên đoàn Tỉnh/Thành → Hội đồng VTF (≥70% phiếu thuận)</strong>
                </div>
              </div>

              <p className="result-note">{currentRank.desc}</p>

              <button type="button" className="btn-primary btn-full" onClick={handleTransferToForm}>
                <span>Đẩy Kết Quả ({activeTotalScore}đ) Vào Hồ Sơ Đề Cử 038/TB-VTF</span>
                <ArrowRight size={18} />
              </button>
              <span className="deadline-hint">
                Hạn chót gửi hồ sơ về Văn phòng VTF: Trước ngày 30/10/2026
              </span>
            </div>
          </div>
        ) : (
          <div className="fan-interactive-grid">
            {/* Cột 1: Bình chọn Cú đá của 30 năm */}
            <div className="poll-card">
              <div className="card-tag-row">
                <span className="tag-red">SỰ KIỆN ĐỒNG HÀNH ĐÊM GALA 19/12/2026</span>
                <span className="mono-small">{totalVotes.toLocaleString('vi-VN')} lượt bình chọn</span>
              </div>
              <h3>Bình Chọn "Cú Đá Lịch Sử Của 30 Năm Taekwondo Việt Nam"</h3>
              <p className="muted-p">
                Lấy cảm hứng từ hạng mục "Kick of the Year" tại World Taekwondo Gala Awards — Kết quả bình chọn sẽ được công bố trực tiếp tại Tiệc Gala "Đêm Ngọn Lửa Huyền Thoại".
              </p>

              <div className="kick-list">
                {kickCandidates.map((item) => {
                  const pct = Math.round((item.votes / totalVotes) * 100);
                  const isSelected = votedKickId === item.id;
                  return (
                    <div key={item.id} className={`kick-item ${isSelected ? 'kick-selected' : ''}`}>
                      <div className="kick-top">
                        <div>
                          <span className="kick-event">{item.event}</span>
                          <h4>
                            {item.athlete} — {item.kickName}
                          </h4>
                        </div>
                        <button
                          type="button"
                          className={`btn-vote ${isSelected ? 'voted' : ''}`}
                          onClick={() => handleVoteKick(item.id)}
                          disabled={Boolean(votedKickId)}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 size={15} /> Đã bình chọn
                            </>
                          ) : (
                            <>
                              <Trophy size={15} /> Bình chọn
                            </>
                          )}
                        </button>
                      </div>
                      <p className="kick-desc">{item.description}</p>
                      <div className="vote-bar-track">
                        <div className="vote-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="vote-stats-row">
                        <span>{item.votes.toLocaleString('vi-VN')} phiếu</span>
                        <strong>{pct}%</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cột 2: Trắc nghiệm nhanh & Thẻ hành trình số VTF_TID */}
            <div className="passport-quiz-card">
              <div className="card-tag-row">
                <span className="tag-gold">TRẢI NGHIỆM LIÊN ĐOÀN ĐIỆN TỬ 4.0</span>
                <span className="mono-small">Điểm Quiz: {quizScore}/3</span>
              </div>
              <h3>Trắc Nghiệm Di Sản & Tạo "Thẻ Hành Trình Số VTF_TID"</h3>

              <div className="mini-quiz-list">
                {QUIZ_QUESTIONS.map((q, qIdx) => (
                  <div key={qIdx} className="quiz-box">
                    <p className="quiz-q">
                      <strong>Câu {qIdx + 1}:</strong> {q.q}
                    </p>
                    <div className="quiz-opts">
                      {q.options.map((opt, oIdx) => {
                        const chosen = quizAnswers[qIdx] === oIdx;
                        const isCorrect = oIdx === q.correctIndex;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            className={`quiz-opt-btn ${
                              chosen ? (isCorrect ? 'opt-correct' : 'opt-wrong') : ''
                            }`}
                            onClick={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))}
                          >
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="digital-passport-preview">
                <div className="passport-header">
                  <div>
                    <span className="passport-code">VTF DIGITAL ID · CHECK-IN HÀNH LANG DI SẢN</span>
                    <h4>THẺ HÀNH TRÌNH ĐẠI LỄ 30 NĂM (1996 – 2026)</h4>
                  </div>
                  <div className="passport-logo-group">
                    <img
                      src="/images/logos/logo-vtf-official.png"
                      alt="VTF Logo"
                      width={52}
                      height={32}
                    />
                    <img
                      src="/images/logos/logo-vietnam-taekwondo.png"
                      alt="Vietnam Taekwondo Logo"
                      width={58}
                      height={32}
                    />
                  </div>
                </div>
                <div className="passport-inputs">
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Nhập họ tên của bạn"
                    aria-label="Họ tên trên Thẻ hành trình"
                  />
                  <input
                    type="number"
                    min={1960}
                    max={2026}
                    value={visitorStartYear}
                    onChange={(e) => setVisitorStartYear(Number(e.target.value))}
                    aria-label="Năm bắt đầu gắn bó với Taekwondo"
                  />
                  <input
                    type="text"
                    value={visitorDan}
                    onChange={(e) => setVisitorDan(e.target.value)}
                    placeholder="Cấp đai / Vai trò"
                    aria-label="Cấp đai hoặc vai trò"
                  />
                </div>
                <div className="passport-badge-output">
                  <div>
                    <small>ĐẠI BIỂU / MÔN SINH ĐỒNG HÀNH</small>
                    <strong>{visitorName || 'Môn sinh Taekwondo Việt Nam'}</strong>
                    <span>
                      Gắn bó từ năm {visitorStartYear} ({Math.max(1, 2026 - visitorStartYear)} năm) · {visitorDan}
                    </span>
                  </div>
                  <div className="qr-sim">
                    <span>VTF-30Y</span>
                    <small>GAL/GMS</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
