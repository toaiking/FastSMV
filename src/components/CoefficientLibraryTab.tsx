import React, { useState, useEffect } from 'react';
import { CoefficientLibrary, Coefficient, PartTier, CoefficientCategory, CoefficientHistory } from '../types';
import { 
  Plus, Trash2, Save, Undo, Archive, CheckCircle, AlertCircle, FileJson, ArrowDownToLine, RefreshCw, Layers, Upload
} from 'lucide-react';

interface CoefficientLibraryTabProps {
  library: CoefficientLibrary;
  onLibraryUpdate: () => void;
  isDark?: boolean;
  isLocalStorageMode?: boolean;
}

interface BackupFile {
  fileName: string;
  createdAt: string;
  sizeBytes: number;
}

export default function CoefficientLibraryTab({
  library,
  onLibraryUpdate,
  isDark = false,
  isLocalStorageMode = false
}: CoefficientLibraryTabProps) {
  // Local editable copy of the library
  const [localCoefficients, setLocalCoefficients] = useState<Coefficient[]>([]);
  const [localPartTiers, setLocalPartTiers] = useState<PartTier[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Sub-tabs: 4 categories + part tiers + backups
  const [subTab, setSubTab] = useState<'product_type' | 'complexity' | 'experience' | 'allowance' | 'tiers' | 'backups'>('product_type');

  // Change confirmation modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [changeDescription, setChangeDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Backup state
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  // Load from props
  useEffect(() => {
    setLocalCoefficients(JSON.parse(JSON.stringify(library.coefficients)));
    setLocalPartTiers(JSON.parse(JSON.stringify(library.partTiers)));
    setHasChanges(false);
  }, [library]);

  // Fetch backups whenever user enters backups subtab
  useEffect(() => {
    if (subTab === 'backups') {
      fetchBackups();
    }
  }, [subTab]);

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/coefficients/backups');
      if (response.ok) {
        const list = await response.json();
        setBackups(list);
      }
    } catch (e) {
      console.error('Failed to load backups', e);
    }
  };

  // Mark changes detected
  const markChanged = () => {
    setHasChanges(true);
  };

  // Revert changes
  const handleDiscardChanges = () => {
    if (confirm('Bạn có chắc chắn muốn hủy bỏ toàn bộ chỉnh sửa chưa lưu?')) {
      setLocalCoefficients(JSON.parse(JSON.stringify(library.coefficients)));
      setLocalPartTiers(JSON.parse(JSON.stringify(library.partTiers)));
      setHasChanges(false);
    }
  };

  // COEFFICIENTS: Edit a field
  const handleEditCoefficient = (id: string, field: keyof Coefficient, value: any) => {
    setLocalCoefficients(prev => 
      prev.map(c => {
        if (c.id === id) {
          markChanged();
          return { ...c, [field]: value };
        }
        return c;
      })
    );
  };

  // COEFFICIENTS: Add a row
  const handleAddCoefficient = (category: CoefficientCategory) => {
    const newItem: Coefficient = {
      id: `coef-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      category,
      name: 'Hệ số mới',
      value: 1.0,
      description: 'Nhập mô tả hệ số này...'
    };
    setLocalCoefficients(prev => [...prev, newItem]);
    markChanged();
  };

  // COEFFICIENTS: Delete a row
  const handleDeleteCoefficient = (id: string) => {
    if (confirm('Xóa hệ số này? Mẫu cũ sử dụng ID này vẫn giữ nguyên thông tin gốc, nhưng không thể chọn mới hệ số này.')) {
      setLocalCoefficients(prev => prev.filter(c => c.id !== id));
      markChanged();
    }
  };

  // PART TIERS: Edit a field
  const handleEditPartTier = (id: string, field: keyof PartTier, value: any) => {
    setLocalPartTiers(prev => 
      prev.map(t => {
        if (t.id === id) {
          markChanged();
          // parse numbers properly
          let parsedValue = value;
          if (field === 'minParts' || field === 'maxParts' || field === 'multiplier') {
            parsedValue = parseFloat(value) || 0;
          }
          return { ...t, [field]: parsedValue };
        }
        return t;
      })
    );
  };

  // PART TIERS: Add a tier
  const handleAddPartTier = () => {
    const nextMin = localPartTiers.length > 0 
      ? Math.max(...localPartTiers.map(t => t.maxParts)) + 1 
      : 1;

    const newTier: PartTier = {
      id: `tier-${Date.now()}`,
      minParts: isFinite(nextMin) ? nextMin : 21,
      maxParts: 9999,
      multiplier: 1.0,
      description: `Bậc số lượng chi tiết (${isFinite(nextMin) ? nextMin : 21} trở lên)`
    };

    setLocalPartTiers(prev => [...prev, newTier]);
    markChanged();
  };

  // PART TIERS: Delete a tier
  const handleDeletePartTier = (id: string) => {
    if (confirm('Xóa bậc chi tiết này?')) {
      setLocalPartTiers(prev => prev.filter(t => t.id !== id));
      markChanged();
    }
  };

  // Save batch submission handler
  const handleTriggerSave = () => {
    // Validate inputs
    const emptyNames = localCoefficients.some(c => !c.name.trim());
    if (emptyNames) {
      alert('Tên hệ số không được để trống.');
      return;
    }

    const invalidValues = localCoefficients.some(c => c.value <= 0);
    if (invalidValues) {
      alert('Giá trị hệ số phải lớn hơn 0.');
      return;
    }

    setChangeDescription(`Cập nhật thư viện hệ số: điều chỉnh các thông số trong tab ${
      subTab === 'tiers' ? 'Bậc chi tiết' : 'Hệ số nhóm'
    }`);
    setSaveError('');
    setSaveSuccess('');
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    if (!changeDescription.trim()) {
      setSaveError('Vui lòng nhập lý do/mô tả thay đổi để ghi nhận lịch sử.');
      return;
    }

    setIsSaving(true);
    setSaveError('');

    if (isLocalStorageMode) {
      try {
        const nextVersion = library.version + 1;
        const updatedLibrary: CoefficientLibrary = {
          version: nextVersion,
          updatedAt: new Date().toISOString(),
          coefficients: localCoefficients,
          partTiers: localPartTiers
        };

        localStorage.setItem('smv_coefficients', JSON.stringify(updatedLibrary));

        // Add history item to localStorage
        const localHistoryStr = localStorage.getItem('smv_history') || '[]';
        const localHistory = JSON.parse(localHistoryStr) as CoefficientHistory[];
        const newHistoryItem: CoefficientHistory = {
          id: `hist-${Date.now()}`,
          timestamp: new Date().toISOString(),
          versionBefore: library.version,
          versionAfter: nextVersion,
          action: 'Cập nhật hệ số',
          details: changeDescription.trim() || `Cập nhật thư viện hệ số (Lưu trên thiết bị) lên phiên bản ${nextVersion}`
        };

        localHistory.unshift(newHistoryItem);
        localStorage.setItem('smv_history', JSON.stringify(localHistory));

        setSaveSuccess('Cập nhật hệ số thành công (Lưu trên thiết bị)!');
        setHasChanges(false);

        setTimeout(() => {
          setShowSaveModal(false);
          onLibraryUpdate();
        }, 1000);

      } catch (err: any) {
        setSaveError(err.message || 'Lỗi lưu cục bộ.');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    try {
      const response = await fetch('/api/coefficients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coefficients: localCoefficients,
          partTiers: localPartTiers,
          changeDescription: changeDescription.trim()
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gặp lỗi khi lưu hệ số.');
      }

      setSaveSuccess('Cập nhật hệ số thành công!');
      setHasChanges(false);
      setTimeout(() => {
        setShowSaveModal(false);
        onLibraryUpdate();
      }, 1000);

    } catch (e: any) {
      setSaveError(e.message || 'Lỗi kết nối.');
    } finally {
      setIsSaving(false);
    }
  };

  // Backup & Restore Actions
  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setBackupMsg('');

    if (isLocalStorageMode) {
      try {
        const dataStr = JSON.stringify(library, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `smv_coefficients_v${library.version}_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setBackupMsg(`✅ Đã tải file backup (.json) về thiết bị thành công!`);
      } catch (err: any) {
        setBackupMsg(`❌ Lỗi tải backup: ${err.message}`);
      } finally {
        setIsBackingUp(false);
      }
      return;
    }

    try {
      const response = await fetch('/api/coefficients/backup', { method: 'POST' });
      const result = await response.json();
      if (response.ok) {
        setBackupMsg(`✅ Đã tạo file backup thành công: ${result.fileName}`);
        fetchBackups();
      } else {
        setBackupMsg(`❌ Lỗi: ${result.error}`);
      }
    } catch (e: any) {
      setBackupMsg(`❌ Lỗi kết nối: ${e.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleLocalRestoreUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as CoefficientLibrary;

        if (!parsed.version || !parsed.coefficients || !parsed.partTiers) {
          throw new Error('Định dạng file sao lưu không hợp lệ. Phải chứa đầy đủ phiên bản và hằng số.');
        }

        if (confirm(`Bạn có chắc chắn muốn khôi phục thư viện hệ số về phiên bản v${parsed.version} từ file "${file.name}"? Dữ liệu hiện tại sẽ bị ghi đè hoàn toàn.`)) {
          // Backup current in history
          const localHistoryStr = localStorage.getItem('smv_history') || '[]';
          const localHistory = JSON.parse(localHistoryStr) as CoefficientHistory[];
          const restoreHistoryItem: CoefficientHistory = {
            id: `hist-restore-${Date.now()}`,
            timestamp: new Date().toISOString(),
            versionBefore: library.version,
            versionAfter: parsed.version,
            action: 'Khôi phục hệ số',
            details: `Khôi phục thư viện hệ số về phiên bản ${parsed.version} từ file: ${file.name}`
          };
          localHistory.unshift(restoreHistoryItem);
          
          localStorage.setItem('smv_coefficients', JSON.stringify(parsed));
          localStorage.setItem('smv_history', JSON.stringify(localHistory));

          alert(`Khôi phục thư viện hệ số về phiên bản v${parsed.version} thành công!`);
          onLibraryUpdate();
        }
      } catch (err: any) {
        alert(`Không thể đọc file sao lưu: ${err.message}`);
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  const handleRestoreBackup = async (fileName: string) => {
    if (!confirm(`Bạn có chắc muốn khôi phục về file backup "${fileName}"? Hệ số hiện tại sẽ bị ghi đè và một file backup tự động của hệ số hiện tại sẽ được tạo.`)) {
      return;
    }

    setIsRestoring(fileName);
    try {
      const response = await fetch('/api/coefficients/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      });

      const result = await response.json();
      if (response.ok) {
        alert(`Khôi phục thành công! Thư viện đã được tải lại về phiên bản v${result.restoredLibrary.version}`);
        onLibraryUpdate();
      } else {
        alert(`Lỗi khôi phục: ${result.error}`);
      }
    } catch (e: any) {
      alert(`Lỗi kết nối: ${e.message}`);
    } finally {
      setIsRestoring(null);
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

  // Filter current active coefficient group
  const activeCoefficients = localCoefficients.filter(c => c.category === subTab);

  return (
    <div className={`p-5 rounded-2xl border flex flex-col gap-5 ${
      isDark ? 'bg-slate-800 border-slate-700/80 text-white' : 'bg-white border-gray-100 shadow-xs'
    }`} id="coefficients-tab-container">
      {/* Tab Header with version */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100/30 gap-4">
        <div>
          <h2 className="text-base font-bold">📚 Thư viện Hệ Số & Bậc Chi Tiết</h2>
          <p className="text-xs text-gray-400 mt-1">
            Thiết lập các hằng số điều chỉnh cho công thức ước lượng SMV. Phiên bản hiện tại:{' '}
            <strong className="text-blue-600 font-mono text-sm bg-blue-50 px-2 py-0.5 rounded-sm">v{library.version}</strong> (Cập nhật lúc:{' '}
            <span className="font-mono text-[11px]">{formatDate(library.updatedAt)}</span>)
          </p>
        </div>

        {/* Change detected alert banner */}
        {hasChanges && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-xl text-amber-500 text-xs font-semibold animate-pulse">
            <span className="block text-amber-600 font-bold">Có thay đổi chưa lưu!</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="px-2.5 py-1 text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleTriggerSave}
                className="px-2.5 py-1 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer font-bold"
              >
                <Save className="w-3 h-3" /> Lưu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Categories submenus selection */}
      <div className="flex flex-wrap border-b border-gray-100/25" id="coef-sub-tabs">
        <button
          onClick={() => setSubTab('product_type')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            subTab === 'product_type' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          👕 Loại sản phẩm
        </button>
        <button
          onClick={() => setSubTab('complexity')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            subTab === 'complexity' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          ⚙️ Độ phức tạp
        </button>
        <button
          onClick={() => setSubTab('experience')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            subTab === 'experience' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          👤 Kinh nghiệm
        </button>
        <button
          onClick={() => setSubTab('allowance')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            subTab === 'allowance' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          🔋 Allowance
        </button>
        <button
          onClick={() => setSubTab('tiers')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            subTab === 'tiers' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          🔢 Bậc rập
        </button>
        <button
          onClick={() => setSubTab('backups')}
          className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            subTab === 'backups' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          💽 Sao lưu
        </button>
      </div>

      {/* SUBTAB CONTENTS: Standard Categories (Product type, complexity, experience, allowance) */}
      {(subTab === 'product_type' || subTab === 'complexity' || subTab === 'experience' || subTab === 'allowance') && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              Nhập giá trị hệ số nhân trực tiếp.
            </span>
            <button
              type="button"
              onClick={() => handleAddCoefficient(subTab)}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Thêm mới
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-100/30 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b text-gray-400 font-mono ${isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-gray-50 border-gray-150'}`}>
                  <th className="p-3 w-1/3">Tên hệ số / Cấp độ</th>
                  <th className="p-3 w-1/4 text-right">Giá trị hệ số nhân</th>
                  <th className="p-3">Diễn giải ý nghĩa</th>
                  <th className="p-3 text-center w-16">Xoá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/20">
                {activeCoefficients.map(coef => (
                  <tr key={coef.id} className="hover:bg-slate-50/10">
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={coef.name}
                        onChange={e => handleEditCoefficient(coef.id, 'name', e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                          isDark 
                            ? 'bg-slate-700 border-slate-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-950'
                        }`}
                      />
                    </td>
                    <td className="p-2.5">
                      <div className="relative max-w-[110px] ml-auto">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={coef.value}
                          onChange={e => handleEditCoefficient(coef.id, 'value', parseFloat(e.target.value) || 0)}
                          className={`w-full pl-2 pr-6 py-1.5 rounded-lg border text-right font-mono font-bold text-blue-500 ${
                            isDark 
                              ? 'bg-slate-700 border-slate-600' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                        <div className="absolute inset-y-0 right-1.5 flex items-center pointer-events-none">
                          <span className="text-[9px] text-gray-400 font-bold">
                            {coef.category === 'allowance' ? '%' : 'x'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={coef.description || ''}
                        onChange={e => handleEditCoefficient(coef.id, 'description', e.target.value)}
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs ${
                          isDark 
                            ? 'bg-slate-700/60 border-slate-600/60 text-slate-300' 
                            : 'bg-white border-gray-200 text-gray-500'
                        }`}
                        placeholder="Thêm mô tả về hệ số..."
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteCoefficient(coef.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: Part Tiers */}
      {subTab === 'tiers' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Layers className="w-4 h-4 text-gray-400" />
              Tách hệ số theo số lượng chi tiết Pattern.
            </span>
            <button
              type="button"
              onClick={handleAddPartTier}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Thêm bậc rập
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-100/30 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b text-gray-400 font-mono ${isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-gray-50 border-gray-150'}`}>
                  <th className="p-3 w-1/4">Số chi tiết từ (Min)</th>
                  <th className="p-3 w-1/4">Số chi tiết đến (Max)</th>
                  <th className="p-3 w-1/5 text-right">Hệ số nhân</th>
                  <th className="p-3">Mô tả / Diễn giải</th>
                  <th className="p-3 text-center w-16">Xoá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/20 font-mono">
                {localPartTiers.map(tier => (
                  <tr key={tier.id} className="hover:bg-slate-50/10">
                    <td className="p-2.5">
                      <input
                        type="number"
                        min="0"
                        value={tier.minParts}
                        onChange={e => handleEditPartTier(tier.id, 'minParts', e.target.value)}
                        className={`w-full px-2 py-1.5 rounded-lg border text-center font-bold text-gray-700 ${
                          isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-gray-300'
                        }`}
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        min="0"
                        value={tier.maxParts}
                        onChange={e => handleEditPartTier(tier.id, 'maxParts', e.target.value)}
                        className={`w-full px-2 py-1.5 rounded-lg border text-center font-bold text-gray-700 ${
                          isDark ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-gray-300'
                        }`}
                      />
                    </td>
                    <td className="p-2.5">
                      <div className="relative max-w-[100px] ml-auto">
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={tier.multiplier}
                          onChange={e => handleEditPartTier(tier.id, 'multiplier', e.target.value)}
                          className={`w-full pl-2 pr-6 py-1.5 rounded-lg border text-right font-bold text-blue-500 ${
                            isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
                          }`}
                        />
                        <div className="absolute inset-y-0 right-1.5 flex items-center pointer-events-none">
                          <span className="text-[10px] text-gray-400 font-bold">x</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-2.5 font-sans">
                      <input
                        type="text"
                        value={tier.description}
                        onChange={e => handleEditPartTier(tier.id, 'description', e.target.value)}
                        className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
                          isDark ? 'bg-slate-700/60 border-slate-600/60 text-slate-300' : 'bg-white border-gray-200 text-gray-500'
                        }`}
                        placeholder="VD: Rất nhiều chi tiết..."
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeletePartTier(tier.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: Backup and Restore */}
      {subTab === 'backups' && (
        <div className="flex flex-col gap-5" id="backups-manager">
          {isLocalStorageMode ? (
            <>
              <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                isDark ? 'bg-slate-900 border-slate-750' : 'bg-slate-50 border-gray-200'
              }`}>
                <div>
                  <h3 className="text-xs font-bold flex items-center gap-1.5">
                    <Archive className="w-4 h-4 text-blue-500" /> Tải file Sao lưu (.json)
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Tải về máy tính một bản sao lưu cứng (.json) chứa toàn bộ cấu hình hệ số hiện tại của bạn.
                  </p>
                </div>
                <button
                  onClick={handleCreateBackup}
                  disabled={isBackingUp}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
                  {isBackingUp ? 'Đang tạo...' : '💽 Tải xuống Sao lưu (.json)'}
                </button>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                isDark ? 'bg-slate-900 border-slate-750' : 'bg-slate-50 border-gray-200'
              }`}>
                <div>
                  <h3 className="text-xs font-bold flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-emerald-500" /> Khôi phục từ File (.json)
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Chọn file sao lưu `.json` đã tải trước đó từ thiết bị của bạn để khôi phục cấu hình hệ số.
                  </p>
                </div>
                <label className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nạp file Sao lưu</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleLocalRestoreUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </>
          ) : (
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              isDark ? 'bg-slate-900 border-slate-750' : 'bg-slate-50 border-gray-200'
            }`}>
              <div>
                <h3 className="text-xs font-bold flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-blue-500" /> Sao lưu thủ công tức thì
                </h3>
                <p className="text-[11px] text-gray-400 mt-1">
                  Tạo một bản sao lưu an toàn của thư viện hệ số hiện tại trên server.
                </p>
              </div>
              <button
                onClick={handleCreateBackup}
                disabled={isBackingUp}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
                {isBackingUp ? 'Đang tạo backup...' : '💽 Sao lưu rập mẫu'}
              </button>
            </div>
          )}

          {backupMsg && (
            <div className={`p-3 text-xs font-bold rounded-lg border ${
              backupMsg.includes('Lỗi') ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-800 border-emerald-100'
            }`}>
              {backupMsg}
            </div>
          )}

          {/* Backups List Table */}
          <div className="flex flex-col gap-2">
            <h4 className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">Danh sách file sao lưu cứng (.json)</h4>
            
            <div className="overflow-x-auto border border-gray-100/30 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-gray-400 font-mono ${isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-gray-50 border-gray-150'}`}>
                    <th className="p-3">Tên File Backup (.json)</th>
                    <th className="p-3">Ngày tạo sao lưu</th>
                    <th className="p-3 text-right">Kích thước file</th>
                    <th className="p-3 text-center w-36">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/20 font-mono">
                  {backups.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400 font-sans italic">
                        Chưa tìm thấy bản sao lưu nào. Hãy bấm nút sao lưu để tạo bản đầu tiên.
                      </td>
                    </tr>
                  ) : (
                    backups.map(backup => (
                      <tr key={backup.fileName} className="hover:bg-slate-50/10">
                        <td className="p-2.5 text-xs font-bold flex items-center gap-2">
                          <FileJson className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <span className="truncate max-w-xs">{backup.fileName}</span>
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
                            disabled={isRestoring !== null}
                            onClick={() => handleRestoreBackup(backup.fileName)}
                            className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg text-xs font-sans font-bold transition-all flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                            {isRestoring === backup.fileName ? 'Đang nạp...' : 'Nạp'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Save Button for active edits (visible in CRUD subtabs) */}
      {subTab !== 'backups' && hasChanges && (
        <div className="pt-3 border-t border-gray-100/30 flex justify-end">
          <button
            onClick={handleTriggerSave}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/15 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" /> Lưu thay đổi hệ số
          </button>
        </div>
      )}

      {/* SAVE BATCH MODAL/DIALOG */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" id="save-reason-modal">
          <div className={`rounded-2xl max-w-lg w-full p-5 shadow-2xl border animate-in fade-in zoom-in duration-200 ${
            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-100'
          }`}>
            <h3 className="text-base font-bold mb-1">📝 Nhật ký thay đổi hệ số</h3>
            <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
              Nhập lý do hoặc chi tiết thay đổi để lưu vào nhật ký hệ thống (ví dụ: "Cập nhật hệ số Áo Jeans để bù đắp tay nghề công nhân yếu").
            </p>

            <textarea
              rows={3}
              required
              placeholder="Nhập lý do thay đổi..."
              value={changeDescription}
              onChange={e => setChangeDescription(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 mb-4 ${
                isDark ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-50 text-gray-900 border-gray-300'
              }`}
            />

            {saveError && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4" />
                <span>{saveError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-100 flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4" />
                <span>{saveSuccess}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100/20">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-200 bg-transparent rounded-lg transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmSave}
                className="px-5 py-2.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              >
                {isSaving ? 'Đang lưu...' : '✓ Xác nhận & Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
