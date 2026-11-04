import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Flame,
  Globe,
  Layers,
  MapPin,
  Medal,
  Menu,
  Phone,
  Search,
  Send,
  Shield,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Users,
  X,
  AlertCircle,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import {
  HERO_METRICS,
  OFFICIAL_DOCS,
  TIMELINE_MILESTONES,
  HALL_OF_FAME_2026,
  GALA_PROGRAM_CHAPTERS,
  YEARBOOK_STRUCTURE,
  GALLERY_PHOTOS,
  FAQ_ITEMS,
  INITIAL_SUBMISSIONS,
  SubmissionRecord,
  HallOfFameMember,
  GalleryPhoto,
} from './data/landingData';
import {
  VTF_8_LISTS_SUMMARY,
  VTF_ALL_8_LISTS_ITEMS,
  VTF_TOTAL_TOP4_UNIQUE,
  VtfListGroupId,
} from './data/vtf8ListsData';
import { InteractiveBoosters, CalculatorTransferPayload } from './components/InteractiveBoosters';
import { LeadAdminDrawer } from './components/LeadAdminDrawer';

const STORAGE_KEY = 'vtf_30nam_submissions_v1';

interface HeroSlide {
  id: string;
  eraTag: string;
  title: string;
  subtitle: string;
  image: string;
  kpiValue: string;
  kpiLabel: string;
}

const HERO_SHOWCASE_SLIDES: HeroSlide[] = [
  {
    id: 'slide-sydney',
    eraTag: 'CỘT MỐC LỊCH SỬ · OLYMPIC SYDNEY 2000',
    title: 'Tấm Huy Chương Olympic Đầu Tiên Của Thể Thao Việt Nam',
    subtitle:
      'Võ sĩ Trần Hiếu Ngân (HCB hạng −57kg nữ tại Sydney, ngày 28/09/2000) cùng HLV trưởng Trương Ngọc Để mở toang cánh cửa Thế vận hội cho cả nền thể thao nước nhà.',
    image: '/images/tran-hieu-ngan-sydney-2000.jpg',
    kpiValue: 'HCB Olympic 2000',
    kpiLabel: 'Khởi đầu giấc mơ Thế vận hội',
  },
  {
    id: 'slide-poomsae',
    eraTag: 'CƯỜNG QUỐC QUYỀN THUẬT · TOP 2–4 THẾ GIỚI',
    title: 'Châu Tuyết Vân & Thế Hệ Vàng Poomsae Việt Nam Trên Đỉnh Thế Giới',
    subtitle:
      'Dưới sự dẫn dắt của Đại võ sư Nguyễn Thanh Huy (9 Đẳng Kukkiwon), Đội tuyển Quyền Quốc gia liên tiếp giành HCV Thế giới, Châu Á và thống trị đấu trường SEA Games.',
    image: '/images/poomsae-atf-2015-team.jpg',
    kpiValue: '10+ HCV Thế Giới',
    kpiLabel: 'Vị thế cường quốc Poomsae',
  },
  {
    id: 'slide-kyorugi-new',
    eraTag: 'THẾ HỆ KẾ CẬN · HƯỚNG TỚI OLYMPIC 2028–2032',
    title: 'Bạc Thị Khiêm, Trương Thị Kim Tuyền & Khát Vọng Vàng Châu Lục',
    subtitle:
      'Lớp võ sĩ trẻ tài năng tiếp nối ngọn lửa của Trần Quang Hạ và Hồ Nhất Thống, chinh phục HCV Châu Á 2024 tại Đà Nẵng và SEA Games 33 (2025).',
    image: '/images/bac-thi-khiem-asian2024.jpg',
    kpiValue: 'HCV Châu Á 2024',
    kpiLabel: 'Bản lĩnh võ sĩ thời đại mới',
  },
  {
    id: 'slide-gala-2026',
    eraTag: 'ĐẠI LỄ 30 NĂM · 19/12/2026 TẠI TP. HỒ CHÍ MINH',
    title: 'Đêm Ngọn Lửa Huyền Thoại & Ra Mắt Vietnam Taekwondo Hall Of Fame',
    subtitle:
      'Hội tụ hơn 200 đại biểu Quốc tế (WT, ATU, Kukkiwon, ATF) và 27 tỉnh/thành ngành trong Đại hội VTF nhiệm kỳ VII (2026 - 2031) và Lễ Kỷ niệm 30 Năm ngày thành lập VTF (1996 - 2026).',
    image: '/images/poster-30nam-giac-mo-olympic.jpg',
    kpiValue: '19/12/2026',
    kpiLabel: 'Nhà thi đấu Quân khu 7, TP.HCM',
  },
];

const SUBMISSION_TYPE_LABELS: Record<SubmissionRecord['submissionType'], string> = {
  nomination_a: 'Đề cử Hệ A – Thành tích Đỉnh cao (036/VTF)',
  nomination_b: 'Đề cử Hệ B – Cống hiến Di sản Phong trào (036/VTF)',
  yearbook_34_provinces: 'Gửi Bài viết & Ảnh Kỷ yếu 34 Tỉnh/Thành (CV 128/VTF-VP)',
  gala_registration: 'Đăng ký Đại biểu tham dự Đêm Gala 19/12/2026',
  gold_yearbook_bid: 'Đặt mua / Đấu giá Kỷ yếu Bản Vàng (Quỹ Ngọn lửa Olympic)',
};

export function App() {
  // Theme Switcher: 'heritage' (Grand Heritage Vermilion & Gold) vs 'dobok' (Kukkiwon Dobok Crisp)
  const [themeMode, setThemeMode] = useState<'heritage' | 'dobok'>('heritage');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero interactive slide
  const [activeHeroSlide, setActiveHeroSlide] = useState<number>(0);

  // Timeline interactive stage
  const [activeTimelineIndex, setActiveTimelineIndex] = useState<number>(2);

  // Hall of Fame category filter & selected modal
  const [hofCategory, setHofCategory] = useState<
    'all' | 'lifetime' | 'leadership' | 'coach' | 'athlete' | 'international'
  >('all');
  const [selectedHofMember, setSelectedHofMember] = useState<HallOfFameMember | null>(null);
  const [activeSpeechDoc, setActiveSpeechDoc] = useState<'cuc_tdtt' | 'chu_tich_vtf' | null>(null);

  // Directory 8 Lists filter & search
  const [dirGroup, setDirGroup] = useState<'top4' | 'all8' | VtfListGroupId>('top4');
  const [dirBranch, setDirBranch] = useState<'all' | 'Hệ A - Đỉnh cao' | 'Hệ B - Di sản'>('all');
  const [hideDuplicateInFuncLists, setHideDuplicateInFuncLists] = useState<boolean>(false);
  const [dirSearch, setDirSearch] = useState<string>('');
  const [showAllDirectory, setShowAllDirectory] = useState<boolean>(false);

  // Gala & Yearbook tab
  const [galaTab, setGalaTab] = useState<'gala_chapters' | 'yearbook_120' | 'ten_firsts'>('gala_chapters');

  // Gallery filter & lightbox
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'poomsae' | 'kyorugi' | 'heritage'>('all');
  const [lightboxPhoto, setLightboxPhoto] = useState<GalleryPhoto | null>(null);

  // FAQ open index
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  // Submissions localStorage state & Admin Drawer
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SubmissionRecord[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_SUBMISSIONS;
  });
  const [isAdminDrawerOpen, setIsAdminDrawerOpen] = useState<boolean>(false);

  // Registration / Nomination Form State (4 States: Idle, Validation Error, Submitting, Success Modal)
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [submissionType, setSubmissionType] = useState<SubmissionRecord['submissionType']>('nomination_b');
  const [yearsContributed, setYearsContributed] = useState<number>(15);
  const [estimatedScore, setEstimatedScore] = useState<number | undefined>(undefined);
  const [estimatedRank, setEstimatedRank] = useState<string | undefined>(undefined);
  const [messageOrAchievement, setMessageOrAchievement] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'error' | 'success'>('idle');
  const [latestCertificate, setLatestCertificate] = useState<SubmissionRecord | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    } catch {
      // ignore storage errors
    }
  }, [submissions]);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filtered Hall of Fame
  const filteredHof = useMemo(() => {
    if (hofCategory === 'all') return HALL_OF_FAME_2026;
    return HALL_OF_FAME_2026.filter((m) => m.category === hofCategory);
  }, [hofCategory]);

  // Filtered 8 Lists Directory
  const filteredDirectory = useMemo(() => {
    const q = dirSearch.trim().toLowerCase();
    const top4Set = new Set([
      'ds1_pioneers',
      'ds2_champions',
      'ds3_technical_referees',
      'ds4_local_masters',
    ]);
    return VTF_ALL_8_LISTS_ITEMS.filter((item) => {
      if (dirGroup === 'top4' && !top4Set.has(item.group)) return false;
      if (dirGroup !== 'top4' && dirGroup !== 'all8' && item.group !== dirGroup) return false;
      if (dirBranch !== 'all' && item.branch !== dirBranch) return false;
      if (hideDuplicateInFuncLists && item.inHigherList) return false;
      if (q) {
        const hay = `${item.name} ${item.locality} ${item.role} ${item.highlight} ${item.groupCode} ${item.danOrLevel ?? ''}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [dirGroup, dirBranch, hideDuplicateInFuncLists, dirSearch]);

  const visibleDirectory = showAllDirectory ? filteredDirectory : filteredDirectory.slice(0, 30);

  // Filtered Gallery
  const filteredGallery = useMemo(() => {
    if (galleryFilter === 'all') return GALLERY_PHOTOS;
    return GALLERY_PHOTOS.filter((p) => p.category === galleryFilter);
  }, [galleryFilter]);

  // Receive calculated score from InteractiveBoosters
  const handleApplyScoreToForm = (payload: CalculatorTransferPayload) => {
    setSubmissionType(payload.branch);
    setYearsContributed(payload.years);
    setEstimatedScore(payload.totalScore);
    setEstimatedRank(payload.rankLabel);
    setMessageOrAchievement(payload.summaryText);
    scrollToSection('portal-register');
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 3) {
      errs.fullName = 'Vui lòng nhập đầy đủ Họ và Tên (tối thiểu 3 ký tự).';
    }
    const cleanPhone = phone.replace(/\s+/g, '');
    if (!/^(0|\+84)[0-9]{8,10}$/.test(cleanPhone)) {
      errs.phone = 'Số điện thoại chưa đúng chuẩn Việt Nam (10 số bắt đầu bằng 0 hoặc +84).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Địa chỉ Email chưa hợp lệ (ví dụ: ten@donvi.vn).';
    }
    if (!organization.trim()) {
      errs.organization = 'Vui lòng ghi rõ Liên đoàn/Bộ môn Tỉnh, Thành, Ngành hoặc CLB trực thuộc.';
    }
    if (!messageOrAchievement.trim() || messageOrAchievement.trim().length < 15) {
      errs.messageOrAchievement =
        'Vui lòng tóm tắt thành tích, số quyết định/minh chứng hoặc nội dung đăng ký (tối thiểu 15 ký tự).';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setFormStatus('error');
      return;
    }

    setFormStatus('submitting');
    window.setTimeout(() => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const timestamp = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(
        now.getHours()
      )}:${pad(now.getMinutes())}`;

      const newRecord: SubmissionRecord = {
        id: `VTF30-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: timestamp,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        organization: organization.trim(),
        submissionType,
        submissionTypeLabel: SUBMISSION_TYPE_LABELS[submissionType],
        yearsContributed: Number(yearsContributed) || 5,
        estimatedScore,
        estimatedRank,
        messageOrAchievement: messageOrAchievement.trim(),
      };

      setSubmissions((prev) => [newRecord, ...prev]);
      setLatestCertificate(newRecord);
      setFormStatus('success');
      setFormErrors({});
    }, 550);
  };

  const handleResetSampleData = () => {
    setSubmissions(INITIAL_SUBMISSIONS);
  };

  const handleClearAllSubmissions = () => {
    setSubmissions([]);
  };

  const activeMilestone = TIMELINE_MILESTONES[activeTimelineIndex] || TIMELINE_MILESTONES[0];
  const currentHero = HERO_SHOWCASE_SLIDES[activeHeroSlide] || HERO_SHOWCASE_SLIDES[0];

  return (
    <div className="vtf-app-shell">
      {/* Top Official Announcement Ribbon */}
      <div className="top-official-ribbon">
        <div className="container ribbon-inner">
          <div className="ribbon-left">
            <span className="ribbon-badge">CHÍNH THỨC VTF</span>
            <span className="ribbon-text">
              Cổng thông tin Kỷ niệm 30 năm Liên đoàn Taekwondo Việt Nam (22/12/1996 - 22/12/2026) · Đại lễ Gala:{' '}
              <strong>19/12/2026 tại TP.HCM</strong>
            </span>
          </div>
          <div className="ribbon-right">
            <a
              href="/docs/VTF_036_Tieu_Chi_Vinh_Danh_30_Nam.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="ribbon-doc-link"
            >
              <FileText size={13} /> Tiêu chí 036/VTF
            </a>
            <a
              href="/docs/VTF_038_TB_Khen_Thuong_30_Nam.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="ribbon-doc-link"
            >
              <FileText size={13} /> Thông báo 038/TB-VTF
            </a>
            <a
              href="/docs/VTF_128_CV_Ky_Yeu_34_Tinh_Thanh.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="ribbon-doc-link"
            >
              <FileText size={13} /> Công văn 128/VTF-VP
            </a>
          </div>
        </div>
      </div>

      {/* Sticky Navigation Header */}
      <header className="sticky-header">
        <div className="container header-inner">
          <button
            type="button"
            className="brand-logo-btn"
            onClick={() => scrollToSection('hero-top')}
            aria-label="Về đầu trang Kỷ niệm 30 năm Liên đoàn Taekwondo Việt Nam"
          >
            <div className="header-dual-logos">
              <img
                src="/images/logos/logo-vtf-official.png"
                alt="Logo Liên đoàn Taekwondo Việt Nam (VTF)"
                className="header-vtf-logo"
                width={66}
                height={42}
              />
            </div>
            <div className="brand-emblem">
              <span className="emblem-num">30</span>
              <span className="emblem-sub">NĂM</span>
            </div>
            <div className="brand-titles">
              <span className="brand-kicker">LIÊN ĐOÀN TAEKWONDO VIỆT NAM</span>
              <span className="brand-main">DI SẢN 30 NĂM (1996 – 2026)</span>
            </div>
          </button>

          <nav className="desktop-nav" aria-label="Điều hướng chính">
            <button type="button" className="nav-item" onClick={() => scrollToSection('messages-honor')}>
              Thông điệp
            </button>
            <button type="button" className="nav-item" onClick={() => scrollToSection('timeline-30years')}>
              Biên niên sử
            </button>
            <button type="button" className="nav-item" onClick={() => scrollToSection('hall-of-fame')}>
              Hall of Fame
            </button>
            <button type="button" className="nav-item" onClick={() => scrollToSection('directory-120')}>
              8 Danh sách (91+)
            </button>
            <button type="button" className="nav-item" onClick={() => scrollToSection('gala-yearbook')}>
              Gala & Kỷ yếu
            </button>
            <button type="button" className="nav-item" onClick={() => scrollToSection('cong-cu-tuong-tac')}>
              Chấm điểm 036/VTF
            </button>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="theme-switch-btn"
              onClick={() => setThemeMode((prev) => (prev === 'heritage' ? 'dobok' : 'heritage'))}
              title="Chuyển đổi bảng màu: Di sản Đỏ Vàng / Võ phục Trắng Xanh WT"
            >
              <Sun size={15} />
              <span>{themeMode === 'heritage' ? 'Theme: Đỏ Vàng' : 'Theme: Võ Phục WT'}</span>
            </button>

            <button
              type="button"
              className="admin-drawer-trigger"
              onClick={() => setIsAdminDrawerOpen(true)}
              title="Mở kho lưu trữ hồ sơ đề cử & xuất CSV"
            >
              <FolderOpen size={15} />
              <span>Hồ sơ ({submissions.length})</span>
            </button>

            <button
              type="button"
              className="header-cta-primary"
              onClick={() => scrollToSection('portal-register')}
            >
              <span>Nộp Hồ Sơ 30 Năm</span>
              <ChevronRight size={16} />
            </button>

            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Mở menu điều hướng"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <button type="button" onClick={() => scrollToSection('messages-honor')}>
              Thông điệp Lãnh đạo & Thư chúc mừng Cục TDTT
            </button>
            <button type="button" onClick={() => scrollToSection('timeline-30years')}>
              Biên niên sử 6 Giai đoạn (1962 – 1996 – 2026)
            </button>
            <button type="button" onClick={() => scrollToSection('hall-of-fame')}>
              Đại sảnh Danh vọng (Hall of Fame – Class of 2026)
            </button>
            <button type="button" onClick={() => scrollToSection('directory-120')}>
              8 Danh Sách Nhân Sự 30 Năm (91 TOP + 429 Hồ sơ)
            </button>
            <button type="button" onClick={() => scrollToSection('gala-yearbook')}>
              Đêm Gala 19/12/2026 & Kỷ yếu 120 Trang
            </button>
            <button type="button" onClick={() => scrollToSection('cong-cu-tuong-tac')}>
              Công cụ Tự chấm điểm Vinh danh 036/VTF
            </button>
            <button
              type="button"
              className="mobile-nav-cta"
              onClick={() => scrollToSection('portal-register')}
            >
              Nộp Hồ Sơ Đề Cử & Gửi Kỷ Yếu 34 Tỉnh/Thành
            </button>
          </div>
        )}
      </header>

      <main>
        {/* =========================================================
            SECTION 1: HERO SECTION (ABOVE THE FOLD - SINGLE H1)
        ========================================================= */}
        <section id="hero-top" className="hero-section">
          <div className="container">
            <div className="hero-grid">
              {/* Left Narrative Column */}
              <div className="hero-narrative">
                <div className="hero-eyebrow-pill">
                  <Flame size={15} className="icon-flame" />
                  <span>KỶ NIỆM 30 NĂM THÀNH LẬP VTF (22/12/1996 - 22/12/2026)</span>
                </div>

                <h1 className="hero-h1">
                  30 Năm Liên Đoàn Taekwondo Việt Nam:{' '}
                  <span className="hero-highlight">Khát Vọng Hóa Rồng – Nối Nhịp Olympic</span>
                </h1>

                <p className="hero-lead">
                  <em>“Từ những võ đường nhỏ đến đấu trường Olympic, và hành trình ấy vẫn đang tiếp diễn.”</em> Trải
                  qua ba thập kỷ chính quy hóa kể từ Quyết định <strong>358/TTg</strong> của Thủ tướng Chính phủ và Đại
                  hội lần thứ I (22/12/1996), Taekwondo Việt Nam tự hào quy tụ hơn{' '}
                  <strong>1.500 câu lạc bộ, 100.000+ võ sinh thường xuyên</strong> tại 34 tỉnh/thành phố mới, ghi dấu
                  tấm Huy chương Bạc Olympic Sydney 2000 lịch sử và vị thế Top 2–4 Cường quốc Quyền Thế giới.
                </p>

                {/* Dual Action CTA Bar */}
                <div className="hero-cta-group">
                  <button
                    type="button"
                    className="btn-primary-gold"
                    onClick={() => scrollToSection('cong-cu-tuong-tac')}
                  >
                    <Award size={18} />
                    <span>Chấm Điểm Vinh Danh 30 Năm (036/VTF)</span>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-outline"
                    onClick={() => scrollToSection('timeline-30years')}
                  >
                    <BookOpen size={18} />
                    <span>Khám Phá Biên Niên Sử & 8 Danh Sách (91+)</span>
                  </button>
                </div>

                {/* Official Signed Documents Quick Bar */}
                <div className="official-docs-strip">
                  <div className="docs-strip-title">
                    <Shield size={15} />
                    <span>Văn bản pháp lý chính thức của Liên đoàn Taekwondo Việt Nam (bản PDF có dấu đỏ):</span>
                  </div>
                  <div className="docs-strip-cards">
                    {OFFICIAL_DOCS.map((doc) => (
                      <a
                        key={doc.code}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="doc-mini-card"
                      >
                        <div className="doc-mini-top">
                          <span className="doc-code-tag">{doc.code}</span>
                          <span className="doc-date-tag">{doc.date}</span>
                        </div>
                        <p className="doc-mini-name">{doc.title}</p>
                        <span className="doc-download-cta">
                          <Download size={13} /> Tải PDF chính thức
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Interactive Visual Showcase Card */}
              <div className="hero-visual-col">
                <div className="hero-showcase-frame">
                  <div className="showcase-image-wrap">
                    <div
                      className="ambient-photo-backdrop"
                      style={{ backgroundImage: `url(${currentHero.image})` }}
                      aria-hidden="true"
                    />
                    <img
                      src={currentHero.image}
                      alt={currentHero.title}
                      className="showcase-main-img"
                      width={640}
                      height={440}
                    />
                    <div className="showcase-overlay-gradient" />
                    <div className="showcase-corner-crest">
                      <img
                        src="/images/logos/logo-vtf-official.png"
                        alt="VTF Crest"
                        width={54}
                        height={34}
                      />
                      <span>1996 – 2026</span>
                    </div>
                    <div className="showcase-floating-kpi">
                      <Medal size={18} />
                      <div>
                        <strong>{currentHero.kpiValue}</strong>
                        <span>{currentHero.kpiLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="showcase-caption-box">
                    <span className="showcase-era-tag">{currentHero.eraTag}</span>
                    <h2 className="showcase-slide-title">{currentHero.title}</h2>
                    <p className="showcase-slide-desc">{currentHero.subtitle}</p>

                    <div className="showcase-switcher-tabs" role="tablist" aria-label="Chọn dấu ấn 30 năm">
                      {HERO_SHOWCASE_SLIDES.map((slide, idx) => (
                        <button
                          key={slide.id}
                          type="button"
                          role="tab"
                          aria-selected={activeHeroSlide === idx}
                          className={`showcase-tab-btn ${activeHeroSlide === idx ? 'active' : ''}`}
                          onClick={() => setActiveHeroSlide(idx)}
                        >
                          <span className="tab-num">0{idx + 1}</span>
                          <span className="tab-label">
                            {idx === 0
                              ? 'Olympic 2000'
                              : idx === 1
                              ? 'Đỉnh cao Quyền'
                              : idx === 2
                              ? 'Đối kháng mới'
                              : 'Đại lễ 19/12'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 Hero Metrics Strip */}
            <div className="hero-metrics-grid">
              {HERO_METRICS.map((m) => (
                <div key={m.label} className="metric-heritage-card">
                  <div className="metric-top-row">
                    <span className="metric-big-value">{m.value}</span>
                    <span className="metric-code-pill">{m.code}</span>
                  </div>
                  <h3 className="metric-card-title">{m.label}</h3>
                  <p className="metric-card-detail">{m.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 2: MESSAGES OF HONOR (THƯ CHÚC MỪNG CỤC TDTT & CHỦ TỊCH VTF)
        ========================================================= */}
        <section id="messages-honor" className="section-block section-alt">
          <div className="container">
            <div className="section-header-center">
              <span className="section-eyebrow">THÔNG ĐIỆP LỊCH SỬ & GHI NHẬN CẤP NHÀ NƯỚC</span>
              <h2 className="section-h2">Lời Chúc Mừng Của Cục Thể Dục Thể Thao & Tâm Huyết Chủ Tịch VTF</h2>
              <p className="section-subtitle">
                Sự ghi nhận trang trọng từ cơ quan quản lý Nhà nước và lời tri ân gửi tới các thế hệ tiền bối, võ sư,
                HLV, trọng tài và hàng triệu môn sinh trên khắp mọi miền Tổ quốc.
              </p>
            </div>

            <div className="messages-dual-grid">
              {/* Card 1: Director of Vietnam Sports Administration */}
              <article className="honor-letter-card">
                <div className="letter-seal-header">
                  <div className="seal-icon-box">
                    <Award size={24} />
                  </div>
                  <div className="letter-head-text">
                    <span className="letter-org">BỘ VĂN HÓA, THỂ THAO VÀ DU LỊCH · CỤC THỂ DỤC THỂ THAO VIỆT NAM</span>
                    <h3 className="letter-author">Ông Nguyễn Danh Hoàng Việt – Cục trưởng Cục TDTT Việt Nam</h3>
                    <span className="letter-meta">Trích Thư chúc mừng Kỷ niệm 30 năm thành lập VTF (Hà Nội, 2026)</span>
                  </div>
                  <img
                    src="/images/logos/logo-vtf-official.png"
                    alt="Logo VTF"
                    className="letter-corner-logo"
                    width={64}
                    height={40}
                  />
                </div>

                <blockquote className="letter-quote-body">
                  “Nhân dịp kỷ niệm 30 năm thành lập Liên đoàn Taekwondo Việt Nam (22/12/1996 – 22/12/2026), thay mặt
                  lãnh đạo Cục Thể dục thể thao Việt Nam và với tình cảm cá nhân, tôi thân ái gửi tới Liên đoàn
                  Taekwondo Việt Nam, các thế hệ lãnh đạo, cán bộ, huấn luyện viên, trọng tài, vận động viên và những
                  người đã, đang đóng góp cho sự phát triển của Taekwondo Việt Nam lời chúc mừng tốt đẹp nhất.
                  <br />
                  <br />
                  Cục Thể dục thể thao Việt Nam trân trọng ghi nhận và đánh giá cao những đóng góp của Liên đoàn
                  Taekwondo Việt Nam trong sự nghiệp phát triển môn Taekwondo nói riêng và thể thao Việt Nam nói chung…”
                </blockquote>

                <div className="letter-highlight-points">
                  <div className="point-chip">
                    <CheckCircle2 size={15} />
                    <span>Ghi nhận đóng góp toàn diện cho phong trào & thành tích cao</span>
                  </div>
                  <div className="point-chip">
                    <CheckCircle2 size={15} />
                    <span>Đổi mới phương thức hoạt động, vươn xa trên đấu trường quốc tế</span>
                  </div>
                </div>

                <div className="letter-card-actions">
                  <button
                    type="button"
                    className="btn-read-full-speech"
                    onClick={() => setActiveSpeechDoc('cuc_tdtt')}
                  >
                    <FileText size={16} />
                    <span>Xem Nguyên Văn Toàn Bộ Thư Chúc Mừng</span>
                  </button>
                  <a
                    href="/docs/Cuc_TDTT_Thu_Chuc_Mung_VTF_30_Nam.docx"
                    download="Cuc_TDTT_Thu_Chuc_Mung_VTF_30_Nam.docx"
                    className="btn-download-speech-doc"
                  >
                    <Download size={15} />
                    <span>Tải File (.DOCX)</span>
                  </a>
                </div>
              </article>

              {/* Card 2: VTF President Grandmaster Truong Ngoc De */}
              <article className="honor-letter-card president-card">
                <div className="letter-seal-header">
                  <img
                    src="/images/truong-ngoc-de-9-dan-kukkiwon.jpg"
                    alt="Đại võ sư Trương Ngọc Để đón nhận Cửu đẳng Huyền đai (9 Dan Kukkiwon)"
                    className="president-avatar-thumb"
                    width={64}
                    height={64}
                  />
                  <div className="letter-head-text">
                    <span className="letter-org">LIÊN ĐOÀN TAEKWONDO VIỆT NAM (VTF) · NHIỆM KỲ III, IV, V, VI</span>
                    <h3 className="letter-author">Đại võ sư Trương Ngọc Để – Chủ tịch Liên đoàn (9 Đẳng Kukkiwon)</h3>
                    <span className="letter-meta">
                      Người HLV trực tiếp tại Sydney 2000 · Giải thưởng Cống hiến Trọn đời Châu Á 2024
                    </span>
                  </div>
                  <img
                    src="/images/logos/logo-vietnam-taekwondo.png"
                    alt="Logo Vietnam Taekwondo"
                    className="letter-corner-logo"
                    width={72}
                    height={42}
                  />
                </div>

                <blockquote className="letter-quote-body">
                  “Ba mươi năm của Liên đoàn Taekwondo Việt Nam (22/12/1996 – 22/12/2026) được dệt nên từ mồ hôi trên
                  những sân đất nện buổi ban đầu, từ ý chí thép của các võ sĩ đội tuyển quốc gia và sự hy sinh thầm lặng
                  của hàng ngàn võ sư, huấn luyện viên nơi vùng sâu, vùng xa, biên giới và hải đảo.
                  <br />
                  <br />
                  Với Bản tiêu chí <strong>036/VTF</strong> và lần đầu tiên thiết lập{' '}
                  <strong>Đại sảnh Danh vọng (Vietnam Taekwondo Hall of Fame)</strong>, chúng ta cam kết một nguyên tắc
                  nhất quán: Không một giọt mồ hôi, không một thập kỷ tận hiến nào vì màu cờ sắc áo bị lãng quên. Ngọn
                  lửa từ các bậc tiền bối sẽ tiếp tục soi sáng hành trình 20 năm tới (2026 – 2046) hướng về đỉnh cao
                  Olympic.”
                </blockquote>

                <div className="letter-highlight-points">
                  <div className="point-chip">
                    <Flame size={15} />
                    <span>Tri ân công bằng cả Đỉnh cao (Hệ A) & Phong trào cơ sở (Hệ B)</span>
                  </div>
                  <div className="point-chip">
                    <Sparkles size={15} />
                    <span>Khởi động Quỹ Ngọn lửa Olympic hỗ trợ tài năng trẻ 2028–2032</span>
                  </div>
                </div>

                <div className="letter-card-actions">
                  <button
                    type="button"
                    className="btn-read-full-speech"
                    onClick={() => setActiveSpeechDoc('chu_tich_vtf')}
                  >
                    <FileText size={16} />
                    <span>Xem Nguyên Văn Toàn Bộ Bài Phát Biểu</span>
                  </button>
                  <a
                    href="/docs/VTF_Bao_Cao_Thanh_Tich_30_Nam_Chu_Tich_Truong_Ngoc_De.docx"
                    download="VTF_Bao_Cao_Thanh_Tich_30_Nam_Chu_Tich_Truong_Ngoc_De.docx"
                    className="btn-download-speech-doc"
                  >
                    <Download size={15} />
                    <span>Tải File (.DOCX)</span>
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 3: INTERACTIVE TIMELINE (BIÊN NIÊN SỬ 6 GIAI ĐOẠN)
        ========================================================= */}
        <section id="timeline-30years" className="section-block">
          <div className="container">
            <div className="section-header-center">
              <span className="section-eyebrow">BIÊN NIÊN SỬ 6 GIAI ĐOẠN LỊCH SỬ</span>
              <h2 className="section-h2">Từ Những Võ Đường Đầu Tiên Đến Liên Đoàn Điện Tử & Đỉnh Cao Thế Giới</h2>
              <p className="section-subtitle">
                Bấm chọn từng giai đoạn để theo dõi trọn vẹn dòng chảy lịch sử từ thời kỳ du nhập (1962), ngày Thủ
                tướng ký Quyết định 358/TTg (1996) đến tầm nhìn 2046.
              </p>
            </div>

            {/* Interactive Stage Stepper */}
            <div className="timeline-stepper-bar" role="tablist" aria-label="6 giai đoạn lịch sử VTF">
              {TIMELINE_MILESTONES.map((ms, index) => (
                <button
                  key={ms.year}
                  type="button"
                  role="tab"
                  aria-selected={activeTimelineIndex === index}
                  className={`timeline-step-pill ${activeTimelineIndex === index ? 'active' : ''}`}
                  onClick={() => setActiveTimelineIndex(index)}
                >
                  <span className="step-year">{ms.year}</span>
                  <span className="step-phase">{ms.phase}</span>
                </button>
              ))}
            </div>

            {/* Featured Active Stage Detail Card */}
            <div className="timeline-featured-panel">
              <div className="timeline-featured-media">
                <div
                  className="ambient-photo-backdrop"
                  style={{ backgroundImage: `url(${activeMilestone.image})` }}
                  aria-hidden="true"
                />
                <img
                  src={activeMilestone.image}
                  alt={activeMilestone.title}
                  className="timeline-featured-img"
                  width={580}
                  height={390}
                />
                <span className="timeline-badge-overlay">{activeMilestone.badge}</span>
              </div>

              <div className="timeline-featured-content">
                <div className="timeline-meta-row">
                  <span className="timeline-year-tag">{activeMilestone.year}</span>
                  <span className="timeline-phase-tag">{activeMilestone.phase}</span>
                </div>
                <h3 className="timeline-stage-title">{activeMilestone.title}</h3>
                <p className="timeline-stage-sub">{activeMilestone.subtitle}</p>
                <p className="timeline-stage-desc">{activeMilestone.description}</p>

                <ul className="timeline-highlights-list">
                  {activeMilestone.highlights.map((hl) => (
                    <li key={hl}>
                      <CheckCircle2 size={16} className="hl-icon" />
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Full 6-Card Overview Grid */}
            <div className="timeline-mini-grid">
              {TIMELINE_MILESTONES.map((ms, idx) => (
                <div
                  key={ms.year}
                  className={`timeline-mini-card ${activeTimelineIndex === idx ? 'selected' : ''}`}
                  onClick={() => setActiveTimelineIndex(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setActiveTimelineIndex(idx);
                  }}
                >
                  <div className="mini-card-head">
                    <span className="mini-year">{ms.year}</span>
                    <span className="mini-badge">{ms.phase}</span>
                  </div>
                  <h4>{ms.title}</h4>
                  <p>{ms.subtitle}</p>
                </div>
              ))}
            </div>

            {/* Official VTF Brand Identity Evolution Showcase (from hinh anh tham khao) */}
            <div className="brand-evolution-strip">
              <div className="brand-evo-header">
                <div>
                  <span className="section-eyebrow">DI SẢN NHẬN DIỆN THƯƠNG HIỆU VTF QUA 3 THẬP KỶ</span>
                  <h3>Hệ Thống Biểu Trưng Chính Thức Của Liên Đoàn Taekwondo Việt Nam</h3>
                </div>
                <p>
                  Từ biểu trưng chữ <strong>V-F đỏ và thế võ vàng truyền thống</strong> gắn liền với ký ức nhiều thế hệ
                  đến bộ nhận diện <strong>Vietnam Taekwondo (2022)</strong> mang ngôi sao vàng trên ngực áo đỏ và cánh
                  chim xanh hội nhập Olympic.
                </p>
              </div>

              <div className="brand-evo-cards">
                <div className="brand-evo-card">
                  <div className="brand-evo-img-box">
                    <img
                      src="/images/logos/logo-vtf-official.png"
                      alt="Biểu trưng Liên đoàn Taekwondo Việt Nam VTF truyền thống"
                      width={180}
                      height={100}
                      loading="lazy"
                    />
                  </div>
                  <span className="evo-period-tag">BIỂU TRƯNG VTF TRUYỀN THỐNG</span>
                  <h4>Logo VTF (Đỏ – Vàng Di Sản)</h4>
                  <p>Biểu trưng chính thức trên hệ thống văn bản, bằng cấp và giải đấu quốc gia suốt các nhiệm kỳ.</p>
                </div>

                <div className="brand-evo-card">
                  <div className="brand-evo-img-box blue-banner-bg">
                    <img
                      src="/images/logos/logo-vtf-blue-banner.jpg"
                      alt="Banner Biểu trưng VTF trên nền xanh quốc tế"
                      width={200}
                      height={100}
                      loading="lazy"
                    />
                  </div>
                  <span className="evo-period-tag">PHIÊN BẢN BANNER QUỐC TẾ</span>
                  <h4>VTF Trên Thảm Đấu Quốc Tế</h4>
                  <p>Hiện diện trang trọng tại các kỳ SEA Games, Giải Vô địch Châu Á và Giải Quốc tế tại Việt Nam.</p>
                </div>

                <div className="brand-evo-card">
                  <div className="brand-evo-img-box">
                    <img
                      src="/images/logos/logo-vietnam-taekwondo.png"
                      alt="Biểu trưng Vietnam Taekwondo mới công bố năm 2022"
                      width={180}
                      height={100}
                      loading="lazy"
                    />
                  </div>
                  <span className="evo-period-tag">NHẬN DIỆN MỚI · TỪ NĂM 2022</span>
                  <h4>Logo Vietnam Taekwondo Mới</h4>
                  <p>Hình tượng võ sĩ đỏ mang ngôi sao vàng Tổ quốc và chữ W xanh dương kết nối World Taekwondo.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 4: VIETNAM TAEKWONDO HALL OF FAME (CLASS OF 2026)
        ========================================================= */}
        <section id="hall-of-fame" className="section-block section-dark-heritage">
          <div className="container">
            <div className="section-header-center">
              <span className="section-eyebrow eyebrow-gold">
                LẦN ĐẦU TIÊN TRONG LỊCH SỬ 30 NĂM · CLASS OF 2026
              </span>
              <h2 className="section-h2">Đại Sảnh Danh Vọng – Vietnam Taekwondo Hall Of Fame</h2>
              <p className="section-subtitle">
                Lấy cảm hứng từ Hall of Fame của World Taekwondo (WT), tôn vinh tối đa 10–12 huyền thoại kiệt xuất nhất
                30 năm qua thuộc 5 hạng mục. Mỗi nhân vật được trao biểu tượng đồng đúc nguyên khối{' '}
                <strong>“Dấu chân Huyền thoại”</strong> và khắc tên vĩnh viễn tại trụ sở VTF (219 Lý Thường Kiệt,
                TP.HCM).
              </p>
            </div>

            {/* Sacred Tribute Banner: "Chiếc Ghế Danh Dự" */}
            <div className="sacred-chair-tribute">
              <div className="chair-icon-col">
                <Flame size={28} />
              </div>
              <div className="chair-text-col">
                <h3>Nghi Thức Tri Ân Thiêng Liêng: “Chiếc Ghế Danh Dự” Dành Cho Các Bậc Tiền Bối Đã Khuất</h3>
                <p>
                  Tại hàng ghế đầu của Đêm Gala 19/12/2026, một chiếc ghế phủ võ phục trắng (Dobok) và đai đen thêu tên
                  vàng được đặt trang trọng kèm bó hoa trắng để tưởng niệm các bậc khai sơn phá thạch đã đi xa:{' '}
                  <strong>Cố Võ sư Khúc Văn Bón</strong> (người mở đường phong trào phía Bắc),{' '}
                  <strong>Cố Võ sư Trần Đình Cải</strong> (người đặt nền móng tại Đà Nẵng – miền Trung),{' '}
                  <strong>Cố Võ sư Nguyễn Công Vinh</strong> (Bình Thuận) cùng các bậc tiền bối qua các thời kỳ.
                </p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="hof-filter-bar" role="tablist" aria-label="Lọc hạng mục Đại sảnh Danh vọng">
              {[
                { id: 'all', label: 'Tất cả Huyền thoại (12)' },
                { id: 'lifetime', label: 'Cống hiến Trọn đời (Lifetime)' },
                { id: 'leadership', label: 'Lãnh đạo & Quản lý' },
                { id: 'coach', label: 'Huấn luyện viên Huyền thoại' },
                { id: 'athlete', label: 'Vận động viên Biểu tượng' },
                { id: 'international', label: 'Bạn bè Quốc tế' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={hofCategory === tab.id}
                  className={`hof-filter-btn ${hofCategory === tab.id ? 'active' : ''}`}
                  onClick={() =>
                    setHofCategory(
                      tab.id as 'all' | 'lifetime' | 'leadership' | 'coach' | 'athlete' | 'international'
                    )
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Hall of Fame Grid */}
            <div className="hof-cards-grid">
              {filteredHof.map((member) => (
                <article key={member.id} className="hof-legend-card">
                  <div
                    className="hof-card-img-wrap"
                    onClick={() => setSelectedHofMember(member)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedHofMember(member);
                    }}
                  >
                    <div
                      className="ambient-photo-backdrop"
                      style={{ backgroundImage: `url(${member.image})` }}
                      aria-hidden="true"
                    />
                    <img
                      src={member.image}
                      alt={member.name}
                      className="hof-card-img"
                      width={360}
                      height={280}
                      loading="lazy"
                    />
                  </div>

                  <div className="hof-badges-strip">
                    <span className="hof-category-badge">{member.categoryLabel}</span>
                    {member.danRank && <span className="hof-dan-badge">{member.danRank}</span>}
                  </div>

                  <div className="hof-card-body">
                    <div className="hof-era-row">
                      <span>{member.era}</span>
                      <span>·</span>
                      <span>{member.region}</span>
                    </div>
                    <h3 className="hof-member-name">{member.name}</h3>
                    <p className="hof-member-title">{member.title}</p>

                    <blockquote className="hof-member-quote">“{member.quote}”</blockquote>

                    <ul className="hof-achievements-preview">
                      {member.achievements.slice(0, 2).map((ach) => (
                        <li key={ach}>
                          <Star size={13} />
                          <span>{ach}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      className="hof-detail-btn"
                      onClick={() => setSelectedHofMember(member)}
                    >
                      <span>Xem Hồ Sơ Di Sản Đầy Đủ</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 5: HỆ THỐNG 8 DANH SÁCH NHÂN SỰ KỶ NIỆM 30 NĂM VTF (1996 – 2026)
        ========================================================= */}
        <section id="directory-120" className="section-block section-alt">
          <div className="container">
            <div className="section-header-center">
              <span className="section-eyebrow">
                TỔNG HỢP NHÂN SỰ KỶ NIỆM 30 NĂM VTF (1996 – 2026) · 8 DANH SÁCH CHÍNH THỨC
              </span>
              <h2 className="section-h2">
                Hệ Thống 8 Danh Sách Nhân Sự 30 Năm VTF ({VTF_TOTAL_TOP4_UNIQUE} Hồ Sơ TOP Không Trùng &{' '}
                {VTF_ALL_8_LISTS_ITEMS.length} Lượt Danh Bạ)
              </h2>
              <p className="section-subtitle">
                Nguyên tắc tổng hợp: Mỗi cá nhân chỉ xuất hiện ở danh sách ưu tiên cao nhất trong{' '}
                <strong>4 Danh sách TOP (DS1 – DS4: 91 người không trùng)</strong>, đồng thời công bố đầy đủ{' '}
                <strong>4 Danh sách Chức năng & Đẳng cấp toàn quốc (DS5 – DS8)</strong>: Thành viên HĐKT hiện nay (27),
                Trọng tài QG Cấp 1–2 (58), HLV đạt 6–7 Đẳng VTF (248) và HLV đạt từ 7 Đẳng Kukkiwon (5).
              </p>
            </div>

            {/* Interactive Master Summary Table of All 8 Lists */}
            <div className="vtf-8lists-summary-card">
              <div className="vtf-8lists-summary-head">
                <div>
                  <span className="summary-kicker">BẢNG TỔNG HỢP 8 DANH SÁCH NHÂN SỰ KỶ NIỆM 30 NĂM VTF</span>
                  <h3>Bấm chọn bất kỳ danh sách nào dưới đây để tra cứu chi tiết từng cá nhân</h3>
                </div>
                <div className="vtf-8lists-actions">
                  <a
                    href="https://docs.google.com/spreadsheets/d/1KkX9yWIAV3kcActDIkDrzIFd-uFxkXbjJn68uLZzWzQ/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-sheet-link"
                  >
                    <ExternalLink size={15} />
                    <span>Mở Google Sheets Trực Tuyến</span>
                  </a>
                  <a
                    href="/docs/VTF_8_Danh_Sach_30_Nam.xlsx"
                    download="VTF_8_Danh_Sach_30_Nam.xlsx"
                    className="btn-download-speech-doc"
                  >
                    <Download size={15} />
                    <span>Tải File Excel (.XLSX)</span>
                  </a>
                </div>
              </div>

              <div className="vtf-8lists-grid">
                {VTF_8_LISTS_SUMMARY.map((row) => {
                  const isActive = dirGroup === row.groupId;
                  return (
                    <button
                      key={row.groupId}
                      type="button"
                      className={`vtf-list-summary-item ${row.isTop4 ? 'top4-item' : 'func-item'} ${
                        isActive ? 'active' : ''
                      }`}
                      onClick={() => {
                        setDirGroup(row.groupId);
                        setShowAllDirectory(true);
                      }}
                    >
                      <div className="list-sum-top">
                        <span className="list-sum-code">
                          Danh sách {row.stt} ({row.code})
                        </span>
                        <span className="list-sum-count">{row.count} người</span>
                      </div>
                      <strong className="list-sum-title">{row.title}</strong>
                      <span className="list-sum-note">{row.note}</span>
                    </button>
                  );
                })}
              </div>

              <div className="vtf-8lists-total-bar">
                <div className="total-bar-left">
                  <CheckCircle2 size={16} />
                  <span>
                    <strong>TỔNG (không trùng trong 4 DS TOP 1–4): {VTF_TOTAL_TOP4_UNIQUE} người</strong> · Tổng toàn bộ
                    8 Danh sách: <strong>{VTF_ALL_8_LISTS_ITEMS.length} hồ sơ</strong>
                  </span>
                </div>
                <div className="total-bar-right">
                  <button
                    type="button"
                    className={`mini-filter-pill ${dirGroup === 'top4' ? 'active' : ''}`}
                    onClick={() => {
                      setDirGroup('top4');
                      setShowAllDirectory(true);
                    }}
                  >
                    Xem 4 DS TOP (91 người)
                  </button>
                  <button
                    type="button"
                    className={`mini-filter-pill ${dirGroup === 'all8' ? 'active' : ''}`}
                    onClick={() => {
                      setDirGroup('all8');
                      setShowAllDirectory(false);
                    }}
                  >
                    Xem Tất Cả 8 Danh Sách (429)
                  </button>
                </div>
              </div>
            </div>

            {/* Search & Multi-filter Controls */}
            <div className="directory-controls-card">
              <div className="dir-search-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  value={dirSearch}
                  onChange={(e) => setDirSearch(e.target.value)}
                  placeholder="Tìm theo họ tên, đơn vị/địa phương (TP.HCM, Hà Nội, An Giang, Đồng Tháp...), đẳng cấp, thành tích..."
                  aria-label="Tìm kiếm trong 8 danh sách nhân sự 30 năm VTF"
                />
                {dirSearch && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setDirSearch('')}
                    aria-label="Xóa từ khóa tìm kiếm"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="dir-filter-row">
                <div className="dir-group-tabs">
                  {[
                    { id: 'top4', label: '4 DS TOP (91 Không trùng)' },
                    { id: 'all8', label: 'Tất cả 8 DS (429)' },
                    { id: 'ds1_pioneers', label: 'DS1 · CB & Võ sư Cống hiến (27)' },
                    { id: 'ds2_champions', label: 'DS2 · HLV & VĐV Xuất sắc (28)' },
                    { id: 'ds3_technical_referees', label: 'DS3 · HĐKT & Trọng tài (21)' },
                    { id: 'ds4_local_masters', label: 'DS4 · HLV Địa phương (15)' },
                    { id: 'ds5_current_hdkt', label: 'DS5 · HĐKT Hiện nay (27)' },
                    { id: 'ds6_national_referees', label: 'DS6 · Trọng tài C1-C2 (58)' },
                    { id: 'ds7_vtf_dan_6_7', label: 'DS7 · Đẳng 6-7 VTF (248)' },
                    { id: 'ds8_kukkiwon_dan_7_plus', label: 'DS8 · Đẳng 7+ Kukkiwon (5)' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className={`dir-tab-chip ${dirGroup === g.id ? 'active' : ''}`}
                      onClick={() => {
                        setDirGroup(g.id as 'top4' | 'all8' | VtfListGroupId);
                        if (g.id !== 'all8' && g.id !== 'ds7_vtf_dan_6_7') {
                          setShowAllDirectory(true);
                        } else {
                          setShowAllDirectory(false);
                        }
                      }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                <div className="dir-extra-filters">
                  <div className="dir-branch-select">
                    <Filter size={15} />
                    <select
                      value={dirBranch}
                      onChange={(e) =>
                        setDirBranch(e.target.value as 'all' | 'Hệ A - Đỉnh cao' | 'Hệ B - Di sản')
                      }
                      aria-label="Lọc theo Hệ xét thưởng 036/VTF"
                    >
                      <option value="all">Tất cả Hệ (Hệ A & Hệ B)</option>
                      <option value="Hệ A - Đỉnh cao">Hệ A – Thành tích Đỉnh cao</option>
                      <option value="Hệ B - Di sản">Hệ B – Cống hiến Di sản</option>
                    </select>
                  </div>

                  <label className="dir-dedup-checkbox">
                    <input
                      type="checkbox"
                      checked={hideDuplicateInFuncLists}
                      onChange={(e) => setHideDuplicateInFuncLists(e.target.checked)}
                    />
                    <span>Ẩn người đã có ở DS ưu tiên cao hơn</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Directory Results Table / Cards */}
            <div className="directory-results-meta">
              <span>
                Đang hiển thị <strong>{visibleDirectory.length}</strong> / <strong>{filteredDirectory.length}</strong> hồ
                sơ trong danh sách đang chọn
              </span>
              <span className="meta-note">
                * Dữ liệu đồng bộ 100% từ bảng Tổng hợp 8 Danh sách Kỷ niệm 30 năm VTF (1996 – 2026)
              </span>
            </div>

            <div className="directory-cards-grid">
              {visibleDirectory.map((person) => {
                const cleanName = person.name.replace(/\([^)]*\)/g, '').trim();
                const nameParts = cleanName.split(/\s+/);
                const initials =
                  nameParts.length >= 2
                    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
                    : cleanName.slice(0, 2).toUpperCase();
                return (
                  <div
                    key={person.id}
                    className={`dir-person-card ${
                      person.group.startsWith('ds1') ||
                      person.group.startsWith('ds2') ||
                      person.group.startsWith('ds3') ||
                      person.group.startsWith('ds4')
                        ? 'dir-card-top4'
                        : 'dir-card-func'
                    }`}
                  >
                    <div className="dir-person-top">
                      <span className="dir-stt-badge">
                        {person.groupCode} #{person.stt}
                      </span>
                      <span
                        className={`dir-branch-tag ${
                          person.branch === 'Hệ A - Đỉnh cao' ? 'branch-a' : 'branch-b'
                        }`}
                      >
                        {person.branch}
                      </span>
                      <span className="dir-locality-tag">
                        <MapPin size={12} /> {person.locality}
                      </span>
                    </div>

                    <div className="dir-person-main">
                      {person.photo ? (
                        <img
                          src={person.photo}
                          alt={person.name}
                          className="dir-person-avatar"
                          width={52}
                          height={52}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className={`dir-person-monogram ${
                            person.branch === 'Hệ A - Đỉnh cao' ? 'mono-a' : 'mono-b'
                          }`}
                          aria-hidden="true"
                        >
                          <span>{initials}</span>
                        </div>
                      )}
                      <div className="dir-person-info">
                        <h3 className="dir-person-name">{person.name}</h3>
                        <p className="dir-person-role">
                          {person.role}
                          {person.danOrLevel && person.danOrLevel !== person.role ? (
                            <span className="dir-dan-pill">{person.danOrLevel}</span>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    <p className="dir-person-highlight">{person.highlight}</p>
                    <div className="dir-person-footer">
                      <span className="dir-group-label">{person.groupLabel}</span>
                      {person.inHigherList && (
                        <span className="dir-dup-badge" title="Cá nhân này đã được xếp trong Danh sách ưu tiên cao hơn">
                          Đã có ở DS ưu tiên
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredDirectory.length > 30 && (
              <div className="directory-load-more">
                <button
                  type="button"
                  className="btn-primary-gold"
                  onClick={() => setShowAllDirectory((prev) => !prev)}
                >
                  {showAllDirectory
                    ? 'Thu gọn danh sách hiển thị (30 hồ sơ đầu)'
                    : `Xem Toàn Bộ ${filteredDirectory.length} Hồ Sơ Trong Danh Sách Này`}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* =========================================================
            SECTION 6: ĐÊM GALA "ĐÊM NGỌN LỬA HUYỀN THOẠI" & KỶ YẾU 120 TRANG
        ========================================================= */}
        <section id="gala-yearbook" className="section-block">
          <div className="container">
            <div className="section-header-center">
              <span className="section-eyebrow">CHUỖI SỰ KIỆN TRỌNG ĐIỂM QUÝ IV/2026 & ẤN PHẨM LỊCH SỬ</span>
              <h2 className="section-h2">
                Gala “Đêm Ngọn Lửa Huyền Thoại” (19/12/2026) & Đặc San Kỷ Yếu 120 Trang
              </h2>
              <p className="section-subtitle">
                Sự kiện đỉnh cao khép lại Đại hội Đại biểu VTF nhiệm kỳ VII (2026 - 2031), kết hợp Giải Vô địch
                Taekwondo Quốc tế và lễ đấu giá 50 cuốn Kỷ yếu Bản Vàng gây <strong>Quỹ Ngọn lửa Olympic</strong>.
              </p>
            </div>

            {/* Event Master Overview Banner */}
            <div className="gala-master-banner">
              <div className="gala-info-item">
                <Calendar size={20} />
                <div>
                  <span>THỜI GIAN ĐẠI LỄ GALA</span>
                  <strong>18:00 – 21:30 · Thứ Bảy, 19/12/2026</strong>
                </div>
              </div>
              <div className="gala-info-item">
                <MapPin size={20} />
                <div>
                  <span>ĐỊA ĐIỂM TỔ CHỨC</span>
                  <strong>Nhà thi đấu Quân khu 7 / Khách sạn Tân Sơn Nhất, TP.HCM</strong>
                </div>
              </div>
              <div className="gala-info-item">
                <Users size={20} />
                <div>
                  <span>QUY MÔ ĐẠI BIỂU</span>
                  <strong>200+ Đại biểu (WT, ATU, Kukkiwon, ATF & 27 Tỉnh/Thành Ngành)</strong>
                </div>
              </div>
              <div className="gala-info-item">
                <Globe size={20} />
                <div>
                  <span>TRỰC TIẾP ĐA NỀN TẢNG</span>
                  <strong>Livestream VTVcab, HTV, YouTube & Fanpage VTF</strong>
                </div>
              </div>
            </div>

            {/* 3-Tab Switcher: 5-Chapter Gala Script | 120-Page Yearbook Structure | 10 First-Ever Highlights */}
            <div className="gala-tabs-header" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={galaTab === 'gala_chapters'}
                className={`gala-tab-btn ${galaTab === 'gala_chapters' ? 'active' : ''}`}
                onClick={() => setGalaTab('gala_chapters')}
              >
                <Flame size={16} />
                <span>Kịch Bản 5 Chương Đêm Gala (18:00 – 21:30)</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={galaTab === 'yearbook_120'}
                className={`gala-tab-btn ${galaTab === 'yearbook_120' ? 'active' : ''}`}
                onClick={() => setGalaTab('yearbook_120')}
              >
                <BookOpen size={16} />
                <span>Cấu Trúc Kỷ Yếu 120 Trang & 50 Bản Vàng</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={galaTab === 'ten_firsts'}
                className={`gala-tab-btn ${galaTab === 'ten_firsts' ? 'active' : ''}`}
                onClick={() => setGalaTab('ten_firsts')}
              >
                <Sparkles size={16} />
                <span>10 Điểm Nhấn “Lần Đầu Tiên Xuất Hiện”</span>
              </button>
            </div>

            {/* Tab 1: 5-Chapter Gala Script */}
            {galaTab === 'gala_chapters' && (
              <div className="gala-chapters-list">
                {GALA_PROGRAM_CHAPTERS.map((chap) => (
                  <div key={chap.chapterCode} className="gala-chapter-card">
                    <div className="chapter-time-col">
                      <span className="chapter-code-badge">{chap.chapterCode}</span>
                      <span className="chapter-clock">
                        <Clock size={14} /> {chap.time}
                      </span>
                    </div>
                    <div className="chapter-main-col">
                      <h3 className="chapter-title">{chap.title}</h3>
                      <p className="chapter-subtitle">{chap.subtitle}</p>
                      <ul className="chapter-details">
                        {chap.details.map((d) => (
                          <li key={d}>
                            <CheckCircle2 size={15} />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="chapter-performer-col">
                      <span className="performer-label">Đạo diễn & Biểu diễn</span>
                      <strong>{chap.performer}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: 120-Page Yearbook & 50 Limited Gold Copies */}
            {galaTab === 'yearbook_120' && (
              <div className="yearbook-showcase-wrap">
                <div className="gold-edition-banner">
                  <div className="gold-edition-badge">PHIÊN BẢN GIỚI HẠN 50 CUỐN ĐÁNH SỐ 01 – 50</div>
                  <h3>Kỷ Yếu 30 Năm Bản Vàng Ép Kim – Gây Quỹ “Ngọn Lửa Olympic”</h3>
                  <p>
                    Bên cạnh 1.000 cuốn bản tiêu chuẩn và E-book 4.0 tích hợp mã QR Video ở từng trang, VTF ấn hành đúng{' '}
                    <strong>50 cuốn Phiên bản Vàng (Gold-foiled Limited Edition)</strong> có chữ ký tươi của Chủ tịch
                    World Taekwondo <strong>Chungwon Choue</strong>, Chủ tịch ATU <strong>Lee Kyu-seok</strong> và Chủ
                    tịch VTF <strong>Trương Ngọc Để</strong>. 10 cuốn đặc biệt sẽ được đấu giá trực tiếp tại Đêm Gala
                    19/12/2026 để tài trợ VĐV trẻ hướng tới Olympic 2028–2032.
                  </p>
                  <button
                    type="button"
                    className="btn-primary-gold"
                    onClick={() => {
                      setSubmissionType('gold_yearbook_bid');
                      scrollToSection('portal-register');
                    }}
                  >
                    <Trophy size={16} />
                    <span>Đăng Ký Đặt Mua / Đấu Giá Kỷ Yếu Bản Vàng</span>
                  </button>
                </div>

                <div className="yearbook-parts-grid">
                  {YEARBOOK_STRUCTURE.map((part) => (
                    <div key={part.partNumber} className="yearbook-part-card">
                      <div className="yb-part-top">
                        <span className="yb-part-num">{part.partNumber}</span>
                        <span className="yb-part-pages">{part.pages}</span>
                      </div>
                      <h4 className="yb-part-title">{part.title}</h4>
                      <p className="yb-part-summary">{part.summary}</p>
                      <div className="yb-topics-tags">
                        {part.keyTopics.map((t) => (
                          <span key={t} className="yb-topic-chip">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: 10 First-Ever Highlights */}
            {galaTab === 'ten_firsts' && (
              <div className="ten-firsts-grid">
                {[
                  {
                    num: '01',
                    title: 'Ra mắt Đại sảnh Danh vọng (Vietnam Taekwondo Hall of Fame)',
                    desc: 'Lần đầu tiên thiết lập thiết chế tôn vinh vĩnh viễn Class of 2026 với bảng đồng “Dấu chân Huyền thoại” đặt tại trụ sở VTF.',
                  },
                  {
                    num: '02',
                    title: 'Hệ thống Xét thưởng Độc lập Hệ A & Hệ B (036/VTF)',
                    desc: 'Giải quyết triệt để bài toán công bằng giữa Thành tích huy chương quốc tế (Hệ A) và Cống hiến thầm lặng xây dựng phong trào cơ sở (Hệ B).',
                  },
                  {
                    num: '03',
                    title: 'Nghi thức “Chiếc Ghế Danh Dự” Tri ân Tiền bối Đã Khuất',
                    desc: 'Chiếc ghế danh dự phủ võ phục trắng và đai đen thêu tên vàng đặt tại hàng ghế VIP đầu tiên của Đêm Gala.',
                  },
                  {
                    num: '04',
                    title: 'Nghi thức Truyền Đai 4 Thế Hệ & Thắp Đuốc Olympic',
                    desc: 'Từ Đại võ sư Trương Ngọc Để → Trần Hiếu Ngân → Châu Tuyết Vân / Kim Tuyền → VĐV nhí 10 tuổi vô địch trẻ.',
                  },
                  {
                    num: '05',
                    title: 'Sân khấu 3D Mapping “Cú Đá Xuyên Thời Gian”',
                    desc: 'Kết hợp võ nhạc truyền thống, trống hội, đàn tranh và công nghệ LED Matrix tái hiện 30 năm lịch sử.',
                  },
                  {
                    num: '06',
                    title: 'Triển lãm Hiện vật Gốc “Con Đường 30 Năm”',
                    desc: 'Trưng bày tấm HCB Olympic Sydney 2000 nguyên bản, bộ giáp tre thập niên 1990 và Quyết định 358/TTg.',
                  },
                  {
                    num: '07',
                    title: 'Kỷ yếu Đa phương tiện 120 Trang Tích hợp QR Video',
                    desc: 'Quét mã QR ở từng chương để xem lại video cú đá lịch sử tại Sydney 2000, Hiroshima 1994 và phỏng vấn nhân chứng.',
                  },
                  {
                    num: '08',
                    title: '50 Bản Vàng Kỷ Yếu Có Chữ Ký Chủ Tịch WT & ATU',
                    desc: 'Ấn phẩm sưu tầm giới hạn gây Quỹ Ngọn lửa Olympic hỗ trợ tài năng trẻ hướng tới Olympic 2028–2032.',
                  },
                  {
                    num: '09',
                    title: 'Bản đồ Địa lý Taekwondo 34 Tỉnh/Thành Phố Mới',
                    desc: 'Tổng kết toàn diện quy mô CLB, võ đường và nhân sự sau sắp xếp đơn vị hành chính theo Công văn 128/VTF-VP.',
                  },
                  {
                    num: '10',
                    title: 'Cấp Hộ Chiếu Số VTF_TID Cho Đại Biểu & Môn Sinh',
                    desc: 'Tích hợp hệ thống quản trị Liên đoàn điện tử (>400.000 hồ sơ GMS) và chứng nhận điện tử 30 năm.',
                  },
                ].map((item) => (
                  <div key={item.num} className="first-highlight-card">
                    <span className="first-num-badge">{item.num}</span>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =========================================================
            SECTION 7: GALLERY TƯ LIỆU & HÌNH ẢNH THỰC TẾ
        ========================================================= */}
        <section id="photo-gallery" className="section-block section-alt">
          <div className="container">
            <div className="section-header-center">
              <span className="section-eyebrow">KHO TƯ LIỆU ẢNH THỰC TẾ TỪ VTF ARCHIVES</span>
              <h2 className="section-h2">Những Khoảnh Khắc Vàng Trên Thảm Đấu Quốc Tế & Phong Trào Cơ Sở</h2>
              <p className="section-subtitle">
                Bộ ảnh tư liệu gốc từ kho lưu trữ Khen thưởng 30 năm Liên đoàn Taekwondo Việt Nam. Bấm vào từng bức ảnh
                để phóng to và xem chú thích lịch sử chi tiết.
              </p>
            </div>

            <div className="gallery-filter-pills">
              {[
                { id: 'all', label: 'Tất cả Tư liệu (9)' },
                { id: 'poomsae', label: 'Đội tuyển Quyền (Poomsae)' },
                { id: 'kyorugi', label: 'Đội tuyển Đối kháng (Kyorugi)' },
                { id: 'heritage', label: 'Di sản & Truyền nghề' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`gallery-pill-btn ${galleryFilter === cat.id ? 'active' : ''}`}
                  onClick={() => setGalleryFilter(cat.id as 'all' | 'poomsae' | 'kyorugi' | 'heritage')}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="gallery-masonry-grid">
              {filteredGallery.map((photo) => (
                <figure
                  key={photo.id}
                  className="gallery-card-item"
                  onClick={() => setLightboxPhoto(photo)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setLightboxPhoto(photo);
                  }}
                >
                  <div className="gallery-img-box">
                    <div
                      className="ambient-photo-backdrop"
                      style={{ backgroundImage: `url(${photo.src})` }}
                      aria-hidden="true"
                    />
                    <img
                      src={photo.src}
                      alt={photo.title}
                      className="gallery-img"
                      width={420}
                      height={290}
                      loading="lazy"
                    />
                    <span className="gallery-year-tag">{photo.year}</span>
                  </div>
                  <figcaption className="gallery-caption">
                    <h3>{photo.title}</h3>
                    <p>{photo.caption}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 8: INTERACTIVE BOOSTERS (L4 CALCULATOR 036/VTF + POLL + QUIZ + PASSPORT)
        ========================================================= */}
        <InteractiveBoosters onApplyScoreToForm={handleApplyScoreToForm} />

        {/* =========================================================
            SECTION 9: CỔNG NỘP HỒ SƠ ĐỀ CỬ (038/TB-VTF), KỶ YẾU 34 TỈNH/THÀNH (CV 128) & FAQ
        ========================================================= */}
        <section id="portal-register" className="section-block">
          <div className="container">
            <div className="portal-split-layout">
              {/* Left Column: Official Submission Form */}
              <div className="portal-form-card">
                <div className="portal-form-header">
                  <div className="portal-letterhead-bar">
                    <img
                      src="/images/logos/logo-vtf-official.png"
                      alt="Biểu trưng VTF"
                      width={68}
                      height={42}
                    />
                    <img
                      src="/images/logos/logo-vietnam-taekwondo.png"
                      alt="Biểu trưng Vietnam Taekwondo"
                      width={78}
                      height={42}
                    />
                    <span className="section-eyebrow">CỔNG TIẾP NHẬN TRỰC TUYẾN VTF 2026</span>
                  </div>
                  <h2 className="portal-form-title">
                    Nộp Hồ Sơ Đề Cử Vinh Danh (038/TB-VTF) & Gửi Tư Liệu Kỷ Yếu 34 Tỉnh/Thành
                  </h2>
                  <p className="portal-form-desc">
                    Hồ sơ gửi lên được lưu trữ tức thời vào hệ thống tiếp nhận của Tiểu ban Nhân sự & Khen thưởng VTF,
                    đồng thời cấp <strong>Giấy Tiếp Nhận Hồ Sơ Điện Tử</strong> có mã số tra cứu.
                  </p>
                </div>

                {estimatedScore !== undefined && (
                  <div className="prefilled-score-banner">
                    <Award size={20} />
                    <div>
                      <strong>Đã đồng bộ điểm tự chấm từ Công cụ 036/VTF: {estimatedScore}/100 điểm</strong>
                      <span>Xếp hạng dự kiến: {estimatedRank}</span>
                    </div>
                  </div>
                )}

                {formStatus === 'error' && Object.keys(formErrors).length > 0 && (
                  <div className="form-error-alert" role="alert">
                    <AlertCircle size={18} />
                    <div>
                      <strong>Vui lòng kiểm tra lại thông tin hồ sơ:</strong>
                      <ul>
                        {Object.values(formErrors).map((err) => (
                          <li key={err}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} noValidate className="vtf-submission-form">
                  <div className="form-row-2">
                    <div className="form-field">
                      <label htmlFor="vtf-fullname">Họ và Tên cá nhân / Người đại diện đơn vị *</label>
                      <input
                        id="vtf-fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ví dụ: Võ sư Nguyễn Văn A"
                        className={formErrors.fullName ? 'input-error' : ''}
                      />
                      {formErrors.fullName && <span className="field-error-msg">{formErrors.fullName}</span>}
                    </div>

                    <div className="form-field">
                      <label htmlFor="vtf-phone">Số điện thoại liên hệ (Zalo/Di động) *</label>
                      <input
                        id="vtf-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0909 576 776"
                        className={formErrors.phone ? 'input-error' : ''}
                      />
                      {formErrors.phone && <span className="field-error-msg">{formErrors.phone}</span>}
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label htmlFor="vtf-email">Địa chỉ Email nhận xác nhận *</label>
                      <input
                        id="vtf-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ten@donvi.vn"
                        className={formErrors.email ? 'input-error' : ''}
                      />
                      {formErrors.email && <span className="field-error-msg">{formErrors.email}</span>}
                    </div>

                    <div className="form-field">
                      <label htmlFor="vtf-org">Đơn vị / Liên đoàn Tỉnh, Thành, Ngành / CLB *</label>
                      <input
                        id="vtf-org"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        placeholder="Ví dụ: Liên đoàn Taekwondo TP. Đà Nẵng"
                        className={formErrors.organization ? 'input-error' : ''}
                      />
                      {formErrors.organization && <span className="field-error-msg">{formErrors.organization}</span>}
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-field">
                      <label htmlFor="vtf-subtype">Hạng mục Hồ sơ / Đăng ký *</label>
                      <select
                        id="vtf-subtype"
                        value={submissionType}
                        onChange={(e) =>
                          setSubmissionType(e.target.value as SubmissionRecord['submissionType'])
                        }
                      >
                        <option value="nomination_b">
                          1. Đề cử Hệ B – Cống hiến Di sản Phong trào (036/VTF)
                        </option>
                        <option value="nomination_a">
                          2. Đề cử Hệ A – Thành tích Đỉnh cao (036/VTF)
                        </option>
                        <option value="yearbook_34_provinces">
                          3. Gửi Bài viết & Ảnh Kỷ yếu 34 Tỉnh/Thành (CV 128/VTF-VP)
                        </option>
                        <option value="gala_registration">
                          4. Đăng ký Đại biểu dự Đêm Gala 19/12/2026 tại TP.HCM
                        </option>
                        <option value="gold_yearbook_bid">
                          5. Đặt mua / Đấu giá Kỷ yếu Bản Vàng (Quỹ Ngọn lửa Olympic)
                        </option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label htmlFor="vtf-years">Số năm hoạt động / cống hiến cộng dồn (có xác minh)</label>
                      <input
                        id="vtf-years"
                        type="number"
                        min={1}
                        max={65}
                        value={yearsContributed}
                        onChange={(e) => setYearsContributed(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="vtf-achievement">
                      Tóm tắt Thành tích / Số Quyết định minh chứng / Nội dung Báo cáo Kỷ yếu 34 Tỉnh/Thành *
                    </label>
                    <textarea
                      id="vtf-achievement"
                      rows={4}
                      value={messageOrAchievement}
                      onChange={(e) => setMessageOrAchievement(e.target.value)}
                      placeholder="Ghi rõ: Quá trình đóng góp, số năm tham gia BCH/HLV/Trọng tài, thành tích huy chương hoặc tóm tắt bài viết 300-500 chữ của địa phương..."
                      className={formErrors.messageOrAchievement ? 'input-error' : ''}
                    />
                    {formErrors.messageOrAchievement && (
                      <span className="field-error-msg">{formErrors.messageOrAchievement}</span>
                    )}
                  </div>

                  <div className="form-submit-row">
                    <button
                      type="submit"
                      className="btn-submit-official"
                      disabled={formStatus === 'submitting'}
                    >
                      {formStatus === 'submitting' ? (
                        <>
                          <Loader2 size={18} className="spin-icon" />
                          <span>Đang mã hóa & lưu hồ sơ vào hệ thống VTF...</span>
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          <span>Gửi Hồ Sơ Chính Thức & Nhận Mã Xác Nhận</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn-view-admin-inline"
                      onClick={() => setIsAdminDrawerOpen(true)}
                    >
                      <Layers size={16} />
                      <span>Xem danh sách hồ sơ đã nộp ({submissions.length})</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Official Deadlines, Contact & FAQ Accordion */}
              <div className="portal-sidebar-col">
                {/* Official Contact & Deadlines Box */}
                <div className="official-contact-box">
                  <h3>Mốc Thời Hạn & Đầu Mối Tiếp Nhận Hồ Sơ VTF</h3>
                  <ul className="deadline-list">
                    <li>
                      <span className="dl-date">10/09/2026</span>
                      <div>
                        <strong>Hạn gửi Bài viết & Ảnh Kỷ yếu 34 Tỉnh/Thành</strong>
                        <p>Theo Công văn số 128/VTF-VP ngày 08/08/2026 (Bài 300–500 chữ + 5–10 ảnh gốc).</p>
                      </div>
                    </li>
                    <li>
                      <span className="dl-date">30/10/2026</span>
                      <div>
                        <strong>Hạn chót Hồ sơ Xét Khen thưởng 30 Năm (Hệ A & Hệ B)</strong>
                        <p>Theo Thông báo số 038/TB-VTF ngày 06/04/2026 kèm văn bản xác nhận của đơn vị.</p>
                      </div>
                    </li>
                    <li>
                      <span className="dl-date">19/12/2026</span>
                      <div>
                        <strong>Đại hội VTF Nhiệm kỳ VII & Đêm Gala Vinh Danh</strong>
                        <p>Tổ chức tại TP. Hồ Chí Minh kết hợp Giải Vô địch Taekwondo Quốc tế (18–20/12/2026).</p>
                      </div>
                    </li>
                  </ul>

                  <div className="contact-person-card">
                    <Phone size={18} />
                    <div>
                      <span>Đầu mối Ban Truyền thông & Tiếp nhận Hồ sơ VTF:</span>
                      <strong>Bà Nguyễn Thị Anh Thư – SĐT/Zalo: 0909 576 776</strong>
                      <span>Email: tkdvn1996@gmail.com · Địa chỉ: 219 Lý Thường Kiệt, P.15, Q.11, TP.HCM</span>
                    </div>
                  </div>
                </div>

                {/* FAQ Accordion */}
                <div className="faq-accordion-box">
                  <h3 className="faq-box-title">Giải Đáp Thắc Mắc Về Quy Chế 036/VTF & Kỷ Yếu</h3>
                  <div className="faq-list">
                    {FAQ_ITEMS.map((faq, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div key={faq.question} className={`faq-item ${isOpen ? 'open' : ''}`}>
                          <button
                            type="button"
                            className="faq-question-btn"
                            onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                            aria-expanded={isOpen}
                          >
                            <span className="faq-cat-pill">{faq.category}</span>
                            <span className="faq-q-text">{faq.question}</span>
                            <ChevronDown size={18} className="faq-chevron" />
                          </button>
                          {isOpen && (
                            <div className="faq-answer-panel">
                              <p>{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="vtf-footer">
        <div className="container footer-grid">
          <div className="footer-col-brand">
            <div className="brand-logo-footer">
              <img
                src="/images/logos/logo-vtf-official.png"
                alt="Logo Liên đoàn Taekwondo Việt Nam VTF"
                className="footer-vtf-logo"
                width={72}
                height={46}
              />
              <div className="brand-emblem">
                <span className="emblem-num">30</span>
                <span className="emblem-sub">NĂM</span>
              </div>
              <div>
                <strong>LIÊN ĐOÀN TAEKWONDO VIỆT NAM</strong>
                <span>VIETNAM TAEKWONDO FEDERATION (1996 – 2026)</span>
              </div>
            </div>
            <p className="footer-mission">
              “Khát Vọng Hóa Rồng – Nối Nhịp Olympic”. Cổng thông tin chính thức phục vụ chuỗi sự kiện Kỷ niệm 30 năm
              thành lập Liên đoàn Taekwondo Việt Nam, Đại sảnh Danh vọng (Hall of Fame), Công trình Kỷ yếu 120 trang và
              Đại hội đại biểu toàn quốc nhiệm kỳ VII (2026 – 2030).
            </p>
            <div className="footer-address">
              <p>
                <strong>Trụ sở Văn phòng VTF:</strong> Số 219 Lý Thường Kiệt, Phường 15, Quận 11, TP. Hồ Chí Minh
              </p>
              <p>
                <strong>Hotline / Zalo Ban Tổ chức:</strong> 0909 576 776 (Bà Nguyễn Thị Anh Thư) ·{' '}
                <strong>Email:</strong> tkdvn1996@gmail.com
              </p>
            </div>
          </div>

          <div className="footer-col-links">
            <h4>Văn Bản Pháp Lý 30 Năm</h4>
            <ul>
              <li>
                <a href="/docs/VTF_036_Tieu_Chi_Vinh_Danh_30_Nam.pdf" target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} /> Bản Tiêu chí số 036/VTF (04/04/2026)
                </a>
              </li>
              <li>
                <a href="/docs/VTF_038_TB_Khen_Thuong_30_Nam.pdf" target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} /> Thông báo số 038/TB-VTF (06/04/2026)
                </a>
              </li>
              <li>
                <a href="/docs/VTF_128_CV_Ky_Yeu_34_Tinh_Thanh.pdf" target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} /> Công văn số 128/VTF-VP (08/08/2026)
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col-links">
            <h4>Điều Hướng Nhanh</h4>
            <ul>
              <li>
                <button type="button" onClick={() => scrollToSection('timeline-30years')}>
                  Biên niên sử 6 Giai đoạn (1962 – 2026)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('hall-of-fame')}>
                  Vietnam Taekwondo Hall of Fame 2026
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('directory-120')}>
                  8 Danh Sách Nhân Sự 30 Năm (91 TOP + 429 Hồ sơ)
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToSection('cong-cu-tuong-tac')}>
                  Công cụ Tự chấm điểm 036/VTF
                </button>
              </li>
              <li>
                <button type="button" onClick={() => setIsAdminDrawerOpen(true)}>
                  Quản trị & Xuất CSV Hồ sơ Đề cử ({submissions.length})
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="container footer-bottom-bar">
          <span>© 1996 – 2026 Liên đoàn Taekwondo Việt Nam (VTF). Bảo lưu mọi quyền.</span>
          <span>Chuẩn hóa theo Quyết định 358/TTg & Hệ sinh thái Liên đoàn điện tử VTF Digital ID.</span>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="mobile-sticky-bottom-bar">
        <button
          type="button"
          className="mob-bar-btn-calc"
          onClick={() => scrollToSection('cong-cu-tuong-tac')}
        >
          <Award size={16} />
          <span>Chấm Điểm 036/VTF</span>
        </button>
        <button
          type="button"
          className="mob-bar-btn-submit"
          onClick={() => scrollToSection('portal-register')}
        >
          <Send size={16} />
          <span>Nộp Hồ Sơ 30 Năm</span>
        </button>
      </div>

      {/* =========================================================
          MODAL 1: HALL OF FAME MEMBER DETAIL
      ========================================================= */}
      {selectedHofMember && (
        <div
          className="vtf-modal-backdrop"
          onClick={() => setSelectedHofMember(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="hof-modal-title"
        >
          <div className="vtf-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setSelectedHofMember(null)}
              aria-label="Đóng cửa sổ"
            >
              <X size={20} />
            </button>
            <div className="hof-modal-header">
              <img
                src={selectedHofMember.image}
                alt={selectedHofMember.name}
                className="hof-modal-img"
                width={120}
                height={120}
              />
              <div>
                <span className="hof-category-badge">{selectedHofMember.categoryLabel}</span>
                <h3 id="hof-modal-title" className="hof-modal-name">
                  {selectedHofMember.name}
                </h3>
                <p className="hof-modal-role">{selectedHofMember.title}</p>
                <span className="hof-modal-meta">
                  {selectedHofMember.era} · {selectedHofMember.region}{' '}
                  {selectedHofMember.danRank ? `· ${selectedHofMember.danRank}` : ''}
                </span>
              </div>
            </div>
            <blockquote className="hof-modal-quote">“{selectedHofMember.quote}”</blockquote>
            <h4 className="hof-modal-sub">Dấu Ấn & Thành Tựu Lịch Sử:</h4>
            <ul className="hof-modal-list">
              {selectedHofMember.achievements.map((a) => (
                <li key={a}>
                  <CheckCircle2 size={16} />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: PHOTO LIGHTBOX
      ========================================================= */}
      {lightboxPhoto && (
        <div
          className="vtf-modal-backdrop"
          onClick={() => setLightboxPhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
        >
          <div className="vtf-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setLightboxPhoto(null)}
              aria-label="Đóng ảnh phóng to"
            >
              <X size={20} />
            </button>
            <img
              src={lightboxPhoto.src}
              alt={lightboxPhoto.title}
              className="lightbox-full-img"
              width={900}
              height={600}
            />
            <div className="lightbox-caption-bar">
              <span className="gallery-year-tag">{lightboxPhoto.year}</span>
              <h3 id="lightbox-title">{lightboxPhoto.title}</h3>
              <p>{lightboxPhoto.caption}</p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: DIGITAL SUBMISSION CERTIFICATE (SUCCESS STATE)
      ========================================================= */}
      {formStatus === 'success' && latestCertificate && (
        <div
          className="vtf-modal-backdrop"
          onClick={() => setFormStatus('idle')}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cert-modal-title"
        >
          <div className="vtf-certificate-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setFormStatus('idle')}
              aria-label="Đóng giấy xác nhận"
            >
              <X size={20} />
            </button>

            <div className="cert-header-seal">
              <div className="cert-logos-row">
                <img
                  src="/images/logos/logo-vtf-official.png"
                  alt="Logo VTF"
                  width={76}
                  height={46}
                />
                <CheckCircle2 size={36} className="cert-check-icon" />
                <img
                  src="/images/logos/logo-vietnam-taekwondo.png"
                  alt="Logo Vietnam Taekwondo"
                  width={84}
                  height={46}
                />
              </div>
              <span className="cert-kicker">LIÊN ĐOÀN TAEKWONDO VIỆT NAM · TIỂU BAN NHÂN SỰ & KHEN THƯỞNG</span>
              <h3 id="cert-modal-title">GIẤY TIẾP NHẬN HỒ SƠ ĐIỆN TỬ KỶ NIỆM 30 NĂM</h3>
              <span className="cert-code-pill">Mã hồ sơ: {latestCertificate.id}</span>
            </div>

            <div className="cert-body-grid">
              <div>
                <span>Họ và Tên / Đại diện:</span>
                <strong>{latestCertificate.fullName}</strong>
              </div>
              <div>
                <span>Đơn vị / Địa phương:</span>
                <strong>{latestCertificate.organization}</strong>
              </div>
              <div>
                <span>Hạng mục đăng ký:</span>
                <strong>{latestCertificate.submissionTypeLabel}</strong>
              </div>
              <div>
                <span>Thời gian tiếp nhận:</span>
                <strong>{latestCertificate.createdAt}</strong>
              </div>
              {latestCertificate.estimatedScore !== undefined && (
                <div>
                  <span>Điểm tự chấm (036/VTF):</span>
                  <strong>
                    {latestCertificate.estimatedScore}/100đ ({latestCertificate.estimatedRank})
                  </strong>
                </div>
              )}
            </div>

            <p className="cert-note">
              Hồ sơ đã được lưu vào bộ nhớ quản trị trên trình duyệt. Quý vị có thể bấm nút{' '}
              <strong>“Hồ sơ ({submissions.length})”</strong> trên thanh công cụ để tải file Excel (.CSV) đối chiếu hoặc
              gửi kèm bản cứng/PDF minh chứng về email <strong>tkdvn1996@gmail.com</strong>.
            </p>

            <div className="cert-actions">
              <button
                type="button"
                className="btn-primary-gold"
                onClick={() => {
                  setFormStatus('idle');
                  setIsAdminDrawerOpen(true);
                }}
              >
                <span>Mở Kho Hồ Sơ & Xuất File CSV</span>
              </button>
              <button type="button" className="btn-secondary-outline" onClick={() => setFormStatus('idle')}>
                <span>Đóng Cửa Sổ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: FULL VERBATIM SPEECH / CONGRATULATORY LETTER READER
      ========================================================= */}
      {activeSpeechDoc && (
        <div
          className="vtf-modal-backdrop"
          onClick={() => setActiveSpeechDoc(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="speech-modal-title"
        >
          <div className="vtf-speech-reader-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setActiveSpeechDoc(null)}
              aria-label="Đóng nguyên văn bài phát biểu"
            >
              <X size={20} />
            </button>

            {/* Top Switcher Tabs inside Modal */}
            <div className="speech-modal-switcher">
              <button
                type="button"
                className={`speech-tab-btn ${activeSpeechDoc === 'cuc_tdtt' ? 'active' : ''}`}
                onClick={() => setActiveSpeechDoc('cuc_tdtt')}
              >
                <Award size={15} />
                <span>Thư Chúc Mừng Cục TDTT Việt Nam</span>
              </button>
              <button
                type="button"
                className={`speech-tab-btn ${activeSpeechDoc === 'chu_tich_vtf' ? 'active' : ''}`}
                onClick={() => setActiveSpeechDoc('chu_tich_vtf')}
              >
                <Flame size={15} />
                <span>Diễn Văn & Báo Cáo Chủ Tịch VTF Trương Ngọc Để</span>
              </button>
            </div>

            {activeSpeechDoc === 'cuc_tdtt' ? (
              <div className="speech-paper-sheet">
                <div className="speech-official-letterhead">
                  <div className="letterhead-left">
                    <span>BỘ VĂN HÓA, THỂ THAO VÀ DU LỊCH</span>
                    <strong>CỤC THỂ DỤC THỂ THAO VIỆT NAM</strong>
                    <div className="letterhead-line" />
                  </div>
                  <div className="letterhead-right">
                    <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
                    <span>Độc lập - Tự do - Hạnh phúc</span>
                    <div className="letterhead-line" />
                    <em>Hà Nội, năm 2026</em>
                  </div>
                </div>

                <div className="speech-title-block">
                  <img
                    src="/images/logos/logo-vtf-official.png"
                    alt="Logo VTF"
                    className="speech-center-logo"
                    width={84}
                    height={50}
                  />
                  <h3 id="speech-modal-title">THƯ CHÚC MỪNG</h3>
                  <p className="speech-sub-heading">
                    Nhân dịp kỷ niệm 30 năm thành lập Liên đoàn Taekwondo Việt Nam
                    <br />
                    <strong>(22/12/1996 – 22/12/2026)</strong>
                  </p>
                </div>

                <div className="speech-verbatim-content">
                  <p>
                    Nhân dịp kỷ niệm 30 năm thành lập Liên đoàn Taekwondo Việt Nam (22/12/1996 – 22/12/2026), thay mặt
                    lãnh đạo Cục Thể dục thể thao Việt Nam và với tình cảm cá nhân, tôi thân ái gửi tới Liên đoàn
                    Taekwondo Việt Nam, các thế hệ lãnh đạo, cán bộ, huấn luyện viên, trọng tài, vận động viên và những
                    người đã, đang đóng góp cho sự phát triển của Taekwondo Việt Nam lời chúc mừng tốt đẹp nhất.
                  </p>
                  <p>
                    Ba mươi năm xây dựng và phát triển là một chặng đường đáng trân trọng, ghi dấu những nỗ lực, tâm
                    huyết và đóng góp của các thế hệ cán bộ quản lý, huấn luyện viên, trọng tài, vận động viên và những
                    người làm công tác Taekwondo trên cả nước. Từ những ngày đầu thành lập, Liên đoàn Taekwondo Việt Nam
                    đã từng bước củng cố tổ chức, phát triển phong trào, xây dựng lực lượng vận động viên, huấn luyện
                    viên, trọng tài; đồng thời tích cực phối hợp với các cơ quan quản lý nhà nước và các tổ chức
                    Taekwondo quốc tế, góp phần đưa Taekwondo Việt Nam ngày càng khẳng định vị trí trong đời sống thể
                    thao nước nhà và trên đấu trường quốc tế.
                  </p>
                  <p>
                    Cục Thể dục thể thao Việt Nam trân trọng ghi nhận và đánh giá cao những đóng góp của Liên đoàn
                    Taekwondo Việt Nam trong sự nghiệp phát triển môn Taekwondo nói riêng và thể thao Việt Nam nói
                    chung. Những thành tích mà các thế hệ vận động viên Taekwondo Việt Nam đạt được tại các đấu trường
                    khu vực, châu lục và quốc tế trong thời gian qua là kết quả của sự nỗ lực, đoàn kết và trách nhiệm
                    của cả hệ thống, trong đó có vai trò quan trọng của Liên đoàn trong công tác tổ chức, quản lý, đào
                    tạo, phát triển phong trào và xây dựng lực lượng.
                  </p>
                  <p>
                    Bước vào giai đoạn phát triển mới, Cục Thể dục thể thao Việt Nam tin tưởng Liên đoàn Taekwondo Việt
                    Nam sẽ tiếp tục phát huy những kết quả đã đạt được, đổi mới mạnh mẽ phương thức hoạt động, nâng cao
                    chất lượng công tác quản lý, đào tạo và huấn luyện; quan tâm phát triển phong trào Taekwondo rộng
                    khắp trong cả nước, đồng thời tập trung xây dựng lực lượng vận động viên thành tích cao, hướng tới
                    những thành tích cao hơn tại các đấu trường khu vực, châu lục và thế giới. Cục Thể dục thể thao Việt
                    Nam sẽ tiếp tục đồng hành, phối hợp và tạo điều kiện thuận lợi để Liên đoàn thực hiện tốt các nhiệm
                    vụ được giao, đóng góp tích cực vào sự phát triển của thể thao Việt Nam.
                  </p>
                  <p>
                    Nhân dịp ý nghĩa này, chúc Liên đoàn Taekwondo Việt Nam ngày càng phát triển vững mạnh; chúc các thế
                    hệ cán bộ, huấn luyện viên, trọng tài, vận động viên và những người làm công tác Taekwondo trên cả
                    nước luôn mạnh khỏe, đoàn kết, tâm huyết và đạt nhiều thành tích mới. Chúc Taekwondo Việt Nam tiếp
                    tục khẳng định vị thế, vươn xa trên đấu trường quốc tế và đóng góp nhiều hơn nữa cho sự nghiệp phát
                    triển thể dục thể thao nước nhà.
                  </p>
                </div>

                <div className="speech-signature-block">
                  <div className="sig-col">
                    <span className="sig-role">CỤC TRƯỞNG</span>
                    <strong className="sig-name">Nguyễn Danh Hoàng Việt</strong>
                  </div>
                </div>

                <div className="speech-modal-footer">
                  <a
                    href="/docs/Cuc_TDTT_Thu_Chuc_Mung_VTF_30_Nam.docx"
                    download="Cuc_TDTT_Thu_Chuc_Mung_VTF_30_Nam.docx"
                    className="btn-primary-gold"
                  >
                    <Download size={16} />
                    <span>Tải Toàn Văn Thư Chúc Mừng (.DOCX)</span>
                  </a>
                  <button
                    type="button"
                    className="btn-secondary-outline"
                    onClick={() => setActiveSpeechDoc(null)}
                  >
                    <span>Đóng Cửa Sổ</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="speech-paper-sheet">
                <div className="speech-official-letterhead">
                  <div className="letterhead-left">
                    <span>LIÊN ĐOÀN TAEKWONDO VIỆT NAM</span>
                    <strong>BAN CHẤP HÀNH TRUNG ƯƠNG (VTF)</strong>
                    <div className="letterhead-line" />
                  </div>
                  <div className="letterhead-right">
                    <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
                    <span>Độc lập - Tự do - Hạnh phúc</span>
                    <div className="letterhead-line" />
                    <em>TP. Hồ Chí Minh, ngày 19 tháng 12 năm 2026</em>
                  </div>
                </div>

                <div className="speech-title-block">
                  <img
                    src="/images/logos/logo-vietnam-taekwondo.png"
                    alt="Logo Vietnam Taekwondo"
                    className="speech-center-logo"
                    width={96}
                    height={52}
                  />
                  <h3 id="speech-modal-title">
                    DIỄN VĂN KỶ NIỆM 30 NĂM THÀNH LẬP LIÊN ĐOÀN TAEKWONDO VIỆT NAM
                  </h3>
                  <p className="speech-sub-heading">
                    Chủ đề: “Khát Vọng Hóa Rồng – Nối Nhịp Olympic”
                    <br />
                    <strong>(22/12/1996 – 22/12/2026)</strong>
                  </p>
                </div>

                <div className="speech-verbatim-content">
                  <p>
                    <em>
                      Kính thưa các đồng chí Lãnh đạo Bộ Văn hóa, Thể thao và Du lịch, Cục Thể dục thể thao Việt Nam, Ủy
                      ban Olympic Việt Nam!
                      <br />
                      Kính thưa Lãnh đạo Liên đoàn Taekwondo Thế giới (WT), Liên đoàn Taekwondo Châu Á (ATU), Viện Hàn
                      lâm Taekwondo Thế giới (Kukkiwon), Liên đoàn Taekwondo Đông Nam Á (ATF) cùng hơn 200 đại biểu Quốc
                      tế và 27 tỉnh/thành/ngành!
                      <br />
                      Thưa toàn thể các bậc võ sư tiền bối, các thế hệ cán bộ quản lý, huấn luyện viên, trọng tài, vận
                      động viên và hàng triệu môn sinh Taekwondo trên khắp mọi miền Tổ quốc!
                    </em>
                  </p>
                  <p>
                    Cách đây tròn ba thập kỷ, ngày 28/5/1996, Thủ tướng Chính phủ đã ban hành Quyết định số 358/TTg cho
                    phép thành lập Liên đoàn Taekwondo Việt Nam, và ngày 22/12/1996, Đại hội đại biểu toàn quốc lần thứ
                    nhất đã chính thức khai sinh ngôi nhà chung của Taekwondo Việt Nam. Nhìn lại chặng đường 30 năm
                    (22/12/1996 – 22/12/2026), từ một bộ môn còn thiếu thốn cơ sở vật chất, tập luyện trên những sân đất
                    nện buổi ban đầu, chúng ta đã cùng nhau dệt nên một hành trình lịch sử đầy tự hào: từ những võ đường
                    nhỏ vươn ra đấu trường Olympic.
                  </p>
                  <p>
                    Trong giây phút thiêng liêng của Lễ Kỷ niệm 30 năm và Đại hội nhiệm kỳ VII (2026 – 2031), chúng ta
                    thành kính nghiêng mình tưởng nhớ và tri ân các bậc võ sư tiền bối khai sơn phá thạch đã đi xa; trân
                    trọng cảm ơn các thế hệ lãnh đạo Liên đoàn qua các thời kỳ – nguyên Chủ tịch Đặng Quốc Tiến, nguyên
                    Chủ tịch Hà Văn Dũng – cùng hàng ngàn võ sư, huấn luyện viên đã âm thầm cống hiến cả thanh xuân nơi
                    vùng sâu, vùng xa, biên giới và hải đảo để hôm nay Taekwondo Việt Nam quy tụ hơn 1.500 câu lạc bộ và
                    trên 100.000 võ sinh tập luyện thường xuyên trên hệ thống quản trị số hóa toàn quốc.
                  </p>
                  <p>
                    Ba mươi năm qua, lá cờ đỏ sao vàng đã nhiều lần tung bay kiêu hãnh trên các đấu trường quốc tế nhờ ý
                    chí thép của các thế hệ võ sĩ Taekwondo Việt Nam: từ những tấm Huy chương Vàng SEA Games đầu tiên
                    năm 1991, Huy chương Vàng ASIAD Hiroshima 1994 của Trần Quang Hạ, Huy chương Vàng ASIAD Bangkok 1998
                    của Hồ Nhất Thống, chuỗi kỳ tích vô địch SEA Games của Nguyễn Văn Hùng, Nguyễn Thị Huyền Diệu, vị
                    thế cường quốc Quyền (Poomsae) thế giới của Châu Tuyết Vân và các đồng đội, cho đến đỉnh cao chói
                    lọi là tấm Huy chương Bạc Olympic Sydney 2000 lịch sử của võ sĩ Trần Hiếu Ngân – tấm huy chương Thế
                    vận hội đầu tiên mở toang cánh cửa giấc mơ Olympic cho cả nền thể thao Việt Nam.
                  </p>
                  <p>
                    Để tri ân trọn vẹn và công bằng mọi đóng góp trong suốt ba thập kỷ, tại cột mốc 30 năm này, Liên
                    đoàn Taekwondo Việt Nam chính thức ban hành <strong>Bản tiêu chí số 036/VTF</strong> với hai phân hệ
                    độc lập nhưng bình đẳng về danh dự quốc gia: <strong>Hệ A (Thành tích đỉnh cao)</strong> và{' '}
                    <strong>Hệ B (Cống hiến – Di sản phong trào)</strong>, đồng thời lần đầu tiên thiết lập{' '}
                    <strong>Đại sảnh Danh vọng – Vietnam Taekwondo Hall of Fame (Class of 2026)</strong>. Chúng ta cam
                    kết một nguyên tắc nhất quán: Không một giọt mồ hôi, không một thập kỷ tận hiến nào vì màu cờ sắc áo
                    bị lãng quên!
                  </p>
                  <p>
                    Bước vào nhiệm kỳ VII (2026 – 2031) và hướng tới tầm nhìn 2046 với chủ đề{' '}
                    <strong>“Khát Vọng Hóa Rồng – Nối Nhịp Olympic”</strong>, Liên đoàn Taekwondo Việt Nam quyết tâm đẩy
                    mạnh ba trụ cột chiến lược: (1) Chuẩn hóa và mở rộng phong trào an toàn – nhân văn – bền vững trên
                    toàn quốc; (2) Hoàn thiện hệ sinh thái Liên đoàn điện tử – Liên đoàn số kết nối trực tiếp chuẩn GMS
                    toàn cầu; và (3) Tập trung nguồn lực xã hội hóa cùng Quỹ Ngọn lửa Olympic để đầu tư đột phá cho thế
                    hệ vận động viên trẻ chinh phục huy chương tại ASIAD 2026, Olympic Los Angeles 2028 và Brisbane
                    2032.
                  </p>
                  <p>
                    Ngọn lửa võ đạo từ các bậc tiền bối và hào khí Sydney 2000 đang tiếp tục cháy sáng trong tim thế hệ
                    trẻ hôm nay. Xin kính chúc Quý vị đại biểu, các vị khách quý quốc tế cùng toàn thể đại gia đình
                    Taekwondo Việt Nam sức khỏe, hạnh phúc và thắng lợi mới!
                  </p>
                </div>

                <div className="speech-signature-block">
                  <div className="sig-col">
                    <span className="sig-role">TM. BAN CHẤP HÀNH LIÊN ĐOÀN TAEKWONDO VIỆT NAM</span>
                    <span className="sig-subrole">CHỦ TỊCH</span>
                    <strong className="sig-name">Đại võ sư Trương Ngọc Để</strong>
                  </div>
                </div>

                <div className="speech-modal-footer">
                  <a
                    href="/docs/VTF_Bao_Cao_Thanh_Tich_30_Nam_Chu_Tich_Truong_Ngoc_De.docx"
                    download="VTF_Bao_Cao_Thanh_Tich_30_Nam_Chu_Tich_Truong_Ngoc_De.docx"
                    className="btn-primary-gold"
                  >
                    <Download size={16} />
                    <span>Tải Báo Cáo Thành Tích 30 Năm VTF (.DOCX)</span>
                  </a>
                  <button
                    type="button"
                    className="btn-secondary-outline"
                    onClick={() => setActiveSpeechDoc(null)}
                  >
                    <span>Đóng Cửa Sổ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          ADMIN DRAWER (LOCALSTORAGE + CSV EXPORT)
      ========================================================= */}
      <LeadAdminDrawer
        isOpen={isAdminDrawerOpen}
        onClose={() => setIsAdminDrawerOpen(false)}
        submissions={submissions}
        onResetSampleData={handleResetSampleData}
        onClearAll={handleClearAllSubmissions}
      />
    </div>
  );
}

export default App;
