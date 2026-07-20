/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { Style } from '../types';
import { getTranslation } from '../lib/translations';

// Helper to get active language and translate
const getLang = () => (localStorage.getItem('smv_language') as 'vi' | 'en') || 'vi';
const t = (text: string) => getTranslation(text, getLang());

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
    t('Mã hàng'),
    t('Tên Style'),
    t('Khách hàng'),
    t('Tổng chu vi rập (cm)'),
    t('Phương thức Base SMV'),
    t('Định mức phút/cm'),
    t('Base SMV (phút)'),
    t('Hệ số Loại sản phẩm'),
    t('Hệ số Độ phức tạp'),
    t('Hệ số Bậc chu vi rập'),
    t('Hệ số Kinh nghiệm'),
    t('Hệ số Bù hao (Allowance %)'),
    t('SMV Cuối cùng (phút)'),
    t('Người ước lượng'),
    t('Ngày tạo'),
    t('Ghi chú')
  ];

  const data = styles.map(style => {
    const calc = style.calculationDetails;
    return [
      style.styleCode,
      style.styleName,
      style.customer,
      style.patternPerimeterCm,
      style.baseSmvMethod === 'auto' ? t('Tính tự động') : t('Nhập thủ công'),
      style.baseSmvMethod === 'auto' ? style.perimeterSmvRate : '-',
      style.baseSmv,
      `${t(calc.productTypeName)} (${calc.productTypeVal})`,
      `${t(calc.complexityName)} (${calc.complexityVal})`,
      `${t(calc.perimeterTierName)} (${calc.perimeterFactor})`,
      `${t(calc.experienceName)} (${calc.experienceVal})`,
      `${t(calc.allowanceName)} (${(calc.allowanceVal * 100).toFixed(0)}%)`,
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
    { wch: 20 }, // Tổng chu vi rập (cm)
    { wch: 22 }, // Phương thức Base
    { wch: 22 }, // Định mức
    { wch: 15 }, // Base SMV
    { wch: 25 }, // Loại SP
    { wch: 25 }, // Độ phức tạp
    { wch: 25 }, // Bậc chu vi rập
    { wch: 25 }, // Kinh nghiệm
    { wch: 25 }, // Bù hao
    { wch: 20 }, // SMV Cuối cùng
    { wch: 18 }, // Người ước lượng
    { wch: 18 }, // Ngày tạo
    { wch: 30 }  // Ghi chú
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t('Danh sách Style SMV'));

  // Generate file and trigger download
  XLSX.writeFile(wb, `Danh_Sach_Style_SMV_${new Date().toISOString().slice(0,10)}.xlsx`);
}

/**
 * Export high-fidelity calculation report for a single Style
 */
export function exportSingleStyleToExcel(style: Style) {
  const calc = style.calculationDetails;

  const rows = [
    [t('BÁO CÁO CHI TIẾT ƯỚC LƯỢNG SMV (SEWING MINUTE VALUE)')],
    [],
    [t('I. THÔNG TIN CHUNG SẢN PHẨM')],
    [t('Mã hàng (Style Code):'), style.styleCode, '', t('Tên sản phẩm (Style Name):'), style.styleName],
    [t('Khách hàng (Customer):'), style.customer, '', t('Người ước lượng:'), style.estimator],
    [t('Ngày ước lượng:'), formatDate(style.createdAt), '', t('Tổng chu vi rập (cm):'), style.patternPerimeterCm],
    [t('Ghi chú:'), style.notes || t('Không có ghi chú')],
    [],
    [t('II. DIỄN GIẢI CÔNG THỨC & HỆ SỐ ÁP DỤNG')],
    [t('Công thức:'), t('SMV Cuối cùng = Base SMV x Hệ số Sản Phẩm x Hệ số Độ Phức Tạp x Hệ số Bậc Chu Vi Rập x Hệ số Kinh Nghiệm x (1 + % Allowance)')],
    [],
    [t('Hạng mục yếu tố'), t('Tên hệ số đã chọn'), t('Giá trị áp dụng'), t('Diễn giải ý nghĩa')],
    [
      `1. ${t('Base SMV (Thời gian nền)')}`,
      style.baseSmvMethod === 'auto' ? `${t('Tự động')} (${t('Chu vi rập')} x ${style.perimeterSmvRate} ${t('phút/cm')})` : t('Nhập thủ công theo kinh nghiệm'),
      style.baseSmv,
      t('Thời gian sản xuất cơ sở trước khi nhân các hệ số hiệu chỉnh')
    ],
    [
      `2. ${t('Loại sản phẩm (Product Type)')}`,
      t(calc.productTypeName),
      calc.productTypeVal,
      t('Hệ số điều chỉnh theo đặc thù kỹ thuật của từng dòng sản phẩm')
    ],
    [
      `3. ${t('Độ phức tạp (Complexity)')}`,
      t(calc.complexityName),
      calc.complexityVal,
      t('Hệ số phản ánh độ khó đường may, ráp nối của hàng')
    ],
    [
      `4. ${t('Bậc chu vi rập (Perimeter Tier)')}`,
      t(calc.perimeterTierName),
      calc.perimeterFactor,
      t('Hệ số tỷ lệ thuận theo tổng chiều dài chu vi các chi tiết rập')
    ],
    [
      `5. ${t('Kinh nghiệm may (Experience)')}`,
      t(calc.experienceName),
      calc.experienceVal,
      t('Hệ số điều chỉnh theo tay nghề và mức độ quen tay của chuyền may')
    ],
    [
      `6. ${t('Bù hao hao phí (Allowance)')}`,
      t(calc.allowanceName),
      `${(calc.allowanceVal * 100).toFixed(0)}%`,
      t('Hệ số bù hao thời gian nghỉ ngơi, mệt mỏi, thao tác phụ trợ (Allowance)')
    ],
    [],
    [t('III. KẾT QUẢ TỔNG HỢP')],
    [t('Tổng thời gian ước lượng (SMV):'), `${calc.finalSmv.toFixed(3)} ${t('phút')}`, '', t('Phiên bản thư viện hệ số:'), `v${calc.libraryVersion}`],
    [],
    [t('Xác nhận của Người Ước Lượng'), '', '', t('Xác nhận của Quản Lý/Duyệt')],
    [t('(Ký & ghi rõ họ tên)'), '', '', t('(Ký & ghi rõ họ tên)')],
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
