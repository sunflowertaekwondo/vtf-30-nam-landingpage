import test from 'node:test';
import assert from 'node:assert/strict';
import { tinhDiem, kiemTraDauVao, hangTheoDiem, LUA_CHON, HANG } from '../src/lib/diem036.js';

// Bản sao NGUYÊN VĂN công thức cũ trong src/components/InteractiveBoosters.tsx (trước khi tách ra dùng chung),
// để chứng minh việc tách không làm đổi kết quả ở bất kỳ tổ hợp lựa chọn nào.
const cuA = (aAxis1Medal, aAxis2Accumulated, aYears, aAxis4Training, aAxis4Management) => {
  const aAxis3Score = aYears >= 15 ? 15 : aYears >= 10 ? 10 : 5;
  const aAxis4Score = Math.min(15, aAxis4Training + aAxis4Management);
  return { truc: [aAxis1Medal, aAxis2Accumulated, aAxis3Score, aAxis4Score], tong: Math.min(100, aAxis1Medal + aAxis2Accumulated + aAxis3Score + aAxis4Score) };
};
const cuB = (bYears, bAxis2Club, bAxis2System, bAxis3Athletes, bAxis3Coaches, bRole1, bRole2) => {
  const bAxis1Score = bYears >= 30 ? 30 : bYears >= 20 ? 25 : bYears >= 10 ? 15 : 10;
  const bAxis2Score = Math.min(30, bAxis2Club + bAxis2System);
  const bAxis3Score = Math.min(20, bAxis3Athletes + bAxis3Coaches);
  const bAxis4Score = Math.min(20, bRole1 + bRole2);
  return { truc: [bAxis1Score, bAxis2Score, bAxis3Score, bAxis4Score], tong: Math.min(100, bAxis1Score + bAxis2Score + bAxis3Score + bAxis4Score) };
};
const cuHang = (score) => (score >= 90 ? 'dac-biet' : score >= 75 ? 'xuat-sac' : score >= 60 ? 'tieu-bieu' : score >= 50 ? 'ghi-nhan' : 'chua-dat');

test('Hệ A: mọi tổ hợp lựa chọn cho đúng điểm 4 trục, tổng và hạng như công thức cũ', () => {
  let n = 0;
  for (const medal of LUA_CHON.A.medal) for (const accumulated of LUA_CHON.A.accumulated)
    for (let years = 5; years <= 35; years++) for (const training of LUA_CHON.A.training) for (const management of LUA_CHON.A.management) {
      const moi = tinhDiem({ he: 'A', medal, accumulated, years, training, management });
      const cu = cuA(medal, accumulated, years, training, management);
      assert.deepEqual(moi.truc, cu.truc);
      assert.equal(moi.tong, cu.tong);
      assert.equal(moi.hang.ma, cuHang(cu.tong));
      n++;
    }
  assert.equal(n, 5 * 4 * 31 * 4 * 3);
});

test('Hệ B: mọi tổ hợp lựa chọn cho đúng điểm 4 trục, tổng và hạng như công thức cũ', () => {
  let n = 0;
  for (let years = 5; years <= 50; years++) for (const club of LUA_CHON.B.club) for (const system of LUA_CHON.B.system)
    for (const athletes of LUA_CHON.B.athletes) for (const coaches of LUA_CHON.B.coaches)
      for (const role1 of LUA_CHON.B.role1) for (const role2 of LUA_CHON.B.role2) {
        const moi = tinhDiem({ he: 'B', years, club, system, athletes, coaches, role1, role2 });
        const cu = cuB(years, club, system, athletes, coaches, role1, role2);
        assert.deepEqual(moi.truc, cu.truc);
        assert.equal(moi.tong, cu.tong);
        assert.equal(moi.hang.ma, cuHang(cu.tong));
        n++;
      }
  assert.equal(n, 46 * 4 * 3 * 4 * 3 * 4 * 4);
});

test('Điểm tối đa của mỗi hệ là 100 và không bao giờ vượt 100', () => {
  assert.equal(tinhDiem({ he: 'A', medal: 50, accumulated: 20, years: 35, training: 10, management: 5 }).tong, 100);
  assert.equal(tinhDiem({ he: 'B', years: 50, club: 20, system: 10, athletes: 10, coaches: 10, role1: 20, role2: 15 }).tong, 100);
});

test('Ngưỡng hạng: 90, 75, 60, 50 đúng biên', () => {
  const cac = [[100, 'dac-biet'], [90, 'dac-biet'], [89, 'xuat-sac'], [75, 'xuat-sac'], [74, 'tieu-bieu'], [60, 'tieu-bieu'], [59, 'ghi-nhan'], [50, 'ghi-nhan'], [49, 'chua-dat'], [0, 'chua-dat']];
  for (const [d, ma] of cac) assert.equal(hangTheoDiem(d).ma, ma, `điểm ${d}`);
  assert.equal(HANG['dac-biet'].tieuDe, 'HẠNG ĐẶC BIỆT (90 – 100 điểm)');
});

test('Kiểm tra đầu vào: chấp nhận dữ liệu hợp lệ và chỉ giữ các khóa đã biết', () => {
  const r = kiemTraDauVao({ he: 'A', medal: 45, accumulated: 20, years: 18, training: 10, management: 5, nguy_hiem: 'x', __proto__: { y: 1 } });
  assert.equal(r.ok, true);
  assert.deepEqual(Object.keys(r.giaTri).sort(), ['accumulated', 'he', 'management', 'medal', 'training', 'years']);
  const b = kiemTraDauVao({ he: 'B', years: 30, club: 20, system: 10, athletes: 10, coaches: 10, role1: 15, role2: 5 });
  assert.equal(b.ok, true);
  assert.equal(tinhDiem(b.giaTri).tong, 30 + 30 + 20 + 20);
});

test('Kiểm tra đầu vào: từ chối giá trị ngoài danh sách, kiểu sai, thiếu khóa, số năm vô lý', () => {
  const tot = { he: 'A', medal: 45, accumulated: 20, years: 18, training: 10, management: 5 };
  const xau = [
    null, undefined, 'A', [], {}, { he: 'C' },
    { ...tot, medal: 99 }, { ...tot, medal: '45' }, { ...tot, medal: 45.5 }, { ...tot, accumulated: 17 },
    { ...tot, years: -1 }, { ...tot, years: 81 }, { ...tot, years: 1.5 }, { ...tot, years: 'abc' }, { ...tot, management: NaN },
    { he: 'A', medal: 45 }, { he: 'B', years: 10, club: 20, system: 0, athletes: 10, coaches: 10, role1: 15, role2: 5 },
    { he: 'B', years: 10, club: 20, system: 10, athletes: 10, coaches: 10, role1: 25, role2: 5 },
  ];
  for (const v of xau) {
    const r = kiemTraDauVao(v);
    assert.equal(r.ok, false, JSON.stringify(v));
    assert.ok(r.loi.length >= 1 && r.loi.every((m) => typeof m === 'string' && m.length > 5));
  }
});
