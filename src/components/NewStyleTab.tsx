import React, { useState, useEffect, useRef } from 'react';
import { CoefficientLibrary, Style, Coefficient, PartTier, SMVCalculationDetails } from '../types';
import { 
  Play, Save, CheckCircle2, RotateCcw, AlertCircle, FileSpreadsheet, Eye,
  Camera, Mic, MicOff, Plus, Minus, RefreshCw, X, Sliders, Check, Upload, Sparkles, HelpCircle, Shirt
} from 'lucide-react';
import { exportSingleStyleToExcel } from './ExcelExporter';

interface NewStyleTabProps {
  library: CoefficientLibrary;
  editingStyle: Style | null;
  onSaveSuccess: () => void;
  onCancelEdit: () => void;
  isDark?: boolean;
}

// Preset patterns for simulated camera capture
const MOCK_PATTERNS = [
  {
    name: 'Áo thun T-Shirt Basic',
    parts: 6,
    productTypeKeyword: 'Áo thun',
    description: 'Rập gồm: Thân trước (1), Thân sau (1), Tay áo (2), Bo cổ (1), Đắp vai (1).',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Sơ mi dài tay (Shirt)',
    parts: 14,
    productTypeKeyword: 'Sơ mi',
    description: 'Rập gồm: Thân trước (2), Thân sau (1), Đô sau (1), Tay áo (2), Cổ áo (2), Chân cổ (1), Măng sét (2), Trụ tay (2), Túi ngực (1).',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Quần Jeans Denim',
    parts: 12,
    productTypeKeyword: 'Quần jeans',
    description: 'Rập gồm: Thân trước (2), Thân sau (2), Túi trước (2), Túi sau (2), Túi đồng xu (1), Đai quần (1), Đáp khoá (2).',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=60'
  },
  {
    name: 'Áo khoác gió (Jacket)',
    parts: 18,
    productTypeKeyword: 'Áo khoác',
    description: 'Rập gồm: Thân trước (2), Thân sau (1), Tay áo (2), Mũ trùm (3), Lót trong (3), Túi sườn (2), Nẹp khoá (1), Bo gấu (2), Bo tay (2).',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60'
  }
];

export default function NewStyleTab({
  library,
  editingStyle,
  onSaveSuccess,
  onCancelEdit,
  isDark = false
}: NewStyleTabProps) {
  // Form States
  const [styleCode, setStyleCode] = useState('');
  const [styleName, setStyleName] = useState('');
  const [customer, setCustomer] = useState('');
  const [partsCount, setPartsCount] = useState<number>(10);
  const [baseSmvMethod, setBaseSmvMethod] = useState<'manual' | 'auto'>('auto');
  const [partsSmvRate, setPartsSmvRate] = useState<number>(0.35);
  const [manualBaseSmv, setManualBaseSmv] = useState<number>(3.5);
  const [estimator, setEstimator] = useState('');
  const [notes, setNotes] = useState('');
  const [patternImage, setPatternImage] = useState<string>('');

  // Selected Coefficient IDs
  const [selectedProductTypeId, setSelectedProductTypeId] = useState('');
  const [selectedComplexityId, setSelectedComplexityId] = useState('');
  const [selectedExperienceId, setSelectedExperienceId] = useState('');
  const [selectedAllowanceId, setSelectedAllowanceId] = useState('');

  // UI States
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeCalculation, setActiveCalculation] = useState<SMVCalculationDetails | null>(null);

  // Camera & Voice Support States
  const [isListening, setIsListening] = useState<'styleName' | 'notes' | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(true);
  const [showPatternPicker, setShowPatternPicker] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Group coefficients by category
  const productTypes = library.coefficients.filter(c => c.category === 'product_type');
  const complexities = library.coefficients.filter(c => c.category === 'complexity');
  const experiences = library.coefficients.filter(c => c.category === 'experience');
  const allowances = library.coefficients.filter(c => c.category === 'allowance');

  // Initialize selected coefficients on load or library change
  useEffect(() => {
    if (productTypes.length > 0 && !selectedProductTypeId) setSelectedProductTypeId(productTypes[0].id);
    if (complexities.length > 0 && !selectedComplexityId) setSelectedComplexityId(complexities[0].id);
    if (experiences.length > 0 && !selectedExperienceId) setSelectedExperienceId(experiences[0].id);
    if (allowances.length > 0 && !selectedAllowanceId) setSelectedAllowanceId(allowances[0].id);
  }, [library]);

  // Load editingStyle values when editingStyle is set
  useEffect(() => {
    if (editingStyle) {
      setStyleCode(editingStyle.styleCode);
      setStyleName(editingStyle.styleName);
      setCustomer(editingStyle.customer);
      setPartsCount(editingStyle.partsCount);
      setBaseSmvMethod(editingStyle.baseSmvMethod);
      setPartsSmvRate(editingStyle.partsSmvRate || 0.35);
      if (editingStyle.baseSmvMethod === 'manual') {
        setManualBaseSmv(editingStyle.baseSmv);
      }
      setEstimator(editingStyle.estimator);
      setNotes(editingStyle.notes || '');
      setPatternImage(editingStyle.patternImage || '');
      setSelectedProductTypeId(editingStyle.productTypeId);
      setSelectedComplexityId(editingStyle.complexityId);
      setSelectedExperienceId(editingStyle.experienceId);
      setSelectedAllowanceId(editingStyle.allowanceId);
      setErrorMsg('');
      setSuccessMsg('');
    } else {
      // Reset form to defaults
      setStyleCode('');
      setStyleName('');
      setCustomer('');
      setPartsCount(10);
      setBaseSmvMethod('auto');
      setPartsSmvRate(0.35);
      setManualBaseSmv(3.5);
      setNotes('');
      setPatternImage('');
      // Keep estimator cached in localStorage for convenience
      const cachedEstimator = localStorage.getItem('smv_cached_estimator');
      if (cachedEstimator) {
        setEstimator(cachedEstimator);
      } else {
        setEstimator('');
      }
      if (productTypes.length > 0) setSelectedProductTypeId(productTypes[0].id);
      if (complexities.length > 0) setSelectedComplexityId(complexities[0].id);
      if (experiences.length > 0) setSelectedExperienceId(experiences[0].id);
      if (allowances.length > 0) setSelectedAllowanceId(allowances[0].id);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [editingStyle, library]);

  // Handle Estimator localstorage caching
  const handleEstimatorChange = (val: string) => {
    setEstimator(val);
    localStorage.setItem('smv_cached_estimator', val);
  };

  // Live recalculate whenever inputs change
  useEffect(() => {
    // 1. Calculate Base SMV
    const baseSmv = baseSmvMethod === 'auto' 
      ? Number((partsCount * partsSmvRate).toFixed(3))
      : Number(manualBaseSmv);

    // 2. Fetch coefficient values
    const prodType = library.coefficients.find(c => c.id === selectedProductTypeId) || productTypes[0];
    const comp = library.coefficients.find(c => c.id === selectedComplexityId) || complexities[0];
    const exp = library.coefficients.find(c => c.id === selectedExperienceId) || experiences[0];
    const allow = library.coefficients.find(c => c.id === selectedAllowanceId) || allowances[0];

    // 3. Find Part Tier Multiplier based on parts count
    const partTier = library.partTiers.find(tier => partsCount >= tier.minParts && partsCount <= tier.maxParts) 
      || library.partTiers[library.partTiers.length - 1]; // fallback

    const pTypeVal = prodType ? prodType.value : 1.0;
    const pTypeName = prodType ? prodType.name : 'N/A';

    const compVal = comp ? comp.value : 1.0;
    const compName = comp ? comp.name : 'N/A';

    const expVal = exp ? exp.value : 1.0;
    const expName = exp ? exp.name : 'N/A';

    const allowVal = allow ? allow.value : 0.0;
    const allowName = allow ? allow.name : 'N/A';

    const tierVal = partTier ? partTier.multiplier : 1.0;
    const tierName = partTier ? partTier.description : 'Mặc định';

    // 4. Calculate final SMV
    // Formula: Base_SMV * Type * Complexity * Tier * Experience * (1 + Allowance)
    const rawSmv = baseSmv * pTypeVal * compVal * tierVal * expVal * (1 + allowVal);
    const finalSmv = Number(rawSmv.toFixed(3));

    setActiveCalculation({
      libraryVersion: library.version,
      baseSmv,
      productTypeVal: pTypeVal,
      productTypeName: pTypeName,
      complexityVal: compVal,
      complexityName: compName,
      partTierVal: tierVal,
      partTierName: tierName,
      experienceVal: expVal,
      experienceName: expName,
      allowanceVal: allowVal,
      allowanceName: allowName,
      finalSmv
    });
  }, [
    partsCount,
    baseSmvMethod,
    partsSmvRate,
    manualBaseSmv,
    selectedProductTypeId,
    selectedComplexityId,
    selectedExperienceId,
    selectedAllowanceId,
    library
  ]);

  // Speech Recognition handler
  const toggleVoiceInput = (targetField: 'styleName' | 'notes') => {
    if (isListening) {
      setIsListening(null);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt hoặc khung hiển thị hiện tại chưa hỗ trợ API Nhận dạng giọng nói (Voice Speech-to-Text). Bạn vui lòng nhập trực tiếp trên bàn phím.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = 'vi-VN';
      rec.continuous = false;
      rec.interimResults = false;

      setIsListening(targetField);

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        if (targetField === 'styleName') {
          setStyleName(prev => (prev ? prev + ' ' : '') + resultText);
        } else if (targetField === 'notes') {
          setNotes(prev => (prev ? prev + ' ' : '') + resultText);
        }
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        setIsListening(null);
      };

      rec.onend = () => {
        setIsListening(null);
      };

      rec.start();
    } catch (e) {
      console.error(e);
      setIsListening(null);
    }
  };

  // Hardware Camera Activation
  const startCamera = async () => {
    setCameraActive(true);
    setCameraAllowed(true);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setCameraAllowed(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Capture Frame from Video
  const captureFrame = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPatternImage(dataUrl);
      }
      stopCamera();
    } catch (e) {
      console.error("Error capturing canvas image:", e);
    }
  };

  // Select Mock Preset Pattern Template
  const handleSelectMockPattern = (mock: typeof MOCK_PATTERNS[number]) => {
    setPartsCount(mock.parts);
    setPatternImage(mock.image);
    setNotes(prev => `[Nhập từ mẫu Pattern Rập] ${mock.name}. ${mock.description}\n` + prev);
    
    // Auto find closest match for Product Type
    const match = productTypes.find(pt => pt.name.toLowerCase().includes(mock.productTypeKeyword.toLowerCase()));
    if (match) {
      setSelectedProductTypeId(match.id);
    }
    
    setShowPatternPicker(false);
  };

  // Cleanup camera streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Reset form action
  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn xoá hết thông tin đang nhập để làm lại?')) {
      setStyleCode('');
      setStyleName('');
      setCustomer('');
      setPartsCount(10);
      setBaseSmvMethod('auto');
      setPartsSmvRate(0.35);
      setManualBaseSmv(3.5);
      setNotes('');
      setPatternImage('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  // Form submission: save or update Style
  const handleSaveStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!styleCode.trim()) {
      setErrorMsg('Mã hàng không được để trống.');
      return;
    }
    if (!styleName.trim()) {
      setErrorMsg('Tên Style không được để trống.');
      return;
    }
    if (!estimator.trim()) {
      setErrorMsg('Vui lòng nhập tên Người ước lượng.');
      return;
    }
    if (!activeCalculation) {
      setErrorMsg('Lỗi tính toán SMV.');
      return;
    }

    const payload: Style = {
      id: editingStyle ? editingStyle.id : `style-${Date.now()}`,
      styleCode: styleCode.trim(),
      styleName: styleName.trim(),
      customer: customer.trim(),
      partsCount,
      baseSmvMethod,
      partsSmvRate,
      baseSmv: activeCalculation.baseSmv,
      productTypeId: selectedProductTypeId,
      complexityId: selectedComplexityId,
      experienceId: selectedExperienceId,
      allowanceId: selectedAllowanceId,
      estimator: estimator.trim(),
      notes: notes.trim(),
      patternImage,
      createdAt: editingStyle ? editingStyle.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      calculationDetails: activeCalculation
    };

    setIsSaving(true);

    try {
      const url = editingStyle ? `/api/styles/${editingStyle.id}` : '/api/styles';
      const method = editingStyle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra khi lưu Style.');
      }

      setSuccessMsg(editingStyle ? 'Cập nhật Style thành công!' : 'Lưu Style mới thành công!');
      
      // If saving new, clear fields
      if (!editingStyle) {
        setStyleCode('');
        setStyleName('');
        setCustomer('');
        setPartsCount(10);
        setNotes('');
        setPatternImage('');
      }

      setTimeout(() => {
        onSaveSuccess();
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger excel download for current live calculation
  const handleExportLive = () => {
    if (!activeCalculation) return;
    
    // Create temporary style model to export
    const tempStyle: Style = {
      id: 'live-temp',
      styleCode: styleCode.trim() || 'MA-MAU',
      styleName: styleName.trim() || 'Style Chưa Đặt Tên',
      customer: customer.trim() || 'Khách Hàng Mẫu',
      partsCount,
      baseSmvMethod,
      partsSmvRate,
      baseSmv: activeCalculation.baseSmv,
      productTypeId: selectedProductTypeId,
      complexityId: selectedComplexityId,
      experienceId: selectedExperienceId,
      allowanceId: selectedAllowanceId,
      estimator: estimator.trim() || 'Người Ước Lượng',
      notes: notes.trim(),
      patternImage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      calculationDetails: activeCalculation
    };

    exportSingleStyleToExcel(tempStyle);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="new-style-tab-container">
      {/* LEFT: Product inputs Form */}
      <form onSubmit={handleSaveStyle} className={`lg:col-span-7 p-5 rounded-2xl border flex flex-col gap-5 ${
        isDark ? 'bg-slate-800 border-slate-700/80 text-white' : 'bg-white border-gray-100 shadow-xs'
      }`} id="style-form">
        
        {/* Title banner */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100/50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500 text-white rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {editingStyle ? 'Sửa thông tin Style' : 'Ước lượng Style mới'}
            </h2>
          </div>
          {editingStyle && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs text-red-500 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-md transition-colors font-semibold"
            >
              Hủy
            </button>
          )}
        </div>

        {/* SECTION 1: BASIC INFORMATION */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-wider block">1. Thông tin chung</span>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Style Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1" htmlFor="style-code">
                Mã hàng <span className="text-red-500">*</span>
              </label>
              <input
                id="style-code"
                type="text"
                required
                placeholder="Ví dụ: TS-402, JEANS-99..."
                value={styleCode}
                onChange={e => setStyleCode(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white focus:ring-2 focus:ring-blue-500' 
                    : 'bg-slate-50 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900'
                }`}
              />
            </div>

            {/* Customer */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1" htmlFor="customer">
                Khách hàng
              </label>
              <input
                id="customer"
                type="text"
                placeholder="Ví dụ: Zara, Nike, Uniqlo..."
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white focus:ring-2 focus:ring-blue-500' 
                    : 'bg-slate-50 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900'
                }`}
              />
            </div>

            {/* Style Name with VOICE microphone */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1" htmlFor="style-name">
                Tên Style hàng <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="style-name"
                  type="text"
                  required
                  placeholder="Ví dụ: Áo thun cổ tròn may trần vai..."
                  value={styleName}
                  onChange={e => setStyleName(e.target.value)}
                  className={`w-full pl-3 pr-10 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-white focus:ring-2 focus:ring-blue-500' 
                      : 'bg-slate-50 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => toggleVoiceInput('styleName')}
                  className={`absolute right-2 p-1.5 rounded-md transition-all cursor-pointer ${
                    isListening === 'styleName' 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Nhập tên bằng giọng nói (Tiếng Việt)"
                >
                  {isListening === 'styleName' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Estimator Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1" htmlFor="estimator">
                Tên Người ước lượng (IE) <span className="text-red-500">*</span>
              </label>
              <input
                id="estimator"
                type="text"
                required
                placeholder="Nhập tên của bạn hoặc kỹ sư chịu trách nhiệm..."
                value={estimator}
                onChange={e => handleEstimatorChange(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white focus:ring-2 focus:ring-blue-500' 
                    : 'bg-slate-50 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PATTERN & CAMERA CAPTURING MODULE */}
        <div className="space-y-3 pt-4 border-t border-gray-100/50">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider block">2. Chi tiết Pattern & Camera</span>
            <button
              type="button"
              onClick={() => setShowPatternPicker(!showPatternPicker)}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Sử dụng rập mẫu
            </button>
          </div>

          {/* Simulated and real Pattern library drawer */}
          {showPatternPicker && (
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3 animate-fadeIn">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-blue-800">Chọn rập chi tiết có sẵn:</span>
                <button type="button" onClick={() => setShowPatternPicker(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MOCK_PATTERNS.map((mock, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectMockPattern(mock)}
                    className="p-2 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-left transition-all active:scale-97 cursor-pointer"
                  >
                    <span className="text-xs font-bold text-gray-800 block">{mock.name}</span>
                    <span className="text-[10px] text-blue-700 font-semibold">{mock.parts} chi tiết</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Camera Component */}
          <div className="bg-slate-50/40 p-3.5 rounded-xl border border-dashed border-gray-300 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1">
                  <Camera className="w-4 h-4 text-blue-500" />
                  <span>Ảnh tài liệu / Rập mẫu</span>
                </h4>
              </div>

              <div className="flex gap-2">
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-3 h-3" /> Bật Camera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-2.5 py-1.5 bg-red-500 text-white rounded-lg text-[11px] font-bold hover:bg-red-600 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Tắt
                  </button>
                )}
              </div>
            </div>

            {/* Video stream container */}
            {cameraActive && (
              <div className="relative aspect-video max-w-md mx-auto bg-black rounded-lg overflow-hidden border border-slate-700">
                {!cameraAllowed ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center text-gray-400">
                    <AlertCircle className="w-6 h-6 text-yellow-500 mb-1.5 animate-bounce" />
                    <p className="text-xs font-bold text-white">Chưa cấp quyền Camera</p>
                    <p className="text-[10px] text-gray-450 mt-1 max-w-xs">Vui lòng cấp quyền truy cập camera trong cài đặt.</p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 inset-x-0 flex justify-center">
                      <button
                        type="button"
                        onClick={captureFrame}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-full shadow-md flex items-center gap-1 active:scale-90 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Chụp ảnh
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Render Image Thumbnail if exists */}
            {patternImage && (
              <div className="relative w-28 h-20 bg-slate-100 rounded-lg overflow-hidden border border-gray-200 group">
                <img src={patternImage} alt="Pattern template thumbnail" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPatternImage('')}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full transition-all cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[8px] text-center font-bold py-0.5">
                  Đã tải hồ sơ
                </div>
              </div>
            )}
          </div>

          {/* Numbers Steppers (Finger-friendly for mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Parts Count input */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1" htmlFor="parts-count">
                Số lượng chi tiết từ Pattern
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPartsCount(prev => Math.max(1, prev - 1))}
                  className="w-11 h-11 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 rounded-lg flex items-center justify-center font-black select-none cursor-pointer border border-gray-200 shadow-xs"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  id="parts-count"
                  type="number"
                  min="1"
                  required
                  value={partsCount}
                  onChange={e => setPartsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`flex-1 h-11 text-center font-black text-base rounded-lg transition-all ${
                    isDark 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-slate-50 border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setPartsCount(prev => prev + 1)}
                  className="w-11 h-11 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 rounded-lg flex items-center justify-center font-black select-none cursor-pointer border border-gray-200 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Base SMV Method Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">
                Nhập Thời gian gốc (Base SMV)
              </label>
              <div className="grid grid-cols-2 gap-2 h-11">
                <button
                  type="button"
                  onClick={() => setBaseSmvMethod('auto')}
                  className={`h-full px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                    baseSmvMethod === 'auto'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-gray-50 border-gray-300 text-gray-500 hover:text-gray-800'
                  }`}
                >
                  🤖 Tự động
                </button>
                <button
                  type="button"
                  onClick={() => setBaseSmvMethod('manual')}
                  className={`h-full px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                    baseSmvMethod === 'manual'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-gray-50 border-gray-300 text-gray-500 hover:text-gray-800'
                  }`}
                >
                  ✍️ Nhập tay
                </button>
              </div>
            </div>
          </div>

          {/* Nested method inputs */}
          <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {baseSmvMethod === 'auto' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1" htmlFor="parts-smv-rate">
                  Định mức nền (phút/chi tiết)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPartsSmvRate(prev => Math.max(0.05, Number((prev - 0.05).toFixed(2))))}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex items-center justify-center font-bold border border-gray-200 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    id="parts-smv-rate"
                    type="number"
                    step="0.01"
                    min="0.05"
                    value={partsSmvRate}
                    onChange={e => setPartsSmvRate(Math.max(0.01, parseFloat(e.target.value) || 0))}
                    className="flex-1 h-10 text-center font-bold text-sm bg-white rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setPartsSmvRate(prev => Number((prev + 0.05).toFixed(2)))}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex items-center justify-center font-bold border border-gray-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1" htmlFor="manual-base-smv">
                  Base SMV thủ công (phút)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setManualBaseSmv(prev => Math.max(0, Number((prev - 0.5).toFixed(2))))}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex items-center justify-center font-bold border border-gray-200 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    id="manual-base-smv"
                    type="number"
                    step="0.1"
                    min="0"
                    value={manualBaseSmv}
                    onChange={e => setManualBaseSmv(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="flex-1 h-10 text-center font-black text-sm bg-white rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setManualBaseSmv(prev => Number((prev + 0.5).toFixed(2)))}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg flex items-center justify-center font-bold border border-gray-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Result Indicator */}
            <div className="flex items-center justify-center bg-blue-50/50 rounded-lg p-2.5 border border-blue-100/50">
              <div className="text-center">
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Base SMV Tạm Tính</span>
                <strong className="text-blue-700 text-lg font-black font-sans">
                  {baseSmvMethod === 'auto' ? (partsCount * partsSmvRate).toFixed(3) : manualBaseSmv.toFixed(3)}
                </strong>{' '}
                <span className="text-blue-600 text-xs font-semibold">phút</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: COEFFICIENT SELECTION GRID */}
        <div className="space-y-4 pt-4 border-t border-gray-100/50">
          <span className="text-xs font-bold text-blue-500 uppercase tracking-wider block">3. Hệ số định biên may mặc</span>
          
          <div className="grid grid-cols-1 gap-4" id="coefficients-form-groups">
            
            {/* Product Types Cards Option */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400" htmlFor="pt-option">
                👕 Loại sản phẩm (Product Type)
              </label>
              <div className="grid grid-cols-2 gap-2" id="pt-option">
                {productTypes.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedProductTypeId(c.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all active:scale-97 cursor-pointer flex flex-col justify-between h-16 ${
                      selectedProductTypeId === c.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-xs font-bold truncate block w-full">{c.name}</span>
                    <strong className={`text-sm font-black font-mono block ${selectedProductTypeId === c.id ? 'text-white' : 'text-blue-600'}`}>
                      f={c.value.toFixed(2)}
                    </strong>
                  </button>
                ))}
              </div>
            </div>

            {/* Complexities Cards Option */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400" htmlFor="complex-option">
                ⚙️ Độ phức tạp đường may (Complexity)
              </label>
              <div className="grid grid-cols-2 gap-2" id="complex-option">
                {complexities.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedComplexityId(c.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all active:scale-97 cursor-pointer flex flex-col justify-between h-16 ${
                      selectedComplexityId === c.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-xs font-bold truncate block w-full">{c.name}</span>
                    <strong className={`text-sm font-black font-mono block ${selectedComplexityId === c.id ? 'text-white' : 'text-blue-600'}`}>
                      f={c.value.toFixed(2)}
                    </strong>
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Cards Option */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400" htmlFor="exp-option">
                👤 Kinh nghiệm công nhân (Experience)
              </label>
              <div className="grid grid-cols-2 gap-2" id="exp-option">
                {experiences.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedExperienceId(c.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all active:scale-97 cursor-pointer flex flex-col justify-between h-16 ${
                      selectedExperienceId === c.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-xs font-bold truncate block w-full">{c.name}</span>
                    <strong className={`text-sm font-black font-mono block ${selectedExperienceId === c.id ? 'text-white' : 'text-blue-600'}`}>
                      f={c.value.toFixed(2)}
                    </strong>
                  </button>
                ))}
              </div>
            </div>

            {/* Allowances Cards Option */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-400" htmlFor="allow-option">
                🔋 Hệ số bù hao thao tác (Allowance)
              </label>
              <div className="grid grid-cols-2 gap-2" id="allow-option">
                {allowances.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedAllowanceId(c.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all active:scale-97 cursor-pointer flex flex-col justify-between h-16 ${
                      selectedAllowanceId === c.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-xs font-bold truncate block w-full">{c.name}</span>
                    <strong className={`text-sm font-black font-mono block ${selectedAllowanceId === c.id ? 'text-white' : 'text-emerald-600'}`}>
                      +{(c.value * 100).toFixed(0)}%
                    </strong>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Notes with Voice recognition */}
        <div className="space-y-1.5 pt-4 border-t border-gray-100/50">
          <label className="block text-xs font-semibold text-gray-400" htmlFor="style-notes">
            Thuyết minh kỹ thuật may
          </label>
          <div className="relative">
            <textarea
              id="style-notes"
              rows={3}
              placeholder="May viền cổ, dập ly, ghi âm giọng nói..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className={`w-full pl-3 pr-10 py-2.5 rounded-lg text-sm transition-all ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-slate-50 border border-gray-300 focus:ring-2 focus:ring-blue-500 text-gray-900'
              }`}
            />
            <button
              type="button"
              onClick={() => toggleVoiceInput('notes')}
              className={`absolute right-2.5 top-2.5 p-1.5 rounded-md transition-all cursor-pointer ${
                isListening === 'notes' 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
              }`}
              title="Nhập ghi chú bằng giọng nói"
            >
              {isListening === 'notes' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex gap-3 justify-end pt-3 border-t border-gray-100/50">
          {!editingStyle && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-3 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 rounded-xl transition-all flex items-center gap-1.5 select-none active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Xoá nháp
            </button>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 sm:flex-initial px-6 py-3.5 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 font-bold rounded-xl shadow-md shadow-blue-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Đang lưu vào đĩa...' : editingStyle ? 'Lưu thay đổi Style' : '💾 Lưu Style Lập tức'}
          </button>
        </div>

        {/* Notification alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </form>

      {/* RIGHT: LIVE ESTIMATOR RESULTS (PANEL) */}
      <div className="lg:col-span-5 bg-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800 flex flex-col gap-5 sticky top-24 self-start" id="results-panel">
        <div>
          <span className="text-slate-400 text-[10px] uppercase tracking-widest font-mono font-semibold">Tóm tắt định biên</span>
          <h2 className="text-xl font-bold text-blue-400 font-sans tracking-tight">🧮 Diễn giải SMV</h2>
        </div>

        {activeCalculation ? (
          <div className="flex flex-col gap-5" id="calc-display">
            {/* BIG FINAL SMV RESULT */}
            <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-750 text-center flex flex-col items-center">
              <span className="text-slate-400 text-xs font-bold uppercase font-mono tracking-wider">SMV ĐỊNH BIÊN CUỐI CÙNG</span>
              <div className="text-5xl font-black text-emerald-400 mt-2 tracking-tight font-sans">
                {activeCalculation.finalSmv.toFixed(3)}
              </div>
              <span className="text-slate-300 text-xs font-bold mt-1.5 bg-slate-700 px-2.5 py-0.5 rounded-full">phút / sản phẩm</span>
            </div>

            {/* FORMULA MATHEMATICAL REPRESENTATION */}
            <div>
              <h3 className="text-slate-400 text-xs uppercase font-mono mb-2">Công thức tính toán (IE standard)</h3>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                <div className="text-blue-400 font-bold mb-1">SMV = Base_SMV × f_Loại × f_Khó × f_Bậc × f_Nghề × (1 + % Allowance)</div>
                <div className="border-t border-slate-800/80 my-2 pt-2 text-xs flex flex-wrap gap-x-1.5 gap-y-1">
                  <span>= <strong className="text-white font-bold">{activeCalculation.baseSmv}</strong></span>
                  <span>× <strong className="text-yellow-400 font-bold">{activeCalculation.productTypeVal}</strong> (Loại)</span>
                  <span>× <strong className="text-yellow-400 font-bold">{activeCalculation.complexityVal}</strong> (Khó)</span>
                  <span>× <strong className="text-yellow-400 font-bold">{activeCalculation.partTierVal}</strong> (Bậc)</span>
                  <span>× <strong className="text-yellow-400 font-bold">{activeCalculation.experienceVal}</strong> (Nghề)</span>
                  <span>× <strong className="text-yellow-400 font-bold">{(1 + activeCalculation.allowanceVal).toFixed(2)}</strong> (Bù hao)</span>
                </div>
              </div>
            </div>

            {/* DETAIL BY ELEMENT TABLE */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-slate-400 text-xs uppercase font-mono">Thông số cấu thành</h3>
              <div className="space-y-2 text-xs">
                {/* 1. Base */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <div>
                    <span className="text-slate-300 block">Thời gian gốc (Base SMV)</span>
                    <span className="text-slate-500 text-[10px]">{baseSmvMethod === 'auto' ? `Số chi tiết (${partsCount}) × Định mức (${partsSmvRate})` : 'Nhập tay thủ công'}</span>
                  </div>
                  <strong className="text-white font-mono">{activeCalculation.baseSmv.toFixed(3)}</strong>
                </div>

                {/* 2. Product type */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <div>
                    <span className="text-slate-300 block">Loại sản phẩm (Product Type)</span>
                    <span className="text-slate-500 text-[10px]">{activeCalculation.productTypeName}</span>
                  </div>
                  <strong className="text-yellow-400 font-mono">×{activeCalculation.productTypeVal.toFixed(2)}</strong>
                </div>

                {/* 3. Complexity */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <div>
                    <span className="text-slate-300 block">Độ phức tạp (Complexity)</span>
                    <span className="text-slate-500 text-[10px]">{activeCalculation.complexityName}</span>
                  </div>
                  <strong className="text-yellow-400 font-mono">×{activeCalculation.complexityVal.toFixed(2)}</strong>
                </div>

                {/* 4. Part Tier count */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <div>
                    <span className="text-slate-300 block">Hệ số bậc chi tiết (Part Tier)</span>
                    <span className="text-slate-500 text-[10px]">{activeCalculation.partTierName}</span>
                  </div>
                  <strong className="text-yellow-400 font-mono">×{activeCalculation.partTierVal.toFixed(2)}</strong>
                </div>

                {/* 5. Experience */}
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/60">
                  <div>
                    <span className="text-slate-300 block">Kinh nghiệm may (Experience)</span>
                    <span className="text-slate-500 text-[10px]">{activeCalculation.experienceName}</span>
                  </div>
                  <strong className="text-yellow-400 font-mono">×{activeCalculation.experienceVal.toFixed(2)}</strong>
                </div>

                {/* 6. Allowance */}
                <div className="flex justify-between items-center py-1.5">
                  <div>
                    <span className="text-slate-300 block">Hệ số bù hao Allowance</span>
                    <span className="text-slate-500 text-[10px]">{activeCalculation.allowanceName}</span>
                  </div>
                  <strong className="text-emerald-400 font-mono">+{(activeCalculation.allowanceVal * 100).toFixed(0)}%</strong>
                </div>
              </div>
            </div>

            {/* Quick Export live sheet */}
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center gap-2">
              <span className="text-slate-500 text-[10px] font-mono">Phiên bản hệ số: v{library.version}</span>
              <button
                type="button"
                onClick={handleExportLive}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Xuất Excel trực quan
              </button>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-xs text-center py-10">
            Đang chờ dữ liệu đầu vào rập mẫu...
          </div>
        )}
      </div>
    </div>
  );
}
