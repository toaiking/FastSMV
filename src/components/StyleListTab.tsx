import React, { useState } from 'react';
import { Style } from '../types';
import { 
  Search, Trash2, Edit, FileSpreadsheet, Eye, EyeOff, Calendar, User, 
  ArrowUpDown, ChevronDown, ChevronUp, Shirt, BookOpen, Clock, Activity, Settings, Info
} from 'lucide-react';
import { exportAllStylesToExcel, exportSingleStyleToExcel } from './ExcelExporter';
import { useLanguage } from '../lib/LanguageContext';

interface StyleListTabProps {
  styles: Style[];
  onEditStyle: (style: Style) => void;
  onDeleteStyle: (id: string) => void;
  isDark?: boolean;
}

export default function StyleListTab({
  styles,
  onEditStyle,
  onDeleteStyle,
  isDark = false
}: StyleListTabProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStyleId, setExpandedStyleId] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<'styleCode' | 'styleName' | 'createdAt' | 'finalSmv'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filter criteria
  const [productTypeFilter, setProductTypeFilter] = useState('');
  const [complexityFilter, setComplexityFilter] = useState('');

  // Extract unique filter keys for dropdown
  const uniqueProductTypes = Array.from(new Set(styles.map(s => s.calculationDetails?.productTypeName))).filter(Boolean);
  const uniqueComplexities = Array.from(new Set(styles.map(s => s.calculationDetails?.complexityName))).filter(Boolean);

  // Format Date Helper
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch (e) {
      return isoString;
    }
  };

  const handleSort = (field: 'styleCode' | 'styleName' | 'createdAt' | 'finalSmv') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter and Search logic
  const filteredStyles = styles.filter(style => {
    const matchesSearch = 
      style.styleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      style.styleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      style.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      style.estimator.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProductType = productTypeFilter === '' || style.calculationDetails?.productTypeName === productTypeFilter;
    const matchesComplexity = complexityFilter === '' || style.calculationDetails?.complexityName === complexityFilter;

    return matchesSearch && matchesProductType && matchesComplexity;
  });

  // Sort logic
  const sortedStyles = [...filteredStyles].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'createdAt') {
      comparison = a.createdAt.localeCompare(b.createdAt);
    } else if (sortField === 'styleCode') {
      comparison = a.styleCode.localeCompare(b.styleCode);
    } else if (sortField === 'styleName') {
      comparison = a.styleName.localeCompare(b.styleName);
    } else if (sortField === 'finalSmv') {
      const aSmv = a.calculationDetails?.finalSmv || a.baseSmv;
      const bSmv = b.calculationDetails?.finalSmv || b.baseSmv;
      comparison = aSmv - bSmv;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleRowExpand = (id: string) => {
    setExpandedStyleId(expandedStyleId === id ? null : id);
  };

  const handleDeleteClick = (e: React.MouseEvent, style: Style) => {
    e.stopPropagation(); // prevent expanding row
    if (confirm(`Bạn có chắc chắn muốn xoá Style "${style.styleCode} - ${style.styleName}" không? Thao tác này không thể khôi phục!`)) {
      onDeleteStyle(style.id);
    }
  };

  const handleEditClick = (e: React.MouseEvent, style: Style) => {
    e.stopPropagation();
    onEditStyle(style);
  };

  const handleExportAll = () => {
    if (styles.length === 0) {
      alert('Không có dữ liệu để xuất Excel.');
      return;
    }
    exportAllStylesToExcel(styles);
  };

  return (
    <div className="flex flex-col gap-5 font-sans" id="style-list-tab-container">
      
      {/* Search & Filter Controls Card (Fully Responsive) */}
      <div className={`p-4 rounded-2xl border flex flex-col gap-4 ${
        isDark ? 'bg-slate-800 border-slate-700/80 text-white' : 'bg-white border-gray-100 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row gap-3.5">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute inset-y-0 left-3.5 my-auto w-4.5 h-4.5 text-gray-400" />
            <input
              type="text"
              placeholder={t("Tìm kiếm Style...")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all font-semibold ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white focus:ring-2 focus:ring-blue-500' 
                  : 'bg-slate-50 border border-gray-300 focus:bg-white text-gray-900 focus:ring-2 focus:ring-blue-500'
              }`}
            />
          </div>

          {/* Quick Export excel */}
          <button
            onClick={handleExportAll}
            className="h-11 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-750 rounded-xl shadow-md shadow-emerald-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> 
            <span>{t("Xuất Excel tóm tắt")} ({filteredStyles.length})</span>
          </button>
        </div>

        {/* Dropdown filters stack */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-gray-100/30 pt-3">
          {/* Filter Product type */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t("Loại sản phẩm")}</label>
            <select
              value={productTypeFilter}
              onChange={e => setProductTypeFilter(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("-- Tất cả loại --")}</option>
              {uniqueProductTypes.map(tVal => (
                <option key={tVal} value={tVal}>{tVal}</option>
              ))}
            </select>
          </div>

          {/* Filter Complexity */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t("Độ phức tạp")}</label>
            <select
              value={complexityFilter}
              onChange={e => setComplexityFilter(e.target.value)}
              className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("-- Tất cả độ khó --")}</option>
              {uniqueComplexities.map(cVal => (
                <option key={cVal} value={cVal}>{cVal}</option>
              ))}
            </select>
          </div>

          {/* Sorter selection (Handy on Mobile) */}
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t("Sắp xếp")}</label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={sortField}
                onChange={e => handleSort(e.target.value as any)}
                className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">📅 {t("Ngày tạo")}</option>
                <option value="styleCode">🔢 {t("Mã Style")}</option>
                <option value="styleName">✏️ {t("Tên Style")}</option>
                <option value="finalSmv">⏱️ {t("Tổng SMV")}</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2.5 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
              >
                <span>{t("Thứ tự")}:</span>
                <strong className="text-blue-600">{sortOrder === 'asc' ? t("Tăng dần") : t("Giảm dần")}</strong>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE LIST LAYOUT (CARD VIEW) - visible only on mobile/tablet */}
      <div className="block md:hidden space-y-3" id="styles-mobile-cards">
        {sortedStyles.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
            <Shirt className="w-10 h-10 mx-auto mb-2 opacity-25" />
            <p className="text-sm font-bold">{t("Không tìm thấy Style nào phù hợp.")}</p>
          </div>
        ) : (
          sortedStyles.map(style => {
            const calc = style.calculationDetails;
            const finalSmv = calc?.finalSmv || style.baseSmv;
            const isExpanded = expandedStyleId === style.id;
            
            return (
              <div
                key={style.id}
                id={`mobile-card-${style.id}`}
                onClick={() => toggleRowExpand(style.id)}
                className={`p-4 rounded-xl border transition-all active:scale-99 cursor-pointer flex flex-col gap-3.5 ${
                  isExpanded 
                    ? 'bg-blue-50/20 border-blue-300' 
                    : isDark 
                      ? 'bg-slate-800 border-slate-700/80 text-white' 
                      : 'bg-white border-gray-200/80 shadow-xs'
                }`}
              >
                {/* Upper line: Style Code & Final SMV badge */}
                <div className="flex justify-between items-start gap-2">
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-100 rounded">
                        {style.styleCode}
                      </span>
                      {style.customer && (
                        <span className="text-[10px] text-gray-400 font-bold truncate">
                          {style.customer}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm font-bold truncate mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {style.styleName}
                    </h3>
                  </div>

                  {/* Big prominent circular/badge value for SMV */}
                  <div className="text-right flex-shrink-0 bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-emerald-800 flex flex-col items-center justify-center min-w-[70px] shadow-2xs">
                    <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest font-mono">EST. SMV</span>
                    <strong className="text-sm font-black font-mono mt-0.5">{finalSmv.toFixed(3)}</strong>
                  </div>
                </div>

                {/* Sub headers (Date and Estimator) */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 border-t border-b border-gray-100/50 py-1.5 font-medium">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-400" /> {t("Người đo")}: {style.estimator}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" /> {formatDate(style.createdAt)}
                  </span>
                </div>

                {/* Collapse toggle row */}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-bold">
                    ⚙️ {calc?.productTypeName || 'Áo'} • {calc?.complexityName || 'Trung bình'}
                  </span>
                  <span className="text-xs font-bold text-blue-600 flex items-center gap-0.5">
                    {isExpanded ? (
                      <>{t("Ẩn bớt")} <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>{t("Xem thêm")} <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </span>
                </div>

                {/* Expanded metadata and mathematical breakdown */}
                {isExpanded && (
                  <div className="space-y-3 bg-slate-50/50 p-3 rounded-lg border border-gray-200 text-xs animate-fadeIn mt-2">
                    
                    {/* Render Image Thumbnail if exists */}
                    {style.patternImage && (
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-400 text-[9px] font-bold uppercase block">{t("Hồ sơ rập:")}</span>
                        <div className="w-full h-24 rounded-lg overflow-hidden border border-gray-300">
                          <img src={style.patternImage} alt="Pattern template document" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    {style.notes && (
                      <div>
                        <strong className="block text-gray-700 font-bold mb-0.5">{t("📝 Ghi chú rập/kỹ thuật:")}</strong>
                        <p className="text-gray-600 leading-relaxed italic">{style.notes}</p>
                      </div>
                    )}

                    {/* Industrial Formula details */}
                    <div>
                      <strong className="block text-gray-700 font-bold mb-1">{t("🧮 Diễn giải công thức:")}</strong>
                      <div className="bg-slate-900 text-white p-2.5 rounded-md font-mono text-[10px] leading-relaxed overflow-x-auto">
                        <div className="text-blue-400 font-bold mb-0.5">SMV = Base_SMV × f_Loại × f_Khó × f_Bậc × f_Nghề × (1 + Allowance)</div>
                        <div className="border-t border-slate-800/80 mt-1 pt-1 text-slate-300">
                          = {style.baseSmv} × {calc?.productTypeVal} × {calc?.complexityVal} × {calc?.perimeterFactor} × {calc?.experienceVal} × {(1 + (calc?.allowanceVal || 0)).toFixed(2)}
                          <div className="text-emerald-400 font-bold mt-0.5">= {finalSmv.toFixed(3)} {t("phút")}</div>
                        </div>
                      </div>
                    </div>

                    {/* Applied factors list */}
                    <div className="space-y-1 text-gray-600 font-semibold text-[11px]">
                      <div className="flex justify-between border-b border-gray-200/50 pb-1">
                        <span>{t("Thời gian nền:")}</span>
                        <span className="text-gray-900 font-mono">{style.baseSmv.toFixed(2)} {t("phút")} ({style.patternPerimeterCm} cm)</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200/50 pb-1">
                        <span>👕 {t("Hệ số sản phẩm:")}</span>
                        <span className="text-gray-900">{calc?.productTypeName} (x{calc?.productTypeVal.toFixed(2)})</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200/50 pb-1">
                        <span>⚙️ {t("Hệ số độ phức tạp:")}</span>
                        <span className="text-gray-900">{calc?.complexityName} (x{calc?.complexityVal.toFixed(2)})</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200/50 pb-1">
                        <span>📏 {t("Hệ số bậc chu vi rập:")}</span>
                        <span className="text-gray-900">{calc?.perimeterFactor.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200/50 pb-1">
                        <span>👤 {t("Hệ số tay nghề:")}</span>
                        <span className="text-gray-900">{calc?.experienceName} (x{calc?.experienceVal.toFixed(2)})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🔋 {t("Hệ số bù hao:")}</span>
                        <span className="text-emerald-600">+{((calc?.allowanceVal || 0) * 100).toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Touch-Friendly Action buttons at the bottom of the Card */}
                    <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-gray-200/80">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); exportSingleStyleToExcel(style); }}
                        className="py-2.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-[10px] font-bold border border-emerald-200 flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleEditClick(e, style)}
                        className="py-2.5 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-lg text-[10px] font-bold border border-blue-200 flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> {t("Sửa")}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, style)}
                        className="py-2.5 bg-red-50 text-red-800 hover:bg-red-100 rounded-lg text-[10px] font-bold border border-red-200 flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {t("Xoá")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW (GRID VIEW) - visible only on medium screens and larger */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {sortedStyles.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-base font-semibold">{t("Chưa tìm thấy Style nào khớp với điều kiện.")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="styles-table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider font-mono">
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('styleCode')}>
                    <div className="flex items-center gap-1">
                      {t("Mã hàng")}
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('styleName')}>
                    <div className="flex items-center gap-1">
                      {t("Tên Style")}
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">{t("Khách hàng")}</th>
                  <th className="py-3.5 px-4 text-center">{t("Chu vi rập (cm)")}</th>
                  <th className="py-3.5 px-4 text-right">Base SMV</th>
                  <th className="py-3.5 px-4 text-right cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('finalSmv')}>
                    <div className="flex items-center gap-1 justify-end">
                      {t("SMV Cuối (Phút)")}
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">{t("Người đo")}</th>
                  <th className="py-3.5 px-4 text-center">{t("Thao tác")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {sortedStyles.map(style => {
                  const isExpanded = expandedStyleId === style.id;
                  const calc = style.calculationDetails;
                  const finalSmv = calc?.finalSmv || style.baseSmv;
                  return (
                    <React.Fragment key={style.id}>
                      <tr 
                        onClick={() => toggleRowExpand(style.id)}
                        className={`hover:bg-slate-50/70 transition-colors cursor-pointer group ${isExpanded ? 'bg-blue-50/30' : ''}`}
                      >
                        <td className="py-4 px-4 font-semibold text-gray-900 font-mono">
                          {style.styleCode}
                        </td>
                        <td className="py-4 px-4 text-gray-700 font-medium">
                          {style.styleName}
                        </td>
                        <td className="py-4 px-4 text-gray-500">
                          {style.customer || '-'}
                        </td>
                        <td className="py-4 px-4 text-center font-semibold text-gray-800">
                          {style.patternPerimeterCm}
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-gray-500">
                          {style.baseSmv.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-blue-600 font-mono">
                          {finalSmv.toFixed(3)}
                        </td>
                        <td className="py-4 px-4 text-gray-600 text-xs">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span>{style.estimator}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {formatDate(style.createdAt)}
                          </div>
                        </td>
                        <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleRowExpand(style.id)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all cursor-pointer"
                              title={t("Xem chi tiết diễn giải")}
                            >
                              {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => exportSingleStyleToExcel(style)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-all cursor-pointer"
                              title={t("Xuất Excel Chi tiết")}
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleEditClick(e, style)}
                              className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all cursor-pointer"
                              title={t("Sửa Style")}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteClick(e, style)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-all cursor-pointer"
                              title={t("Xoá Style")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Desk Detail Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-slate-50/50 p-5 border-t border-b border-gray-100">
                            <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6">
                              <div className="md:col-span-4 flex flex-col gap-4 border-r border-gray-100 pr-6">
                                <div>
                                  <span className="text-gray-400 text-[10px] font-mono block uppercase font-bold">{t("Chi tiết Style")}</span>
                                  <h4 className="text-lg font-bold text-gray-900 mt-0.5">{style.styleCode}</h4>
                                  <p className="text-sm text-gray-600">{style.styleName}</p>
                                </div>

                                {/* Thumbnail Pattern if exists */}
                                {style.patternImage && (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-gray-400 text-[9px] font-bold uppercase block">{t("Bản chụp Pattern:")}</span>
                                    <div className="w-full h-28 rounded-lg overflow-hidden border border-gray-200 shadow-2xs">
                                      <img src={style.patternImage} alt="Pattern template document preview" className="w-full h-full object-cover" />
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-1.5 text-xs text-gray-600 font-semibold">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">{t("Khách hàng:")}</span>
                                    <span className="text-gray-800">{style.customer || '—'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">{t("Người đo:")}</span>
                                    <span className="text-gray-800">{style.estimator}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">{t("Ngày tạo:")}</span>
                                    <span className="text-gray-800 font-mono">{formatDate(style.createdAt)}</span>
                                  </div>
                                </div>

                                {style.notes && (
                                  <div className="mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                                    <strong className="block text-gray-700 font-bold mb-1">{t("📝 Ghi chú rập/kỹ thuật:")}</strong>
                                    <p className="text-gray-600 leading-relaxed italic">{style.notes}</p>
                                  </div>
                                )}
                              </div>

                              <div className="md:col-span-8 flex flex-col gap-4">
                                <h5 className="text-xs text-gray-400 font-mono uppercase tracking-wider font-bold">{t("Diễn giải công thức & hệ số")}</h5>
                                
                                <div className="bg-slate-900 text-white p-3.5 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
                                  <div className="text-blue-400 font-bold mb-1">{t("SMV cuối cùng = Base_SMV × f_Loại × f_Khó × f_Bậc × f_Nghề × (1 + % Allowance)")}</div>
                                  <div className="mt-2 text-slate-300 border-t border-slate-800 pt-2 flex flex-wrap gap-x-2.5 gap-y-1">
                                    <span>= <strong className="text-white font-bold">{style.baseSmv}</strong></span>
                                    <span>× <strong className="text-yellow-400 font-bold">{calc?.productTypeVal}</strong></span>
                                    <span>× <strong className="text-yellow-400 font-bold">{calc?.complexityVal}</strong></span>
                                    <span>× <strong className="text-yellow-400 font-bold">{calc?.perimeterFactor}</strong></span>
                                    <span>× <strong className="text-yellow-400 font-bold">{calc?.experienceVal}</strong></span>
                                    <span>× <strong className="text-yellow-400 font-bold">{(1 + (calc?.allowanceVal || 0)).toFixed(2)}</strong></span>
                                    <span className="text-emerald-400 font-bold font-sans ml-1">= {finalSmv.toFixed(3)} {t("phút")}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                                    <span className="text-gray-400 font-semibold block">{t("Thời gian gốc (Base SMV)")}</span>
                                    <span className="font-bold text-gray-900 mt-1 font-mono block text-sm">{calc?.baseSmv.toFixed(3)} {t("phút")}</span>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                                    <span className="text-gray-400 font-semibold block">👕 {t("Loại sản phẩm")}</span>
                                    <span className="font-bold text-blue-600 mt-1 font-mono block text-sm">{t("Hệ số:")} {calc?.productTypeVal.toFixed(2)}</span>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                                    <span className="text-gray-400 font-semibold block">⚙️ {t("Độ phức tạp kỹ thuật")}</span>
                                    <span className="font-bold text-blue-600 mt-1 font-mono block text-sm">{t("Hệ số:")} {calc?.complexityVal.toFixed(2)}</span>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                                    <span className="text-gray-400 font-semibold block">📏 {t("Bậc chu vi rập (cm)")}</span>
                                    <span className="font-bold text-blue-600 mt-1 font-mono block text-sm">{t("Hệ số:")} {calc?.perimeterFactor.toFixed(2)}</span>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                                    <span className="text-gray-400 font-semibold block">👤 {t("Kinh nghiệm may")}</span>
                                    <span className="font-bold text-blue-600 mt-1 font-mono block text-sm">{t("Hệ số:")} {calc?.experienceVal.toFixed(2)}</span>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-150">
                                    <span className="text-gray-400 font-semibold block">🔋 {t("Bù hao Allowance")}</span>
                                    <span className="font-bold text-emerald-600 mt-1 font-mono block text-sm">+{((calc?.allowanceVal || 0) * 100).toFixed(0)}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
