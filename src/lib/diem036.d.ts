export interface DauVaoHeA {
  he: 'A';
  /** Trục 1: mức thành tích cao nhất (50, 45, 40, 35 hoặc 30 điểm) */
  medal: number;
  /** Trục 2: thành tích tích lũy (20, 15, 10 hoặc 0) */
  accumulated: number;
  /** Trục 3: số năm tham gia thi đấu, huấn luyện */
  years: number;
  /** Trục 4: đào tạo và phát triển lực lượng (10, 7, 5 hoặc 0) */
  training: number;
  /** Trục 4: công tác chuyên môn và quản lý (5, 3 hoặc 0) */
  management: number;
}

export interface DauVaoHeB {
  he: 'B';
  /** Trục 1: số năm cống hiến cộng dồn */
  years: number;
  /** Trục 2: quy mô CLB (20, 15, 10 hoặc 0) */
  club: number;
  /** Trục 2: phát triển hệ thống địa phương (10, 7 hoặc 5) */
  system: number;
  /** Trục 3: đào tạo VĐV (10, 8, 5 hoặc 0) */
  athletes: number;
  /** Trục 3: đào tạo HLV và trọng tài (10, 7 hoặc 5) */
  coaches: number;
  /** Trục 4: vai trò thứ nhất (20, 15, 10 hoặc 5) */
  role1: number;
  /** Trục 4: vai trò thứ hai (15, 10, 5 hoặc 0) */
  role2: number;
}

export type DauVao = DauVaoHeA | DauVaoHeB;

export type MaHang = 'dac-biet' | 'xuat-sac' | 'tieu-bieu' | 'ghi-nhan' | 'chua-dat';

export interface ThongTinHang {
  ma: MaHang;
  tieuDe: string;
  ngan: string;
  tu: number;
}

export interface KetQuaDiem {
  he: 'A' | 'B';
  /** Điểm 4 trục theo thứ tự Trục 1 đến Trục 4 */
  truc: [number, number, number, number];
  tong: number;
  hang: ThongTinHang;
}

export const LUA_CHON: {
  A: Record<'medal' | 'accumulated' | 'training' | 'management', number[]>;
  B: Record<'club' | 'system' | 'athletes' | 'coaches' | 'role1' | 'role2', number[]>;
};
export const SO_NAM: { min: number; max: number };
export const HANG: Record<MaHang, ThongTinHang>;
export function hangTheoDiem(diem: number): ThongTinHang;
export function tinhDiem(dauVao: DauVao): KetQuaDiem;
export function kiemTraDauVao(raw: unknown): { ok: true; giaTri: DauVao } | { ok: false; loi: string[] };
