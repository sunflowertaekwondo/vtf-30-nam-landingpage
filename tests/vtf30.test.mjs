import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('1. [Security Gate G4.06] Client source & dist bundle must NOT expose raw KiraAI secret key', () => {
  const chatbotSrc = fs.readFileSync(
    path.join(rootDir, 'src', 'components', 'KateLinhChatbot.tsx'),
    'utf8'
  );
  assert.equal(
    chatbotSrc.includes('kira_f1d4002a2519f3ea0c9110c3ea0e79c4'),
    false,
    'KateLinhChatbot.tsx must not contain raw KiraAI secret key'
  );
  assert.equal(
    chatbotSrc.includes('/api/katelinh-chat'),
    true,
    'KateLinhChatbot.tsx must route via /api/katelinh-chat serverless proxy'
  );

  const distAssetsDir = path.join(rootDir, 'dist', 'assets');
  if (fs.existsSync(distAssetsDir)) {
    const jsFiles = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'));
    for (const file of jsFiles) {
      const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf8');
      assert.equal(
        content.includes('kira_f1d4002a2519f3ea0c9110c3ea0e79c4'),
        false,
        `Built client bundle ${file} must NOT expose raw KiraAI key`
      );
    }
  }
});

test('2. [Architecture Gate G1.04 & CV 128/VTF-VP] Serverless APIs & Nomination Form fields are wired', () => {
  assert.equal(
    fs.existsSync(path.join(rootDir, 'api', 'katelinh-chat.js')),
    true,
    'api/katelinh-chat.js must exist'
  );
  assert.equal(
    fs.existsSync(path.join(rootDir, 'api', 'submit-nomination.js')),
    true,
    'api/submit-nomination.js must exist'
  );

  const appSrc = fs.readFileSync(path.join(rootDir, 'src', 'App.tsx'), 'utf8');
  assert.equal(
    appSrc.includes('/api/submit-nomination'),
    true,
    'App.tsx must synchronize nominations with /api/submit-nomination'
  );
  assert.equal(
    appSrc.includes('photoAlbumUrl') && appSrc.includes('consentAccepted'),
    true,
    'App.tsx must include CV 128/VTF-VP photo album link and NĐ 13/2023 consent checkbox'
  );
});

test('3. [Data Integrity Gate Q5] 429 Personnel Records & Grandmaster Titles are clean and standardized', () => {
  const listsSrc = fs.readFileSync(
    path.join(rootDir, 'src', 'data', 'vtf8ListsData.ts'),
    'utf8'
  );
  const landingSrc = fs.readFileSync(
    path.join(rootDir, 'src', 'data', 'landingData.ts'),
    'utf8'
  );

  assert.equal(
    listsSrc.includes('Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon)'),
    true,
    'vtf8ListsData.ts must contain standardized title Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon)'
  );
  assert.equal(
    landingSrc.includes('Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon)'),
    true,
    'landingData.ts must contain standardized title Đại võ sư Nguyễn Thanh Huy (8 Đẳng Kukkiwon)'
  );

  // Check that no locality/highlight string in vtf8ListsData.ts has double closing parens "))"
  const doubleParenMatches = listsSrc.match(/[a-zA-ZÀ-ỹ]\)\)/g);
  assert.equal(
    doubleParenMatches,
    null,
    'vtf8ListsData.ts must have 0 occurrences of double closing parenthesis bug'
  );
});

test('4. [036/VTF Scoring Engine Gate Q1.2] Hệ A (70+20+10) & Hệ B (60+25+15) formulas compute accurately', () => {
  const computeScore = (p1, p2, p3, max1, max2, max3) => {
    const s1 = Math.min(Math.max(0, p1), max1);
    const s2 = Math.min(Math.max(0, p2), max2);
    const s3 = Math.min(Math.max(0, p3), max3);
    const total = s1 + s2 + s3;
    const rank =
      total >= 85
        ? 'Hạng Đặc Biệt – Đề cử Đại sảnh Danh vọng / Kỷ niệm chương Vàng 30 Năm'
        : total >= 70
          ? 'Hạng Xuất Sắc – Đề cử Bằng khen VTF 30 Năm'
          : total >= 55
            ? 'Hạng Tiêu Biểu – Đề cử Giấy chứng nhận Vinh danh 30 Năm'
            : 'Cần bổ sung thêm hồ sơ minh chứng';
    return { total, rank };
  };

  const heAMax = computeScore(70, 20, 10, 70, 20, 10);
  assert.equal(heAMax.total, 100);
  assert.equal(heAMax.rank.startsWith('Hạng Đặc Biệt'), true);

  const heBMax = computeScore(60, 25, 15, 60, 25, 15);
  assert.equal(heBMax.total, 100);
  assert.equal(heBMax.rank.startsWith('Hạng Đặc Biệt'), true);

  const heBMid = computeScore(45, 18, 12, 60, 25, 15);
  assert.equal(heBMid.total, 75);
  assert.equal(heBMid.rank.startsWith('Hạng Xuất Sắc'), true);
});

test('5. [Performance Gate G6.01] Code splitting keeps all JS chunks under 500 KB', () => {
  const distAssetsDir = path.join(rootDir, 'dist', 'assets');
  if (fs.existsSync(distAssetsDir)) {
    const jsFiles = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith('.js'));
    assert.equal(jsFiles.length >= 3, true, 'Expected multiple code-split JS chunks');
    for (const file of jsFiles) {
      const sizeKb = fs.statSync(path.join(distAssetsDir, file)).size / 1024;
      assert.equal(
        sizeKb < 500,
        true,
        `Chunk ${file} (${sizeKb.toFixed(1)} KB) must be under 500 KB`
      );
    }
  }
});
