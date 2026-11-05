import React from 'react';
import { Download, RotateCcw, Trash2, X, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { SubmissionRecord } from '../data/landingData';

interface LeadAdminDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: SubmissionRecord[];
  onResetSampleData: () => void;
  onClearAll: () => void;
}

export const LeadAdminDrawer: React.FC<LeadAdminDrawerProps> = ({
  isOpen,
  onClose,
  submissions,
  onResetSampleData,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const handleExportCSV = () => {
    const headers = [
      'Mã Hồ Sơ',
      'Thời Gian Nộp',
      'Họ Và Tên',
      'Số Điện Thoại',
      'Email',
      'Đơn Vị / Địa Phương',
      'Hạng Mục Đăng Ký',
      'Số Năm Cống Hiến',
      'Điểm Tự Chấm (036/VTF)',
      'Hạng Dự Kiến',
      'Nội Dung Thành Tích / Tư Liệu Kỷ Yếu',
      'Link Kho Ảnh 5-10 Ảnh Gốc (CV 128/VTF-VP)',
      'Chú Thích Ảnh Lịch Sử',
      'Mã Chữ Ký Xác Thực Server VTF',
    ];

    const rows = submissions.map((s) => [
      s.id,
      s.createdAt,
      `"${s.fullName.replace(/"/g, '""')}"`,
      `'${s.phone}`,
      s.email,
      `"${s.organization.replace(/"/g, '""')}"`,
      `"${s.submissionTypeLabel.replace(/"/g, '""')}"`,
      String(s.yearsContributed),
      s.estimatedScore !== undefined ? String(s.estimatedScore) : 'N/A',
      `"${(s.estimatedRank || 'N/A').replace(/"/g, '""')}"`,
      `"${s.messageOrAchievement.replace(/"/g, '""')}"`,
      `"${(s.photoAlbumUrl || '').replace(/"/g, '""')}"`,
      `"${(s.photoCaptions || '').replace(/"/g, '""')}"`,
      `"${(s.serverReceiptHash || 'LOCAL-VERIFIED').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `VTF_30Nam_HoSo_DangKy_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="drawer-backdrop" role="dialog" aria-modal="true" aria-label="Quản trị hồ sơ VTF 30 năm">
      <div className="drawer-panel">
        <div className="drawer-header">
          <div>
            <span className="eyebrow-pill">
              <ShieldCheck size={14} /> HỆ THỐNG LƯU TRỮ LOCALSTORAGE · VTF 30 NĂM
            </span>
            <h3>Quản Trị Hồ Sơ Vinh Danh (038/TB-VTF) & Tư Liệu Kỷ Yếu (CV 128)</h3>
          </div>
          <button type="button" className="btn-icon-close" onClick={onClose} aria-label="Đóng cửa sổ quản trị">
            <X size={20} />
          </button>
        </div>

        <div className="drawer-toolbar">
          <div className="drawer-count">
            Tổng số hồ sơ đã ghi nhận: <strong>{submissions.length} hồ sơ</strong>
          </div>
          <div className="drawer-actions">
            <button type="button" className="btn-outline-sm" onClick={onResetSampleData}>
              <RotateCcw size={15} /> Nạp lại mẫu chuẩn VTF
            </button>
            <button type="button" className="btn-outline-sm danger" onClick={onClearAll}>
              <Trash2 size={15} /> Xóa trống
            </button>
            <button
              type="button"
              className="btn-primary-sm"
              onClick={handleExportCSV}
              disabled={submissions.length === 0}
            >
              <Download size={15} /> Xuất File Excel (.CSV)
            </button>
          </div>
        </div>

        <div className="drawer-body">
          {submissions.length === 0 ? (
            <div className="empty-drawer-state">
              <FileSpreadsheet size={40} />
              <h4>Chưa có hồ sơ nào trong bộ nhớ</h4>
              <p>Hãy bấm "Nạp lại mẫu chuẩn VTF" hoặc điền biểu mẫu đề cử trên trang để kiểm thử.</p>
            </div>
          ) : (
            <div className="submissions-list">
              {submissions.map((item) => (
                <div key={item.id} className="submission-card">
                  <div className="sub-card-top">
                    <span className="sub-type-badge">{item.submissionTypeLabel}</span>
                    <span className="sub-time">{item.createdAt}</span>
                  </div>
                  <div className="sub-card-main">
                    <h4>
                      {item.fullName} — <span>{item.organization}</span>
                    </h4>
                    <p className="sub-contact">
                      SĐT: <strong>{item.phone}</strong> · Email: <strong>{item.email}</strong> · Thâm niên:{' '}
                      <strong>{item.yearsContributed} năm</strong>
                    </p>
                    {item.estimatedScore !== undefined && (
                      <div className="sub-score-pill">
                        Điểm 036/VTF: <strong>{item.estimatedScore}/100đ</strong> ({item.estimatedRank})
                      </div>
                    )}
                    <p className="sub-detail">{item.messageOrAchievement}</p>
                    {item.photoAlbumUrl && (
                      <p className="sub-contact" style={{ marginTop: '6px' }}>
                        📸 Kho ảnh Kỷ yếu (CV 128/VTF-VP):{' '}
                        <a href={item.photoAlbumUrl} target="_blank" rel="noopener noreferrer">
                          {item.photoAlbumUrl}
                        </a>
                        {item.photoCaptions ? ` — (${item.photoCaptions})` : ''}
                      </p>
                    )}
                    {item.serverReceiptHash && (
                      <p className="sub-contact" style={{ marginTop: '4px', fontSize: '0.78rem', opacity: 0.85 }}>
                        🔒 Chữ ký xác thực Cổng VTF: <strong>{item.serverReceiptHash}</strong>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
