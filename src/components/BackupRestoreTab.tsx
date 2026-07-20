import React, { useState, useRef } from 'react';
import { CoefficientLibrary, Style, CoefficientHistory } from '../types';
import { 
  Database, Download, Upload, ShieldAlert, CheckCircle2, Wifi, WifiOff, FileJson, Layers, Shirt, History, FileDown, FileUp, AlertCircle, RefreshCw, ArrowDownToLine
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface BackupRestoreTabProps {
  library: CoefficientLibrary;
  styles: Style[];
  history: CoefficientHistory[];
  onSystemRestore: (data: { library: CoefficientLibrary; styles: Style[]; history: CoefficientHistory[] }) => void;
  isDark?: boolean;
  isLocalStorageMode?: boolean;
  onLibraryUpdate: () => void;
}

interface BackupFile {
  fileName: string;
  createdAt: string;
  sizeBytes: number;
}

export default function BackupRestoreTab({
  library,
  styles,
  history,
  onSystemRestore,
  isDark = false,
  isLocalStorageMode = false,
  onLibraryUpdate
}: BackupRestoreTabProps) {
  const { t } = useLanguage();
  
  // Local state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<{
    version: number;
    stylesCount: number;
    historyCount: number;
    parsedData: any;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Server backups states (for when in Server mode)
  const [serverBackups, setServerBackups] = useState<BackupFile[]>([]);
  const [loadingServerBackups, setLoadingServerBackups] = useState(false);
  const [isRestoringServer, setIsRestoringServer] = useState<string | null>(null);
  const [serverBackupMsg, setServerBackupMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load server backups
  const fetchServerBackups = async () => {
    if (isLocalStorageMode) return;
    setLoadingServerBackups(true);
    try {
      const response = await fetch('/api/coefficients/backups');
      if (response.ok) {
        const list = await response.json();
        setServerBackups(list);
      }
    } catch (e) {
      console.error('Failed to load server backups', e);
    } finally {
      setLoadingServerBackups(false);
    }
  };

  React.useEffect(() => {
    if (!isLocalStorageMode) {
      fetchServerBackups();
    }
  }, [isLocalStorageMode]);

  // Export full system backup as JSON
  const handleExportSystem = () => {
    setIsExporting(true);
    try {
      const exportData = {
        type: 'smv_system_backup',
        exportedAt: new Date().toISOString(),
        version: 1,
        library,
        styles,
        history
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `smv_system_backup_${dateStr}_v${library.version}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg(t('Xuất dữ liệu hệ thống thành công! File đã được tải xuống.'));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(`${t("Lỗi khi xuất dữ liệu:")} ${err.message}`);
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processBackupFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processBackupFile(e.target.files[0]);
    }
  };

  // Process the uploaded backup file
  const processBackupFile = (file: File) => {
    setErrorMsg('');
    setImportSummary(null);

    if (!file.name.endsWith('.json')) {
      setErrorMsg(t('Vui lòng chọn tệp định dạng JSON (.json) được xuất từ hệ thống.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        // Validation
        if (!parsed || parsed.type !== 'smv_system_backup') {
          // Fallback check: maybe it's just a coefficients backup
          if (parsed.version && parsed.coefficients && parsed.partTiers) {
            setImportSummary({
              version: parsed.version,
              stylesCount: 0,
              historyCount: 0,
              parsedData: {
                library: parsed,
                styles: [],
                history: []
              }
            });
            setSelectedFile(file);
            return;
          }
          throw new Error(t('Định dạng tệp không hợp lệ. Phải là file backup xuất từ hệ thống SMV.'));
        }

        if (!parsed.library || !parsed.library.coefficients || !parsed.library.partTiers) {
          throw new Error(t('Tệp thiếu thông tin thư viện hệ số.'));
        }

        setImportSummary({
          version: parsed.library.version,
          stylesCount: Array.isArray(parsed.styles) ? parsed.styles.length : 0,
          historyCount: Array.isArray(parsed.history) ? parsed.history.length : 0,
          parsedData: parsed
        });
        setSelectedFile(file);
      } catch (err: any) {
        setErrorMsg(`${t("Không thể đọc file sao lưu:")} ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Commit the import
  const handleImportSystem = () => {
    if (!importSummary) return;

    const { parsedData, version, stylesCount } = importSummary;
    const confirmText = stylesCount > 0
      ? `${t("Bạn có chắc chắn muốn nạp dữ liệu? Thao tác này sẽ ghi đè và thay thế hoàn toàn:")}\n- ${t("Thư viện hệ số hiện tại")} (v${version})\n- ${t("Toàn bộ")} ${styles.length} ${t("Hồ sơ Style hiện tại")} (${stylesCount} style)\n\n${t("Dữ liệu hiện tại trên thiết bị này sẽ bị Xoá và không thể khôi phục!")}`
      : `${t("Bạn có chắc chắn muốn nạp dữ liệu? Thao tác này sẽ khôi phục thư viện hệ số về")} v${version}. ${t("Toàn bộ hệ số hiện tại sẽ bị ghi đè!")}`;

    if (!confirm(confirmText)) return;

    setIsImporting(true);
    try {
      // Build normalized system objects
      const finalLibrary: CoefficientLibrary = parsedData.library;
      const finalStyles: Style[] = Array.isArray(parsedData.styles) ? parsedData.styles : [];
      
      // Normalized history
      let finalHistory: CoefficientHistory[] = Array.isArray(parsedData.history) ? parsedData.history : [];
      
      // Add a restore record to history
      const restoreLog: CoefficientHistory = {
        id: `hist-restore-global-${Date.now()}`,
        timestamp: new Date().toISOString(),
        versionBefore: library.version,
        versionAfter: finalLibrary.version,
        action: 'Nạp bản sao lưu',
        details: `${t('Đã khôi phục toàn bộ hệ thống từ file')} "${selectedFile?.name || 'backup'}". ${t('Đã nạp')} ${finalStyles.length} styles.`
      };
      finalHistory.unshift(restoreLog);

      // Perform system restore
      onSystemRestore({
        library: finalLibrary,
        styles: finalStyles,
        history: finalHistory
      });

      setSuccessMsg(t('🎉 Đồng bộ khôi phục dữ liệu toàn bộ hệ thống thành công!'));
      setImportSummary(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setTimeout(() => setSuccessMsg(''), 5500);
    } catch (err: any) {
      setErrorMsg(`${t("Lỗi khi nạp khôi phục dữ liệu:")} ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Server backup triggers
  const handleCreateServerBackup = async () => {
    setServerBackupMsg('');
    try {
      const response = await fetch('/api/coefficients/backup', { method: 'POST' });
      const result = await response.json();
      if (response.ok) {
        setServerBackupMsg(`✅ ${t("Đã tạo sao lưu trên máy chủ thành công:")} ${result.fileName}`);
        fetchServerBackups();
      } else {
        setServerBackupMsg(`❌ ${t("Lỗi máy chủ:")} ${result.error}`);
      }
    } catch (e: any) {
      setServerBackupMsg(`❌ ${t("Lỗi kết nối:")} ${e.message}`);
    }
  };

  const handleRestoreServerBackup = async (fileName: string) => {
    if (!confirm(`${t("Xác nhận khôi phục thư viện hệ số về file sao lưu máy chủ")} "${fileName}"? ${t("Cấu hình hệ số hiện tại sẽ bị ghi đè!")}`)) {
      return;
    }
    setIsRestoringServer(fileName);
    try {
      const response = await fetch('/api/coefficients/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      });
      const result = await response.json();
      if (response.ok) {
        alert(`${t("Khôi phục thư viện hệ số thành công về phiên bản")} v${result.restoredLibrary.version}`);
        onLibraryUpdate();
      } else {
        alert(`${t("Lỗi khôi phục:")} ${result.error}`);
      }
    } catch (e: any) {
      alert(`${t("Lỗi kết nối máy chủ:")} ${e.message}`);
    } finally {
      setIsRestoringServer(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className={`p-5 rounded-2xl border flex flex-col gap-6 ${
      isDark ? 'bg-slate-800 border-slate-700/80 text-white' : 'bg-white border-gray-100 shadow-xs'
    }`} id="backup-restore-tab-container">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100/30 gap-4">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            <span>{t("Đồng Bộ, Sao Lưu & Khôi Phục Hệ Thống")}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {t("Quản lý dữ liệu hệ thống, nạp dữ liệu từ máy tính khác hoặc đồng bộ sang máy chủ Vercel / Live.")}
          </p>
        </div>

        {/* CONNECTION STATUS */}
        <div className={`flex items-center gap-1.5 font-bold px-3 py-1 rounded-full border text-[11px] self-start sm:self-auto ${
          isLocalStorageMode
            ? (isDark ? 'bg-amber-950/40 border-amber-800 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-700')
            : (isDark ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700')
        }`}>
          {isLocalStorageMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5 animate-pulse" />}
          <span>{t("Chế độ")}: {isLocalStorageMode ? t('Trình duyệt ngoại tuyến (Vercel/Local)') : t('Đồng bộ Máy chủ (Live)')}</span>
        </div>
      </div>

      {/* QUICK EXPLANATION BOX */}
      {isLocalStorageMode && (
        <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
          isDark ? 'bg-slate-900/40 border-slate-700/60' : 'bg-blue-50/50 border-blue-100'
        }`}>
          <div className="font-bold text-blue-600 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>{t("Mẹo di chuyển dữ liệu (Sync sang Vercel)")}</span>
          </div>
          <p className="text-gray-400">
            {t("Khi chạy ứng dụng trên Vercel, do tính chất máy chủ tĩnh (Serverless), ứng dụng sẽ chạy ở chế độ Lưu trữ Trình duyệt (LocalStorage) để bảo toàn 100% chức năng của bạn.")}
          </p>
          <p className="text-gray-400">
            {t("Để nạp nhanh dữ liệu bạn đã làm việc ở máy tính cá nhân (localhost) lên Vercel: Hãy xuất file sao lưu trên máy tính cá nhân, sau đó truy cập Vercel và Nạp file sao lưu đó vào đây. Hệ thống sẽ ngay lập tức đồng bộ toàn bộ Thư viện Hệ số, Hồ sơ Style, và Nhật ký!")}
          </p>
        </div>
      )}

      {/* SYSTEM STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/30 border-slate-700/50' : 'bg-slate-50/50 border-gray-150'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{t("Hồ sơ Style hiện có")}</span>
            <Shirt className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">{styles.length}</div>
          <div className="text-[10px] text-gray-400 mt-1">{t("Bản ghi ước lượng SMV")}</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/30 border-slate-700/50' : 'bg-slate-50/50 border-gray-150'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{t("Thư viện Hệ số")}</span>
            <Layers className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">v{library.version}</div>
          <div className="text-[10px] text-gray-400 mt-1">{t("Cập nhật")}: {formatDate(library.updatedAt)}</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-900/30 border-slate-700/50' : 'bg-slate-50/50 border-gray-150'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{t("Nhật ký hệ số")}</span>
            <History className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-black mt-2 font-mono">{history.length}</div>
          <div className="text-[10px] text-gray-400 mt-1">{t("Bản ghi lịch sử lưu trữ")}</div>
        </div>
      </div>

      {/* EXPORT & IMPORT MODULES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* EXPORT PANEL */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/20 border-slate-750' : 'bg-white border-gray-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                <FileDown className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold">1. {t("Xuất dữ liệu hệ thống (Backup)")}</h3>
            </div>
            
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">
              {t("Tải xuống toàn bộ cấu hình hệ thống bao gồm: Thư viện Hệ số hiện tại, Danh sách tất cả Hồ sơ Style (mã hàng) đã tính toán và Nhật ký thay đổi. File tải về dưới dạng tệp tin cứng an toàn")} <code>.json</code>.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100/20">
            <button
              onClick={handleExportSystem}
              disabled={isExporting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isExporting ? t('Đang tạo bản sao lưu...') : t('Tải xuống toàn bộ Dữ liệu (.json)')}
            </button>
          </div>
        </div>

        {/* IMPORT PANEL */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isDark ? 'bg-slate-900/20 border-slate-750' : 'bg-white border-gray-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <FileUp className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold">2. {t("Nạp dữ liệu hệ thống (Restore)")}</h3>
            </div>
            
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              {t("Chọn tệp sao lưu")} <code>.json</code> {t("từ máy tính của bạn để đồng bộ/khôi phục dữ liệu lên trình duyệt/máy chủ này.")}
            </p>

            {/* Drag and Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50/10' 
                  : isDark ? 'border-slate-700 hover:border-slate-550 bg-slate-800/20' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
              }`}
            >
              <Upload className="w-6 h-6 text-gray-400" />
              <p className="text-xs font-bold text-gray-400">{t("Kéo thả file .json vào đây hoặc click để duyệt")}</p>
              <p className="text-[10px] text-gray-450">{t("Hỗ trợ tệp backup toàn bộ hệ thống")}</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Import summary validation display */}
          {importSummary && (
            <div className={`mt-4 p-3 rounded-xl border space-y-2.5 text-xs animate-fadeIn ${
              isDark ? 'bg-slate-900/60 border-slate-700/80' : 'bg-emerald-50/60 border-emerald-100'
            }`}>
              <div className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t("Cấu trúc tệp hợp lệ! Bản tóm tắt nội dung:")}</span>
              </div>
              <ul className="space-y-1 pl-4 list-disc text-gray-400 font-medium">
                <li>{t("Thư viện hệ số")}: <strong className="text-blue-500">v{importSummary.version}</strong></li>
                <li>{t("Danh sách Style")}: <strong className="text-blue-500">{importSummary.stylesCount}</strong> {t("mã hàng")}</li>
                <li>{t("Lịch sử thay đổi")}: <strong className="text-blue-500">{importSummary.historyCount}</strong> {t("dòng nhật ký")}</li>
              </ul>
              <button
                type="button"
                onClick={handleImportSystem}
                disabled={isImporting}
                className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isImporting ? t('Đang nạp...') : t('Xác nhận Nạp & Ghi đè hệ thống')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ERROR / SUCCESS ALERTS */}
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SERVER-SIDE SAO LƯU MANAGER (Shown only if not in LocalStorage mode) */}
      {!isLocalStorageMode && (
        <div className="pt-6 border-t border-gray-100/20 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-500" />
                <span>{t("Sao lưu cấp độ Máy chủ (Server Database Backups)")}</span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {t("Các bản sao lưu cứng thư viện hệ số được tạo và lưu trực tiếp trên ổ đĩa máy chủ backend.")}
              </p>
            </div>
            <button
              onClick={handleCreateServerBackup}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap self-start"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t("Tạo bản Sao lưu máy chủ mới")}
            </button>
          </div>

          {serverBackupMsg && (
            <div className={`p-2.5 rounded-lg text-xs font-bold border ${
              serverBackupMsg.includes('Lỗi') || serverBackupMsg.includes('❌') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'
            }`}>
              {serverBackupMsg}
            </div>
          )}

          <div className="overflow-x-auto border border-gray-100/30 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b text-gray-400 font-mono ${isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-gray-50 border-gray-150'}`}>
                  <th className="p-3">{t("Tên File trên máy chủ")}</th>
                  <th className="p-3">{t("Thời điểm tạo")}</th>
                  <th className="p-3 text-right">{t("Kích thước file")}</th>
                  <th className="p-3 text-center w-28">{t("Hành động")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/20 font-mono">
                {serverBackups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-400 font-sans italic">
                      {loadingServerBackups ? t('Đang tải danh sách...') : t('Không có bản sao lưu nào trên máy chủ.')}
                    </td>
                  </tr>
                ) : (
                  serverBackups.map(backup => (
                    <tr key={backup.fileName} className="hover:bg-slate-50/10">
                      <td className="p-2.5 text-xs font-bold flex items-center gap-1.5">
                        <FileJson className="w-3.5 h-3.5 text-amber-500" />
                        <span className="truncate max-w-sm">{backup.fileName}</span>
                      </td>
                      <td className="p-2.5 text-gray-400 text-xs font-sans">
                        {formatDate(backup.createdAt)}
                      </td>
                      <td className="p-2.5 text-right text-gray-400 text-xs">
                        {formatSize(backup.sizeBytes)}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          disabled={isRestoringServer !== null}
                          onClick={() => handleRestoreServerBackup(backup.fileName)}
                          className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-600 text-purple-500 hover:text-white rounded-lg text-xs font-sans font-bold transition-all flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <ArrowDownToLine className="w-3 h-3" />
                          {isRestoringServer === backup.fileName ? t('Đang nạp...') : t('Nạp')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
