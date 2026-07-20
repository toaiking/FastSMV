import React from 'react';
import { CoefficientHistory } from '../types';
import { Calendar, Layers, RefreshCw, GitCommit } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface HistoryTabProps {
  history: CoefficientHistory[];
  isDark?: boolean;
}

export default function HistoryTab({ history, isDark = false }: HistoryTabProps) {
  const { t } = useLanguage();
  
  // Format Date Helper
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className={`p-5 rounded-2xl border flex flex-col gap-5 ${
      isDark ? 'bg-slate-800 border-slate-700/80 text-white' : 'bg-white border-gray-100 shadow-xs'
    }`} id="history-tab-container">
      <div>
        <h2 className="text-base font-bold">📜 {t("Nhật Ký Thay Đổi Hệ Số")}</h2>
        <p className="text-xs text-gray-400 mt-1">
          {t("Lịch sử cập nhật thư viện hệ số để đối soát và tra cứu số liệu.")}
        </p>
      </div>

      {history.length === 0 ? (
        <div className="p-12 text-center text-gray-400 italic">
          {t("Chưa ghi nhận sự kiện thay đổi nào trong hệ thống.")}
        </div>
      ) : (
        <div className={`relative border-l-2 pl-6 ml-3 space-y-8 py-2 ${
          isDark ? 'border-slate-700' : 'border-gray-100'
        }`}>
          {history.map((item, idx) => {
            const isRestore = item.action.includes('Khôi phục');
            const isInit = item.action.includes('Khởi tạo');
            
            let colorClass = 'bg-blue-100 text-blue-700 border-blue-200';
            let iconColor = 'text-blue-500';
            if (isRestore) {
              colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
              iconColor = 'text-amber-600';
            } else if (isInit) {
              colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
              iconColor = 'text-emerald-600';
            }

            return (
              <div key={item.id} className="relative group" id={`history-item-${item.id}`}>
                {/* Timeline dot icon wrapper */}
                <span className={`absolute -left-[35px] top-1 flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 border-2 transition-all group-hover:scale-115 group-hover:border-blue-500 ${
                  isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'
                }`}>
                  <GitCommit className={`w-3.5 h-3.5 ${iconColor}`} />
                </span>

                <div className={`border rounded-xl p-4 transition-all shadow-2xs flex flex-col gap-2 ${
                  isDark 
                    ? 'bg-slate-900/40 hover:bg-slate-900/85 border-slate-700/60 text-white' 
                    : 'bg-slate-50/70 hover:bg-slate-50 border-slate-100 text-gray-800'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase border ${colorClass}`}>
                        {t(item.action)}
                      </span>
                      <span className="text-sm font-semibold font-mono">
                        {item.versionBefore === 0 ? 'v1' : `v${item.versionBefore}`} → v{item.versionAfter}
                      </span>
                    </div>

                    <div className="text-xs text-gray-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(item.timestamp)}</span>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed font-sans font-medium whitespace-pre-wrap pl-1 mt-1 ${
                    isDark ? 'text-slate-200' : 'text-gray-700'
                  }`}>
                    {t(item.details)}
                  </p>

                  <div className="text-[10px] text-gray-400 font-mono flex items-center justify-end border-t border-gray-150/10 pt-2 mt-1">
                    ID: {item.id}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
