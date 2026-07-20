/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { Style } from '../types';

// Helper to format date
const formatDate = (isoString: string) => {
  try {
    const d = new Date(isoString);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch (e) {
    return isoString;
  }
};

/**
 * Export all styles in a tidy table structure
 */
export function exportAllStylesToExcel(styles: Style[]) {
  const headers = [
    'Mã hàng',
    'Tên Style',
    'Khách hàng',
    'Số chi tiết',
    'Phương thức Base SMV',
    'Định mức phút/chi tiết',
    'Base SMV (phút)',
    'Hệ số Loại sản phẩm',
    'Hệ số Độ phức tạp',
    'Hệ số Bậc chi tiết',
    'Hệ số Kinh nghiệm',
    'Hệ số Bù hao (Allowance %)',
    'SMV Cuối cùng (phút)',
    'Người ước lượng',
    'Ngày tạo',
    'Ghi chú'
  ];

  const data = styles.map(style => {
    const calc = style.calculationDetails;
    return [
      style.styleCode,
      style.styleName,
      style.customer,
      style.partsCount,
      style.baseSmvMethod === 'auto' ? 'Tính tự động' : 'Nhập thủ công',
      style.baseSmvMethod === 'auto' ? style.partsSmvRate : '-',
      style.baseSmv,
      `${calc.productTypeName} (${calc.productTypeVal})`,
      `${calc.complexityName} (${calc.complexityVal})`,
      `${calc.partTierName} (${calc.partTierVal})`,
      `${calc.experienceName} (${calc.experienceVal})`,
      `${calc.allowanceName} (${(calc.allowanceVal * 100).toFixed(0)}%)`,
      calc.finalSmv,
      style.estimator,
      formatDate(style.createdAt),
      style.notes || ''
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // Mã hàng
    { wch: 25 }, // Tên Style
    { wch: 20 }, // Khách hàng
    { wch: 12 }, // Số chi tiết
    { wch: 22 }, // Phương thức Base
    { wch: 22 }, // Định mức
    { wch: 15 }, // Base SMV
    { wch: 25 }, // Loại SP
    { wch: 25 }, // Độ phức tạp
    { wch: 25 }, // Bậc chi tiết
    { wch: 25 }, // Kinh nghiệm
    { wch: 25 }, // Bù hao
    { wch: 20 }, // SMV Cuối cùng
    { wch: 18 }, // Người ước lượng
    { wch: 18 }, // Ngày tạo
    { wch: 30 }  // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách Style SMV');

  // Generate file and trigger download
  XLSX.writeFile(wb, `Danh_Sach_Style_SMV_${new Date().toISOString().slice(0,10)}.xlsx`);
}

/**
 * Export high-fidelity calculation report for a single Style
 */
export function exportSingleStyleToExcel(style: Style) {
  const calc = style.calculationDetails;

  const rows = [
    ['BÁO CÁO CHI TIẾT ƯỚC LƯỢNG SMV (SEWING MINUTE VALUE)'],
    [],
    ['I. THÔNG TIN CHUNG SẢN PHẨM'],
    ['Mã hàng (Style Code):', style.styleCode, '', 'Tên sản phẩm (Style Name):', style.styleName],
    ['Khách hàng (Customer):', style.customer, '', 'Người ước lượng:', style.estimator],
    ['Ngày ước lượng:', formatDate(style.createdAt), '', 'Số lượng chi tiết:', style.partsCount],
    ['Ghi chú:', style.notes || 'Không có ghi chú'],
    [],
    ['II. DIỄN GIẢI CÔNG THỨC & HỆ SỐ ÁP DỤNG'],
    ['Công thức:', 'SMV Cuối cùng = Base SMV x Hệ số Sản Phẩm x Hệ số Độ Phức Tạp x Hệ số Bậc Chi Tiết x Hệ số Kinh Nghiệm x (1 + % Allowance)'],
    [],
    ['Hạng mục yếu tố', 'Tên hệ số đã chọn', 'Giá trị áp dụng', 'Diễn giải ý nghĩa'],
    [
      '1. Base SMV (Thời gian nền)',
      style.baseSmvMethod === 'auto' ? `Tự động (Số chi tiết x ${style.partsSmvRate} phút)` : 'Nhập thủ công theo kinh nghiệm',
      style.baseSmv,
      'Thời gian sản xuất cơ sở trước khi nhân các hệ số hiệu chỉnh'
    ],
    [
      '2. Loại sản phẩm (Product Type)',
      calc.productTypeName,
      calc.productTypeVal,
      'Hệ số điều chỉnh theo đặc thù kỹ thuật của từng dòng sản phẩm'
    ],
    [
      '3. Độ phức tạp (Complexity)',
      calc.complexityName,
      calc.complexityVal,
      'Hệ số phản ánh độ khó đường may, ráp nối của hàng'
    ],
    [
      '4. Bậc số lượng chi tiết (Part Count)',
      calc.partTierName,
      calc.partTierVal,
      'Hệ số tỷ lệ thuận theo độ phân rã chi tiết của mẫu rập'
    ],
    [
      '5. Kinh nghiệm may (Experience)',
      calc.experienceName,
      calc.experienceVal,
      'Hệ số điều chỉnh theo tay nghề và mức độ quen tay của chuyền may'
    ],
    [
      '6. Bù hao hao phí (Allowance)',
      calc.allowanceName,
      `${(calc.allowanceVal * 100).toFixed(0)}%`,
      'Hệ số bù hao thời gian nghỉ ngơi, mệt mỏi, thao tác phụ trợ (Allowance)'
    ],
    [],
    ['III. KẾT QUẢ TỔNG HỢP'],
    ['Tổng thời gian ước lượng (SMV):', `${calc.finalSmv.toFixed(3)} phút`, '', 'Phiên bản thư viện hệ số:', `v${calc.libraryVersion}`],
    [],
    ['Xác nhận của Người Ước Lượng', '', '', 'Xác nhận của Quản Lý/Duyệt'],
    ['(Ký & ghi rõ họ tên)', '', '', '(Ký & ghi rõ họ tên)'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 30 }, // Cột A
    { wch: 35 }, // Cột B
    { wch: 15 }, // Cột C
    { wch: 25 }, // Cột D
    { wch: 35 }  // Cột E
  ];

  // Merge headers and titles
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }, // Header I
    { s: { r: 8, c: 0 }, e: { r: 8, c: 4 } }, // Header II
    { s: { r: 9, c: 1 }, e: { r: 9, c: 4 } }, // Formula description
    { s: { r: 19, c: 0 }, e: { r: 19, c: 4 } }, // Header III
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `SMV_${style.styleCode}`);

  XLSX.writeFile(wb, `Bao_Cao_SMV_${style.styleCode}.xlsx`);
}
