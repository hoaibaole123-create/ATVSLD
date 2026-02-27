
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PlusCircle, 
  Moon, 
  Sun,
  Signal, 
  Wifi, 
  Battery,
  LayoutDashboard,
  ClipboardList,
  Settings,
  CheckCircle2,
  Loader2,
  TableProperties,
  Search,
  FileSpreadsheet,
  RefreshCw,
  Download,
  AlertCircle,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  Trash2,
  Save,
  Edit3,
  Camera,
  CheckSquare,
  Filter,
  Clock,
  Activity as ActivityIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// --- Consolidated Types ---
export enum DefectStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  URGENT = 'URGENT'
}

export interface ChartData {
  name: string;
  detected: number;
  processed: number;
  nvvh: number;
}

// --- Configuration ---
const SHEET_ID = '1EVA37o8kSgi3Z86hwUQN5uyBtVwERDo3REO0xMtMqE0';

// AppScript URL
const REPORT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbytJsnBmwEMosm1dLK8VZTLYTt2CvR0E-ApUHFMDgWV6B0T1GEBnkk400Q4v0XBrRVO/exec';
const PROCESS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz6EOtoLlEu4qUDZPllqs2eET8VOQ14WwJbM0drY-sVWKWVL1nKJcAFqo7nsnGdZ6jl/exec';

const CATEGORIES = [
  'Quản lý hành chính',
  'Thiết bị công trình',
  'An toàn vệ sinh lao động',
  'TPM, Kaizen'
];

// --- Sub-components ---

const FormLabel: React.FC<{ icon?: string, children: React.ReactNode, required?: boolean }> = ({ icon, children, required }) => (
  <label className="block text-[14px] font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
    {icon && <span>{icon}</span>} {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const CustomRadio: React.FC<{ label: string, description?: string, name: string, value: string, checked?: boolean, onChange?: (e: any) => void }> = ({ label, description, name, value, checked, onChange }) => (
  <label className="flex items-start gap-2 mb-2 cursor-pointer group">
    <div className="mt-1 relative flex items-center justify-center">
      <input 
        type="radio" 
        name={name} 
        value={value} 
        checked={checked} 
        onChange={onChange}
        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer" 
      />
    </div>
    <div className="flex-1">
      <div className={`text-[13px] font-medium ${checked ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{label}</div>
      {description && <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight italic">{description}</div>}
    </div>
  </label>
);

// --- Dashboard Component ---

const Dashboard: React.FC<{ isDarkMode: boolean, onActivityClick: (sheet: string, row: number) => void }> = ({ isDarkMode, onActivityClick }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      let combinedActivities: any[] = [];
      let totalCount = 0;
      let completedCount = 0;
      let pendingCount = 0;

      const promises = CATEGORIES.map(async (cat) => {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(cat)}`;
        const response = await fetch(url);
        const text = await response.text();
        const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
        
        if (match) {
          const json = JSON.parse(match[1]);
          if (json.table && json.table.rows) {
            const rows = json.table.rows;
            const detected = rows.length;
            
            const processed = rows.filter((r: any) => r.c[11] && r.c[11].v).length;
            const nvvh = rows.filter((r: any) => r.c[12] && r.c[12].v).length;
            const pending = detected - processed;

            rows.slice(-4).forEach((r: any, idx: number) => {
              combinedActivities.push({
                time: r.c[1]?.f || 'N/A',
                title: String(r.c[5]?.v || 'Không rõ'),
                location:String(r.c[6]?.v || 'N/A'),
                category: cat,
                row: rows.length - 4 + idx + 2, 
                isDone: !!(r.c[11] && r.c[11].v)
              });
            });

            totalCount += detected;
            completedCount += processed;
            pendingCount += pending;

            return {
              name: cat === 'Quản lý hành chính' ? 'HC' : 
                    cat === 'Thiết bị công trình' ? 'TB' : 
                    cat === 'An toàn vệ sinh lao động' ? 'AT' : 'TPM',
              detected, 
              processed, 
              nvvh      
            };
          }
        }
        return { name: cat, detected: 0, processed: 0, nvvh: 0 };
      });

      const results = await Promise.all(promises);
      setChartData(results);
      setStats({ total: totalCount, completed: completedCount, pending: pendingCount });
      setRecentActivities(combinedActivities.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10));

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      <div className="relative w-full h-64 overflow-hidden">
        <img alt="Factory" className="w-full h-full object-cover brightness-[0.25]" src="https://images.unsplash.com/photo-1565034946487-077786996e27?auto=format&fit=crop&q=80&w=1200" />
        <div className="absolute inset-0 flex flex-col justify-center items-center px-10 text-center bg-gradient-to-b from-blue-900/30 via-transparent to-slate-900/90">
          <h1 className="text-white text-2xl font-black uppercase tracking-tight drop-shadow-2xl mb-2">
            Hệ thống Quản lý Khiếm khuyết
          </h1>
          <div className="flex items-center gap-2 text-blue-200 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/20">
            <ActivityIcon size={14} className="animate-pulse" />
            Live Monitoring
          </div>
        </div>
      </div>

      <main className="px-4 -mt-12 relative z-10 flex-1 max-w-2xl mx-auto w-full">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-white/50 dark:border-slate-800 text-center group transition-all hover:bg-blue-50/10">
            <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-tighter">Tổng lỗi</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{isLoading ? <Loader2 className="animate-spin inline" size={16} /> : stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-white/50 dark:border-slate-800 text-center group transition-all hover:bg-amber-50/10">
            <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-tighter">Đang xử lý</p>
            <p className="text-2xl font-black text-amber-500">{isLoading ? <Loader2 className="animate-spin inline" size={16} /> : stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-white/50 dark:border-slate-800 text-center group transition-all hover:bg-emerald-50/10">
            <p className="text-[9px] text-slate-400 font-black uppercase mb-1 tracking-tighter">Hoàn thành</p>
            <p className="text-2xl font-black text-emerald-500">{isLoading ? <Loader2 className="animate-spin inline" size={16} /> : stats.completed}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Biểu đồ hoạt động</h2>
            <button onClick={fetchDashboardData} className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="h-64 w-full">
            {isLoading ? (
               <div className="h-full w-full flex items-center justify-center opacity-20"><Loader2 size={40} className="animate-spin" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: "#94a3b8" }} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: "#94a3b8" }} />
                  <Tooltip 
                    cursor={{ fill: isDarkMode ? '#1e293b' : '#f8fafc', radius: 8 }} 
                    contentStyle={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderRadius: '16px', border: 'none', fontSize: '11px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} 
                  />
                  <Bar dataKey="detected" name="Phát hiện" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={8} />
                  <Bar dataKey="processed" name="Đã xử lý" fill="#10b981" radius={[4, 4, 0, 0]} barSize={8} />
                  <Bar dataKey="nvvh" name="NVVH" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={8} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', paddingTop: '15px' }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600"><Clock size={18} /></div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Hoạt động mới nhất</h2>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl animate-pulse" />
              ))
            ) : recentActivities.length > 0 ? (
              recentActivities.map((act, idx) => (
                <div 
                  key={idx} 
                  onClick={() => onActivityClick(act.category, act.row)}
                  className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/50 group transition-all hover:shadow-lg cursor-pointer active:scale-[0.98]"
                >
                  <div className={`shrink-0 w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-sm ${act.isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {act.isDone ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate leading-tight mb-1 uppercase tracking-tighter">
                      {act.title}
                    </h3>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate mb-1">
    📍 {act.location}
  </p>

                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                        {act.category.split(',')[0]}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {act.time.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
              ))
            ) : (
              <div className="py-12 text-center opacity-30 flex flex-col items-center">
                <ActivityIcon size={40} strokeWidth={1} />
                <p className="text-[10px] uppercase font-black tracking-widest mt-3">Hiện chưa có hoạt động</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Form Tab Component ---

const DefectForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [images, setImages] = useState<{file: File, preview: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    reporterName: '',
    category: '', 
    area: '',     
    equipmentName: '',
    location: '',
    description: ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.area) {
      alert("Vui lòng chọn đầy đủ Phân loại và Khu vực!");
      return;
    }

    setIsSubmitting(true);
    try {
      const filesPayload = await Promise.all(images.map(img => {
        return new Promise<any>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({
            dataURL: reader.result as string,
            type: img.file.type,
            name: img.file.name
          });
          reader.readAsDataURL(img.file);
        });
      }));

      const payload = { ...formData, files: filesPayload };
      await fetch(REPORT_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({ reporterName: '', category: '', area: '', equipmentName: '', location: '', description: '' });
        setImages([]);
      }, 3000);

    } catch (err) {
      alert("Có lỗi xảy ra khi kết nối với máy chủ.");
      setIsSubmitting(false);
    }
  };

  if (showSuccess) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center animate-in zoom-in duration-300">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-inner"><CheckCircle2 size={48} /></div>
      <h2 className="text-xl font-bold mb-2">Gửi báo cáo thành công!</h2>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-blue-800 p-4 shadow-md text-center"><h2 className="text-white text-[12px] font-black uppercase tracking-widest">CẬP NHẬT TỒN TẠI & HƯ HỎNG</h2></div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
          <section><FormLabel required>Họ và tên người phát hiện</FormLabel><input type="text" className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] outline-none" required value={formData.reporterName} onChange={(e) => setFormData({...formData, reporterName: e.target.value})} /></section>
          <section><FormLabel required>Phân loại</FormLabel>
            <div className="mt-2 space-y-1">
              <CustomRadio name="category" value="administrative" label="Quản lý hành chính" checked={formData.category === 'administrative'} onChange={(e) => setFormData({...formData, category: e.target.value})} />
              <CustomRadio name="category" value="construction-equipment" label="Hư hỏng thiết bị công trình" checked={formData.category === 'construction-equipment'} onChange={(e) => setFormData({...formData, category: e.target.value})} />
              <CustomRadio name="category" value="safety" label="An toàn vệ sinh lao động" checked={formData.category === 'safety'} onChange={(e) => setFormData({...formData, category: e.target.value})} />
              <CustomRadio name="category" value="iso-kaizen" label="ISO, KAIZEN 5S, TPM" checked={formData.category === 'iso-kaizen'} onChange={(e) => setFormData({...formData, category: e.target.value})} />
            </div>
          </section>
          <section><FormLabel required>Khu vực</FormLabel>
            <div className="mt-2 flex flex-col gap-1">
              <CustomRadio name="area" value="ialy-hien-huu" label="Ialy hiện hữu" checked={formData.area === 'ialy-hien-huu'} onChange={(e) => setFormData({...formData, area: e.target.value})} />
              <CustomRadio name="area" value="ialy-mo-rong" label="Ialy mở rộng" checked={formData.area === 'ialy-mo-rong'} onChange={(e) => setFormData({...formData, area: e.target.value})} />
              <CustomRadio name="area" value="cua-nhan-nuoc" label="Cửa nhận nước" checked={formData.area === 'cua-nhan-nuoc'} onChange={(e) => setFormData({...formData, area: e.target.value})} />
              <CustomRadio name="area" value="opy-500" label="OPY 500kV" checked={formData.area === 'opy-500'} onChange={(e) => setFormData({...formData, area: e.target.value})} />
            </div>
          </section>
          <section><FormLabel required>Tên thiết bị</FormLabel><input type="text" className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] outline-none" required value={formData.equipmentName} onChange={(e) => setFormData({...formData, equipmentName: e.target.value})} /></section>
          <section><FormLabel required>Địa điểm</FormLabel><input type="text" className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] outline-none" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /></section>
          <section><FormLabel required>Mô tả</FormLabel><textarea rows={3} className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] outline-none resize-none" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></section>
          <section><FormLabel>Hình ảnh</FormLabel>
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900 cursor-pointer"><input type="file" ref={fileInputRef} multiple accept="image/*" className="hidden" onChange={handleImageChange} /><UploadCloud className="text-blue-500 mb-4" size={32} /><span className="px-6 py-2 bg-blue-600 text-white text-[11px] font-bold rounded-lg uppercase shadow-md">Chọn hình ảnh</span></div>
            <div className="flex flex-wrap gap-2 mt-4">{images.map((img, i) => (<div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border"><img src={img.preview} className="w-full h-full object-cover" /><button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full"><Trash2 size={12}/></button></div>))}</div>
          </section>
          <div className="flex justify-center pt-6"><button type="submit" disabled={isSubmitting} className="px-12 py-3.5 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[13px] shadow-xl flex items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null} GỬI BÁO CÁO</button></div>
        </form>
      </div>
    </div>
  );
};

// --- Summary Tab Component ---

const TableCellContent: React.FC<{ value: any, header: string }> = ({ value, header }) => {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const valStr = String(value || '').trim();
  const lowerHeader = String(header || '').toLowerCase();
  
  const isImageColumn = lowerHeader.includes('hình') || lowerHeader.includes('minh chứng') || lowerHeader.includes('ảnh');
  
  if (!valStr || !isImageColumn) {
    return <div className="block break-words min-w-[150px] leading-normal">{valStr || '-'}</div>;
  }

  const potentialUrls = valStr.split(/[,\n\s]+/).map(s => s.trim()).filter(s => s.length > 5);
  const images = potentialUrls.filter(url => url.startsWith('http')).map(url => {
    let displayUrl = url;
    if (url.includes('drive.google.com')) {
      const driveMatch = url.match(/\/d\/(.+?)\/(view|edit|usp)/) || url.match(/id=(.+?)(&|$)/);
      if (driveMatch && driveMatch[1]) {
        displayUrl = `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w400`;
      }
    }
    return { original: url, display: displayUrl };
  });

  if (images.length === 0) return <div className="block break-words min-w-[150px] leading-normal">{valStr}</div>;

  return (
    <>
      <div className="flex flex-wrap gap-1.5 items-center justify-start p-1 min-w-[120px]">
        {images.map((img, idx) => (
          <div key={idx} onClick={() => setPreviewIndex(idx)} className="w-12 h-12 bg-slate-100 rounded border border-slate-200 overflow-hidden shrink-0 cursor-pointer"><img src={img.display} className="w-full h-full object-cover" /></div>
        ))}
      </div>
      {previewIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPreviewIndex(null)}>
          <button className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full z-[110]"><X size={32} /></button>
          {images.length > 1 && (
            <>
              <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full z-[110]" onClick={(e) => { e.stopPropagation(); setPreviewIndex((previewIndex - 1 + images.length) % images.length); }}><ChevronLeft size={32} /></button>
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-3 bg-white/10 hover:bg-white/20 rounded-full z-[110]" onClick={(e) => { e.stopPropagation(); setPreviewIndex((previewIndex + 1) % images.length); }}><ChevronRight size={32} /></button>
            </>
          )}
          <div className="relative max-w-full max-h-[75vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img src={images[previewIndex].display.includes('thumbnail') ? images[previewIndex].display.replace('w400', 'w1000') : images[previewIndex].original} alt="Full Preview" className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl" />
          </div>
          <div className="mt-8 flex flex-col items-center gap-4 text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Hình ảnh {previewIndex + 1} / {images.length}</p>
            <a href={images[previewIndex].original} target="_blank" rel="noreferrer" className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold text-xs uppercase tracking-widest flex items-center gap-2" onClick={(e) => e.stopPropagation()}>Xem link gốc <ExternalLink size={14} /></a>
          </div>
        </div>
      )}
    </>
  );
};

// --- Modal Chỉnh sửa ---

interface EditModalProps {
  sheet: string;
  row: number;
  headers: string[];
  rowData: any[];
  onClose: () => void;
  onSave: () => void;
}

const EditModal: React.FC<EditModalProps> = ({ sheet, row, headers, rowData, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<any[]>(rowData);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        action: 'updateRowData',
        sheetName: sheet,
        row: row,
        rowData: editedData,
        sheetId: SHEET_ID
      };

      // Để tránh lỗi CORS "Failed to fetch" với Google Apps Script:
      // Chúng ta gửi payload dưới dạng chuỗi và không đặt header Content-Type JSON.
      // Apps Script sẽ nhận payload này qua e.postData.contents.
      const response = await fetch(PROCESS_WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', // Sử dụng no-cors để đảm bảo request được gửi đi mà không bị chặn bởi Preflight
        body: JSON.stringify(payload)
      });

      // Lưu ý: với mode 'no-cors', response.ok sẽ luôn là false và chúng ta không đọc được body.
      // Ta giả định thành công sau một khoảng thời gian ngắn hoặc sau khi request hoàn tất.
      
      alert("Yêu cầu cập nhật đã được gửi! Vui lòng đợi vài giây để hệ thống xử lý.");
      onSave();
    } catch (err) {
      console.error("Save error:", err);
      alert("Có lỗi xảy ra khi lưu. Vui lòng kiểm tra lại cấu hình Apps Script.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 bg-blue-600 flex items-center justify-between shrink-0">
          <h2 className="text-white font-black text-xs uppercase tracking-widest">Chỉnh sửa hàng #{row}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors"><X size={20}/></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {headers.map((h, idx) => {
            const isReadOnly = idx === 0 || idx === 1; // ID và Timestamp thường không nên sửa
            return (
              <div key={idx} className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter ml-1">{h}</label>
                <input 
                  type="text" 
                  disabled={isReadOnly}
                  className={`w-full p-3 rounded-xl border text-xs font-semibold outline-none transition-all ${isReadOnly ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:bg-slate-800 dark:border-slate-700 dark:text-white'}`}
                  value={editedData[idx] || ''}
                  onChange={(e) => {
                    const newData = [...editedData];
                    newData[idx] = e.target.value;
                    setEditedData(newData);
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors uppercase tracking-widest dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400">Hủy</button>
          <button 
            disabled={isSaving}
            onClick={handleSave} 
            className="flex-1 py-3 text-xs font-black text-white bg-blue-600 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
            {isSaving ? 'Đang gửi...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

const DefectSummary: React.FC<{ jumpTo?: { sheet: string, row: number } | null }> = ({ jumpTo }) => {
  const MAX_COLS = 14; 
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [activeSheetName, setActiveSheetName] = useState('Quản lý hành chính');
  const [searchTerm, setSearchTerm] = useState('');
  const [editTarget, setEditTarget] = useState<{ row: number, data: any[] } | null>(null);
  const rowRefs = useRef<{[key: number]: HTMLTableRowElement | null}>({});

  const categories = [{ name: 'Quản lý hành chính' }, { name: 'Thiết bị công trình' }, { name: 'An toàn vệ sinh lao động' }, { name: 'TPM, Kaizen' }];

  useEffect(() => {
    if (jumpTo) {
      setActiveSheetName(jumpTo.sheet);
    }
  }, [jumpTo]);

  const fetchSheetData = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(activeSheetName)}`;
      const response = await fetch(url);
      const text = await response.text();
      const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
      if (match) {
        const json = JSON.parse(match[1]);
        if (json.table && json.table.rows) {
          const rows = json.table.rows.map((row: any) => row.c.map((cell: any) => cell ? (cell.f || cell.v || '') : ''));
          const headers = json.table.cols.map((col: any) => col.label || '');
          setData([headers, ...rows]);
        }
      }
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  }, [activeSheetName]);

  useEffect(() => { fetchSheetData(); }, [fetchSheetData]);

  useEffect(() => {
    if (jumpTo && !isLoading && data.length > 0) {
      const targetRow = jumpTo.row;
      const el = rowRefs.current[targetRow];
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [jumpTo, isLoading, data]);

  const safeSearchTerm = String(searchTerm || '');
  const filteredData = safeSearchTerm.trim() === '' ? data : [data[0], ...data.slice(1).filter(row => row.some((cell: any) => String(cell).toLowerCase().includes(safeSearchTerm.toLowerCase())))];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-x-hidden">
      <div className="bg-blue-800 p-4 shadow-xl flex items-center justify-between shrink-0"><div className="flex items-center gap-3"><TableProperties className="text-white" size={20} /><h1 className="text-white font-black text-[12px] uppercase">TỔNG HỢP DỮ LIỆU</h1></div><button onClick={fetchSheetData} className="p-2 text-white"><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /></button></div>
      <div className="p-4 bg-white dark:bg-slate-900 border-b space-y-4 shrink-0"><div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">{categories.map((cat) => (<button key={cat.name} onClick={() => setActiveSheetName(cat.name)} className={`px-4 py-2 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${activeSheetName === cat.name ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{cat.name}</button>))}</div><div className="flex items-center gap-3"><div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="text" placeholder="Tìm kiếm nhanh..." className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div></div>
      <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-950">
        {isLoading ? (<div className="h-full flex flex-col items-center justify-center space-y-3"><Loader2 size={48} className="animate-spin text-blue-500" /></div>) : filteredData.length > 0 ? (
          <div className="overflow-hidden shadow-2xl rounded-3xl bg-white dark:bg-slate-900 overflow-x-auto border border-slate-100 dark:border-slate-800"><table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800"><thead className="bg-slate-50 dark:bg-slate-800/50"><tr>{filteredData[0].slice(0, MAX_COLS).map((h: string, idx: number) => (<th key={idx} className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-r last:border-0">{h}</th>))}<th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">{filteredData.slice(1).map((row, rIdx) => {
            const actualRowIndex = rIdx + 2;
            const isJumped = jumpTo && actualRowIndex === jumpTo.row && activeSheetName === jumpTo.sheet;
            return (
              <tr key={rIdx} ref={el => { if (el) rowRefs.current[actualRowIndex] = el; }} className={isJumped ? 'bg-yellow-100 dark:bg-yellow-900/40' : ''}>
                {row.slice(0, MAX_COLS).map((cell: any, cIdx: number) => (<td key={cIdx} className="px-6 py-4 text-xs text-slate-700 dark:text-slate-300 border-r last:border-0 align-top"><TableCellContent value={cell} header={filteredData[0][cIdx]} /></td>))}
                <td className="px-6 py-4 align-top">
                  <button 
                    onClick={() => setEditTarget({ row: actualRowIndex, data: row })}
                    className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
                  >
                    <Edit3 size={16} />
                  </button>
                </td>
              </tr>
            );
          })}</tbody></table></div>
        ) : (<div className="h-full flex flex-col items-center justify-center opacity-40"><FileSpreadsheet size={80} /></div>)}
      </div>

      {editTarget && (
        <EditModal 
          sheet={activeSheetName} 
          row={editTarget.row} 
          headers={data[0]} 
          rowData={editTarget.data} 
          onClose={() => setEditTarget(null)}
          onSave={() => {
            setEditTarget(null);
            setTimeout(fetchSheetData, 1000); // Đợi chút để Server cập nhật xong
          }}
        />
      )}
    </div>
  );
};

// --- Tab: Xử lý tồn tại ---

const ProcessingForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [defectList, setDefectList] = useState<any[]>([]);
  const [images, setImages] = useState<{file: File, preview: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ sheet: '', row: '', tinhTrang: '', ghiChu: '', NVVH: '' });

  const categories = [
    { label: 'Quản lý hành chính', value: 'Quản lý hành chính' },
    { label: 'Thiết bị công trình', value: 'Thiết bị công trình' },
    { label: 'An toàn vệ sinh lao động', value: 'An toàn vệ sinh lao động' },
    { label: 'TPM, Kaizen', value: 'TPM, Kaizen' }
  ];

  useEffect(() => {
    if (formData.sheet) fetchDefects();
    else setDefectList([]);
  }, [formData.sheet]);

  const fetchDefects = async () => {
    setIsLoadingList(true);
    try {
      const payload = { action: 'getPendingList', sheetName: formData.sheet, sheetId: SHEET_ID };
      // Sử dụng mode no-cors cho POST request nếu cần, nhưng GET/POST JSON đơn giản thường ok với Apps Script nếu thiết lập đúng.
      const response = await fetch(PROCESS_WEB_APP_URL, { 
        method: 'POST', 
        body: JSON.stringify(payload) 
      });
      const data = await response.json();
      setDefectList(data);
    } catch (err) { console.error(err); } finally { setIsLoadingList(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sheet || !formData.row) return alert("Vui lòng chọn đầy đủ thông tin!");
    setIsSubmitting(true);
    try {
      const filesPayload = await Promise.all(images.map(img => {
        return new Promise<any>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve({ data: (reader.result as string).split(',')[1], type: img.file.type, name: img.file.name });
          reader.readAsDataURL(img.file);
        });
      }));
      const payload = { action: 'uploadFiles', form: { sheetId: SHEET_ID, sheet: formData.sheet, row: parseInt(formData.row), tinhTrang: formData.tinhTrang, ghiChu: formData.ghiChu, NVVH: formData.NVVH, files: filesPayload } };
      
      await fetch(PROCESS_WEB_APP_URL, { 
        method: 'POST', 
        mode: 'no-cors',
        body: JSON.stringify(payload) 
      });

      alert("Cập nhật thành công!");
      setFormData({ sheet: '', row: '', tinhTrang: '', ghiChu: '', NVVH: '' });
      setImages([]);
      setDefectList([]);
    } catch (err) { alert("Lỗi: " + err); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="animate-in slide-in-from-right duration-500 max-w-2xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-8"><h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">📸 Cập nhật xử lý tồn tại</h1></div>
      <form onSubmit={handleSubmit} className="space-y-6 pb-24">
        <section><FormLabel icon="📄">Chọn loại</FormLabel><select className="w-full p-3 rounded-lg border border-slate-300 bg-white" value={formData.sheet} onChange={(e) => setFormData({...formData, sheet: e.target.value, row: ''})}><option value="">-- Chọn loại --</option>{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></section>
        <section><FormLabel icon="📁">Chọn tồn tại</FormLabel><div className="relative"><select className="w-full p-3 rounded-lg border border-slate-300 bg-white disabled:bg-slate-50" value={formData.row} onChange={(e) => setFormData({...formData, row: e.target.value})} disabled={!formData.sheet || isLoadingList}><option value="">-- Chọn tồn tại --</option>{defectList.map((item, idx) => (<option key={idx} value={item.row}>{`[${item.colE}] - ${item.colF} - ${item.colG}`}</option>))}</select>{isLoadingList && <Loader2 className="absolute right-3 top-3.5 animate-spin text-blue-500" size={18} />}</div></section>
        <section><FormLabel icon="⚠️">Tình trạng</FormLabel><input type="text" className="w-full p-3 rounded-lg border border-slate-300 
             bg-white text-slate-900 
             placeholder:text-slate-400 
             focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.tinhTrang} onChange={(e) => setFormData({...formData, tinhTrang: e.target.value})} /></section>
        <section><FormLabel icon="📝">Ghi chú</FormLabel><textarea rows={3} className="w-full p-3 rounded-lg border border-slate-300 
             bg-white text-slate-900 
             placeholder:text-slate-400 
             resize-none
             focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.ghiChu} onChange={(e) => setFormData({...formData, ghiChu: e.target.value})} /></section>
        <section><FormLabel icon="📝">NVVH xử lý</FormLabel><textarea rows={3} className="w-full p-3 rounded-lg border border-slate-300 
             bg-white text-slate-900 
             placeholder:text-slate-400 
             resize-none
             focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.NVVH} onChange={(e) => setFormData({...formData, NVVH: e.target.value})} /></section>
        <section><FormLabel icon="🖼️">Hình ảnh minh chứng</FormLabel><div className="flex items-center gap-4 p-3 border border-slate-300 rounded-lg bg-white"><button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 bg-slate-100 border border-slate-300 rounded text-sm font-medium">Chọn tệp</button><span className="text-sm text-slate-500">{images.length > 0 ? `${images.length} tệp` : "Chưa chọn"}</span><input type="file" ref={fileInputRef} multiple className="hidden" onChange={(e) => { if(e.target.files) setImages([...images, ...Array.from(e.target.files).map(f => ({file: f, preview: URL.createObjectURL(f)}))]); }} /></div><div className="flex flex-wrap gap-2 mt-4">{images.map((img, i) => (<div key={i} className="relative w-24 h-24 rounded-lg border-2 overflow-hidden shadow-sm hover:scale-105 transition-transform"><img src={img.preview} className="w-full h-full object-cover" /><button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><Trash2 size={12}/></button></div>))}</div></section>
        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-200 active:scale-[0.98] transition-all">{isSubmitting ? <Loader2 size={24} className="animate-spin inline" /> : "Gửi dữ liệu"}</button>
      </form>
    </div>
  );
};

// --- App Shell ---

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'processing' | 'summary'>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [summaryJump, setSummaryJump] = useState<{ sheet: string, row: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })), 10000);
    return () => clearInterval(timer);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleActivityClick = (sheet: string, row: number) => {
    setSummaryJump({ sheet, row });
    setActiveTab('summary');
  };

  return (
    <div className={`min-h-screen relative flex flex-col pb-24 shadow-2xl bg-background-light dark:bg-background-dark overflow-x-hidden ${activeTab === 'dashboard' ? 'max-w-md mx-auto' : 'w-full'}`}>
      <div className="flex justify-between items-center px-6 pt-3 pb-1 text-slate-900 dark:text-white sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-50">
        <span className="text-xs font-bold">{currentTime}</span>
        <div className="flex gap-1.5 items-center"><Signal size={14} /><Wifi size={14} /><Battery size={14} className="rotate-90" /></div>
      </div>

      <button onClick={toggleDarkMode} className="fixed top-12 right-6 w-10 h-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center border border-white dark:border-slate-700 z-50 transition-all active:scale-90">
        {isDarkMode ? <Sun className="text-amber-400" size={18} /> : <Moon className="text-slate-600" size={18} />}
      </button>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'dashboard' && <Dashboard isDarkMode={isDarkMode} onActivityClick={handleActivityClick} />}
        {activeTab === 'report' && <DefectForm />}
        {activeTab === 'processing' && <ProcessingForm />}
        {activeTab === 'summary' && <DefectSummary jumpTo={summaryJump} />}
      </div>

      <nav className={`fixed bottom-0 left-0 right-0 mx-auto h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-50 ${activeTab === 'dashboard' ? 'max-w-md' : 'w-full'}`}>
        <button onClick={() => { setActiveTab('dashboard'); setSummaryJump(null); }} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'dashboard' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'dashboard' ? 'bg-blue-600/10' : ''}`}><LayoutDashboard size={22} /></div>
          <span className="text-[8px] font-black uppercase tracking-tight">Tổng quan</span>
        </button>
        <button onClick={() => { setActiveTab('report'); setSummaryJump(null); }} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'report' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'report' ? 'bg-blue-600/10' : ''}`}><ClipboardList size={22} /></div>
          <span className="text-[8px] font-black uppercase tracking-tight">Báo cáo</span>
        </button>
        <button onClick={() => { setActiveTab('processing'); setSummaryJump(null); }} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'processing' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'processing' ? 'bg-blue-600/10' : ''}`}><Camera size={22} /></div>
          <span className="text-[8px] font-black uppercase tracking-tight">Xử lý</span>
        </button>
        <button onClick={() => setActiveTab('summary')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'summary' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'summary' ? 'bg-blue-600/10' : ''}`}><TableProperties size={22} /></div>
          <span className="text-[8px] font-black uppercase tracking-tight">Tổng hợp</span>
        </button>
      </nav>
    </div>
  );
};
export default App;
