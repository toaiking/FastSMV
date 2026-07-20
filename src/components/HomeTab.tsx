import React from 'react';
import { Style, CoefficientLibrary } from '../types';
import { 
  Shirt, Calculator, BookOpen, Clock, Activity, ArrowRight, CheckCircle, Wifi, Moon, Sun, Award
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface HomeTabProps {
  styles: Style[];
  library: CoefficientLibrary | null;
  onNavigateToTab: (tab: 'home' | 'new_style' | 'styles_list' | 'coefficients' | 'history') => void;
  onEditStyle: (style: Style) => void;
  isDark: boolean;
}

export default function HomeTab({
  styles,
  library,
  onNavigateToTab,
  onEditStyle,
  isDark
}: HomeTabProps) {
  const { t } = useLanguage();
  
  // Calculate statistics
  const totalStyles = styles.length;
  const avgSmv = totalStyles > 0 
    ? styles.reduce((acc, curr) => acc + (curr.calculationDetails?.finalSmv || curr.baseSmv), 0) / totalStyles
    : 0;

  // Calculate unique customers
  const uniqueCustomers = new Set(styles.map(s => s.customer).filter(Boolean)).size;

  // Recent 3 styles
  const recentStyles = styles.slice(0, 3);

  return (
    <div className="flex flex-col gap-5 font-sans" id="home-tab-container">
      {/* Welcome Banner Card */}
      <div className={`p-5 rounded-xl border transition-all ${
        isDark 
          ? 'bg-slate-800/80 border-slate-700/80 text-white' 
          : 'bg-gradient-to-r from-blue-600 to-indigo-700 border-blue-700 text-white shadow-sm'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-bold mb-2">
              <Award className="w-3 h-3 text-yellow-300" />
              <span>{t("Hệ thống Công nghệ IE May Mặc")}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">SMV Estimator</h1>
            <p className="text-xs text-blue-100/90 mt-1 max-w-xl leading-relaxed">
              {t("Ước lượng thời gian Sewing Minute Value từ rập Pattern. Tối ưu hóa trực quan cho thiết bị di động của kỹ sư.")}
            </p>
          </div>
          
          {/* Big Tap to Calculate Button */}
          <button
            onClick={() => onNavigateToTab('new_style')}
            id="home-cta-calculate"
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 transition-all rounded-lg font-bold text-xs shadow-xs cursor-pointer whitespace-nowrap self-stretch md:self-auto"
          >
            <Calculator className="w-4 h-4 text-blue-600" />
            <span>{t("TÍNH STYLE MỚI")}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" id="home-stats-grid">
        {/* Total styles */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-gray-100 shadow-xs'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Shirt className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">{t("TỔNG STYLE")}</span>
              <strong className={`text-base font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalStyles}</strong>
            </div>
          </div>
        </div>

        {/* Avg SMV */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-gray-100 shadow-xs'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">{t("SMV TRUNG BÌNH")}</span>
              <strong className={`text-base font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {avgSmv > 0 ? avgSmv.toFixed(2) : '0.00'}<span className="text-[10px] font-normal text-gray-400 ml-0.5">{t("phút")}</span>
              </strong>
            </div>
          </div>
        </div>

        {/* Coef library version */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-gray-100 shadow-xs'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">{t("PHIÊN BẢN HỆ SỐ")}</span>
              <strong className={`text-base font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                v{library?.version || '1.0'}
              </strong>
            </div>
          </div>
        </div>

        {/* Unique Customers stats (Replaces Redundant Offline card) */}
        <div className={`p-3.5 rounded-xl border transition-all ${
          isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-gray-100 shadow-xs'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold">{t("KHÁCH HÀNG")}</span>
              <strong className={`text-base font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {uniqueCustomers}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcut Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5" id="home-shortcuts-grid">
        <button
          onClick={() => onNavigateToTab('coefficients')}
          id="home-shortcut-coefficients"
          className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer group ${
            isDark 
              ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/85' 
              : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs'
          }`}
        >
          <div className={`p-2.5 rounded-lg transition-transform group-hover:scale-105 ${
            isDark ? 'bg-blue-950 text-blue-400' : 'bg-blue-50 text-blue-600'
          }`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{t("Thư viện Hệ số định biên")}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
              {t("Cấu hình định mức nền, hệ số loại sản phẩm, độ phức tạp và phân bậc tổng chu vi rập mẫu.")}
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigateToTab('styles_list')}
          id="home-shortcut-list"
          className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer group ${
            isDark 
              ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/85' 
              : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs'
          }`}
        >
          <div className={`p-2.5 rounded-lg transition-transform group-hover:scale-105 ${
            isDark ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
          }`}>
            <Shirt className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{t("Hồ sơ rập & Style hàng")}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
              {t("Tra cứu hồ sơ mẫu, phân rã chi tiết công thức, xuất báo cáo kỹ thuật Excel cho đơn vị sản xuất.")}
            </p>
          </div>
        </button>
      </div>

      {/* Recent Calculations feed */}
      <div className="flex flex-col gap-2.5" id="recent-styles-section">
        <div className="flex justify-between items-center">
          <h2 className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
            <Activity className="w-4.5 h-4.5 text-blue-500" />
            <span>{t("Style gần đây")}</span>
          </h2>
          {totalStyles > 0 && (
            <button
              onClick={() => onNavigateToTab('styles_list')}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              {t("Xem tất cả")} ({totalStyles})
            </button>
          )}
        </div>

        {recentStyles.length === 0 ? (
          <div className={`p-6 text-center rounded-xl border ${
            isDark ? 'bg-slate-800/20 border-slate-800 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-400'
          }`}>
            <Shirt className="w-8 h-8 mx-auto mb-2 opacity-35" />
            <p className="text-xs font-semibold">{t("Chưa có Style nào được ước lượng.")}</p>
            <p className="text-[10px] text-gray-400 mt-1">{t("Chọn \"Tính Style mới\" ở trên để bắt đầu ước lượng SMV.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5" id="home-recent-styles-list">
            {recentStyles.map((style) => {
              const smvValue = style.calculationDetails?.finalSmv || style.baseSmv;
              return (
                <div
                  key={style.id}
                  onClick={() => onEditStyle(style)}
                  id={`recent-style-card-${style.id}`}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all cursor-pointer hover:translate-x-1 ${
                    isDark 
                      ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80' 
                      : 'bg-white border-gray-100 hover:border-gray-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      isDark ? 'bg-slate-700 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      <Shirt className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <strong className={`text-xs truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {style.styleCode}
                        </strong>
                        <span className={`px-1.5 py-0.2 text-[9px] rounded font-semibold truncate ${
                          isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {style.customer || t('Không có khách hàng')}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{style.styleName}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex items-center gap-2.5">
                    <div>
                      <strong className="text-sm font-black text-emerald-500 font-mono">
                        {smvValue.toFixed(2)}
                      </strong>
                      <span className="text-[9px] text-gray-400 block">{t("phút")}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Apparel IE Tips Card */}
      <div className={`p-3 rounded-lg border flex items-start gap-2.5 ${
        isDark ? 'bg-slate-800/20 border-slate-700/50' : 'bg-amber-50/40 border-amber-100'
      }`}>
        <span className="text-xs text-amber-500">💡</span>
        <div className="text-[11px] leading-relaxed">
          <strong className={isDark ? 'text-amber-400' : 'text-amber-800'}>{t("Mẹo IE:")}</strong>
          <span className={isDark ? 'text-slate-300' : 'text-amber-900/80'}>
            {" "}{t("Tổng chu vi rập mẫu ảnh hưởng trực tiếp đến thời gian may nền. Luôn đo chính xác tổng chu vi tất cả chi tiết rập mẫu trước khi ước lượng.")}
          </span>
        </div>
      </div>
    </div>
  );
}
