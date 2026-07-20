import React, { useState, useEffect } from 'react';
import { CoefficientLibrary, Style, CoefficientHistory } from './types';
import HomeTab from './components/HomeTab';
import NewStyleTab from './components/NewStyleTab';
import StyleListTab from './components/StyleListTab';
import CoefficientLibraryTab from './components/CoefficientLibraryTab';
import HistoryTab from './components/HistoryTab';
import { 
  Calculator, ListChecks, BookOpen, History, Shirt, Wifi, AlertTriangle, Loader2, Home, Sun, Moon, Sparkles 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'new_style' | 'styles_list' | 'coefficients' | 'history'>('home');
  
  // Theme State
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('smv_dark_mode') === 'true';
  });

  // Data States
  const [library, setLibrary] = useState<CoefficientLibrary | null>(null);
  const [styles, setStyles] = useState<Style[]>([]);
  const [history, setHistory] = useState<CoefficientHistory[]>([]);
  
  // Editing active state
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);

  // UI status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply dark mode theme class to HTML/Body or save it
  useEffect(() => {
    localStorage.setItem('smv_dark_mode', String(isDark));
  }, [isDark]);

  // Load all databases from the server
  const loadAllData = async () => {
    try {
      const [coefRes, stylesRes, historyRes] = await Promise.all([
        fetch('/api/coefficients'),
        fetch('/api/styles'),
        fetch('/api/coefficients/history')
      ]);

      if (!coefRes.ok || !stylesRes.ok || !historyRes.ok) {
        throw new Error('Lỗi đồng bộ dữ liệu từ máy chủ.');
      }

      const coefData = await coefRes.json();
      const stylesData = await stylesRes.json();
      const historyData = await historyRes.json();

      setLibrary(coefData);
      setStyles(stylesData);
      setHistory(historyData);
      setError(null);
    } catch (err: any) {
      console.error('Data load error:', err);
      setError('Không thể kết nối đến máy chủ lưu trữ. Vui lòng kiểm tra lại kết nối mạng hoặc tiến trình server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Delete a Style
  const handleDeleteStyle = async (id: string) => {
    try {
      const response = await fetch(`/api/styles/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        // Optimistic update
        setStyles(prev => prev.filter(s => s.id !== id));
        // Reload to keep perfectly synced
        loadAllData();
      } else {
        const result = await response.json();
        alert(result.error || 'Lỗi khi xoá Style.');
      }
    } catch (err: any) {
      alert('Không thể kết nối máy chủ để thực hiện xoá.');
    }
  };

  // Trigger editing a Style
  const handleEditStyle = (style: Style) => {
    setEditingStyle(style);
    setActiveTab('new_style');
  };

  // Save successful handler
  const handleSaveSuccess = () => {
    setEditingStyle(null);
    setActiveTab('styles_list');
    loadAllData();
  };

  const handleCancelEdit = () => {
    setEditingStyle(null);
    setActiveTab('styles_list');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100" id="app-loading">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Đang tải cơ sở dữ liệu SMV Estimator...</p>
        <p className="text-xs text-slate-400 mt-1.5">Đồng bộ hóa thư viện hệ số và lịch sử rập...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-all pb-20 md:pb-6 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`} id="app-shell">
      
      {/* GLOBAL HEADER BAR */}
      <header className={`border-b sticky top-0 z-40 transition-all ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200'
      }`} id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-2.5 flex items-center justify-between gap-4">
          
          {/* Logo & title */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm flex-shrink-0">
              <Shirt className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-tight font-sans">SMV Estimator</h1>
                <span className="px-1 py-0.2 text-[7px] font-extrabold text-blue-100 bg-blue-700/80 rounded">PRO</span>
              </div>
            </div>
          </div>

          {/* Status info bar & Theme Switcher */}
          <div className="flex items-center gap-2.5 text-xs">
            {/* Sync indicators */}
            <div className={`items-center gap-1 font-semibold px-2 py-0.5 rounded-md border text-[10px] hidden sm:flex ${
              isDark ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
            }`}>
              <Wifi className="w-3 h-3" />
              <span>Offline</span>
            </div>

            {library && (
              <div className={`font-mono text-[10px] font-bold hidden md:block ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                v{library.version}
              </div>
            )}

            {/* Light/Dark mode switcher */}
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer active:scale-90 ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' 
                  : 'bg-slate-50 border-gray-200 text-slate-500 hover:bg-gray-100'
              }`}
              title={isDark ? "Chế độ Sáng" : "Chế độ Tối"}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* DESKTOP NAVIGATION TABS RAIL (Hidden on Mobile) */}
      <nav className={`border-b sticky top-[49px] z-30 shadow-xs hidden md:block transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800/80' : 'bg-white border-gray-200/60'
      }`} id="app-navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-1.5" id="navigation-rail">
            <button
              onClick={() => {
                setActiveTab('home');
                setEditingStyle(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/70'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('new_style');
                if (editingStyle) setEditingStyle(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'new_style'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/70'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{editingStyle ? 'Sửa Style' : 'Tính SMV'}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('styles_list');
                setEditingStyle(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'styles_list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/70'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Hồ sơ Style ({styles.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('coefficients');
                setEditingStyle(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'coefficients'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/70'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Thư viện Hệ số</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                setEditingStyle(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/70'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Lịch sử ({history.length})</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAVIGATION BAR (Visible only on Mobile) */}
      <nav className={`md:hidden fixed bottom-0 inset-x-0 z-50 px-2 py-1 flex justify-around items-center shadow-[0_-4px_12px_rgba(0,0,0,0.08)] border-t transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-slate-800'
      }`} id="app-mobile-nav">
        
        {/* Home tab button */}
        <button
          onClick={() => {
            setActiveTab('home');
            setEditingStyle(null);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all active:scale-90 cursor-pointer ${
            activeTab === 'home'
              ? 'text-blue-500 font-extrabold scale-105'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Home className="w-4.5 h-4.5" />
          <span className="text-[8px] font-bold">Home</span>
        </button>

        {/* New Style (Calculator) tab button */}
        <button
          onClick={() => {
            setActiveTab('new_style');
            if (editingStyle) setEditingStyle(null);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all active:scale-90 cursor-pointer ${
            activeTab === 'new_style'
              ? 'text-blue-500 font-extrabold scale-105'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Calculator className="w-4.5 h-4.5" />
          <span className="text-[8px] font-bold">{editingStyle ? 'Sửa' : 'Tính SMV'}</span>
        </button>

        {/* Style List tab button */}
        <button
          onClick={() => {
            setActiveTab('styles_list');
            setEditingStyle(null);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all active:scale-90 cursor-pointer ${
            activeTab === 'styles_list'
              ? 'text-blue-500 font-extrabold scale-105'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ListChecks className="w-4.5 h-4.5" />
          <span className="text-[8px] font-bold">Hồ sơ ({styles.length})</span>
        </button>

        {/* Coefficients Tab Button */}
        <button
          onClick={() => {
            setActiveTab('coefficients');
            setEditingStyle(null);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all active:scale-90 cursor-pointer ${
            activeTab === 'coefficients'
              ? 'text-blue-500 font-extrabold scale-105'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <BookOpen className="w-4.5 h-4.5" />
          <span className="text-[8px] font-bold">Thư viện</span>
        </button>

        {/* History Tab Button */}
        <button
          onClick={() => {
            setActiveTab('history');
            setEditingStyle(null);
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all active:scale-90 cursor-pointer ${
            activeTab === 'history'
              ? 'text-blue-500 font-extrabold scale-105'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <History className="w-4.5 h-4.5" />
          <span className="text-[8px] font-bold">Nhật ký</span>
        </button>
      </nav>

      {/* MAIN CONTAINER FOR CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6" id="app-main-content">
        {/* Error message box if fetching failed */}
        {error && (
          <div className="mb-5 p-4 bg-red-50 text-red-800 rounded-xl border border-red-100 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Lỗi đồng bộ dữ liệu hệ thống!</p>
              <p className="text-xs text-red-600/90 mt-0.5">{error}</p>
              <button 
                onClick={loadAllData} 
                className="mt-2 text-xs font-bold text-red-800 hover:underline cursor-pointer bg-red-100 px-2 py-1 rounded"
              >
                Tải lại trang ngay
              </button>
            </div>
          </div>
        )}

        {/* Tab router switcher */}
        {!error && library && (
          <div id="tab-content" className="animate-fadeIn">
            {activeTab === 'home' && (
              <HomeTab
                styles={styles}
                library={library}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onEditStyle={handleEditStyle}
                isDark={isDark}
              />
            )}

            {activeTab === 'new_style' && (
              <NewStyleTab
                library={library}
                editingStyle={editingStyle}
                onSaveSuccess={handleSaveSuccess}
                onCancelEdit={handleCancelEdit}
                isDark={isDark}
              />
            )}

            {activeTab === 'styles_list' && (
              <StyleListTab
                styles={styles}
                onEditStyle={handleEditStyle}
                onDeleteStyle={handleDeleteStyle}
                isDark={isDark}
              />
            )}

            {activeTab === 'coefficients' && (
              <CoefficientLibraryTab
                library={library}
                onLibraryUpdate={loadAllData}
                isDark={isDark}
              />
            )}

            {activeTab === 'history' && (
              <HistoryTab
                history={history}
                isDark={isDark}
              />
            )}
          </div>
        )}
      </main>

      {/* FOOTER BAR (Hidden on mobile to save layout space) */}
      <footer className={`border-t py-5 mt-8 text-center text-xs text-gray-400 hidden sm:block transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
      }`} id="app-footer">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 SMV Estimator — Giải pháp chuyển đổi số thông minh cho ngành may mặc.</p>
          <p className="mt-1">
            Thiết kế kiến trúc Module hóa tách biệt logic kinh nghiệm và giao diện • Sai số định biên chấp nhận ±20–25%
          </p>
        </div>
      </footer>
    </div>
  );
}
