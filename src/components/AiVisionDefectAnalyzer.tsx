import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  Loader2, 
  AlertCircle, 
  Check, 
  Copy, 
  Zap, 
  ShieldAlert, 
  X, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  Camera, 
  Lightbulb,
  Bot
} from 'lucide-react';

export interface AiVisionAnalysisResult {
  hasDefect?: boolean;
  defectTitle: string;
  category: 'safety' | 'iso-kaizen' | string;
  categoryLabel?: string;
  equipmentName: string;
  suggestedArea?: string;
  suggestedLocation?: string;
  severity: 'Bình thường' | 'Thấp' | 'Trung bình' | 'Cao' | 'Khẩn cấp' | string;
  observations?: string[];
  descriptions: {
    concise: string;
    standard: string;
    detailed: string;
  };
  remedySuggestion?: string;
  processStatus?: string;
  processNote?: string;
  matchedDefect?: {
    sheet?: string;
    row?: number | string;
    equipment?: string;
    location?: string;
    description?: string;
    confidence?: 'high' | 'medium' | 'low' | string;
    matchReason?: string;
  };
}

interface AiVisionDefectAnalyzerProps {
  images: { file: File; preview: string }[];
  isOpen: boolean;
  onClose: () => void;
  onApplyAllReport?: (data: {
    category?: string;
    area?: string;
    equipmentName?: string;
    location?: string;
    description?: string;
  }) => void;
  onApplyDescription?: (text: string) => void;
  formType?: 'report' | 'process';
  pendingDefects?: Array<{
    sheet: string;
    row: number | string;
    colE?: string;
    colF?: string;
    colG?: string;
    equipment?: string;
    location?: string;
    description?: string;
    label?: string;
    [key: string]: any;
  }>;
  onApplyProcess?: (data: { 
    sheet?: string;
    row?: string | number;
    tinhTrang?: string; 
    ghiChu?: string;
    matchedDefect?: any;
  }) => void;
}

// Fast client-side image downscaling to speed up upload & AI vision processing (sub-second speeds)
const compressImageForAi = async (file: File, maxDim = 960, quality = 0.8): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve({ base64: compressedDataUrl, mimeType: 'image/jpeg' });
        } else {
          resolve({ base64: e.target?.result as string, mimeType: file.type || 'image/jpeg' });
        }
      };
      img.onerror = () => {
        resolve({ base64: e.target?.result as string, mimeType: file.type || 'image/jpeg' });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const AiVisionDefectAnalyzer: React.FC<AiVisionDefectAnalyzerProps> = ({
  images,
  isOpen,
  onClose,
  onApplyAllReport,
  onApplyDescription,
  formType = 'report',
  pendingDefects = [],
  onApplyProcess,
}) => {
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AiVisionAnalysisResult | null>(null);
  const [selectedDescType, setSelectedDescType] = useState<'concise' | 'standard' | 'detailed'>('standard');
  const [selectedMatchedItem, setSelectedMatchedItem] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);
  const scannedImagesRef = React.useRef<{ [key: string]: AiVisionAnalysisResult }>({});

  // Auto scan when modal opens or when selected image changes
  React.useEffect(() => {
    if (isOpen && images.length > 0) {
      const activeFile = images[selectedImageIdx]?.file;
      const fileKey = activeFile ? `${activeFile.name}_${activeFile.size}_${selectedImageIdx}` : `${selectedImageIdx}`;
      if (scannedImagesRef.current[fileKey]) {
        const cached = scannedImagesRef.current[fileKey];
        setAnalysisResult(cached);
        if (cached.matchedDefect) {
          setSelectedMatchedItem(cached.matchedDefect);
        }
      } else {
        handleAnalyze(selectedImageIdx);
      }
    }
  }, [isOpen, selectedImageIdx, images]);

  // Analyze the selected image
  const handleAnalyze = async (imgIndex = selectedImageIdx) => {
    if (!images || images.length === 0 || !images[imgIndex]) {
      setErrorMsg("Vui lòng chọn ít nhất một hình ảnh để AI đánh giá!");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisResult(null);
    setSelectedMatchedItem(null);

    try {
      const targetFile = images[imgIndex].file;
      const { base64, mimeType } = await compressImageForAi(targetFile, 800, 0.75);

      const response = await fetch("/api/analyze-defect-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: mimeType,
          formType: formType,
          pendingDefects: pendingDefects && pendingDefects.length > 0 ? pendingDefects : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.details || "Không thể phân tích hình ảnh.");
      }

      const fileKey = targetFile ? `${targetFile.name}_${targetFile.size}_${imgIndex}` : `${imgIndex}`;
      scannedImagesRef.current[fileKey] = data.analysis;
      setAnalysisResult(data.analysis);
      if (data.analysis?.matchedDefect) {
        setSelectedMatchedItem(data.analysis.matchedDefect);
      }
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      setErrorMsg(err.message || "Đã xảy ra lỗi trong quá trình phân tích hình ảnh.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplySingleDescription = (text: string) => {
    if (onApplyDescription) {
      onApplyDescription(text);
      setAppliedNotification("Đã áp dụng mô tả vào biểu mẫu!");
      setTimeout(() => setAppliedNotification(null), 2500);
    }
  };

  const handleApplyAll = () => {
    if (!analysisResult) return;

    if (formType === 'report' && onApplyAllReport) {
      const chosenDescription = analysisResult.descriptions[selectedDescType] || analysisResult.descriptions.standard;
      onApplyAllReport({
        category: analysisResult.category,
        area: analysisResult.suggestedArea,
        equipmentName: analysisResult.equipmentName,
        location: analysisResult.suggestedLocation,
        description: chosenDescription,
      });
      setAppliedNotification("Đã tự động điền tất cả gợi ý vào biểu mẫu!");
      setTimeout(() => {
        setAppliedNotification(null);
        onClose();
      }, 1000);
    } else if (formType === 'process' && onApplyProcess) {
      const targetMatch = selectedMatchedItem || analysisResult.matchedDefect;
      onApplyProcess({
        sheet: targetMatch?.sheet,
        row: targetMatch?.row,
        tinhTrang: analysisResult.processStatus || 'Đã khắc phục hoàn tất',
        ghiChu: analysisResult.processNote || analysisResult.descriptions?.concise || 'Đã xử lý và khắc phục hoàn tất',
        matchedDefect: targetMatch,
      });
      setAppliedNotification("Đã tự động chọn tồn tại và điền kết quả vào biểu mẫu!");
      setTimeout(() => {
        setAppliedNotification(null);
        onClose();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 backdrop-blur-md rounded-xl text-yellow-300 shadow-inner">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                AI Đánh Giá Hình Ảnh & Gợi Ý Mô Tả
              </h3>
              <p className="text-[11px] text-blue-100 font-medium">
                {formType === 'report' ? 'Tự động nhận diện khiếm khuyết, rủi ro và gợi ý mô tả kỹ thuật' : 'Đánh giá minh chứng kết quả xử lý và gợi ý ghi chú'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Applied Notification Banner */}
        {appliedNotification && (
          <div className="bg-emerald-500 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200">
            <CheckCircle2 size={16} />
            <span>{appliedNotification}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Images Selection & Preview */}
          {images.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Chọn ảnh cần thẩm định ({images.length} ảnh)
                </span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                  Ảnh #{selectedImageIdx + 1}
                </span>
              </div>

              {/* Thumbnails row */}
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImageIdx(idx);
                      if (analysisResult) setAnalysisResult(null);
                    }}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImageIdx === idx 
                        ? 'border-blue-600 ring-4 ring-blue-500/20 scale-105 shadow-md' 
                        : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.preview} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      #{idx + 1}
                    </span>
                  </button>
                ))}
              </div>

              {/* Active Image with AI Action overlay */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 h-52 sm:h-64 flex items-center justify-center">
                <img 
                  src={images[selectedImageIdx]?.preview} 
                  alt="Active preview" 
                  className="w-full h-full object-contain"
                />
                
                {!analysisResult && !isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                    <button
                      type="button"
                      onClick={() => handleAnalyze(selectedImageIdx)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5"
                    >
                      <Sparkles size={16} className="text-yellow-300 animate-spin" />
                      Bắt đầu đánh giá bức ảnh này
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <Camera size={36} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Chưa có hình ảnh nào được chọn</p>
              <p className="text-[11px] text-slate-400">Vui lòng tải lên ảnh hiện trường hoặc chụp ảnh từ máy ảnh để AI thẩm định.</p>
            </div>
          )}

          {/* Loading state */}
          {isAnalyzing && (
            <div className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Loader2 size={24} className="animate-spin" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Gemini Vision đang phân tích hình ảnh...
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Đang nhận diện thiết bị, kiểm tra dấu hiệu bất thường và tạo các bản gợi ý mô tả kỹ thuật
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Lỗi phân tích hình ảnh:</p>
                <p className="mt-0.5 text-[11px] opacity-90">{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => handleAnalyze()}
                  className="mt-2 text-[11px] font-black underline uppercase tracking-wider hover:opacity-80"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {/* Analysis Results Card */}
          {analysisResult && !isAnalyzing && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
              
              {/* If formType is 'process', show Matched Defect & Process Status Section */}
              {formType === 'process' ? (
                <>
                  {/* Matched Defect in Database Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/40 border-2 border-emerald-400/80 dark:border-emerald-700/80 shadow-md space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-emerald-600 text-white rounded-xl shadow-md">
                          <Bot size={18} />
                        </span>
                        <div>
                          <span className="text-xs font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wide flex items-center gap-1.5">
                            🎯 AI Tự Động Khớp Tồn Tại Trong Bảng
                          </span>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                            Dựa trên thiết bị, hình ảnh và vị trí đã lưu trong hệ thống
                          </p>
                        </div>
                      </div>

                      {/* Confidence Badge */}
                      <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        {selectedMatchedItem?.confidence === 'high' ? 'Độ khớp cao (95%)' : 'Đã tìm thấy mục khớp'}
                      </span>
                    </div>

                    {selectedMatchedItem ? (
                      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                            📁 {selectedMatchedItem.sheet || 'An toàn vệ sinh lao động'} • Dòng #{selectedMatchedItem.row}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            ⚙️ {selectedMatchedItem.equipment || selectedMatchedItem.colE || analysisResult.equipmentName}
                          </span>
                        </div>

                        <div className="text-xs space-y-1">
                          {(selectedMatchedItem.location || selectedMatchedItem.colF) && (
                            <p className="text-slate-600 dark:text-slate-300">
                              <span className="font-bold text-slate-400 text-[10px] uppercase">Vị trí: </span>
                              {selectedMatchedItem.location || selectedMatchedItem.colF}
                            </p>
                          )}
                          <p className="text-slate-800 dark:text-slate-100 font-medium">
                            <span className="font-bold text-slate-400 text-[10px] uppercase">Nội dung tồn tại: </span>
                            {selectedMatchedItem.description || selectedMatchedItem.colG || analysisResult.defectTitle}
                          </p>
                        </div>

                        {selectedMatchedItem.matchReason && (
                          <div className="p-2.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/60 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                            <Sparkles size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span><strong>Lý do AI nhận diện:</strong> {selectedMatchedItem.matchReason}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 text-xs text-slate-600">
                        Chưa tìm thấy tồn tại trùng khớp tự động. Bạn có thể chọn danh mục bên dưới để gán thủ công.
                      </div>
                    )}

                    {/* Quick Selector if multiple pending defects exist */}
                    {pendingDefects && pendingDefects.length > 0 && (
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                          Hoặc chọn tồn tại khác từ danh sách ({pendingDefects.length} tồn tại đang chờ):
                        </label>
                        <select
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={selectedMatchedItem ? `${selectedMatchedItem.sheet}_${selectedMatchedItem.row}` : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setSelectedMatchedItem(null);
                              return;
                            }
                            const found = pendingDefects.find(d => `${d.sheet}_${d.row}` === val);
                            if (found) {
                              setSelectedMatchedItem({
                                sheet: found.sheet,
                                row: found.row,
                                equipment: found.colE || found.equipment || '',
                                location: found.colF || found.location || '',
                                description: found.colG || found.description || '',
                                confidence: 'manual',
                                matchReason: 'Người dùng chọn trực tiếp từ danh mục'
                              });
                            }
                          }}
                        >
                          <option value="">-- Chọn tồn tại đang chờ --</option>
                          {pendingDefects.map((item, idx) => (
                            <option key={idx} value={`${item.sheet}_${item.row}`}>
                              {`[${item.sheet}] Dòng #${item.row}: ${item.colE || item.equipment || ''} - ${item.colF || item.location || ''} - ${item.colG || item.description || ''}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Suggested Process Status & Notes */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Sparkles size={16} />
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                        Gợi ý cập nhật Tình trạng & Ghi chú xử lý
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tình trạng đề xuất:</label>
                          <button
                            type="button"
                            onClick={() => handleCopy(analysisResult.processStatus || 'Đã khắc phục hoàn tất', 'status')}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {copiedKey === 'status' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            Sao chép
                          </button>
                        </div>
                        <input
                          type="text"
                          readOnly
                          className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100"
                          value={analysisResult.processStatus || 'Đã khắc phục hoàn tất'}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ghi chú đề xuất:</label>
                          <button
                            type="button"
                            onClick={() => handleCopy(analysisResult.processNote || analysisResult.descriptions.concise, 'note')}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {copiedKey === 'note' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            Sao chép
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          readOnly
                          className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 resize-none"
                          value={analysisResult.processNote || analysisResult.descriptions.concise || 'Đã kiểm tra và xử lý dứt điểm khiếm khuyết.'}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Standard Report Mode UI */
                <>
                  {/* Header Badges & Summary */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                          <Bot size={16} />
                        </span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                          {analysisResult.defectTitle}
                        </span>
                      </div>

                      {/* Severity Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        analysisResult.hasDefect === false || analysisResult.severity === 'Bình thường'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                          : analysisResult.severity === 'Khẩn cấp' || analysisResult.severity === 'Cao'
                          ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200'
                          : analysisResult.severity === 'Trung bình'
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200'
                          : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200'
                      }`}>
                        {analysisResult.hasDefect === false || analysisResult.severity === 'Bình thường' ? (
                          <CheckCircle2 size={12} className="text-emerald-600" />
                        ) : (
                          <ShieldAlert size={12} />
                        )}
                        {analysisResult.hasDefect === false || analysisResult.severity === 'Bình thường'
                          ? 'Trạng thái: Bình thường'
                          : `Rủi ro: ${analysisResult.severity}`}
                      </span>
                    </div>

                    {/* Normal Status Banner if no defects */}
                    {(analysisResult.hasDefect === false || analysisResult.severity === 'Bình thường') && (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span><strong>Đánh giá tốt:</strong> Không phát hiện khiếm khuyết hay nguy cơ mất an toàn. Thiết bị / vị trí đạt chuẩn vận hành.</span>
                      </div>
                    )}

                    {/* Key specs grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-700/40">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Phân loại:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {analysisResult.category === 'safety' ? 'An toàn VSLĐ' : 'ISO, KAIZEN 5S, TPM'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Thiết bị:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {analysisResult.equipmentName}
                        </span>
                      </div>
                      {analysisResult.suggestedLocation && (
                        <div className="flex items-center gap-2 col-span-1 sm:col-span-2">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Vị trí:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {analysisResult.suggestedLocation}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Observations list */}
                    {analysisResult.observations && analysisResult.observations.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/40">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                          Chi tiết nhận biết từ ảnh:
                        </p>
                        <ul className="space-y-1">
                          {analysisResult.observations.map((obs, oIdx) => (
                            <li key={oIdx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                              <span className="text-blue-500 shrink-0 font-bold">•</span>
                              <span>{obs}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Description Suggestions Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
                        <Lightbulb size={16} className="text-amber-500" />
                        Gợi ý mô tả tồn tại ({Object.keys(analysisResult.descriptions).length} phương án)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Bấm chọn để áp dụng ngay
                      </span>
                    </div>

                    {/* Option 1: Standard */}
                    <div 
                      onClick={() => setSelectedDescType('standard')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedDescType === 'standard'
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedDescType === 'standard' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                          }`}>
                            {selectedDescType === 'standard' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                            📋 Phương án tiêu chuẩn (Khuyên dùng)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(analysisResult.descriptions.standard, 'standard');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                          title="Sao chép"
                        >
                          {copiedKey === 'standard' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed pl-6">
                        {analysisResult.descriptions.standard}
                      </p>
                      <div className="mt-2.5 pl-6 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplySingleDescription(analysisResult.descriptions.standard);
                          }}
                          className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold text-[10px] rounded-lg hover:bg-blue-50 uppercase tracking-wider"
                        >
                          Áp dụng mô tả này
                        </button>
                      </div>
                    </div>

                    {/* Option 2: Concise */}
                    <div 
                      onClick={() => setSelectedDescType('concise')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedDescType === 'concise'
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedDescType === 'concise' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                          }`}>
                            {selectedDescType === 'concise' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                            ⚡ Phương án ngắn gọn (1 câu)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(analysisResult.descriptions.concise, 'concise');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                          title="Sao chép"
                        >
                          {copiedKey === 'concise' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed pl-6">
                        {analysisResult.descriptions.concise}
                      </p>
                      <div className="mt-2.5 pl-6 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplySingleDescription(analysisResult.descriptions.concise);
                          }}
                          className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold text-[10px] rounded-lg hover:bg-blue-50 uppercase tracking-wider"
                        >
                          Áp dụng mô tả này
                        </button>
                      </div>
                    </div>

                    {/* Option 3: Detailed */}
                    <div 
                      onClick={() => setSelectedDescType('detailed')}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        selectedDescType === 'detailed'
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedDescType === 'detailed' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                          }`}>
                            {selectedDescType === 'detailed' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400">
                            🔬 Phương án chi tiết & Cảnh báo nguy cơ
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(analysisResult.descriptions.detailed, 'detailed');
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                          title="Sao chép"
                        >
                          {copiedKey === 'detailed' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed pl-6">
                        {analysisResult.descriptions.detailed}
                      </p>
                      <div className="mt-2.5 pl-6 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplySingleDescription(analysisResult.descriptions.detailed);
                          }}
                          className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold text-[10px] rounded-lg hover:bg-blue-50 uppercase tracking-wider"
                        >
                          Áp dụng mô tả này
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Remedy Suggestion */}
                  {analysisResult.remedySuggestion && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap size={14} className="text-amber-600 dark:text-amber-400" />
                        <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider">
                          Biện pháp xử lý / Khắc phục đề xuất:
                        </span>
                      </div>
                      <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                        {analysisResult.remedySuggestion}
                      </p>
                    </div>
                  )}
                </>
              )}

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-wrap gap-2.5 justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition-colors uppercase tracking-wider"
          >
            Đóng
          </button>

          {analysisResult && (
            <>
              <button
                type="button"
                onClick={() => handleAnalyze(selectedImageIdx)}
                className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 uppercase tracking-wider"
              >
                <RefreshCw size={14} />
                Đánh giá lại
              </button>

              <button
                type="button"
                onClick={handleApplyAll}
                className="px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-wider"
              >
                <Zap size={15} className="text-yellow-300" />
                {formType === 'process' ? 'Áp dụng & Tự động chọn tồn tại' : 'Áp dụng tất cả vào biểu mẫu'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
