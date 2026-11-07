export interface MilestoneItem {
  year: string;
  phase: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  image: string;
  badge: string;
}

export interface HallOfFameMember {
  id: string;
  name: string;
  title: string;
  category: 'lifetime' | 'leadership' | 'coach' | 'athlete' | 'international';
  categoryLabel: string;
  era: string;
  region: string;
  danRank?: string;
  achievements: string[];
  quote: string;
  image: string;
  /** Trang cá nhân riêng (nếu có), ví dụ '/van/' — hiện nút "Xem Trang Cá Nhân" trên thẻ. */
  profileUrl?: string;
}

export interface DirectoryPerson {
  id: string;
  stt: number;
  name: string;
  locality: string;
  role: string;
  highlight: string;
  group: 'ds1_pioneers' | 'ds2_champions' | 'ds3_technical_referees' | 'ds4_local_masters';
  groupLabel: string;
  branch: 'Hệ A - Đỉnh cao' | 'Hệ B - Di sản';
  danOrLevel?: string;
  photo?: string;
}

export interface GalaChapter {
  time: string;
  chapterCode: string;
  title: string;
  subtitle: string;
  details: string[];
  performer: string;
}

export interface YearbookPart {
  partNumber: string;
  title: string;
  pages: string;
  summary: string;
  keyTopics: string[];
}

export interface GalleryPhoto {
  id: string;
  src: string;
  title: string;
  caption: string;
  category: 'poomsae' | 'kyorugi' | 'heritage';
  year: string;
}

export interface OfficialDoc {
  code: string;
  date: string;
  title: string;
  signer: string;
  summary: string;
  deadline?: string;
  fileUrl: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export interface SubmissionRecord {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  email: string;
  organization: string;
  submissionType: 'nomination_a' | 'nomination_b' | 'yearbook_34_provinces' | 'gala_registration' | 'gold_yearbook_bid';
  submissionTypeLabel: string;
  yearsContributed: number;
  estimatedScore?: number;
  estimatedRank?: string;
  messageOrAchievement: string;
  photoAlbumUrl?: string;
  photoCaptions?: string;
  consentAccepted?: boolean;
  serverReceiptHash?: string;
  serverSynced?: boolean;
}

export const HERO_METRICS = [
  {
    value: '30 Năm',
    code: '22/12/1996 - 22/12/2026',
    label: 'Hành Trình Chính Quy Hóa & Vươn Tầm',
    detail: 'Từ Quyết định 358/TTg của Thủ tướng Chính phủ đến Đại hội nhiệm kỳ VII',
  },
  {
    value: '01 HCB',
    code: 'OLYMPIC SYDNEY 2000',
    label: 'Huy Chương Olympic Lịch Sử Đầu Tiên',
    detail: 'Võ sĩ Trần Hiếu Ngân (hạng −57kg nữ) mở đường cho Thể thao Việt Nam',
  },
  {
    value: '50+ Tỉnh',
    code: '>1.500 CLB · 100.000+ VÕ SINH',
    label: 'Mạng Lưới Phong Trào & 34 Tỉnh Thành Mới',
    detail: 'Quản trị trên hệ sinh thái Liên đoàn điện tử VTF Digital ID & GMS (>400.000 hồ sơ)',
  },
  {
    value: '8 Danh Sách',
    code: '91 HỒ SƠ TOP · 248 HLV 6–7 ĐẲNG',
    label: 'Tổng Hợp Nhân Sự 30 Năm & Hall Of Fame',
    detail: '4 DS TOP (91 người không trùng) & 4 DS Chức năng (HĐKT, Trọng tài C1-2, 6–7 Đẳng VTF, 7+ Kukkiwon)',
  },
];

export const OFFICIAL_DOCS: OfficialDoc[] = [
  {
    code: 'Số: 036/VTF',
    date: '04/04/2026',
    title: 'Bản Tiêu Chí Đánh Giá, Xét Khen Thưởng & Vinh Danh 30 Năm VTF (1996 – 2026)',
    signer: 'PCT kiêm Tổng Thư ký – Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon)',
    summary:
      'Chuẩn hóa xét duyệt độc lập theo 2 phân hệ: Hệ A (Thành tích đỉnh cao – HCV SEA Games trở lên) và Hệ B (Cống hiến Di sản phong trào) trên thang 100 điểm qua 3 cấp xét duyệt.',
    deadline: 'Áp dụng toàn quốc 2026',
    fileUrl: '/docs/VTF_036_Tieu_Chi_Vinh_Danh_30_Nam.pdf',
  },
  {
    code: 'Số: 038/TB-VTF',
    date: '06/04/2026',
    title: 'Thông Báo Triển Khai Lựa Chọn, Đề Xuất Cá Nhân Khen Thưởng & Vinh Danh 30 Năm',
    signer: 'Chủ tịch VTF Trương Ngọc Để',
    summary:
      'Hướng dẫn các hội viên tổ chức lập danh sách, kiểm tra minh chứng (không dùng thông tin truyền miệng) và chấm điểm sơ bộ cấp CLB & cấp Tỉnh/Thành/Ngành.',
    deadline: 'Hạn chót nộp hồ sơ: 30/10/2026',
    fileUrl: '/docs/VTF_038_TB_Khen_Thuong_30_Nam.pdf',
  },
  {
    code: 'Số: 128/VTF-VP',
    date: '08/08/2026',
    title: 'Công Văn Cung Cấp Bài Viết, Hình Ảnh & Dữ Liệu Phục Vụ Kỷ Yếu 30 Năm VTF',
    signer: 'Chủ tịch VTF Trương Ngọc Để',
    summary:
      'Mỗi địa phương chuẩn bị 01 bài viết (300–500 chữ) và 05–10 ảnh gốc độ phân giải cao xây dựng Cơ sở dữ liệu Taekwondo 34 tỉnh, thành phố và Đặc san Kỷ yếu 30 năm.',
    deadline: 'Hạn gửi tư liệu: 10/09/2026 (Liên hệ: Bà Nguyễn Thị Anh Thư – 0909 576 776)',
    fileUrl: '/docs/VTF_128_CV_Ky_Yeu_34_Tinh_Thanh.pdf',
  },
];

export const TIMELINE_MILESTONES: MilestoneItem[] = [
  {
    year: '1962 – 1995',
    phase: 'Giai đoạn I · Khởi nguyên & Việt hóa',
    title: 'Những Võ Đường Tiên Phong & Cú Hích SEA Games 1991',
    subtitle: 'Từ cái nôi TP. Hồ Chí Minh đến Giải Vô địch Quốc gia đầu tiên',
    description:
      'Sau năm 1975, các bậc võ sư tiền bối như Khúc Văn Bón, Nguyễn Long Vân cùng thế hệ Nguyễn Quốc Tâm, Trương Ngọc Để đã dày công phục hồi, "Việt hóa" môn võ Taekwondo hòa quyện tinh thần thượng võ dân tộc. Giải toàn quốc thử nghiệm 1989 và Giải VĐQG lần I năm 1991 tạo bệ phóng cho đội tuyển dự SEA Games 1991 (Manila) giành ngay 1 HCV (Trần Quang Hạ) và 1 HCĐ (Nguyễn Đăng Khánh), tiếp nối bằng tấm HCV ASIAD 12 Hiroshima 1994 lịch sử của Trần Quang Hạ.',
    highlights: [
      'Cố võ sư Khúc Văn Bón & Nguyễn Long Vân đặt nền móng tại TP.HCM',
      '1991: Giải VĐQG lần I & HCV SEA Games đầu tiên tại Philippines',
      '1994: Trần Quang Hạ giành HCV ASIAD 12 tại Hiroshima (Nhật Bản)',
    ],
    image: '/images/timeline-stage1-1962-1995.jpg',
    badge: 'Tiền đề Lịch sử',
  },
  {
    year: '1996',
    phase: 'Giai đoạn II · Xác lập Định chế Quốc gia',
    title: 'Thành Lập Liên Đoàn Taekwondo Việt Nam (VTF)',
    subtitle: 'Quyết định 358/TTg (28/05/1996) & Đại hội Đại biểu Toàn quốc lần I (22/12/1996)',
    description:
      'Ngày 28/05/1996, Thủ tướng Chính phủ ban hành Quyết định số 358/TTg cho phép thành lập Liên đoàn Taekwondo Việt Nam. Ngày 22/12/1996, Đại hội Đại biểu toàn quốc lần thứ I chính thức diễn ra với Chủ tịch đầu tiên Đặng Quốc Tiến (Nguyên Thứ trưởng Bộ Nội vụ), khép lại thời kỳ tự phát để bước vào kỷ nguyên quản trị chính quy, hội nhập toàn diện với World Taekwondo (WT), ATU và Kukkiwon.',
    highlights: [
      'Quyết định 358/TTg ngày 28/05/1996 của Thủ tướng Chính phủ',
      'Đại hội lần thứ I ngày 22/12/1996 – Mốc kỷ niệm truyền thống VTF',
      'Hồ Nhất Thống giành HCV ASIAD 13 Bangkok 1998 ngay trong nhiệm kỳ I',
    ],
    image: '/images/lanh-dao-vtf-1996.jpg',
    badge: 'Mốc Son 1996',
  },
  {
    year: '2000 – 2010',
    phase: 'Giai đoạn III · Kỷ nguyên Vàng Olympic & SEA Games',
    title: 'Khoảnh Khắc Sydney 2000 Làm Thay Đổi Lịch Sử Thể Thao Việt Nam',
    subtitle: 'HCB Olympic đầu tiên của Tổ quốc & Sự thống trị khu vực Đông Nam Á',
    description:
      'Tại Thế vận hội Olympic Sydney 2000, nữ võ sĩ Trần Hiếu Ngân (Phú Yên) đã xuất sắc giành tấm Huy chương Bạc hạng cân −57kg nữ — tấm huy chương Olympic đầu tiên trong lịch sử Thể thao Việt Nam. Tiếp đà vinh quang dưới thời các Chủ tịch Đặng Quốc Tiến và Hà Văn Dũng, thế hệ Nguyễn Văn Hùng ("Độc cô cầu bại" 5 HCV SEA Games liên tiếp, HCB ASIAD 14), Nguyễn Thị Huyền Diệu (4 HCV SEA Games liên tiếp), Nguyễn Thị Hoài Thu (2 HCB ASIAD 2006, 2010), Hoàng Hà Giang (HCV Trẻ Thế giới 2006) đã đưa Việt Nam thành thế lực hàng đầu châu lục.',
    highlights: [
      'Trần Hiếu Ngân: HCB Olympic Sydney 2000 (−57kg nữ) bất tử',
      'Nguyễn Văn Hùng (5 HCV SEA Games) & Nguyễn Thị Huyền Diệu (4 HCV SEA Games)',
      'Hàng loạt HCB, HCĐ tại ASIAD Busan 2002, Doha 2006, Quảng Châu 2010',
    ],
    image: '/images/timeline-stage3-sydney-2000.jpg',
    badge: 'Đỉnh Cao Sydney 2000',
  },
  {
    year: '2011 – 2024',
    phase: 'Giai đoạn IV · Chuyển hướng Chiến lược Poomsae & Hợp tác Quốc tế',
    title: 'Thống Trị Quyền Thế Giới & Cú Bắt Tay Chiến Lược Kukkiwon – CJ',
    subtitle: 'Châu Tuyết Vân cùng đồng đội chinh phục đỉnh cao Poomsae toàn cầu',
    description:
      'Trước sự thay đổi của luật giáp điện tử đối kháng, VTF dưới sự dẫn dắt của Chủ tịch Trương Ngọc Để (9 Đẳng Kukkiwon) và Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon) đã mở mũi nhọn đột phá sang nội dung Quyền (Poomsae) và Võ nhạc. Ngày 20/03/2016, VTF ký MOU lịch sử với Viện Hàn lâm Kukkiwon; đồng thời hợp tác chiến lược hơn 1 thập kỷ với Tập đoàn CJ (Hàn Quốc). Thế hệ Châu Tuyết Vân (10 HCV Thế giới, 6 HCV SEA Games), Nguyễn Thị Lệ Kim, Nguyễn Thiên Phụng, Nguyễn Đình Toàn, Lê Thanh Trung, Trần Tiến Khoa, Hứa Văn Huy đã đưa Việt Nam cán đích Hạng 4 toàn đoàn tại Giải VĐ Quyền Thế giới 2024.',
    highlights: [
      'Ký kết MOU toàn diện với Kukkiwon (20/03/2016) & Tập đoàn CJ (từ 2012)',
      'Đội tuyển Quyền giành hàng chục HCV Thế giới, Châu Á và Nhất toàn đoàn SEA Games 31 (9 HCV)',
      'Đăng cai thành công các giải Châu Á, Trẻ Thế giới và CJ Vietnam Open G1',
    ],
    image: '/images/chungju-2019-team.jpg',
    badge: 'Đột Phá Poomsae',
  },
  {
    year: '2025 – 2026',
    phase: 'Giai đoạn V · Liên đoàn Điện tử 4.0 & Đại lễ 30 Năm',
    title: 'Kỷ Nguyên Số Hóa GMS/GAL & Đại Sảnh Danh Vọng Class of 2026',
    subtitle: 'Quản trị trên 400.000 hồ sơ Cloud & Chuỗi sự kiện Kỷ niệm 30 năm tại TP.HCM',
    description:
      'VTF trở thành liên đoàn tiên phong chuyển đổi số với Định danh số trọn đời (VTF Digital ID / mã GAL trên hệ thống GMS), chấm điểm thời gian thực bằng máy tính bảng và VAR. Năm 2025, Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon) vinh dự đón nhận Huân chương Lao động hạng Nhất; các võ sĩ đối kháng Bạc Thị Khiêm, Trần Thị Ánh Tuyết, Nguyễn Hồng Trọng, Phạm Đăng Quang, Lý Hồng Phúc liên tiếp giành vàng SEA Games 32, 33. Tháng 12/2026, VTF tổ chức Đại hội nhiệm kỳ VII, ra mắt Vietnam Taekwondo Hall of Fame, Kỷ yếu 120 trang và Giải Vô địch Quốc tế VTF.',
    highlights: [
      'Hệ sinh thái Big Data & Cloud quản lý >400.000 hồ sơ hội viên & 1.500+ CLB',
      '23–30/11/2026: Đại hội Thể thao toàn quốc lần thứ X môn Taekwondo tại TP.HCM',
      '16–20/12/2026: Đại hội VII, Gala "Đêm Ngọn Lửa Huyền Thoại" & Giải Quốc tế VTF',
    ],
    image: '/images/virtual-taekwondo-2025-2026.jpg',
    badge: 'Hiện Tại · 2026',
  },
  {
    year: '2028 – 2046',
    phase: 'Giai đoạn VI · Khát vọng Hóa Rồng – Nối nhịp Olympic',
    title: 'Tuyên Ngôn Los Angeles 2028, Brisbane 2032 & Hộp Thời Gian 2046',
    subtitle: 'Ứng dụng AI phân tích đòn thế, tự chủ xã hội hóa và trở lại bục vinh quang Thế vận hội',
    description:
      'Bám sát Chiến lược phát triển TDTT Việt Nam đến năm 2030, tầm nhìn 2045 và tinh thần "Kỷ nguyên vươn mình của dân tộc", VTF công bố Tuyên ngôn Olympic Los Angeles 2028 – ASIAD 2030 – Olympic Brisbane 2032. Quỹ Ngọn lửa Olympic (từ đấu giá 50 cuốn Kỷ yếu Bản Vàng có chữ ký Chủ tịch WT, ATU, VTF) sẽ tài trợ cho lứa tài năng trẻ giành suất Olympic trẻ Dakar 2026 đi tập huấn dài hạn, hướng tới cột mốc 50 năm VTF (2046).',
    highlights: [
      'Ứng dụng AI & Khoa học thể thao phân tích kỹ thuật Kyorugi và chuẩn hóa Poomsae',
      'Phủ sóng Taekwondo & Võ nhạc vào hệ thống giáo dục thể chất học đường 34 tỉnh/thành',
      'Niêm phong "Hộp thời gian 2046" gửi thế hệ kỷ niệm 50 năm thành lập VTF',
    ],
    image: '/images/poster-30nam-giac-mo-olympic.jpg',
    badge: 'Tầm Nhìn 2028–2046',
  },
];

export const HALL_OF_FAME_2026: HallOfFameMember[] = [
  {
    id: 'hof-truong-ngoc-de',
    name: 'Đại Võ Sư Trương Ngọc Để',
    title: 'Chủ tịch Liên đoàn Taekwondo Việt Nam (Nhiệm kỳ IV, V, VI)',
    category: 'leadership',
    categoryLabel: 'Lãnh Đạo & Quản Lý',
    era: '1987 – 2026',
    region: 'TP. Hồ Chí Minh / Toàn quốc',
    danRank: 'Cửu Đẳng Huyền Đai (9 Dan Kukkiwon)',
    achievements: [
      'Người Việt Nam đầu tiên và duy nhất được Viện Hàn lâm Kukkiwon trao Cửu đẳng Huyền đai (9 Dan)',
      'HLV trưởng Đội tuyển Quốc gia giành HCV SEA Games đầu tiên (1991) và HCB Olympic Sydney 2000',
      'Chủ tịch VTF 3 nhiệm kỳ liên tiếp, kiến tạo hợp tác chiến lược với WT, Kukkiwon và Tập đoàn CJ',
    ],
    quote:
      'Ba mươi năm trước chúng ta bước ra biển lớn từ những võ đường đơn sơ. Ba mươi năm tới, khát vọng lớn nhất của VTF là đưa Quốc kỳ Việt Nam một lần nữa tung bay trên bục vinh quang Olympic.',
    image: '/images/truong-ngoc-de-9-dan-kukkiwon.jpg',
  },
  {
    id: 'hof-tran-hieu-ngan',
    name: 'Trần Hiếu Ngân',
    title: 'Huyền thoại Olympic – Huy chương Bạc Thế vận hội Sydney 2000',
    category: 'athlete',
    categoryLabel: 'Vận Động Viên Huyền Thoại',
    era: '1987 – Nay',
    region: 'Phú Yên / TP. Hồ Chí Minh',
    danRank: 'Huyền thoại Olympic Việt Nam',
    achievements: [
      'Huy chương Bạc Olympic Sydney 2000 (hạng −57kg nữ) – Huy chương Olympic đầu tiên của Thể thao Việt Nam',
      'Huy chương Đồng ASIAD 13 Bangkok 1998, Vô địch Châu Á 1998 và HCV SEA Games',
      'Biểu tượng mở đường truyền cảm hứng cho hàng triệu thanh thiếu niên Việt Nam đến với Taekwondo',
    ],
    quote:
      'Khoảnh khắc đứng trên bục nhận huy chương tại Sydney 2000 không chỉ của riêng tôi, mà là mồ hôi của những người thầy mở đường và niềm kiêu hãnh của cả dân tộc Việt Nam.',
    image: '/images/tran-hieu-ngan-sydney-2000.jpg',
  },
  {
    id: 'hof-nguyen-thanh-huy',
    name: 'Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon)',
    title: 'Phó Chủ tịch kiêm Tổng Thư ký VTF · HLV Trưởng ĐT Quyền Quốc gia',
    category: 'coach',
    categoryLabel: 'Huấn Luyện Viên & Kiến Trúc Sư Hệ Thống',
    era: '1985 – 2026',
    region: 'TP. Hồ Chí Minh / Toàn quốc',
    danRank: '8 Đẳng Kukkiwon',
    achievements: [
      'Đón nhận Huân chương Lao động hạng Nhất năm 2025 vì thành tích huấn luyện ĐT Quyền vô địch Thế giới',
      'Được Chủ tịch Kukkiwon trực tiếp trao văn bằng danh dự 8 Đẳng; dẫn dắt Poomsae Việt Nam vào Top 4 Thế giới',
      'Kiến trúc sư mô hình "Liên đoàn điện tử 4.0" và Bản tiêu chí xét vinh danh chuẩn hóa số 036/VTF',
    ],
    quote:
      'Một nền Taekwondo quốc gia bền vững không chỉ được xây bằng huy chương, mà phải được xây bằng dữ liệu minh bạch, thể chế công bằng và sự ghi nhận xứng đáng cho những người giữ lửa phong trào.',
    image: '/images/dai-vo-su-nguyen-thanh-huy.jpg',
  },
  {
    id: 'hof-khuc-van-bon-long-van',
    name: 'Cố Võ Sư Khúc Văn Bón & Võ Sư Nguyễn Long Vân',
    title: 'Nhị Vị Tiên Phong Đặt Nền Móng & Việt Hóa Taekwondo Phía Nam',
    category: 'lifetime',
    categoryLabel: 'Cống Hiến Trọn Đời (Chiếc Ghế Danh Dự)',
    era: '1965 – 1996',
    region: 'TP. Hồ Chí Minh & Các tỉnh phía Nam',
    danRank: 'Tiền bối Khai mở Phong trào',
    achievements: [
      'Khôi phục và giữ lửa phong trào Taekwondo tại TP.HCM ngay sau năm 1975 trong điều kiện gian khó',
      'Nguyên Chủ tịch & Phó Chủ tịch Hội Taekwondo TP.HCM – cái nôi cung cấp lực lượng nòng cốt lập nên VTF',
      'Đào tạo thế hệ võ sư, HLV đầu tiên lan tỏa kỹ thuật chuẩn mực đi khắp các tỉnh thành',
    ],
    quote:
      'Nghi thức "Chiếc ghế danh dự" phủ võ phục và đai đẳng tại Đêm Gala 30 năm là lời tri ân vĩnh cửu gửi tới các bậc tiền bối đã gieo hạt mầm đầu tiên cho đại thụ Taekwondo Việt Nam.',
    image: '/images/vo-su-tien-boi-1962-1995.jpg',
  },
  {
    id: 'hof-dang-quoc-tien-ha-van-dung',
    name: 'Ông Đặng Quốc Tiến & Ông Hà Văn Dũng',
    title: 'Chủ Tịch Danh Dự & Nguyên Chủ Tịch Liên Đoàn Qua Các Thời Kỳ',
    category: 'leadership',
    categoryLabel: 'Lãnh Đạo & Quản Lý',
    era: '1996 – 2012',
    region: 'Hà Nội / Trung ương',
    danRank: 'Chủ tịch VTF Nhiệm kỳ I, II, III',
    achievements: [
      'Ông Đặng Quốc Tiến (Nguyên Thứ trưởng Bộ Nội vụ): Chủ tịch đầu tiên đặt nền móng pháp lý và tổ chức VTF năm 1996',
      'Ông Hà Văn Dũng: Tiếp nối và mở rộng quy mô Liên đoàn, thúc đẩy xã hội hóa và hội nhập quốc tế sâu rộng',
      'Giai đoạn bản lề đưa Taekwondo Việt Nam gặt hái HCB Olympic 2000 và HCV ASIAD 1998',
    ],
    quote:
      'Sự ra đời của Liên đoàn năm 1996 đã tạo hành lang pháp lý vững chắc để Taekwondo Việt Nam tự tin sánh vai cùng các cường quốc võ thuật.',
    image: '/images/lanh-dao-vtf-1996.jpg',
  },
  {
    id: 'hof-tran-quang-ha-ho-nhat-thong',
    name: 'Trần Quang Hạ & Hồ Nhất Thống',
    title: 'Hai Nhà Vô Địch Á Vận Hội (ASIAD 1994 & ASIAD 1998)',
    category: 'athlete',
    categoryLabel: 'Vận Động Viên Huyền Thoại',
    era: '1991 – 2005',
    region: 'TP. Hồ Chí Minh',
    danRank: 'Nhà Vô địch ASIAD',
    achievements: [
      'Trần Quang Hạ: HCV SEA Games đầu tiên (1991), HCV ASIAD 12 Hiroshima 1994, HCĐ Thế giới 1995',
      'Hồ Nhất Thống: HCV ASIAD 13 Bangkok 1998, HCĐ Vô địch Thế giới 1999',
      'Cặp song sát mở màn thời kỳ hoàng kim của Đối kháng (Kyorugi) Việt Nam trên đấu trường châu lục',
    ],
    quote:
      'Những tấm Huy chương Vàng ASIAD 1994 và 1998 đã chứng minh võ sĩ Việt Nam không hề thua kém bất kỳ cường quốc châu Á nào.',
    image: '/images/tran-quang-ha-asiad-1994.jpg',
  },
  {
    id: 'hof-chau-tuyet-van',
    name: 'Châu Tuyết Vân',
    title: 'Biểu Tượng Vàng Poomsae – 10 HCV Thế Giới & 6 HCV SEA Games Liên Tiếp',
    category: 'athlete',
    categoryLabel: 'Vận Động Viên Huyền Thoại',
    era: '2009 – 2026',
    region: 'TP. Hồ Chí Minh',
    danRank: 'Hội đồng Kỹ thuật VTF · Kiện tướng Quốc tế',
    achievements: [
      'Giành 10 Huy chương Vàng Giải Vô địch Quyền Thế giới (từ 2013 đến 2024, 2026)',
      '6 lần liên tiếp giành Huy chương Vàng SEA Games (2013, 2015, 2017, 2019, 2022, 2023)',
      'Đại sứ truyền cảm hứng đưa Taekwondo và Võ nhạc đến gần hơn với hàng triệu bạn trẻ Gen Z',
    ],
    quote:
      'Mỗi bài quyền trên thảm đấu thế giới là một lần chúng tôi kể câu chuyện về sự kiên định, uyển chuyển và ý chí thép của con người Việt Nam.',
    image: '/images/chau-tuyet-van-portrait.jpg',
    profileUrl: '/van/',
  },
  {
    id: 'hof-international-friends',
    name: 'TS. Chungwon Choue, GS. Lee Kyu-seok & Tập Đoàn CJ',
    title: 'Những Người Bạn Lớn Quốc Tế Của Taekwondo Việt Nam',
    category: 'international',
    categoryLabel: 'Bạn Bè Quốc Tế',
    era: '1996 – 2026',
    region: 'World Taekwondo · ATU · Hàn Quốc',
    danRank: 'Đai Chủ tịch VTF – President Edition',
    achievements: [
      'TS. Chungwon Choue (Chủ tịch World Taekwondo) & GS. Lee Kyu-seok (Chủ tịch ATU): Hỗ trợ Việt Nam đăng cai các giải G1, Châu Á, Thế giới',
      'Tập đoàn CJ (Hàn Quốc): Đối tác chiến lược Kim cương từ 2012, tài trợ ĐTQG, chuyên gia Hàn Quốc và hệ thống Giải Trẻ CJ toàn quốc',
      'Viện Hàn lâm Kukkiwon: Ký MOU chuẩn hóa đẳng cấp, đào tạo HLV & Trọng tài quốc tế tại Việt Nam',
    ],
    quote:
      'Việt Nam là một trong những hình mẫu năng động, uy tín và giàu khát vọng nhất của gia đình Taekwondo thế giới.',
    image: '/images/wt-chungwon-choue-vtf.jpg',
  },
];

export const DIRECTORY_120_REPRESENTATIVES: DirectoryPerson[] = [
  // DS1: TOP Cán bộ, Lãnh đạo, Võ sư có công xây dựng (từ file v02.xlsx)
  {
    id: 'p-1',
    stt: 1,
    name: 'Trương Ngọc Để',
    locality: 'TP. Hồ Chí Minh',
    role: 'Chủ tịch VTF 3 nhiệm kỳ liên tục IV, V, VI',
    highlight: 'Cửu đẳng Huyền đai (9 Dan Kukkiwon); HLV trưởng ĐTQG 1991–2000; Thuyền trưởng VTF',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ B - Di sản',
    danOrLevel: '9 Đẳng Kukkiwon',
  },
  {
    id: 'p-2',
    stt: 2,
    name: 'Đặng Quốc Tiến',
    locality: 'Hà Nội',
    role: 'Nguyên Thứ trưởng Bộ Nội vụ · Chủ tịch Danh dự VTF',
    highlight: 'Chủ tịch VTF đầu tiên (Nhiệm kỳ I - 1996), đặt nền móng thể chế và hội nhập quốc tế',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'Chủ tịch Danh dự',
  },
  {
    id: 'p-3',
    stt: 3,
    name: 'Phạm Thế Triều',
    locality: 'An Giang',
    role: 'Nguyên GĐ Sở TDTT, PGĐ Sở VHTTDL An Giang · Phó Chủ tịch VTF',
    highlight: 'Đóng góp chiến lược xây dựng phong trào ĐBSCL và quản trị Liên đoàn qua nhiều nhiệm kỳ',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'Phó Chủ tịch VTF',
  },
  {
    id: 'p-4',
    stt: 4,
    name: 'Hồ Châu Tuấn',
    locality: 'Quân đội / TP.HCM',
    role: 'Đại tá, Nguyên GĐ TT TDTT Quốc phòng II (QK7) · Phó Chủ tịch VTF',
    highlight: 'Phát triển mạnh mẽ Taekwondo Quân đội và đăng cai các sự kiện lớn tại NTĐ Quân khu 7',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'Phó Chủ tịch VTF',
  },
  {
    id: 'p-5',
    stt: 5,
    name: 'Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon)',
    locality: 'TP. Hồ Chí Minh',
    role: 'Phó Chủ tịch kiêm Tổng Thư ký VTF · HLV Trưởng ĐT Quyền QG',
    highlight: '8 Đẳng Kukkiwon; Huân chương Lao động hạng Nhất 2025; Kiến tạo Liên đoàn điện tử 4.0',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: '8 Đẳng Kukkiwon',
    photo: '/images/hlv-thanh-huy-jakarta2013.jpg',
  },
  {
    id: 'p-6',
    stt: 6,
    name: 'Nguyễn Đăng Khánh',
    locality: 'TP. Hồ Chí Minh',
    role: 'Phó Chủ tịch VTF · Nguyên HLV Trưởng ĐTQG',
    highlight: 'HCĐ SEA Games 16 (1991); HLV trưởng ĐTQG đào tạo nhiều thế hệ vô địch châu lục',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'Phó Chủ tịch VTF',
  },
  {
    id: 'p-7',
    stt: 7,
    name: 'Khúc Văn Bón',
    locality: 'TP. Hồ Chí Minh',
    role: 'Cố Võ sư tiên phong · Nguyên Chủ tịch Hội Taekwondo TP.HCM',
    highlight: 'Người đặt nền móng phục hồi và Việt hóa phong trào Taekwondo TP.HCM sau 1975',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'Võ sư Tiên phong',
  },
  {
    id: 'p-8',
    stt: 8,
    name: 'Nguyễn Long Vân',
    locality: 'TP. Hồ Chí Minh',
    role: 'Nguyên Phó Chủ tịch Hội Taekwondo TP.HCM',
    highlight: 'Người thầy của những thế hệ đầu tiên, lan tỏa phong trào Taekwondo khắp phía Nam',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'Võ sư Tiên phong',
  },
  {
    id: 'p-9',
    stt: 9,
    name: 'Nguyễn Quốc Tâm',
    locality: 'TP.HCM / Nha Trang',
    role: 'Nguyên Phó Chủ tịch Hội TKD & Liên đoàn Võ thuật TP.HCM',
    highlight: 'Cây đại thụ chuyên môn giai đoạn tái thiết 1980–2010, đào tạo thế hệ vàng đầu tiên',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'Võ sư Cao cấp',
  },
  {
    id: 'p-10',
    stt: 10,
    name: 'Trần Đình Cải',
    locality: 'Khánh Hòa / Ninh Thuận',
    role: 'Cố Võ sư · Nguyên Chủ tịch Hội Taekwondo đầu tiên tỉnh Khánh Hòa',
    highlight: 'Mở đường và xây dựng hệ thống phong trào Taekwondo khu vực Nam Trung Bộ',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'Võ sư Tiên phong',
  },
  {
    id: 'p-11',
    stt: 11,
    name: 'Nguyễn Thị Minh Yến',
    locality: 'Đà Nẵng / Hà Nội',
    role: 'Võ sư · "Người đàn bà thép" của Taekwondo Đà Nẵng',
    highlight: 'Gây dựng phong trào miền Trung từ thập niên 1980 và hỗ trợ mở lớp đầu tiên tại Hà Nội (1988)',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'Võ sư Cao cấp',
  },
  {
    id: 'p-12',
    stt: 12,
    name: 'Nguyễn Mạnh Hùng',
    locality: 'Hà Nội',
    role: 'Chủ tịch Liên đoàn Taekwondo Hà Nội',
    highlight: 'Xây dựng bộ môn Taekwondo Hà Nội từ năm 1988 đến mạng lưới 68 CLB & 12.000 võ sinh',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'Lãnh đạo Liên đoàn',
  },
  {
    id: 'p-13',
    stt: 13,
    name: 'Đỗ Minh Đức',
    locality: 'Đà Lạt, Lâm Đồng',
    role: 'Chủ tịch Hội Taekwondo tỉnh Lâm Đồng · Ủy viên BCH VTF',
    highlight: 'Đưa Lâm Đồng trở thành điểm sáng phong trào và cung cấp nhiều tuyển thủ quốc gia',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'UV BCH VTF',
  },
  {
    id: 'p-14',
    stt: 14,
    name: 'Nguyễn Trường Hoàng',
    locality: 'TP. Hồ Chí Minh',
    role: 'Chủ tịch Hội đồng Kỹ thuật VTF',
    highlight: '7 Đẳng VTF & Kukkiwon; chuẩn hóa giáo trình thi thăng đẳng và chuyên môn toàn quốc',
    group: 'ds1_pioneers',
    groupLabel: 'DS1 · Cán bộ & Võ sư Xây dựng',
    branch: 'Hệ B - Di sản',
    danOrLevel: '7 Đẳng · HĐKT VTF',
  },
  // DS2: TOP HLV & VĐV Thành tích Xuất sắc
  {
    id: 'c-1',
    stt: 1,
    name: 'Trần Hiếu Ngân',
    locality: 'Phú Yên / TP.HCM',
    role: 'VĐV Đối kháng · HLV Chuyên môn',
    highlight: 'HCB Olympic Sydney 2000 (−57kg nữ); HCĐ ASIAD 13 (1998); HCV Châu Á 1998',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCB Olympic 2000',
    photo: '/images/kyorugi-medal-flag.jpg',
  },
  {
    id: 'c-2',
    stt: 2,
    name: 'Trần Quang Hạ',
    locality: 'TP. Hồ Chí Minh',
    role: 'HLV / Cựu VĐV Đối kháng',
    highlight: 'HCV ASIAD 12 Hiroshima 1994; HCV SEA Games 1991; HCĐ Thế giới 1995; HLV ĐTQG',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCV ASIAD 1994',
  },
  {
    id: 'c-3',
    stt: 3,
    name: 'Hồ Nhất Thống',
    locality: 'TP. Hồ Chí Minh',
    role: 'VĐV Đối kháng',
    highlight: 'HCV ASIAD 13 Bangkok 1998; HCĐ Vô địch Thế giới 1999',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCV ASIAD 1998',
    photo: '/images/asiad-ho-nhat-thong-1998.jpg',
  },
  {
    id: 'c-4',
    stt: 4,
    name: 'Nguyễn Thị Hoài Thu',
    locality: 'Hà Nội',
    role: 'VĐV Đối kháng',
    highlight: '2 Huy chương Bạc ASIAD liên tiếp: ASIAD 15 Doha 2006 & ASIAD 16 Quảng Châu 2010',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: '2 HCB ASIAD',
  },
  {
    id: 'c-5',
    stt: 5,
    name: 'Nguyễn Văn Hùng',
    locality: 'Thanh Hóa',
    role: 'VĐV Đối kháng',
    highlight: 'HCB ASIAD 14 Busan 2002; HCĐ ASIAD 13; 5 HCV SEA Games liên tiếp (1999–2007)',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCB ASIAD · 5 HCV SEA',
  },
  {
    id: 'c-6',
    stt: 6,
    name: 'Nguyễn Thị Huyền Diệu',
    locality: 'TP. Hồ Chí Minh',
    role: 'VĐV Đối kháng',
    highlight: 'HCB ASIAD 14 Busan 2002; kỷ lục 4 HCV SEA Games liên tiếp (1999–2005)',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCB ASIAD · 4 HCV SEA',
  },
  {
    id: 'c-7',
    stt: 7,
    name: 'Châu Tuyết Vân',
    locality: 'TP. Hồ Chí Minh',
    role: 'VĐV Quyền (Poomsae) · Ủy viên HĐKT VTF',
    highlight: '10 HCV Thế giới (2013–2026); 6 HCV SEA Games liên tiếp; Huân chương Lao động hạng Nhất',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: '10 HCV Thế giới',
    photo: '/images/chau-tuyet-van-portrait.jpg',
  },
  {
    id: 'c-8',
    stt: 8,
    name: 'Bạc Thị Khiêm',
    locality: 'Sơn La',
    role: 'VĐV Đối kháng Đội tuyển Quốc gia',
    highlight: 'HCV Châu Á 2024; HCĐ ASIAD 19 Hàng Châu; HCV SEA Games 30 (2019) & SEA Games 33 (2025)',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCV Châu Á · HCĐ ASIAD',
    photo: '/images/bac-thi-khiem-asian2024.jpg',
  },
  {
    id: 'c-9',
    stt: 9,
    name: 'Trương Thị Kim Tuyền',
    locality: 'Vĩnh Long',
    role: 'VĐV Đối kháng Olympic Tokyo 2020',
    highlight: 'HCB Vô địch Thế giới 2017; HCV Châu Á; HCV SEA Games 2015, 2022; Tuyển thủ Olympic',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCB Thế giới 2017',
  },
  {
    id: 'c-10',
    stt: 10,
    name: 'Nguyễn Thiên Phụng',
    locality: 'TP. Hồ Chí Minh',
    role: 'VĐV Quyền (Poomsae) · Ủy viên HĐKT VTF',
    highlight: 'HCĐ Đồng đội ASIAD 18; HCV Quyền Thế giới 2013, 2024, 2026; Nhiều HCV SEA Games',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCV Thế giới · HCĐ ASIAD',
    photo: '/images/nguyen-thien-phung-world2024.jpg',
  },
  {
    id: 'c-11',
    stt: 11,
    name: 'Nguyễn Thị Lệ Kim',
    locality: 'Bình Thuận / Lâm Đồng',
    role: 'VĐV Quyền (Poomsae) · Ủy viên HĐKT VTF',
    highlight: 'Nhiều HCV Thế giới (2013–2026); Chuỗi HCV SEA Games 2013–2022; HCV Châu Á',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCV Thế giới & SEA Games',
    photo: '/images/kimha-lekim-atu.jpg',
  },
  {
    id: 'c-12',
    stt: 12,
    name: 'Trần Tiến Khoa',
    locality: 'Cần Thơ',
    role: 'VĐV / HLV Quyền (Poomsae) · HĐKT VTF',
    highlight: 'HCĐ Quyền đồng đội nam ASIAD 18 (Jakarta 2018); HCV Thế giới & SEA Games',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCĐ ASIAD 18',
    photo: '/images/tran-tien-khoa.jpg',
  },
  {
    id: 'c-13',
    stt: 13,
    name: 'Nguyễn Đình Toàn',
    locality: 'Hà Nội',
    role: 'VĐV Quyền (Poomsae) · Ủy viên HĐKT VTF',
    highlight: 'HCV Quyền Thế giới 2013; Chuỗi HCV SEA Games 2009, 2011, 2013 đôi nam nữ & đồng đội',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCV Thế giới 2013',
  },
  {
    id: 'c-14',
    stt: 14,
    name: 'Trần Hồ Duy',
    locality: 'TP. Hồ Chí Minh',
    role: 'VĐV Quyền (Poomsae)',
    highlight: 'HCĐ Quyền cá nhân nam ASIAD 19 Hàng Châu 2023; HCV SEA Games 2019, 2022, 2025',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCĐ ASIAD 19',
  },
  {
    id: 'c-15',
    stt: 15,
    name: 'Hứa Văn Huy',
    locality: 'TP. Hồ Chí Minh',
    role: 'VĐV Quyền (Poomsae)',
    highlight: 'HCV SEA Games liên tiếp 2019–2023; Huy chương Quyền Thế giới & Châu Á',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCV SEA Games',
    photo: '/images/hua-van-huy.jpg',
  },
  {
    id: 'c-16',
    stt: 16,
    name: 'Nguyễn Ngọc Minh Hy',
    locality: 'TP. Hồ Chí Minh',
    role: 'VĐV Quyền Sáng tạo (Freestyle Poomsae)',
    highlight: 'HCV Quyền Thế giới 2024; HCV SEA Games 2019–2023',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCV Thế giới 2024',
    photo: '/images/nguyen-ngoc-minh-hy.jpg',
  },
  {
    id: 'c-17',
    stt: 17,
    name: 'Lê Trần Kim Uyên',
    locality: 'TP. Hồ Chí Minh',
    role: 'VĐV Quyền (Poomsae)',
    highlight: 'HCV SEA Games 31 (2022) & SEA Games 33 (2025); Huy chương Thế giới & Châu Á',
    group: 'ds2_champions',
    groupLabel: 'DS2 · HLV & VĐV Xuất sắc',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCV SEA Games 31 & 33',
    photo: '/images/le-tran-kim-uyen.jpg',
  },
  // DS3: TOP Hội đồng Kỹ thuật & Trọng tài Quốc gia
  {
    id: 't-1',
    stt: 1,
    name: 'Ngô Diệp',
    locality: 'TP. Hồ Chí Minh',
    role: 'Thành viên Hội đồng Kỹ thuật VTF',
    highlight: '7 Đẳng VTF; Cống hiến bền bỉ trong công tác chấm thi thăng đẳng và chuẩn hóa kỹ thuật',
    group: 'ds3_technical_referees',
    groupLabel: 'DS3 · HĐKT & Trọng tài Quốc gia',
    branch: 'Hệ B - Di sản',
    danOrLevel: '7 Đẳng · HĐKT VTF',
  },
  {
    id: 't-2',
    stt: 2,
    name: 'Nguyễn Hoàng Huy',
    locality: 'TP. Hồ Chí Minh',
    role: 'Thành viên Hội đồng Kỹ thuật VTF',
    highlight: '7 Đẳng VTF (Mã V-000002); Tham gia đào tạo, giám khảo thăng đẳng toàn quốc',
    group: 'ds3_technical_referees',
    groupLabel: 'DS3 · HĐKT & Trọng tài Quốc gia',
    branch: 'Hệ B - Di sản',
    danOrLevel: '7 Đẳng · HĐKT VTF',
  },
  {
    id: 't-3',
    stt: 3,
    name: 'Thiều Trọng Thanh Tâm',
    locality: 'TP. Hồ Chí Minh',
    role: 'Thành viên Hội đồng Kỹ thuật VTF',
    highlight: '7 Đẳng VTF; Chuyên gia đào tạo kỹ thuật và giám sát khảo thí cấp quốc gia',
    group: 'ds3_technical_referees',
    groupLabel: 'DS3 · HĐKT & Trọng tài Quốc gia',
    branch: 'Hệ B - Di sản',
    danOrLevel: '7 Đẳng · HĐKT VTF',
  },
  {
    id: 't-4',
    stt: 4,
    name: 'Bạch Văn Anh',
    locality: 'TP. Hồ Chí Minh',
    role: 'Thành viên Hội đồng Kỹ thuật VTF',
    highlight: '7 Đẳng VTF; Đóng góp lâu năm trong công tác chuyên môn và đào tạo',
    group: 'ds3_technical_referees',
    groupLabel: 'DS3 · HĐKT & Trọng tài Quốc gia',
    branch: 'Hệ B - Di sản',
    danOrLevel: '7 Đẳng · HĐKT VTF',
  },
  {
    id: 't-5',
    stt: 5,
    name: 'Ngô Thị Thùy Dung',
    locality: 'TP. Hồ Chí Minh',
    role: 'Thành viên Hội đồng Kỹ thuật VTF · Cựu Tuyển thủ Quyền',
    highlight: 'HCV Quyền Thế giới & SEA Games; Giảng viên chuyên môn Hội đồng Kỹ thuật VTF',
    group: 'ds3_technical_referees',
    groupLabel: 'DS3 · HĐKT & Trọng tài Quốc gia',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HĐKT VTF',
    photo: '/images/ngo-thi-thuy-dung.jpg',
  },
  {
    id: 't-6',
    stt: 6,
    name: 'Trần Trung Dũng',
    locality: 'Đà Nẵng',
    role: 'Thành viên Hội đồng Kỹ thuật VTF khu vực miền Trung',
    highlight: 'Phụ trách chuẩn hóa chuyên môn, khảo thí thăng đẳng khu vực miền Trung – Tây Nguyên',
    group: 'ds3_technical_referees',
    groupLabel: 'DS3 · HĐKT & Trọng tài Quốc gia',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'HĐKT VTF',
  },
  {
    id: 't-7',
    stt: 7,
    name: 'Lương Văn Liêm',
    locality: 'Đồng Tháp / Tiền Giang',
    role: 'Thành viên Hội đồng Kỹ thuật VTF',
    highlight: '7 Đẳng VTF; Phát triển phong trào và liên đoàn tại Đồng Tháp, Tiền Giang',
    group: 'ds3_technical_referees',
    groupLabel: 'DS3 · HĐKT & Trọng tài Quốc gia',
    branch: 'Hệ B - Di sản',
    danOrLevel: '7 Đẳng · HĐKT VTF',
  },
  {
    id: 't-8',
    stt: 8,
    name: 'Đỗ Thị Bích Hạnh',
    locality: 'Hà Nội',
    role: 'Thành viên HĐKT VTF · Cựu Tuyển thủ Quốc gia',
    highlight: 'HCĐ ASIAD 15 Doha 2006; đóng góp công tác chuyên môn và huấn luyện tại Hà Nội',
    group: 'ds3_technical_referees',
    groupLabel: 'DS3 · HĐKT & Trọng tài Quốc gia',
    branch: 'Hệ A - Đỉnh cao',
    danOrLevel: 'HCĐ ASIAD · HĐKT',
  },
  {
    id: 't-9',
    stt: 9,
    name: 'Nguyễn Tấn Sang & Châu Công Bình',
    locality: 'Vĩnh Long & Đồng Tháp',
    role: 'Trọng tài Quốc gia Cấp 1 tiêu biểu',
    highlight: 'Điều hành công tâm tại các kỳ Đại hội TDTT toàn quốc, Giải VĐQG và Cúp các CLB mạnh',
    group: 'ds3_technical_referees',
    groupLabel: 'DS3 · HĐKT & Trọng tài Quốc gia',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'Trọng tài Cấp 1 QG',
  },
  // DS4: TOP Võ sư, HLV Địa phương & CLB
  {
    id: 'l-1',
    stt: 1,
    name: 'Nguyễn Đăng Dũng',
    locality: 'Lâm Đồng',
    role: 'Võ sư · Lãnh đạo Hội Taekwondo tỉnh Lâm Đồng',
    highlight: 'Hơn nửa thế kỷ gắn bó (từ 1973), mở rộng CLB tới nông thôn và vùng đồng bào dân tộc',
    group: 'ds4_local_masters',
    groupLabel: 'DS4 · Võ sư & HLV Địa phương',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'Trên 30 năm Cống hiến',
  },
  {
    id: 'l-2',
    stt: 2,
    name: 'Võ Dũng Đức',
    locality: 'An Giang',
    role: 'Võ sư · Thành viên HĐKT VTF · Người mở lớp Châu Đốc & Long Xuyên',
    highlight: '6 Đẳng VTF; Giảng dạy từ 1974, xây dựng nền tảng đào tạo Taekwondo tỉnh An Giang',
    group: 'ds4_local_masters',
    groupLabel: 'DS4 · Võ sư & HLV Địa phương',
    branch: 'Hệ B - Di sản',
    danOrLevel: '6 Đẳng · Trên 30 năm',
  },
  {
    id: 'l-3',
    stt: 3,
    name: 'Nguyễn Thị Ngọc Ngân',
    locality: 'Biên Hòa, Đồng Nai',
    role: 'Võ sư · Lãnh đạo Hội / Liên đoàn Taekwondo Đồng Nai',
    highlight: 'Gần 45 năm đồng hành (mở lớp Quyết Thắng từ 1980), phát triển mạng lưới CLB & giải trẻ',
    group: 'ds4_local_masters',
    groupLabel: 'DS4 · Võ sư & HLV Địa phương',
    branch: 'Hệ B - Di sản',
    danOrLevel: '45 năm Cống hiến',
  },
  {
    id: 'l-4',
    stt: 4,
    name: 'Hà Thanh Sơn',
    locality: 'Sóc Trăng',
    role: 'Võ sư · Phụ trách Võ đường Nguyễn Trung Trực',
    highlight: 'Hơn 48 năm giữ lửa võ thuật tại Sóc Trăng, đào tạo nhiều thế hệ HLV kế cận',
    group: 'ds4_local_masters',
    groupLabel: 'DS4 · Võ sư & HLV Địa phương',
    branch: 'Hệ B - Di sản',
    danOrLevel: '48 năm Giữ lửa',
  },
  {
    id: 'l-5',
    stt: 5,
    name: 'Nguyễn Quốc Hùng',
    locality: 'Tánh Linh, Bình Thuận / Lâm Đồng',
    role: 'Võ sư · Thành viên HĐKT VTF',
    highlight: 'Người biến Tánh Linh thành "mỏ vàng" Taekwondo, đào tạo đội ngũ HLV phủ khắp các xã',
    group: 'ds4_local_masters',
    groupLabel: 'DS4 · Võ sư & HLV Địa phương',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'HĐKT VTF · 27 năm',
    photo: '/images/quoc-hung-tuyet-van.jpg',
  },
  {
    id: 'l-6',
    stt: 6,
    name: 'Trịnh Văn Hòa & Trương Sĩ Thống',
    locality: 'An Giang / Kiên Giang & Phú Yên / Đắk Lắk',
    role: 'Võ sư 7 Đẳng VTF · Lãnh đạo Phong trào Địa phương',
    highlight: 'Thầy dạy đầu tiên của Trần Hiếu Ngân (1987) và gây dựng phong trào Tây Nguyên, Tây Nam Bộ',
    group: 'ds4_local_masters',
    groupLabel: 'DS4 · Võ sư & HLV Địa phương',
    branch: 'Hệ B - Di sản',
    danOrLevel: '7 Đẳng VTF',
  },
  {
    id: 'l-7',
    stt: 7,
    name: 'Biện Phi Hùng & Đặng Minh Quí',
    locality: 'Đồng Nai & Bình Dương / TP.HCM',
    role: 'Võ sư 7 Đẳng VTF · Cán bộ Chuyên môn & Phong trào',
    highlight: 'Đóng góp nổi bật trong công tác tổ chức giải đấu và mở rộng CLB miền Đông Nam Bộ',
    group: 'ds4_local_masters',
    groupLabel: 'DS4 · Võ sư & HLV Địa phương',
    branch: 'Hệ B - Di sản',
    danOrLevel: '7 Đẳng VTF',
  },
  {
    id: 'l-8',
    stt: 8,
    name: 'Vũ Thái Hùng & Trần Minh Tuấn',
    locality: 'Thái Nguyên & Hà Nội',
    role: 'Võ sư, HLV & Phụ trách TKD Cung Thiếu nhi Hà Nội',
    highlight: 'Phát triển mạnh mẽ phong trào Taekwondo học đường, thiếu nhi khu vực phía Bắc',
    group: 'ds4_local_masters',
    groupLabel: 'DS4 · Võ sư & HLV Địa phương',
    branch: 'Hệ B - Di sản',
    danOrLevel: 'Võ sư Phong trào',
  },
];

export const GALA_PROGRAM_CHAPTERS: GalaChapter[] = [
  {
    time: '16:30 – 17:15',
    chapterCode: 'TIỀN SẢNH',
    title: 'Hành Lang Di Sản & Check-in Định Danh Số VTF_TID',
    subtitle: 'Triển lãm 30 Pa-nô Lịch sử · Trưng bày Kỷ yếu Bản Vàng & Đai Chủ tịch President Edition',
    details: [
      'Đại biểu quét mã QR từ cơ sở dữ liệu VTF_TID nhận "Thẻ hành trình" in tên, năm bắt đầu tập và đẳng cấp cá nhân',
      'Trải nghiệm triển lãm 30 pa-nô xuyên suốt (Khởi nguyên – Thành lập – Sydney 2000 – Poomsae – Số hóa – Thế hệ mới)',
      'Ký tên lưu niệm trên bức tường lịch sử "30 Năm – 1 Mái Nhà Taekwondo Việt Nam"',
    ],
    performer: 'Ban Tổ chức & Văn phòng VTF',
  },
  {
    time: '17:15 – 17:55',
    chapterCode: 'MỞ MÀN & CHƯƠNG I',
    title: 'Nhịp Tim Võ Đạo & Khởi Nguyên "Người Gieo Lửa"',
    subtitle: 'Mapping 3D 1978–2026 · Công phá 30 tấm ván · Nghi thức "Chiếc Ghế Danh Dự"',
    details: [
      'Đội biểu diễn Quốc gia công phá 30 tấm ván in số năm (1996–2026), tấm cuối lộ biểu trưng "VTF 30"',
      'Nghi thức xúc động "Chiếc ghế danh dự": Ghế trống phủ võ phục và đai đẳng tưởng nhớ các cố võ sư tiền bối đã khuất (Khúc Văn Bón, Trần Đình Cải, Nguyễn Công Vinh...), thân nhân lên nhận Kỷ niệm chương tri ân',
      'Tri ân các đơn vị sáng lập tham dự Đại hội lần thứ I năm 1996',
    ],
    performer: 'Đội biểu diễn QG & Ban Khen thưởng',
  },
  {
    time: '18:05 – 18:40',
    chapterCode: 'CHƯƠNG II',
    title: 'Vinh Quang – "Khoảnh Khắc Sydney 2000"',
    subtitle: 'Tái hiện bục huy chương Olympic lịch sử & Phim tài liệu "VTF – 30 Years Forward"',
    details: [
      'Ánh sáng sân đấu và âm thanh tường thuật gốc năm 2000 vang lên; huyền thoại Trần Hiếu Ngân cùng Ban huấn luyện năm 2000 bước ra sân khấu',
      'Công chiếu phim tài liệu 6 phút song ngữ Việt – Anh "VTF – 30 Years Forward" và vinh danh "Thế hệ mở đường" (ASIAD, Thế giới, SEA Games)',
      'Thông điệp chúc mừng từ Lãnh đạo Bộ VHTTDL, Cục TDTT Việt Nam, Chủ tịch WT và ATU',
    ],
    performer: 'Trần Hiếu Ngân, Ban Chuyên môn & Ban Đối ngoại',
  },
  {
    time: '18:40 – 19:35',
    chapterCode: 'CHƯƠNG III & IV',
    title: 'Đại Sảnh Danh Vọng (Class of 2026) & Kế Thừa "34 Ngọn Lửa"',
    subtitle: 'Ra mắt Vietnam Taekwondo Hall of Fame · Bản đồ ánh sáng 34 Tỉnh/Thành/Ngành',
    details: [
      'Xướng tên 10–12 nhân vật lứa đầu tiên vào Đại sảnh Danh vọng (Class of 2026): Đặt tay lên bảng cảm biến thắp sáng "Bức tường Huyền thoại", trao tấm đồng đúc "Dấu chân Huyền thoại" và Đai Hall of Fame đen viền vàng',
      'Đại diện 34 tỉnh, thành phố, ngành cầm đèn lồng xếp thành bản đồ Việt Nam rực sáng trên sàn LED',
      'Vinh danh độc lập Hệ A (Thành tích đỉnh cao) và Hệ B (Cống hiến di sản) Hạng Đặc Biệt theo Bản tiêu chí 036/VTF',
    ],
    performer: 'Hội đồng Hall of Fame & Đại diện 34 Tỉnh/Thành',
  },
  {
    time: '19:35 – 21:30',
    chapterCode: 'CAO TRÀO & CHƯƠNG V',
    title: 'Nghi Thức Truyền Lửa 5 Thế Hệ & Tuyên Ngôn Olympic 2028',
    subtitle: 'Tiết mục Võ nhạc "Hóa Rồng" · Đấu giá Kỷ yếu Bản Vàng · Hộp thời gian 2046',
    details: [
      'Ngọn đuốc Võ đạo truyền qua 5 thế hệ: Thế hệ Sáng lập → Trần Hiếu Ngân (Olympic 2000) → Châu Tuyết Vân (Poomsae TG) → Vô địch SEA Games 33 → VĐV giành vé Olympic trẻ Dakar 2026 & 30 võ sinh nhí thắp sáng Đài lửa 30 năm',
      'Chủ tịch VTF Trương Ngọc Để công bố Tuyên ngôn Los Angeles 2028 – ASIAD 2030; trao "Đai Chủ tịch – President Edition" cho lãnh đạo WT, ATU, Kukkiwon, CJ',
      'Niêm phong "Hộp thời gian 2046" (mở tại Lễ kỷ niệm 50 năm) & Đấu giá 10 cuốn Kỷ yếu Bản Vàng gây Quỹ Ngọn lửa Olympic',
    ],
    performer: 'Thường trực VTF, Đội tuyển Quyền & Toàn thể Đại biểu',
  },
];

export const YEARBOOK_STRUCTURE: YearbookPart[] = [
  {
    partNumber: 'Phần I',
    title: 'Thông Điệp 30 Năm & Tầm Nhìn Chiến Lược',
    pages: 'Trang 01 – 08',
    summary: 'Lời ngỏ của Chủ tịch VTF Đại võ sư Trương Ngọc Để cùng Thư chúc mừng từ World Taekwondo, ATU, Ủy ban Olympic VN và Cục TDTT Việt Nam.',
    keyTopics: ['Lời ngỏ Chủ tịch Trương Ngọc Để', 'Thư chúc mừng Chủ tịch WT & ATU', 'Thư chúc mừng Cục trưởng Cục TDTT Nguyễn Danh Hoàng Việt'],
  },
  {
    partNumber: 'Phần II & III',
    title: 'Khởi Nguyên Phong Trào & Thế Hệ Xây Nền (1962 – 1995)',
    pages: 'Trang 09 – 30',
    summary: 'Khắc họa những võ đường đầu tiên, chân dung cố võ sư Khúc Văn Bón, Nguyễn Long Vân, Nguyễn Quốc Tâm, cái nôi TP.HCM và thế hệ VĐV mở đường Trần Quang Hạ, Hồ Nhất Thống.',
    keyTopics: ['Cố võ sư Khúc Văn Bón & Nguyễn Long Vân', 'TP.HCM – Chiếc nôi Taekwondo Việt Nam', 'SEA Games 1991 & ASIAD 1994, 1998'],
  },
  {
    partNumber: 'Phần IV',
    title: 'Con Đường Olympic – Sydney 2000 & Khát Vọng Mới',
    pages: 'Trang 31 – 40',
    summary: 'Tái hiện toàn cảnh tấm HCB Olympic Sydney 2000 lịch sử của Trần Hiếu Ngân, những người thầy phía sau vinh quang và phân tích chiến lược trở lại Thế vận hội 2028–2032.',
    keyTopics: ['Chân dung Trần Hiếu Ngân Sydney 2000', 'Những người phía sau tấm HCB lịch sử', 'Giải bài toán trở lại Olympic LA 2028'],
  },
  {
    partNumber: 'Phần V & VI',
    title: '30 Năm VTF & Cuộc Cách Mạng Liên Đoàn Điện Tử 4.0',
    pages: 'Trang 41 – 60',
    summary: 'Biên niên sử 6 nhiệm kỳ VTF qua các đời Chủ tịch Đặng Quốc Tiến, Hà Văn Dũng, Trương Ngọc Để và vai trò của Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon) trong chuyển đổi số GMS/GAL.',
    keyTopics: ['Quyết định 358/TTg & 6 kỳ Đại hội VTF', '30 Năm – 30 Dấu mốc lịch sử', 'Hệ sinh thái Dữ liệu số >400.000 hội viên'],
  },
  {
    partNumber: 'Phần VII & VIII',
    title: 'Đỉnh Cao Poomsae, Trọng Tài Quốc Tế & Những Người Bạn Lớn',
    pages: 'Trang 61 – 76',
    summary: 'Chiến lược đưa Poomsae Việt Nam vươn tầm Top 4 Thế giới, chuẩn hóa Trọng tài Quốc tế và vinh danh TS. Chungwon Choue, GS. Lee Kyu-seok, Kukkiwon, Tập đoàn CJ.',
    keyTopics: ['Thế hệ vàng Poomsae Châu Tuyết Vân', 'Hội đồng Kỹ thuật & Trọng tài Quốc tế', 'Hợp tác chiến lược Kukkiwon & CJ Group'],
  },
  {
    partNumber: 'Phần IX, X & XI',
    title: 'Bản Đồ 34 Tỉnh Thành Thời Kỳ Mới & Thế Hệ Kế Thừa',
    pages: 'Trang 77 – 100',
    summary: 'Toàn cảnh phong trào 34 tỉnh, thành phố sau sắp xếp hành chính, mô hình Học đường – Quân đội – Công an, Danh bạ Võ sư 5+ Đẳng và lứa VĐV trẻ hướng tới Olympic.',
    keyTopics: ['34 Địa phương – 34 Câu chuyện Taekwondo', 'Danh mục Võ sư Cao cấp, HLV, Trọng tài', '50 Bản Vàng Giới hạn có chữ ký VIP Quốc tế'],
  },
];

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: 'gal-1',
    src: '/images/chungju-2019-team.jpg',
    title: 'Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon) Cùng Đội Tuyển Quyền Vô Địch Tại Hàn Quốc',
    caption: 'Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon) cùng Châu Tuyết Vân, Nguyễn Thị Lệ Kim, Liên Thị Tuyết Mai giành HCV tại 2019 Chungju World Martial Arts Masterships.',
    category: 'poomsae',
    year: '2019',
  },
  {
    id: 'gal-2',
    src: '/images/bac-thi-khiem-asian2024.jpg',
    title: 'Bạc Thị Khiêm Giương Cao Quốc Kỳ Tại Giải Vô Địch Châu Á 2024',
    caption: 'Tuyển thủ đối kháng Bạc Thị Khiêm xuất sắc giành Huy chương Vàng hạng cân −67kg nữ tại Giải Vô địch Taekwondo Châu Á 2024 tổ chức tại Đà Nẵng, Việt Nam.',
    category: 'kyorugi',
    year: '2024',
  },
  {
    id: 'gal-3',
    src: '/images/chau-tuyet-van-portrait.jpg',
    title: 'Châu Tuyết Vân Bên Huân Chương Lao Động & Bộ Sưu Tập HCV Thế Giới',
    caption: '"Cô gái vàng" của Poomsae Việt Nam với 10 HCV Thế giới và 6 HCV SEA Games liên tiếp – nguồn cảm hứng lớn cho thế hệ trẻ.',
    category: 'poomsae',
    year: '2024',
  },
  {
    id: 'gal-4',
    src: '/images/nguyen-thien-phung-world2024.jpg',
    title: 'Nguyễn Thiên Phụng Đăng Quang Giải Vô Địch Quyền Thế Giới Hong Kong',
    caption: 'Kiện tướng Nguyễn Thiên Phụng khoác Quốc kỳ Việt Nam trên bục nhận Huy chương Vàng Giải Vô địch Quyền Taekwondo Thế giới.',
    category: 'poomsae',
    year: '2024',
  },
  {
    id: 'gal-5',
    src: '/images/bac-thi-khiem-seagames33.jpg',
    title: 'Chiến Thắng Vang Dội Tại SEA Games 33 (Thailand 2025)',
    caption: 'Bạc Thị Khiêm giành Huy chương Vàng đối kháng hạng cân −73kg nữ tại SEA Games 33, khẳng định sự trở lại mạnh mẽ của Kyorugi Việt Nam.',
    category: 'kyorugi',
    year: '2025',
  },
  {
    id: 'gal-6',
    src: '/images/kimha-lekim-atu.jpg',
    title: 'Nguyễn Thị Lệ Kim & Kim Hà Tỏa Sáng Trên Đấu Trường Châu Á',
    caption: 'Hai nữ tuyển thủ Quyền Việt Nam rạng rỡ bên lá cờ đỏ sao vàng và tấm huy chương Giải Vô địch Taekwondo Châu Á (ATU).',
    category: 'poomsae',
    year: '2022–2024',
  },
  {
    id: 'gal-7',
    src: '/images/chau-tuyet-van-training.jpg',
    title: 'Truyền Nghề Trên Thảm Tập: Khắt Khe Từng Milimet Kỹ Thuật',
    caption: 'Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon) trực tiếp chỉnh sửa biên độ đòn đá cao cho Châu Tuyết Vân trong quá trình chuẩn bị giải quốc tế.',
    category: 'heritage',
    year: 'Tư liệu HL',
  },
  {
    id: 'gal-8',
    src: '/images/kyorugi-cj-2026-kick.jpg',
    title: 'Sức Trẻ Tại Giải Vô Địch Taekwondo Trẻ Quốc Gia – Cúp CJ 2026',
    caption: 'Đòn đá tầm cao đẹp mắt với hệ thống giáp điện tử hiện đại tại Giải Trẻ Quốc gia CJ 2026 – cái nôi ươm mầm cho Olympic 2028–2032.',
    category: 'kyorugi',
    year: '2026',
  },
  {
    id: 'gal-9',
    src: '/images/archive-2002-quangtri.jpg',
    title: 'Tư Liệu Lịch Sử: Chủ Tịch Trương Ngọc Để Cùng Phong Trào Cơ Sở (2002)',
    caption: 'Bức ảnh tư liệu quý tại Giải Vô địch Taekwondo tỉnh Quảng Trị năm 2002 – minh chứng cho sự gắn bó sâu sát của lãnh đạo VTF với phong trào địa phương.',
    category: 'heritage',
    year: '2002',
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    category: 'Xét Khen Thưởng 036/VTF',
    question: 'Tại sao Hệ thống Vinh danh 30 năm VTF lại tách riêng Hệ A (Thành tích đỉnh cao) và Hệ B (Cống hiến di sản)?',
    answer:
      'Theo Bản tiêu chí số 036/VTF (ngày 04/04/2026), việc tách độc lập Hệ A và Hệ B giúp giải quyết triệt để bài toán công bằng lịch sử: Những võ sư, HLV cơ sở dành 20–40 năm xây dựng phong trào địa phương (Hệ B) không bị so sánh chéo với các VĐV/HLV giành huy chương Olympic, ASIAD, Thế giới, SEA Games (Hệ A). Cả hai hệ đều là trụ cột sống còn và đều được vinh danh trang trọng ở cấp Quốc gia theo 4 hạng: Đặc biệt (90–100đ), Xuất sắc (75–89đ), Tiêu biểu (60–74đ) và Ghi nhận (50–59đ).',
  },
  {
    category: 'Hồ Sơ & Thời Hạn',
    question: 'Thời gian cống hiến trong Hệ B được tính liên tục hay cộng dồn? Cần những minh chứng gì?',
    answer:
      'Thời gian đóng góp được tính CỘNG DỒN CÓ XÁC MINH (tối thiểu 05 năm ở tầng điều kiện nền), không bắt buộc liên tục tuyệt đối. Tuy nhiên, VTF quy định tuyệt đối không tính thông tin "truyền miệng" và không gộp năm bắt đầu tập võ thành năm cống hiến. Hồ sơ phải kèm Quyết định bổ nhiệm, Giấy chứng nhận đẳng cấp/thành tích, hoặc Văn bản xác nhận của Liên đoàn/Hội/Sở VHTTDL địa phương. Hạn chót gửi về Văn phòng VTF là trước ngày 30/10/2026.',
  },
  {
    category: 'Kỷ Yếu 34 Tỉnh Thành',
    question: 'Các Liên đoàn/Bộ môn địa phương gửi bài viết và ảnh phục vụ Kỷ yếu 30 năm theo quy chuẩn nào?',
    answer:
      'Theo Công văn số 128/VTF-VP ngày 08/08/2026, mỗi địa phương chuẩn bị 01 bài viết (300–500 chữ) nêu rõ lịch sử hình thành, quy mô CLB/võ sinh hiện nay, thành tích, cá nhân tiêu biểu và định hướng sau sắp xếp đơn vị hành chính (34 tỉnh/thành), kèm 05–10 ảnh gốc độ phân giải cao (không chèn chữ/khung). Hạn gửi trước ngày 10/09/2026 qua đầu mối Ban Truyền thông VTF: Bà Nguyễn Thị Anh Thư (SĐT: 0909 576 776 – Email: tkdvn1996@gmail.com).',
  },
  {
    category: 'Sự Kiện & Đại Sảnh Danh Vọng',
    question: 'Vietnam Taekwondo Hall of Fame (Class of 2026) có ý nghĩa gì và được xét chọn ra sao?',
    answer:
      'Lần đầu tiên trong lịch sử 30 năm, VTF thiết lập Đại sảnh Danh vọng (Vietnam Taekwondo Hall of Fame) theo mô hình của World Taekwondo. Lứa đầu tiên (Class of 2026) chỉ chọn lọc khắt khe 10–12 nhân vật kiệt xuất thuộc 5 hạng mục (Cống hiến trọn đời, Lãnh đạo quản lý, Huấn luyện viên, Vận động viên, Bạn bè quốc tế) đạt từ 90 điểm trở lên và ≥70% phiếu bầu kín của Hội đồng. Người được vinh danh sẽ in dấu trên Bức tường Huyền thoại tại trụ sở VTF (219 Lý Thường Kiệt, TP.HCM) và nhận biểu tượng đồng "Dấu chân Huyền thoại".',
  },
  {
    category: 'Quỹ Ngọn Lửa Olympic',
    question: 'Làm thế nào để các doanh nghiệp, mạnh thường quân đặt mua hoặc đấu giá Kỷ yếu Bản Vàng giới hạn 50 cuốn?',
    answer:
      'VTF phát hành giới hạn 50 cuốn Đặc san Kỷ yếu 30 năm phiên bản Bìa Vàng ép kim, đánh số thứ tự từ 01 đến 50, có chữ ký trực tiếp của Chủ tịch WT Chungwon Choue, Chủ tịch ATU Lee Kyu-seok và Chủ tịch VTF Trương Ngọc Để. 10 bản đặc biệt sẽ được đấu giá tại Đêm Gala 19/12/2026 nhằm gây "Quỹ Ngọn lửa Olympic" tài trợ trực tiếp cho các VĐV trẻ tài năng tập huấn hướng tới Olympic Los Angeles 2028 và Brisbane 2032.',
  },
];

export const INITIAL_SUBMISSIONS: SubmissionRecord[] = [
  {
    id: 'sub-001',
    createdAt: '04/11/2026 09:15',
    fullName: 'Võ sư Nguyễn Đăng Dũng',
    phone: '0913456789',
    email: 'tkd.lamdong@vtf.org.vn',
    organization: 'Hội Taekwondo tỉnh Lâm Đồng',
    submissionType: 'nomination_b',
    submissionTypeLabel: 'Đề cử Hệ B – Cống hiến Di sản (036/VTF)',
    yearsContributed: 35,
    estimatedScore: 95,
    estimatedRank: 'HẠNG ĐẶC BIỆT (90–100đ)',
    messageOrAchievement: 'Hồ sơ minh chứng quá trình giảng dạy từ 1973, thành lập Hội TKD Lâm Đồng và phát triển mạng lưới CLB vùng sâu vùng xa.',
  },
  {
    id: 'sub-002',
    createdAt: '04/11/2026 10:30',
    fullName: 'Kiện tướng Bạc Thị Khiêm',
    phone: '0987654321',
    email: 'bacthikhiem.tkd@gmail.com',
    organization: 'Đội tuyển Taekwondo Quốc gia / Sơn La',
    submissionType: 'nomination_a',
    submissionTypeLabel: 'Đề cử Hệ A – Thành tích Đỉnh cao (036/VTF)',
    yearsContributed: 12,
    estimatedScore: 85,
    estimatedRank: 'HẠNG XUẤT SẮC (75–89đ)',
    messageOrAchievement: 'HCV Châu Á 2024 tại Đà Nẵng, HCĐ ASIAD 19 Hàng Châu 2023, HCV SEA Games 30 (2019) và SEA Games 33 (2025).',
  },
  {
    id: 'sub-003',
    createdAt: '04/11/2026 14:20',
    fullName: 'Ông Nguyễn Mạnh Hùng',
    phone: '0904112233',
    email: 'liendoantkdhanoi@gmail.com',
    organization: 'Liên đoàn Taekwondo TP. Hà Nội',
    submissionType: 'yearbook_34_provinces',
    submissionTypeLabel: 'Gửi Bài viết & Ảnh Kỷ yếu 34 Tỉnh/Thành (CV 128)',
    yearsContributed: 31,
    messageOrAchievement: 'Báo cáo 500 chữ và bộ 10 ảnh tư liệu độ phân giải cao: Mạng lưới 98 điểm tập, 68 CLB và 12.000 võ sinh Thủ đô Hà Nội.',
  },
];
