
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  ChevronDown,
  ChevronUp,
  UploadCloud,
  Trash2,
  Save,
  Edit3,
  Camera,
  CheckSquare,
  Filter,
  Clock,
  Activity as ActivityIcon,
  Users,
  Sparkles,
  Wand2,
  ScanSearch,
  Check,
  Lightbulb,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Copy,
  Bot,
  Layers,
  BellRing,
  AlertTriangle,
  Info,
  Eye,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
  Sector
} from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AiVisionDefectAnalyzer } from './src/components/AiVisionDefectAnalyzer';

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
const EDIT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwpCbRAAzIKjQhBq96OqYoAHgDaaahzvFkKo2NczHntmkwZOeGnSSFecvg44ZXZUhs/exec';

const CATEGORIES = [
  
  'An toàn vệ sinh lao động',
  'TPM, Kaizen'
];

export const AREA_LOCATIONS_MAP: Record<string, { name: string; locations: string[] }> = {
  'opy-500': {
    name: 'OPY 500kV',
    locations: [
      'Trạm OPY ▼ 550',
      'Phòng Điều Khiển - Trạm OPY ▼ 550',
      'Trạm Phân Phối Ngoài Trời - Trạm OPY ▼ 550'
    ]
  },
  'cua-nhan-nuoc': {
    name: 'Cửa nhận nước & Đập tràn',
    locations: [
      'CNN Ialy Hiện Hữu ▼522',
      'CNN Ialy Mở Rộng ▼522',
      'CNN',
      'Đập Tràn ▼ 522',
      'THB11 - Đập tràn ▼522',
      'Tời Nâng - Đập tràn ▼522'
    ]
  },
  'ialy-mo-rong': {
    name: 'Ialy mở rộng',
    locations: [
      'NMTĐ IALY MỞ RỘNG',
      'TRẠM CHUYỂN TIẾP ▼ 358,5',
      'CÁC HỆ THỐNG, THIẾT BỊ ▼ 348',
      'Máy biến áp 500kV ▼ 348',
      'Trạm xử lý nước, dầu ▼ 348',
      'Trạm bơm chữa cháy ▼ 348',
      'Trạm Diezel dự phòng ▼ 348',
      'Khu vực hạ lưu NM ▼ 348',
      'Cao trình 339,1',
      'Phòng ĐKTT ▼ 339,1',
      'Cao trình 331,4',
      'Phòng Tự dùng ▼ 331,4',
      'Cao trình 323,7',
      'Xưởng sửa chữa cơ khí ▼ 323,7',
      'Phòng TG hút ▼ 316,6',
      'Phòng thiết bị khí nén ▼ 316,6',
      'Cao trình 309,5-GM',
      'Phòng thiết bị kích từ ▼ 309,5-GM',
      'Phòng máy nén khí bù ▼ 309,5-GM',
      'Phòng thông gió đẩy ▼ 309,5-GM',
      'Cao trình 303,9-GM',
      'Buồng MF H5 ▼ 303,9-GM',
      'Buồng MF H6 ▼ 303,9-GM',
      'Cao trình 298,3-GM',
      'Hầm tua bin ▼ 298,3-GM',
      'Cao trình 292,7-GM',
      'Cao trình 288,3-GM',
      'GIAN MÁY'
    ]
  },
  'ialy-hien-huu': {
    name: 'Ialy hiện hữu',
    locations: [
      'NMTĐ IALY',
      'Nhà Khử Khí ▼ 355,7',
      'Phòng máy phát Diezel ▼ 355,7 - nhà PK',
      'Thông Gió Hút ▼352',
      'Trạm Chuyển Tiếp ▼ 352',
      'Các Hệ Thống, Thiết Bị Nhà PK',
      'Trạm Hợp Bộ 6 - nhà PK',
      'Thông Gió Đẩy - nhà PK',
      'Phòng ĐKTT - nhà PK',
      'Gian Biến Áp',
      'Cao Trình 340 - GBA',
      'Cao Trình 336,5 - GBA',
      'Cao Trình 332 - GBA',
      'Cao Trình 327,8 - GBA',
      'Cao Trình 323,8 - GBA',
      'Xưởng Sửa Chữa GBA',
      'Gian Máy',
      'Cao Trình 309 - GM',
      'Cao Trình 303 - GM',
      'Xưởng Sửa Chữa ▼ 303 - GM',
      'Cao Trình 299,2 - GM',
      'Cao Trình 288,8 - GM',
      'Cao Trình 284,2 - GM',
      'Cao Trình 277 - GM'
    ]
  }
};

export const IALY_HIEN_HUU_LOCATIONS = AREA_LOCATIONS_MAP['ialy-hien-huu'].locations;

// --- Bảng phân giao trách nhiệm bảo trì tự quản TPM - Ialy Mở Rộng ---
export interface KipDutyInfo {
  stt: number;
  elevation: string;
  task: string;
  assignedKip: string;
  kipId: number;
}

export const IALY_MO_RONG_DUTY_TABLE: KipDutyInfo[] = [
  { stt: 1, elevation: '358m', task: 'Thực hiện quy trình bảo trì tự quản TPM.', assignedKip: 'Kíp 1', kipId: 1 },
  { stt: 2, elevation: '348m', task: 'Thực hiện quy trình bảo trì tự quản TPM.', assignedKip: 'Kíp 1', kipId: 1 },
  { stt: 3, elevation: '339m', task: 'Thực hiện quy trình bảo trì tự quản TPM.', assignedKip: 'Kíp 2', kipId: 2 },
  { stt: 4, elevation: '331m', task: 'Thực hiện quy trình bảo trì tự quản TPM.', assignedKip: 'Kíp 2', kipId: 2 },
  { stt: 5, elevation: '323m', task: 'Thực hiện quy trình bảo trì tự quản TPM.', assignedKip: 'Kíp 3', kipId: 3 },
  { stt: 6, elevation: '316m', task: 'Thực hiện quy trình bảo trì tự quản TPM.', assignedKip: 'Kíp 3', kipId: 3 },
  { stt: 7, elevation: '309m', task: 'Thực hiện quy trình bảo trì tự quản TPM.', assignedKip: 'Kíp 4', kipId: 4 },
  { stt: 8, elevation: '303m', task: 'Thực hiện quy trình bảo trì tự quản TPM.', assignedKip: 'Kíp 5', kipId: 5 },
  { stt: 9, elevation: '298m', task: 'Thực hiện quy trình bảo trì tự quản TPM.', assignedKip: 'Kíp 5', kipId: 5 },
  { stt: 10, elevation: '292,7m', task: 'Thực hiện quy trình bảo trì tự quản TPM.', assignedKip: 'Kíp 4', kipId: 4 },
  { stt: 11, elevation: '288,3m', task: 'Thực hiện quy trình bảo trì tự quản TPM.', assignedKip: 'Kíp 1', kipId: 1 }
];

export interface KipSummaryConfig {
  kipId: number;
  kipName: string;
  elevationsText: string;
  elevations: string[];
}

export const KIP_CONFIG_LIST: KipSummaryConfig[] = [
  { kipId: 1, kipName: 'Kíp 1', elevationsText: '▼ 358m • 348m • 288,3m', elevations: ['358', '348', '288,3', '288.3', '288'] },
  { kipId: 2, kipName: 'Kíp 2', elevationsText: '▼ 339m • 331m', elevations: ['339', '331'] },
  { kipId: 3, kipName: 'Kíp 3', elevationsText: '▼ 323m • 316m', elevations: ['323', '316'] },
  { kipId: 4, kipName: 'Kíp 4', elevationsText: '▼ 309m • 292,7m', elevations: ['309', '292,7', '292.7', '292'] },
  { kipId: 5, kipName: 'Kíp 5', elevationsText: '▼ 303m • 298m', elevations: ['303', '298'] }
];

export function detectKipFromDefect(area?: string, location?: string, title?: string): { kipId: number, kipName: string, matchedElevation: string } | null {
  const normArea = String(area || '').toLowerCase().trim();
  const normLoc = String(location || '').toLowerCase().trim();
  const normTitle = String(title || '').toLowerCase().trim();

  // 1. Kiểm tra nếu chứa từ khóa "mở rộng" -> chắc chắn là Ialy Mở Rộng
  const hasMoRongKeywords = normArea.includes('mở rộng') || normArea.includes('mo rong') || normArea.includes('mo-rong') ||
    normLoc.includes('mở rộng') || normLoc.includes('mo rong') || normLoc.includes('mo-rong') ||
    normTitle.includes('mở rộng') || normTitle.includes('mo rong');

  // Nếu không có từ khóa mở rộng, kiểm tra danh mục vị trí Ialy Mở Rộng
  const matchesMoRongList = AREA_LOCATIONS_MAP['ialy-mo-rong']?.locations.some(l => {
    const lower = l.toLowerCase();
    return normLoc === lower || (normLoc.length > 5 && normLoc.includes(lower));
  });

  const isMoRong = hasMoRongKeywords || matchesMoRongList;

  // CHỈ xử lý nếu tồn tại thuộc Ialy mở rộng
  if (!isMoRong) {
    return null;
  }

  // 2. Kiểm tra loại trừ nếu bị nhầm sang khu vực khác (chỉ khi không có từ khóa mở rộng)
  if (!hasMoRongKeywords) {
    if (normArea.includes('hiện hữu') || normArea.includes('hien huu')) return null;
    if (normArea.includes('cửa nhận nước') || normArea.includes('đập tràn') || normLoc.includes('cnn')) return null;
    if (normArea.includes('opy') || normLoc.includes('opy')) return null;
  }

  const combined = `${normLoc} ${normTitle} ${normArea}`;

  // Cao trình 358m -> Kíp 1
  if (combined.includes('358')) return { kipId: 1, kipName: 'Kíp 1', matchedElevation: '▼ 358m' };
  // Cao trình 348m -> Kíp 1
  if (combined.includes('348')) return { kipId: 1, kipName: 'Kíp 1', matchedElevation: '▼ 348m' };
  // Cao trình 288,3m -> Kíp 1
  if (combined.includes('288,3') || combined.includes('288.3') || combined.includes('288')) return { kipId: 1, kipName: 'Kíp 1', matchedElevation: '▼ 288,3m' };
  // Cao trình 339m -> Kíp 2
  if (combined.includes('339')) return { kipId: 2, kipName: 'Kíp 2', matchedElevation: '▼ 339m' };
  // Cao trình 331m (bao gồm 331,4m, 331.4m, 331m) -> Kíp 2
  if (combined.includes('331')) return { kipId: 2, kipName: 'Kíp 2', matchedElevation: '▼ 331m' };
  // Cao trình 323m -> Kíp 3
  if (combined.includes('323')) return { kipId: 3, kipName: 'Kíp 3', matchedElevation: '▼ 323m' };
  // Cao trình 316m -> Kíp 3
  if (combined.includes('316')) return { kipId: 3, kipName: 'Kíp 3', matchedElevation: '▼ 316m' };
  // Cao trình 309m -> Kíp 4
  if (combined.includes('309')) return { kipId: 4, kipName: 'Kíp 4', matchedElevation: '▼ 309m' };
  // Cao trình 292,7m -> Kíp 4
  if (combined.includes('292,7') || combined.includes('292.7') || combined.includes('292')) return { kipId: 4, kipName: 'Kíp 4', matchedElevation: '▼ 292,7m' };
  // Cao trình 303m -> Kíp 5
  if (combined.includes('303')) return { kipId: 5, kipName: 'Kíp 5', matchedElevation: '▼ 303m' };
  // Cao trình 298m -> Kíp 5
  if (combined.includes('298')) return { kipId: 5, kipName: 'Kíp 5', matchedElevation: '▼ 298m' };

  // Khớp theo tên thiết bị/phòng đặc trưng tại Ialy Mở Rộng
  if (combined.includes('kích từ') || combined.includes('khí bù') || combined.includes('thông gió đẩy')) {
    return { kipId: 4, kipName: 'Kíp 4', matchedElevation: '▼ 309m' };
  }
  if (combined.includes('mf h5') || combined.includes('mf h6') || combined.includes('tua bin') || combined.includes('h5') || combined.includes('h6')) {
    return { kipId: 5, kipName: 'Kíp 5', matchedElevation: '▼ 303m / 298m' };
  }
  if (combined.includes('cơ khí') || combined.includes('tg hút') || combined.includes('khí nén')) {
    return { kipId: 3, kipName: 'Kíp 3', matchedElevation: '▼ 323m / 316m' };
  }
  if (combined.includes('đktt') || combined.includes('tự dùng') || combined.includes('945-3') || combined.includes('945') || combined.includes('dao cách ly')) {
    return { kipId: 2, kipName: 'Kíp 2', matchedElevation: '▼ 339m / 331m' };
  }
  if (combined.includes('chuyển tiếp') || combined.includes('biến áp') || combined.includes('chữa cháy') || combined.includes('diezel') || combined.includes('xử lý nước')) {
    return { kipId: 1, kipName: 'Kíp 1', matchedElevation: '▼ 358m / 348m' };
  }

  return null;
}

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

const Dashboard: React.FC<{ isDarkMode: boolean, onActivityClick: (sheet: string, row: number) => void, onStatClick: (sheet: string, status: 'all' | 'processed' | 'pending' | 'nvvh') => void }> = ({ isDarkMode, onActivityClick, onStatClick }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, notStarted: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [topContributors, setTopContributors] = useState<{name: string, total: number, monthly: {[key: string]: number}}[]>([]);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [selectedRankingMonth, setSelectedRankingMonth] = useState('all');

  // Quản lý cảnh báo theo Kíp phụ trách tại Ialy Mở Rộng
  const [kipDefects, setKipDefects] = useState<{ [key: number]: any[] }>({ 1: [], 2: [], 3: [], 4: [], 5: [] });
  const [selectedKipId, setSelectedKipId] = useState<number | null>(null);
  const [selectedKipFilter, setSelectedKipFilter] = useState<'all' | 'unresolved' | 'pending' | 'processing' | 'completed'>('unresolved');
  const [showKipDutyModal, setShowKipDutyModal] = useState(false);

  const availableStatsMonths = useMemo(() => {
    const months = new Set<string>();
    topContributors.forEach(p => {
      Object.keys(p.monthly).forEach(m => months.add(m));
    });
    return Array.from(months).sort((a, b) => {
      const [m1, y1] = a.split('/').map(Number);
      const [m2, y2] = b.split('/').map(Number);
      return y2 !== y1 ? y2 - y1 : m2 - m1;
    });
  }, [topContributors]);

  const sortedContributorsByMonth = useMemo(() => {
    if (selectedRankingMonth === 'all') return topContributors;
    return [...topContributors]
      .filter(p => p.monthly[selectedRankingMonth] > 0)
      .sort((a, b) => (b.monthly[selectedRankingMonth] || 0) - (a.monthly[selectedRankingMonth] || 0));
  }, [topContributors, selectedRankingMonth]);

  // Thống kê chi tiết theo từng Kíp (1 đến 5)
  const kipStats = useMemo(() => {
    return KIP_CONFIG_LIST.map(config => {
      const items = kipDefects[config.kipId] || [];
      const pending = items.filter(i => i.isPending).length;
      const processing = items.filter(i => i.isProcessing).length;
      const completed = items.filter(i => i.isDone).length;
      const unresolved = pending + processing;
      const total = items.length;
      return {
        ...config,
        items,
        pending,
        processing,
        completed,
        unresolved,
        total
      };
    });
  }, [kipDefects]);

  const totalUnresolvedMoRong = useMemo(() => {
    return kipStats.reduce((acc, k) => acc + k.unresolved, 0);
  }, [kipStats]);

  const totalDetectedMoRong = useMemo(() => {
    return kipStats.reduce((acc, k) => acc + k.total, 0);
  }, [kipStats]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      let combinedActivities: any[] = [];
      let totalCount = 0;
      let completedCount = 0;
      let processingCount = 0;
      let notStartedCount = 0;
      const contributorMap: {[key: string]: { total: number, monthly: {[key: string]: number} }} = {};
      const newKipDefects: { [key: number]: any[] } = { 1: [], 2: [], 3: [], 4: [], 5: [] };

      const parseDateObj = (val: any) => {
        if (!val) return null;
        const str = String(val);
        if (str.startsWith('Date(')) {
          const p = str.match(/\d+/g);
          if (p) return new Date(Number(p[0]), Number(p[1]), Number(p[2]), Number(p[3]||0), Number(p[4]||0), Number(p[5]||0));
        }
        const ts = Date.parse(str);
        return isNaN(ts) ? null : new Date(ts);
      };

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
            const processing = rows.filter((r: any) => (r.c[12] && r.c[12].v) && !(r.c[11] && r.c[11].v)).length;
            const pending = rows.filter((r: any) => !(r.c[12] && r.c[12].v) && !(r.c[11] && r.c[11].v)).length;

            rows.forEach((r: any, idx: number) => {
              const physicalRow = idx + 2; // Physical row number in Google Sheets
              
              // Aggregate contributors (case-insensitive) - Using robust cell value extraction
              const reporterCell = r.c[2];
              const rawName = reporterCell ? (reporterCell.f || (reporterCell.v != null ? String(reporterCell.v) : '')) : '';
              const trimmedName = rawName.trim();
              
              if (trimmedName) {
                const normalizedName = trimmedName.toUpperCase();
                if (!contributorMap[normalizedName]) {
                  contributorMap[normalizedName] = { total: 0, monthly: {} };
                }
                contributorMap[normalizedName].total += 1;
                
                const dateObj = parseDateObj(r.c[1]?.v);
                if (dateObj) {
                  const monthKey = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
                  contributorMap[normalizedName].monthly[monthKey] = (contributorMap[normalizedName].monthly[monthKey] || 0) + 1;
                }
              }

              const areaCell = r.c[4];
              const areaVal = areaCell ? (areaCell.f || (areaCell.v != null ? String(areaCell.v) : '')) : '';
              const titleVal = String(r.c[5]?.v || 'Không rõ');
              const locCell = r.c[6];
              const locVal = locCell ? (locCell.f || (locCell.v != null ? String(locCell.v) : 'N/A')) : 'N/A';
              const descCell = r.c[7];
              const descVal = descCell ? (descCell.f || (descCell.v != null ? String(descCell.v) : '')) : '';
              const isDone = !!(r.c[11] && r.c[11].v);
              const isProcessing = !!((r.c[12] && r.c[12].v) && !isDone);
              const isPending = !isProcessing && !isDone;

              combinedActivities.push({
                time: r.c[1]?.f || 'N/A',
                rawTime: r.c[1]?.v || '', 
                title: titleVal,
                location: locVal,
                category: cat,
                row: physicalRow,
                isDone: isDone
              });

              // Phân tích và phân bổ theo Kíp nếu là tồn tại tại Ialy mở rộng hoặc khớp cao trình
              const matchedKip = detectKipFromDefect(areaVal, locVal, titleVal);
              if (matchedKip && matchedKip.kipId >= 1 && matchedKip.kipId <= 5) {
                newKipDefects[matchedKip.kipId].push({
                  time: r.c[1]?.f || 'N/A',
                  rawTime: r.c[1]?.v || '',
                  title: titleVal,
                  location: locVal,
                  area: areaVal,
                  desc: descVal,
                  reporter: trimmedName || 'N/A',
                  category: cat,
                  row: physicalRow,
                  isDone,
                  isProcessing,
                  isPending,
                  kipId: matchedKip.kipId,
                  kipName: matchedKip.kipName,
                  matchedElevation: matchedKip.matchedElevation
                });
              }
            });

            totalCount += detected;
            completedCount += processed;
            processingCount += processing;
            notStartedCount += pending;

            return {
              name: cat,
              detected, 
              processed, 
              processing,
              pending      
            };
          }
        }
        return { name: cat, detected: 0, processed: 0, processing: 0, pending: 0 };
      });

      const results = await Promise.all(promises);
      setChartData(results);
      setStats({ total: totalCount, completed: completedCount, pending: processingCount, notStarted: notStartedCount });
      setKipDefects(newKipDefects);
      
      // Process contributors
      const sortedContributors = Object.entries(contributorMap)
        .map(([name, data]) => ({ name, total: data.total, monthly: data.monthly }))
        .sort((a, b) => b.total - a.total);
      setTopContributors(sortedContributors);

      // Improved sorting: parse Google Date strings and fallback to row index
      const sortedActivities = combinedActivities.sort((a, b) => {
        const parseDate = (val: any) => {
          if (!val) return 0;
          const str = String(val);
          if (str.startsWith('Date(')) {
            const p = str.match(/\d+/g);
            if (p) return new Date(Number(p[0]), Number(p[1]), Number(p[2]), Number(p[3]||0), Number(p[4]||0), Number(p[5]||0)).getTime();
          }
          const ts = Date.parse(str);
          return isNaN(ts) ? 0 : ts;
        };

        const timeA = parseDate(a.rawTime);
        const timeB = parseDate(b.rawTime);

        if (timeB !== timeA) return timeB - timeA;
        return b.row - a.row; // If same time, higher row index is newer
      });
      
      setRecentActivities(sortedActivities.slice(0, 6));

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
        <img alt="Factory" className="w-full h-full object-cover brightness-[0.25]" src="https://i.ibb.co/zWPTxZvg/123.png" />
        <div className="absolute inset-0 flex flex-col justify-center items-center px-10 text-center bg-gradient-to-b from-blue-900/30 via-transparent to-slate-900/90">
          <h1 className="text-white text-2xl font-black uppercase tracking-tight drop-shadow-2xl mb-2">
            KIỂM TRA VÀ CẬP NHẬT CÔNG TÁC AN TOÀN VỆ SINH LAO ĐỘNG
          </h1>
          <div className="flex items-center gap-2 text-blue-200 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/20">
            <ActivityIcon size={14} className="animate-pulse" />
            
          </div>
        </div>
      </div>

      <main className="px-4 -mt-12 relative z-10 flex-1 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div 
            onClick={() => onStatClick('all', 'all')}
            className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-white/50 dark:border-slate-800 text-center group transition-all hover:bg-blue-50/10 cursor-pointer active:scale-95"
          >
            <p className="text-xs font-black text-slate-400 uppercase mb-1 tracking-widest">Tổng</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{isLoading ? <Loader2 className="animate-spin inline" size={16} /> : stats.total}</p>
          </div>
          <div 
            onClick={() => onStatClick('all', 'processed')}
            className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-white/50 dark:border-slate-800 text-center group transition-all hover:bg-emerald-50/10 cursor-pointer active:scale-95"
          >
            <p className="text-xs font-black text-slate-400 uppercase mb-1 tracking-widest">Hoàn thành</p>
            <p className="text-2xl font-black text-emerald-500">{isLoading ? <Loader2 className="animate-spin inline" size={16} /> : stats.completed}</p>
          </div>
          <div 
            onClick={() => onStatClick('all', 'nvvh')}
            className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-white/50 dark:border-slate-800 text-center group transition-all hover:bg-amber-50/10 cursor-pointer active:scale-95"
          >
            <p className="text-xs font-black text-slate-400 uppercase mb-1 tracking-widest">Đang xử lý</p>
            <p className="text-2xl font-black text-amber-500">{isLoading ? <Loader2 className="animate-spin inline" size={16} /> : stats.pending}</p>
          </div>
          <div 
            onClick={() => onStatClick('all', 'pending')}
            className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-white/50 dark:border-slate-800 text-center group transition-all hover:bg-rose-50/10 cursor-pointer active:scale-95"
          >
            <p className="text-xs font-black text-slate-400 uppercase mb-1 tracking-widest">Chưa xử lý</p>
            <p className="text-2xl font-black text-rose-500">{isLoading ? <Loader2 className="animate-spin inline" size={16} /> : stats.notStarted}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600"><ActivityIcon size={18} /></div>
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Biểu đồ hoạt động</h2>
            </div>
            <button onClick={fetchDashboardData} className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className={`grid ${
            chartData.length === 1 ? 'grid-cols-1 max-w-xl mx-auto' :
            chartData.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            chartData.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
            'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
          } gap-6 md:gap-8`}>
            {isLoading ? (
              Array(Math.max(2, chartData.length || 2)).fill(0).map((_, i) => (
                <div key={i} className="h-72 sm:h-80 bg-slate-50 dark:bg-slate-900/50 rounded-3xl animate-pulse" />
              ))
            ) : (
              chartData.map((entry, idx) => {
                const completed = entry.processed;
                const totalStarted = entry.processing;
                const pending = entry.pending;
                const inProgressOnly = Math.max(0, entry.detected - completed - pending);
                
                const data = [
                  { name: 'Hoàn thành', value: completed, color: '#10b981', grad: `gradGreen-${idx}` },
                  { name: 'Đang xử lý', value: inProgressOnly, color: '#f59e0b', grad: `gradAmber-${idx}` },
                  { name: 'Chưa xử lý', value: pending, color: '#ef4444', grad: `gradRed-${idx}` }
                ].filter(d => d.value > 0);

                return (
                  <div key={idx} className="flex flex-col items-center group w-full">
                    <div className="h-72 sm:h-80 w-full relative bg-slate-900/5 dark:bg-slate-900/20 rounded-[2.5rem] overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/30 transition-all hover:shadow-2xl hover:scale-[1.01] duration-500">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none" />
                      
                      {/* Corner Buttons */}
                      <button 
                        onClick={() => onStatClick(entry.name, 'processed')}
                        className="absolute top-4 left-4 z-20 flex flex-col items-center p-3 bg-emerald-50/95 dark:bg-emerald-900/50 backdrop-blur-md rounded-2xl border border-emerald-200/70 dark:border-emerald-800/50 hover:scale-105 active:scale-95 transition-all shadow-md min-w-[72px]"
                      >
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Hoàn thành</span>
                        <span className="text-base font-black text-emerald-700 dark:text-emerald-300 leading-none">{completed}</span>
                      </button>

                      <button 
                        onClick={() => onStatClick(entry.name, 'nvvh')}
                        className="absolute top-4 right-4 z-20 flex flex-col items-center p-3 bg-amber-50/95 dark:bg-amber-900/50 backdrop-blur-md rounded-2xl border border-amber-200/70 dark:border-amber-800/50 hover:scale-105 active:scale-95 transition-all shadow-md min-w-[72px]"
                      >
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">Đang xử lý</span>
                        <span className="text-base font-black text-amber-700 dark:text-amber-300 leading-none">{totalStarted}</span>
                      </button>

                      <button 
                        onClick={() => onStatClick(entry.name, 'pending')}
                        className="absolute bottom-4 left-4 z-20 flex flex-col items-center p-3 bg-rose-50/95 dark:bg-rose-900/50 backdrop-blur-md rounded-2xl border border-rose-200/70 dark:border-rose-800/50 hover:scale-105 active:scale-95 transition-all shadow-md min-w-[72px]"
                      >
                        <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-0.5">Chưa xử lý</span>
                        <span className="text-base font-black text-rose-700 dark:text-rose-300 leading-none">{pending}</span>
                      </button>

                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                          <defs>
                            <linearGradient id={`gradGreen-${idx}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                            <linearGradient id={`gradAmber-${idx}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" />
                              <stop offset="100%" stopColor="#d97706" />
                            </linearGradient>
                            <linearGradient id={`gradRed-${idx}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ef4444" />
                              <stop offset="100%" stopColor="#b91c1c" />
                            </linearGradient>
                            <filter id="vividShadow" height="150%">
                              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                              <feOffset dx="0" dy="10" result="offsetblur" />
                              <feComponentTransfer>
                                <feFuncA type="linear" slope="0.5" />
                              </feComponentTransfer>
                              <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            startAngle={90}
                            endAngle={-270}
                            innerRadius={50}
                            outerRadius={95}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                            filter="url(#vividShadow)"
                            animationDuration={1800}
                            labelLine={false}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                              const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                              if (percent < 0.08) return null;
                              return (
                                <text 
                                  x={x} 
                                  y={y} 
                                  fill="white" 
                                  textAnchor="middle" 
                                  dominantBaseline="central" 
                                  className="text-xs font-black drop-shadow-lg"
                                >
                                  {(percent * 100).toFixed(0)}%
                                </text>
                              );
                            }}
                          >
                            {data.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={`url(#${entry.grad})`}
                                className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{d.name}</p>
                                    <p className="text-base font-black text-slate-900 dark:text-white">{d.value}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Tổng</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{entry.detected}</p>
                      </div>
                    </div>
                    <div className="mt-4 text-center w-full">
                      <p className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">{entry.name}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600"><Clock size={18} /></div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Hoạt động mới nhất</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
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
                    <h3 className="text-[16px] font-black text-slate-800 dark:text-slate-200 truncate leading-tight mb-1 uppercase tracking-tighter">
                      {act.title}
                    </h3>
                    <p className="text-[15px] text-slate-500 dark:text-slate-400 truncate mb-1">
                      📍 {act.location}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                        {act.category.split(',')[0]}
                      </span>
                      <span className="text-[15px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> {act.time.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center opacity-30 flex flex-col items-center">
                <ActivityIcon size={40} strokeWidth={1} />
                <p className="text-[10px] uppercase font-black tracking-widest mt-3">Hiện chưa có hoạt động</p>
              </div>
            )}
          </div>
        </div>

        {/* --- KHU VỰC CẢNH BÁO & NHẮC NHỞ THEO PHÂN GIAO KÍP TRỰC (IALY MỞ RỘNG) --- */}
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 mb-6 relative overflow-hidden text-[13px]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`p-3.5 rounded-2xl shrink-0 ${
                totalUnresolvedMoRong > 0 
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' 
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
              }`}>
                {totalUnresolvedMoRong > 0 ? (
                  <BellRing size={24} className="animate-bounce" />
                ) : (
                  <ShieldCheck size={24} />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Cảnh báo & Nhắc nhở Kíp trực (Ialy Mở Rộng)
                  </h2>
                  {totalUnresolvedMoRong > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-black bg-amber-500 text-white shadow-sm">
                      <AlertTriangle size={14} /> {totalUnresolvedMoRong} tồn tại chưa hoàn thành
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-black bg-emerald-500 text-white">
                      <CheckCircle2 size={14} /> An toàn
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Hệ thống tự động rà soát & phân bổ tồn tại theo cao trình trách nhiệm bảo trì tự quản TPM (cảnh báo vàng cho các mục đang/chưa hoàn thành)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => setShowKipDutyModal(true)}
                className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 border border-blue-200 dark:border-blue-800 shadow-sm"
              >
                <FileText size={16} />
                <span>Bảng phân giao TPM</span>
              </button>
            </div>
          </div>

          {/* 5 Kíp Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-2">
            {kipStats.map((k) => {
              const isSelected = selectedKipId === k.kipId;
              const hasUnresolved = k.unresolved > 0;

              return (
                <div
                  key={k.kipId}
                  onClick={() => {
                    if (selectedKipId === k.kipId) {
                      setSelectedKipId(null);
                    } else {
                      setSelectedKipId(k.kipId);
                      setSelectedKipFilter(k.unresolved > 0 ? 'unresolved' : 'all');
                    }
                  }}
                  className={`relative p-4 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/40 shadow-lg scale-[1.02]'
                      : hasUnresolved
                      ? 'bg-amber-50/60 hover:bg-amber-50/90 dark:bg-amber-950/20 dark:hover:bg-amber-950/35 border-amber-300 dark:border-amber-700/60 hover:border-amber-400 hover:shadow-md'
                      : 'bg-slate-50 hover:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-900 border-slate-200/80 dark:border-slate-700/70 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        hasUnresolved 
                          ? (k.pending > 0 ? 'bg-rose-500 animate-ping' : 'bg-amber-500 animate-pulse') 
                          : 'bg-emerald-500'
                      }`} />
                      <span className="font-black text-[13px] uppercase tracking-wider text-slate-800 dark:text-slate-100">
                        {k.kipName}
                      </span>
                    </div>
                    <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500">
                      {k.total} tồn tại
                    </span>
                  </div>

                  {/* Cao trình phụ trách */}
                  <div className="mb-3">
                    <p className="text-[13px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                      {k.elevationsText}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="space-y-2 pt-2.5 border-t border-slate-200/60 dark:border-slate-800">
                    {hasUnresolved ? (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`font-extrabold text-[13px] flex items-center gap-1 ${
                            k.pending > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            <AlertTriangle size={14} className="text-amber-500" /> {k.unresolved} chưa hoàn thành
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                          {k.pending > 0 && (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 rounded-md font-bold">
                              {k.pending} chưa làm
                            </span>
                          )}
                          {k.processing > 0 && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-md font-bold">
                              {k.processing} đang xử lý
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[13px] py-0.5">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Đã hoàn thành
                        </span>
                        {k.completed > 0 && (
                          <span className="text-[12px] text-emerald-700 dark:text-emerald-300 font-medium">
                            {k.completed} đã xong
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA Footer */}
                  <div className="mt-3 pt-2 text-center border-t border-slate-100 dark:border-slate-800/80">
                    <span className={`text-[12px] font-black uppercase tracking-wider flex items-center justify-center gap-1 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'}`}>
                      {isSelected ? 'Đang mở danh sách ✕' : 'Xem chi tiết →'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Kíp Detail Drilldown Panel */}
          {selectedKipId !== null && (
            <div className="mt-6 p-5 sm:p-6 bg-slate-50/90 dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700/80">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="px-3.5 py-1 bg-blue-600 text-white rounded-lg text-[13px] font-black uppercase tracking-wider">
                      {KIP_CONFIG_LIST[selectedKipId - 1].kipName}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                      Danh sách tồn tại theo cao trình phụ trách
                    </h3>
                  </div>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                    Phụ trách: <strong className="text-blue-600 dark:text-blue-400">{KIP_CONFIG_LIST[selectedKipId - 1].elevationsText}</strong>
                  </p>
                </div>

                {/* Filter Chips inside Drawer */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { key: 'unresolved', label: `Cần xử lý (${kipStats[selectedKipId - 1].unresolved})`, activeColor: 'bg-rose-500 text-white' },
                    { key: 'pending', label: `Chưa làm (${kipStats[selectedKipId - 1].pending})`, activeColor: 'bg-rose-600 text-white' },
                    { key: 'processing', label: `Đang làm (${kipStats[selectedKipId - 1].processing})`, activeColor: 'bg-amber-500 text-white' },
                    { key: 'completed', label: `Đã xong (${kipStats[selectedKipId - 1].completed})`, activeColor: 'bg-emerald-600 text-white' },
                    { key: 'all', label: `Tất cả (${kipStats[selectedKipId - 1].total})`, activeColor: 'bg-slate-700 text-white' },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setSelectedKipFilter(f.key as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-[13px] font-bold transition-all ${
                        selectedKipFilter === f.key
                          ? f.activeColor + ' shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedKipId(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-1"
                    title="Đóng chi tiết"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Items List */}
              {(() => {
                const currentKipItems = kipStats[selectedKipId - 1].items;
                const filteredItems = currentKipItems.filter(item => {
                  if (selectedKipFilter === 'unresolved') return item.isPending || item.isProcessing;
                  if (selectedKipFilter === 'pending') return item.isPending;
                  if (selectedKipFilter === 'processing') return item.isProcessing;
                  if (selectedKipFilter === 'completed') return item.isDone;
                  return true;
                });

                if (filteredItems.length === 0) {
                  return (
                    <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <CheckCircle2 size={42} className="text-emerald-500 mb-2" />
                      <p className="font-bold text-base text-slate-700 dark:text-slate-300">Không có tồn tại nào trong mục này</p>
                      <p className="text-[13px] mt-1">Kíp hiện đang duy trì tốt các cao trình được phân giao bảo trì tự quản.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/70 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.isDone ? (
                                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-md text-[12px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Đã xử lý
                                </span>
                              ) : item.isProcessing ? (
                                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-md text-[12px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <Clock size={12} /> Đang xử lý
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 rounded-md text-[12px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <AlertCircle size={12} /> Chưa xử lý
                                </span>
                              )}
                              <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-md text-[12px] font-bold">
                                {item.matchedElevation}
                              </span>
                            </div>
                            <span className="text-[12px] font-medium text-slate-400">
                              Hàng #{item.row}
                            </span>
                          </div>

                          <h4 className="text-[14px] sm:text-[15px] font-black text-slate-800 dark:text-white line-clamp-1 mb-1">
                            {item.title}
                          </h4>

                          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium mb-2 line-clamp-1">
                            📍 {item.location}
                          </p>

                          {item.desc && (
                            <p className="text-[13px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg mb-2 line-clamp-2 border border-slate-100 dark:border-slate-800">
                              {item.desc}
                            </p>
                          )}
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[13px] text-slate-400">
                          <div>
                            <span>👤 {item.reporter}</span>
                            <span className="mx-1.5">•</span>
                            <span>{item.time}</span>
                          </div>
                          <button
                            onClick={() => onActivityClick(item.category, item.row)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[12px] uppercase tracking-wider transition-all flex items-center gap-1 active:scale-95 shadow-sm shadow-blue-200 dark:shadow-none"
                          >
                            <span>Xem / Xử lý</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              className="w-full flex items-center justify-between mb-0 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 shadow-inner"><Users size={20} /></div>
                <div className="text-left">
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Thống kê hoạt động</h2>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Bảng thông kê phát hiện tồn tại của từng chức danh</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isStatsExpanded && (
                  <select 
                    value={selectedRankingMonth}
                    onChange={(e) => setSelectedRankingMonth(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="all">TẤT CẢ THỜI GIAN</option>
                    {availableStatsMonths.map(m => (
                      <option key={m} value={m}>THÁNG {m}</option>
                    ))}
                  </select>
                )}
                <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-900 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                  {isStatsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </button>
            
            {isStatsExpanded && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-2 pb-4 custom-scrollbar animate-in slide-in-from-top-4 duration-300">
                {isLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-slate-50 dark:bg-slate-900/50 rounded-3xl animate-pulse" />
                  ))
                ) : sortedContributorsByMonth.length > 0 ? (
                  sortedContributorsByMonth.map((person, idx) => (
                    <div key={idx} className="relative group p-5 bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 transition-all hover:shadow-xl hover:bg-white dark:hover:bg-slate-800 hover:-translate-y-1">
                      {/* Badge for Top 3 */}
                      {idx < 3 && selectedRankingMonth === 'all' && (
                        <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg z-10 ${
                          idx === 0 ? 'bg-amber-400 text-white' : 
                          idx === 1 ? 'bg-slate-300 text-slate-700' : 
                          'bg-orange-400 text-white'
                        }`}>
                          {idx === 0 ? '🏆' : idx + 1}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shadow-inner shrink-0 ${
                          idx === 0 && selectedRankingMonth === 'all' ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600' :
                          idx === 1 && selectedRankingMonth === 'all' ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600' :
                          'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600'
                        }`}>
                          {person.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[12px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                            {person.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[12px] font-black text-blue-600 dark:text-blue-400">
                              {selectedRankingMonth === 'all' ? person.total : (person.monthly[selectedRankingMonth] || 0)}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Phát hiện</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {Object.entries(person.monthly)
                          .sort((a, b) => {
                            const [m1, y1] = a[0].split('/').map(Number);
                            const [m2, y2] = b[0].split('/').map(Number);
                            return y2 !== y1 ? y2 - y1 : m2 - m1;
                          })
                          .map(([month, count]) => (
                            <div 
                              key={month} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRankingMonth(month);
                              }}
                              className={`flex flex-col items-center min-w-[50px] py-1.5 rounded-xl border shadow-sm transition-all cursor-pointer ${
                                selectedRankingMonth === month 
                                ? 'bg-blue-600 border-blue-600 text-white scale-105 z-10' 
                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 group-hover:border-blue-200 dark:group-hover:border-blue-900/50'
                              }`}
                            >
                              <span className={`text-[7px] font-black uppercase tracking-tighter mb-0.5 ${selectedRankingMonth === month ? 'text-blue-100' : 'text-slate-400'}`}>T{month}</span>
                              <span className="text-[10px] font-black">{count}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center opacity-30 flex flex-col items-center">
                    <Users size={40} strokeWidth={1} />
                    <p className="text-[10px] uppercase font-black tracking-widest mt-3">Chưa có dữ liệu nhân sự</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Bảng Phân Giao TPM - NMTĐ Ialy Mở Rộng */}
      {showKipDutyModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-700 flex items-center justify-between shrink-0 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="font-black text-sm uppercase tracking-wider">Bảng phân giao trách nhiệm bảo trì tự quản TPM</h2>
                  <p className="text-xs text-blue-100 font-medium">Nhà máy Thủy điện Ialy Mở Rộng</p>
                </div>
              </div>
              <button 
                onClick={() => setShowKipDutyModal(false)}
                className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 text-center w-12">Stt</th>
                      <th className="p-3 w-28">Cao trình</th>
                      <th className="p-3">Công việc thực hiện</th>
                      <th className="p-3 text-center w-28">Phân giao</th>
                      <th className="p-3 text-center w-28">Tồn tại hiện có</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {IALY_MO_RONG_DUTY_TABLE.map((row) => {
                      // Tính số tồn tại chưa xử lý ở cao trình này
                      const itemsInKip = kipDefects[row.kipId] || [];
                      const matchingElev = itemsInKip.filter(i => {
                        const loc = (i.location || '').toLowerCase();
                        const elev = row.elevation.toLowerCase().replace('m', '').trim();
                        return loc.includes(elev);
                      });
                      const unresolvedCount = matchingElev.filter(i => i.isPending || i.isProcessing).length;

                      return (
                        <tr key={row.stt} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 text-center font-bold text-slate-400">{row.stt}</td>
                          <td className="p-3 font-extrabold text-blue-600 dark:text-blue-400">
                            {row.elevation}
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                            {row.task}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              {row.assignedKip}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {unresolvedCount > 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 flex items-center justify-center gap-1">
                                <AlertTriangle size={12} /> {unresolvedCount}
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 size={12} /> 0
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1.5">
                  <Info size={14} /> Ghi chú phân giao:
                </p>
                <p className="leading-relaxed mb-1">
                  Khi phát hiện tồn tại/khiếm khuyết tại bất kỳ cao trình nào thuộc <strong>NMTĐ Ialy Mở Rộng</strong>, hệ thống sẽ tự động đối chiếu bảng phân giao trên để phát cảnh báo và nhắc nhở Kíp trực tương ứng trên Trang tổng quan.
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  * Lưu ý: Hiện tại chức năng cảnh báo phân giao Kíp chỉ áp dụng cho NMTĐ Ialy Mở Rộng. Các khu vực như Ialy hiện hữu, Cửa nhận nước & Đập tràn sẽ được tích hợp bổ sung sau khi có bảng phân công chi tiết.
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button 
                onClick={() => setShowKipDutyModal(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Form Tab Component ---

const DefectForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [images, setImages] = useState<{file: File, preview: string}[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [locationSearch, setLocationSearch] = useState('');

  const [formData, setFormData] = useState({
    reporterName: '',
    category: '', 
    area: '',     
    equipmentName: '',
    location: '',
    description: ''
  });

  const currentAreaConfig = formData.area ? AREA_LOCATIONS_MAP[formData.area] : null;

  const filteredLocations = useMemo(() => {
    if (!currentAreaConfig) return [];
    if (!locationSearch.trim()) return currentAreaConfig.locations;
    return currentAreaConfig.locations.filter(loc => 
      loc.toLowerCase().includes(locationSearch.toLowerCase())
    );
  }, [currentAreaConfig, locationSearch]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file: File) => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setImages(prev => [...prev, ...newFiles]);
      // Auto open AI Analyzer modal immediately for instant scanning
      setShowAiModal(true);
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
      <div className="bg-blue-800 p-4 shadow-md text-center"><h2 className="text-white text-[12px] font-black uppercase tracking-widest">CẬP NHẬT CÁC VẤN ĐỀ ATVSLĐ VÀ KAIZEN,TPM</h2></div>
      <div className="w-full px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
          <section><FormLabel required>Họ và tên người phát hiện</FormLabel><input type="text" className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] outline-none" required value={formData.reporterName} onChange={(e) => setFormData({...formData, reporterName: e.target.value})} /></section>
          
          <section>
            <FormLabel required>Phân loại</FormLabel>
            <div className="mt-2 space-y-1">
              <CustomRadio name="category" value="safety" label="An toàn vệ sinh lao động" checked={formData.category === 'safety'} onChange={(e) => setFormData({...formData, category: e.target.value})} />
              <CustomRadio name="category" value="iso-kaizen" label="ISO, KAIZEN 5S, TPM" checked={formData.category === 'iso-kaizen'} onChange={(e) => setFormData({...formData, category: e.target.value})} />
            </div>
          </section>

          <section>
            <FormLabel required>Khu vực</FormLabel>
            <div className="mt-2 flex flex-col gap-1">
              <CustomRadio 
                name="area" 
                value="ialy-hien-huu" 
                label="Ialy hiện hữu" 
                checked={formData.area === 'ialy-hien-huu'} 
                onChange={(e) => {
                  setFormData({...formData, area: e.target.value});
                  setLocationSearch('');
                }} 
              />
              <CustomRadio 
                name="area" 
                value="ialy-mo-rong" 
                label="Ialy mở rộng" 
                checked={formData.area === 'ialy-mo-rong'} 
                onChange={(e) => {
                  setFormData({...formData, area: e.target.value});
                  setLocationSearch('');
                }} 
              />
              <CustomRadio 
                name="area" 
                value="cua-nhan-nuoc" 
                label="Cửa nhận nước" 
                checked={formData.area === 'cua-nhan-nuoc'} 
                onChange={(e) => {
                  setFormData({...formData, area: e.target.value});
                  setLocationSearch('');
                }} 
              />
              <CustomRadio 
                name="area" 
                value="opy-500" 
                label="OPY 500kV" 
                checked={formData.area === 'opy-500'} 
                onChange={(e) => {
                  setFormData({...formData, area: e.target.value});
                  setLocationSearch('');
                }} 
              />
            </div>
          </section>

          <section>
            <FormLabel required>Địa điểm</FormLabel>
            <div className="space-y-2">
              <div className="relative">
                <input 
                  type="text" 
                  className="w-full p-2.5 pr-8 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] outline-none font-medium text-blue-900 dark:text-blue-200" 
                  required 
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})} 
                  placeholder={currentAreaConfig ? `Chọn bên dưới hoặc tự nhập địa điểm ${currentAreaConfig.name}...` : "Nhập địa điểm chi tiết..."}
                />
                {formData.location && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, location: '' })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    title="Xóa địa điểm"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {currentAreaConfig && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/70 space-y-3 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                      <Layers size={14} className="text-blue-600" />
                      <span>Danh sách địa điểm {currentAreaConfig.name} ({currentAreaConfig.locations.length})</span>
                    </div>
                    {formData.location && (
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Đã chọn
                      </span>
                    )}
                  </div>

                  {/* Quick Search */}
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Tìm nhanh vị trí trong ${currentAreaConfig.name}...`}
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs outline-none focus:border-blue-500"
                    />
                    {locationSearch && (
                      <button
                        type="button"
                        onClick={() => setLocationSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Chips Grid */}
                  <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar pt-1">
                    {filteredLocations.map((loc) => {
                      const isSelected = formData.location === loc;
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFormData({ ...formData, location: '' });
                            } else {
                              setFormData({ ...formData, location: loc });
                            }
                          }}
                          className={`group px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm ${
                            isSelected
                              ? 'bg-blue-900 text-white ring-2 ring-blue-400 shadow-md scale-[1.02]'
                              : 'bg-blue-700 hover:bg-blue-800 text-white hover:scale-[1.02] active:scale-95'
                          }`}
                        >
                          <span>{loc}</span>
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-white/30 text-white' : 'bg-white/20 text-white/90 group-hover:bg-white/30'
                          }`}>
                            <X size={10} strokeWidth={2.5} />
                          </span>
                        </button>
                      );
                    })}
                    {filteredLocations.length === 0 && (
                      <div className="w-full py-4 text-center text-xs text-slate-400 italic">
                        Không tìm thấy địa điểm phù hợp với "{locationSearch}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section>
            <FormLabel>Hình ảnh minh chứng</FormLabel>
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
              <input type="file" ref={fileInputRef} multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              <UploadCloud className="text-blue-500 mb-3" size={32} />
              <span className="px-6 py-2 bg-blue-600 text-white text-[11px] font-bold rounded-lg uppercase shadow-md hover:bg-blue-700 transition-colors">
                Chọn hình ảnh
              </span>
            </div>

            {images.length > 0 && (
              <div className="mt-4 space-y-3">
                {/* AI Vision Highlight Action Bar */}
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shrink-0">
                      <Sparkles size={16} className="animate-spin" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-wider truncate">
                        AI Thẩm Định Hình Ảnh
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Phân tích {images.length} ảnh để tự động gợi ý phân loại & mô tả
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <Wand2 size={13} />
                    Đánh giá ngay
                  </button>
                </div>

                {/* Thumbnails grid */}
                <div className="flex flex-wrap gap-2.5">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group">
                      <img src={img.preview} className="w-full h-full object-cover" alt={`Defect ${i}`} />
                      <button 
                        type="button" 
                        onClick={() => removeImage(i)} 
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-md hover:bg-red-700 transition-colors"
                      >
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section><FormLabel required>Tên thiết bị</FormLabel><input type="text" className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] outline-none" required value={formData.equipmentName} onChange={(e) => setFormData({...formData, equipmentName: e.target.value})} /></section>
          
          <section>
            <div className="flex items-center justify-between mb-1.5">
              <FormLabel required>Mô tả tồn tại / khiếm khuyết</FormLabel>
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-blue-200 dark:border-blue-800"
                >
                  <Sparkles size={13} className="text-amber-500 animate-pulse" />
                  ✨ Gợi ý từ AI
                </button>
              )}
            </div>
            <textarea rows={3} className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[13px] outline-none resize-none" required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Mô tả cụ thể hiện tượng, vị trí và tình trạng khiếm khuyết..." />
          </section>

          <div className="flex justify-center pt-6">
            <button type="submit" disabled={isSubmitting} className="px-12 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[13px] shadow-xl flex items-center gap-2 transition-all">
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null} 
              GỬI BÁO CÁO
            </button>
          </div>
        </form>
      </div>

      {/* AI Vision Defect Analyzer Modal */}
      <AiVisionDefectAnalyzer
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        images={images}
        formType="report"
        onApplyAllReport={(data) => {
          setFormData(prev => ({
            ...prev,
            category: data.category || prev.category,
            area: data.area || prev.area,
            equipmentName: data.equipmentName || prev.equipmentName,
            location: data.location || prev.location,
            description: data.description || prev.description,
          }));
        }}
        onApplyDescription={(desc) => {
          setFormData(prev => ({ ...prev, description: desc }));
        }}
      />
    </div>
  );
};

// --- Summary Tab Component ---

const TableCellContent: React.FC<{ value: any, header: string }> = ({ value, header }) => {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const valStr = value != null ? String(value).trim() : '';
  const lowerHeader = String(header || '').toLowerCase();
  
  const isImageColumn = lowerHeader.includes('hình') || lowerHeader.includes('minh chứng') || lowerHeader.includes('ảnh');
  
  if (!isImageColumn) {
    const isSTT = lowerHeader === 'stt';
    const isTime = lowerHeader.includes('thời gian');
    const isReporter = lowerHeader.includes('người phát hiện');
    const isCategory = lowerHeader.includes('phân loại');
    const isArea = lowerHeader.includes('khu vực');
    
    return (
      <div className={`block break-words leading-normal ${
        isSTT ? 'min-w-[30px] text-center' : 
        isTime ? 'min-w-[80px]' : 
        isReporter ? 'min-w-[100px]' : 
        isCategory || isArea ? 'min-w-[100px]' :
        'min-w-[160px]'
      }`}>
        {value ?? ''}
      </div>
    );
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
      <div className="flex flex-wrap gap-2 items-center justify-start p-1 min-w-[200px]">
        {images.map((img, idx) => (
          <div key={idx} onClick={() => setPreviewIndex(idx)} className="w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden shrink-0 cursor-pointer shadow-sm hover:scale-105 transition-transform"><img src={img.display} className="w-full h-full object-cover" /></div>
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
      // Làm sạch dữ liệu trước khi gửi
      const cleanData = editedData.map(v => (v === null || v === undefined) ? '' : v);
      
      const payload = {
        action: 'updateRowData',
        sheet: sheet,
        sheetName: sheet,
        row: row,
        rowData: cleanData.slice(0, 14),
        sheetId: SHEET_ID
      };

      console.log("Sending update via proxy:", payload);

      // Gửi qua server proxy để tránh lỗi CORS và nhận được phản hồi thực tế
      const response = await fetch('/api/proxy-apps-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: EDIT_WEB_APP_URL,
          payload: payload
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("EditModal Proxy error:", errorData);
        throw new Error(errorData.details || "Lỗi server proxy (Edit)");
      }

      const resultText = await response.text();
      console.log("Update result raw:", resultText);
      
      let result;
      try {
        result = JSON.parse(resultText);
      } catch (e) {
        result = resultText;
      }

      alert("Dữ liệu đã được cập nhật thành công! Hệ thống đang làm mới (vui lòng đợi 3 giây)...");
      onSave();
    } catch (err: any) {
      console.error("Save error:", err);
      alert("Có lỗi xảy ra khi lưu: " + err.message);
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

const DefectSummary: React.FC<{ jumpTo?: { sheet: string, row?: number, status?: 'all' | 'processed' | 'pending' | 'nvvh' } | null }> = ({ jumpTo }) => {
  const MAX_COLS = 14; 
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [activeSheetName, setActiveSheetName] = useState(jumpTo?.sheet || 'An toàn vệ sinh lao động');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'processed' | 'pending' | 'nvvh'>(jumpTo?.status || 'all');
  const [editTarget, setEditTarget] = useState<{ row: number, data: any[], sheet: string } | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const lastScrolledRef = useRef<string | null>(null);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    if (jumpTo) {
      setActiveSheetName(jumpTo.sheet);
      setSelectedStatus(jumpTo.status || 'all');
      setSearchTerm(''); 
    }
  }, [jumpTo]);

  const categories = [
    { name: 'Tất cả', value: 'all' },
     
    { name: 'An toàn vệ sinh lao động', value: 'An toàn vệ sinh lao động' }, 
    { name: 'TPM, Kaizen', value: 'TPM, Kaizen' }
  ];

  const fetchSheetData = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setData([]); 
    
    try {
      if (activeSheetName === 'all') {
        const promises = CATEGORIES.map(async (cat) => {
          const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(cat)}&t=${Date.now()}`;
          const response = await fetch(url);
          const text = await response.text();
          const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
          if (match) {
            const json = JSON.parse(match[1]);
            if (json.table && json.table.rows) {
              const rows = json.table.rows.map((row: any, idx: number) => {
                const cells = row.c.map((cell: any) => {
                  if (!cell) return '';
                  return cell.f != null ? cell.f : (cell.v != null ? String(cell.v) : '');
                });
                // Pad to 14 columns and add sheet name + original index
                const paddedCells = [...cells];
                while(paddedCells.length < 14) paddedCells.push('');
                return [...paddedCells.slice(0, 14), cat, idx + 2];
              });
              return { rows, headers: json.table.cols.map((col: any) => col.label || '') };
            }
          }
          return { rows: [], headers: [] };
        });

        const results = await Promise.all(promises);
        if (currentFetchId === fetchIdRef.current) {
          const allRows = results.flatMap(r => r.rows);
          const baseHeaders = results.find(r => r.headers.length > 0)?.headers || [];
          const headersWithInfo = [...baseHeaders.slice(0, 14), 'Bộ phận', 'HiddenRowIdx'];
          setData([headersWithInfo, ...allRows]);
        }
      } else {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(activeSheetName)}&t=${Date.now()}`;
        const response = await fetch(url);
        const text = await response.text();
        const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
        
        if (match && currentFetchId === fetchIdRef.current) {
          const json = JSON.parse(match[1]);
          if (json.table && json.table.rows) {
            const rows = json.table.rows.map((row: any, idx: number) => {
              const cells = row.c.map((cell: any) => {
                if (!cell) return '';
                return cell.f != null ? cell.f : (cell.v != null ? String(cell.v) : '');
              });
              const paddedCells = [...cells];
              while(paddedCells.length < 14) paddedCells.push('');
              return [...paddedCells.slice(0, 14), activeSheetName, idx + 2];
            });
            const headers = json.table.cols.map((col: any) => col.label || '');
            const headersWithInfo = [...headers.slice(0, 14), 'Bộ phận', 'HiddenRowIdx'];
            setData([headersWithInfo, ...rows]);
          }
        }
      }
    } catch (err) { 
      if (currentFetchId === fetchIdRef.current) console.error(err); 
    } finally { 
      if (currentFetchId === fetchIdRef.current) setIsLoading(false); 
    }
  }, [activeSheetName]);

  useEffect(() => { fetchSheetData(); }, [fetchSheetData]);

  useEffect(() => {
    const jumpKey = jumpTo ? `${jumpTo.sheet}-${jumpTo.row}` : null;
    
    if (!jumpTo || isLoading || data.length === 0 || lastScrolledRef.current === jumpKey) {
      if (!jumpTo) lastScrolledRef.current = null;
      return;
    }

    const targetId = `row-${jumpTo.sheet}-${jumpTo.row}`;
    let attempts = 0;
    const maxAttempts = 30;
    
    const tryScroll = () => {
      const el = document.getElementById(targetId);
      if (el) {
        lastScrolledRef.current = jumpKey;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryScroll, 150);
      }
    };

    const timer = setTimeout(tryScroll, 200);
    return () => clearTimeout(timer);
  }, [jumpTo, isLoading, data, activeSheetName]);

  const safeSearchTerm = String(searchTerm || '').trim().toLowerCase();
  const headers = data[0] || [];
  const rowsWithIndex = data.slice(1).map((row, idx) => {
    // row is [col0...col13, sheetName, originalRowIdx]
    const originalRowIdx = row[row.length - 1];
    const physicalRow = typeof originalRowIdx === 'number' ? originalRowIdx : idx + 2;
    return { values: row, index: physicalRow };
  });

  const availableMonths = React.useMemo(() => {
    const months = new Set<string>();
    rowsWithIndex.forEach(item => {
      const dateStr = String(item.values[1] || '');
      const match = dateStr.match(/(\d{2})\/(\d{4})/);
      if (match) months.add(`${match[1]}/${match[2]}`);
    });
    return Array.from(months).sort((a, b) => {
      const [m1, y1] = a.split('/').map(Number);
      const [m2, y2] = b.split('/').map(Number);
      return y2 !== y1 ? y2 - y1 : m2 - m1;
    });
  }, [rowsWithIndex]);
  
  const filteredRows = rowsWithIndex.filter(item => {
    const matchesSearch = safeSearchTerm === '' || 
      item.values.some((cell: any) => String(cell).toLowerCase().includes(safeSearchTerm));
    
    const isProcessed = !!(item.values[11] && String(item.values[11]).trim() !== '');
    const isNVVH = !!(item.values[12] && String(item.values[12]).trim() !== '');
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'processed' && isProcessed) || 
      (selectedStatus === 'nvvh' && isNVVH && !isProcessed) ||
      (selectedStatus === 'pending' && !isNVVH && !isProcessed);
      
    const dateStr = String(item.values[1] || '');
    const matchesMonth = selectedMonth === 'all' || dateStr.includes(selectedMonth);

    return matchesSearch && matchesStatus && matchesMonth;
  });

  const exportToExcel = async () => {
    setIsLoading(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(activeSheetName);

      // Add headers
      const headerRow = worksheet.addRow(headers.slice(0, MAX_COLS));
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };

      // Set column widths
      worksheet.columns = headers.slice(0, MAX_COLS).map((h: string) => ({
        header: h,
        key: h,
        width: h.toLowerCase().includes('hình') || h.toLowerCase().includes('ảnh') ? 25 : 20
      }));

      // Add data rows and collect image tasks
      const imageTasks: { 
        url: string, 
        fetchUrl: string, 
        rowNumber: number, 
        colIndex: number 
      }[] = [];

      for (const item of filteredRows) {
        const rowData = item.values.slice(0, MAX_COLS);
        const row = worksheet.addRow(rowData);
        row.height = 80; // Set height for images
        row.alignment = { vertical: 'middle', wrapText: true };

        // Handle images
        for (let i = 0; i < rowData.length; i++) {
          const header = headers[i].toLowerCase();
          const isImageCol = header.includes('hình') || header.includes('minh chứng') || header.includes('ảnh');
          const valStr = String(rowData[i] || '').trim();

          if (isImageCol && valStr) {
            const potentialUrls = valStr.split(/[,\n\s]+/).map(s => s.trim()).filter(s => s.length > 5);
            const imageUrls = potentialUrls.filter(url => url.startsWith('http'));

            if (imageUrls.length > 0) {
              const url = imageUrls[0];
              let fetchUrl = url;
              
              // Enhanced Drive detection
              if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
                const driveMatch = url.match(/\/d\/(.+?)\/(view|edit|usp|copy)/) || 
                                  url.match(/[?&]id=(.+?)(&|$)/) ||
                                  url.match(/\/file\/d\/(.+?)\//);
                if (driveMatch && driveMatch[1]) {
                  fetchUrl = `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w800`;
                }
              }
              
              imageTasks.push({ url, fetchUrl, rowNumber: row.number, colIndex: i });
            }
          }
        }
      }

      // Process images in parallel chunks to avoid overwhelming the server
      const CHUNK_SIZE = 5;
      for (let i = 0; i < imageTasks.length; i += CHUNK_SIZE) {
        const chunk = imageTasks.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (task) => {
          let objectUrl = null;
          try {
            let response;
            let blob;
            
            // Helper for fetch with timeout
            const fetchWithTimeout = async (url: string, timeout = 10000) => {
              const controller = new AbortController();
              const id = setTimeout(() => controller.abort(), timeout);
              try {
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(id);
                return res;
              } catch (err) {
                clearTimeout(id);
                throw err;
              }
            };

            // Try local proxy first
            try {
              const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(task.fetchUrl)}`;
              response = await fetchWithTimeout(proxyUrl);
              if (!response.ok) throw new Error(`Local proxy failed with ${response.status}`);
              blob = await response.blob();
            } catch (localProxyErr) {
              console.warn("Local proxy failed, trying public fallback...", localProxyErr);
              // Fallback to a public Google proxy
              const fallbackUrl = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(task.fetchUrl)}`;
              response = await fetchWithTimeout(fallbackUrl);
              if (!response.ok) throw new Error(`Public fallback failed with ${response.status}`);
              blob = await response.blob();
            }
            
            if (blob.size < 100) throw new Error("Invalid image size");

            const arrayBuffer = await blob.arrayBuffer();
            
            // Determine valid extension for ExcelJS
            let extension: 'png' | 'jpeg' | 'gif' = 'png';
            const mimeType = blob.type.toLowerCase();
            if (mimeType.includes('png')) extension = 'png';
            else if (mimeType.includes('gif')) extension = 'gif';
            else if (mimeType.includes('jpg') || mimeType.includes('jpeg')) extension = 'jpeg';
            else extension = 'jpeg';

            // Get image dimensions with timeout
            const imgObj = new Image();
            objectUrl = URL.createObjectURL(blob);
            imgObj.src = objectUrl;
            
            await Promise.race([
              new Promise((resolve) => {
                imgObj.onload = resolve;
                imgObj.onerror = resolve;
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Image load timeout")), 5000))
            ]);
            
            const naturalWidth = imgObj.width || 100;
            const naturalHeight = imgObj.height || 100;

            const maxWidth = 180; 
            const maxHeight = 100;
            const ratio = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
            const finalWidth = naturalWidth * ratio;
            const finalHeight = naturalHeight * ratio;

            const imageId = workbook.addImage({
              buffer: arrayBuffer,
              extension: extension,
            });

            worksheet.addImage(imageId, {
              tl: { col: task.colIndex + 0.05, row: task.rowNumber - 0.95 } as any,
              ext: { width: finalWidth, height: finalHeight },
              editAs: 'oneCell'
            });
            
            worksheet.getRow(task.rowNumber).getCell(task.colIndex + 1).value = '';
          } catch (e) {
            console.error("Failed to fetch image for excel:", task.fetchUrl, e);
            worksheet.getRow(task.rowNumber).getCell(task.colIndex + 1).value = 'Lỗi ảnh: ' + task.url;
          } finally {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
          }
        }));
      }

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `${activeSheetName}_${new Date().toLocaleDateString()}.xlsx`);
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Có lỗi khi xuất Excel. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-hidden">
      <div className="bg-blue-800 p-4 shadow-xl flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <TableProperties className="text-white" size={20} />
          <h1 className="text-white font-black text-[12px] uppercase">TỔNG HỢP DỮ LIỆU</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToExcel} 
            disabled={isLoading || data.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            <Download size={14} />
            Xuất Excel
          </button>
          <button onClick={fetchSheetData} className="p-2 text-white">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-slate-900 border-b space-y-4 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button 
              key={cat.value} 
              onClick={() => {
                setActiveSheetName(cat.value);
                setSelectedMonth('all');
                setSelectedStatus('all');
              }} 
              className={`px-4 py-2 rounded-xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${activeSheetName === cat.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhanh..." 
              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs outline-none" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          
          <div className="flex gap-2 md:col-span-2">
            <select 
              className="flex-1 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold uppercase outline-none border-none"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">TẤT CẢ THÁNG</option>
              {availableMonths.map(m => <option key={m} value={m}>THÁNG {m}</option>)}
            </select>
            
            <select 
              className="flex-1 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold uppercase outline-none border-none"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
            >
              <option value="all">TẤT CẢ TRẠNG THÁI</option>
              <option value="nvvh"> ĐANG XỬ LÝ</option>
              <option value="pending">CHƯA XỬ LÝ</option>
              <option value="processed">HOÀN THÀNH</option>
            </select>

            <button 
              onClick={() => {
                if (selectedRowIndex !== null) {
                  const item = filteredRows.find(r => r.index === selectedRowIndex);
                  if (item) {
                    setEditTarget({ 
                      row: item.index, 
                      data: item.values, 
                      sheet: activeSheetName === 'all' ? item.values[14] : activeSheetName 
                    });
                  }
                }
              }}
              disabled={selectedRowIndex === null}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-lg shadow-blue-200 dark:shadow-none"
            >
              <Edit3 size={14} />
              <span className="hidden sm:inline">Sửa dòng chọn</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 p-4 flex flex-col">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3">
            <Loader2 size={48} className="animate-spin text-blue-500" />
          </div>
        ) : data.length > 0 ? (
          <div className="flex-1 flex flex-col shadow-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden relative">
            <div className="flex-1 overflow-auto custom-scrollbar pb-2">
              <table className="border-separate border-spacing-0 table-fixed" style={{ width: 'max-content', minWidth: '100%' }}>
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th style={{ width: '50px' }} className="px-4 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">Chọn</th>
                    {headers.slice(0, MAX_COLS).map((h: string, idx: number) => {
                      const lowerH = h.toLowerCase();
                      const isSTT = lowerH === 'stt';
                      const isTime = lowerH.includes('thời gian');
                      const isReporter = lowerH.includes('người phát hiện');
                      const isCategory = lowerH.includes('phân loại');
                      const isArea = lowerH.includes('khu vực');
                      const isImage = lowerH.includes('hình') || lowerH.includes('ảnh') || lowerH.includes('minh chứng');
                      
                      let width = '180px';
                      if (isSTT) width = '50px';
                      else if (isTime) width = '100px';
                      else if (isReporter) width = '120px';
                      else if (isCategory || isArea) width = '120px';
                      else if (isImage) width = '240px';

                      return (
                        <th key={idx} style={{ width }} className="px-4 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-b border-slate-100 dark:border-slate-700 last:border-r-0 bg-slate-50 dark:bg-slate-800 whitespace-nowrap">
                          {h}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredRows.map((item) => {
                    const sheetName = item.values[14];
                    const uniqueKey = `${sheetName}-${item.index}`;
                    const isJumped = jumpTo?.row === item.index && jumpTo?.sheet === sheetName;
                    
                    return (
                      <tr
                        key={uniqueKey}
                        id={`row-${sheetName}-${item.index}`}
                        onClick={() => setSelectedRowIndex(item.index)}
                        className={`${isJumped ? 'bg-yellow-100 dark:bg-yellow-900/40 ring-2 ring-yellow-400 ring-inset' : ''} ${selectedRowIndex === item.index ? 'bg-blue-50 dark:bg-blue-900/20' : ''} transition-all duration-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50`}
                      >
                        <td className="px-4 py-4 text-center border-r border-slate-100 dark:border-slate-800/50">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${selectedRowIndex === item.index ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                            {selectedRowIndex === item.index && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </td>
                        {item.values.slice(0, MAX_COLS).map((cell: any, cIdx: number) => (
                          <td key={cIdx} className="px-4 py-4 text-xs text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800/50 last:border-r-0 align-top overflow-hidden">
                            <TableCellContent value={cell} header={headers[cIdx]} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <FileSpreadsheet size={80} />
          </div>
        )}
      </div>

      {editTarget && (
        <EditModal 
          sheet={editTarget.sheet} 
          row={editTarget.row} 
          headers={data[0].slice(0, MAX_COLS)} 
          rowData={editTarget.data.slice(0, MAX_COLS)} 
          onClose={() => setEditTarget(null)}
          onSave={() => {
            setEditTarget(null);
            setTimeout(fetchSheetData, 3500); // Tăng lên 3.5 giây để chắc chắn server đã cập nhật
          }}
        />
      )}
    </div>
  );
};

// --- Tab: Xử lý tồn tại ---

const ProcessingForm: React.FC = () => {
  const [showSuccess1, setShowSuccess1] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [defectList, setDefectList] = useState<any[]>([]);
  const [allPendingDefects, setAllPendingDefects] = useState<any[]>([]);
  const [matchedItemInfo, setMatchedItemInfo] = useState<any>(null);
  const [images, setImages] = useState<{file: File, preview: string}[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({ sheet: '', row: '', tinhTrang: '', ghiChu: '', NVVH: '' });

  const categories = [
    { label: 'An toàn vệ sinh lao động', value: 'An toàn vệ sinh lao động' },
    { label: 'TPM, Kaizen', value: 'TPM, Kaizen' }
  ];

  // Preload pending defects from both sheets for AI matching
  useEffect(() => {
    loadAllPendingDefects();
  }, []);

  const loadAllPendingDefects = async () => {
    try {
      const [res1, res2] = await Promise.allSettled([
        fetch(PROCESS_WEB_APP_URL, { 
          method: 'POST', 
          body: JSON.stringify({ action: 'getPendingList', sheetName: 'An toàn vệ sinh lao động', sheetId: SHEET_ID }) 
        }).then(r => r.json()),
        fetch(PROCESS_WEB_APP_URL, { 
          method: 'POST', 
          body: JSON.stringify({ action: 'getPendingList', sheetName: 'TPM, Kaizen', sheetId: SHEET_ID }) 
        }).then(r => r.json())
      ]);

      const list1 = res1.status === 'fulfilled' && Array.isArray(res1.value)
        ? res1.value.map((item: any) => ({ ...item, sheet: 'An toàn vệ sinh lao động' }))
        : [];
      const list2 = res2.status === 'fulfilled' && Array.isArray(res2.value)
        ? res2.value.map((item: any) => ({ ...item, sheet: 'TPM, Kaizen' }))
        : [];

      const combined = [...list1, ...list2];
      setAllPendingDefects(combined);
      return combined;
    } catch (err) {
      console.error("Error preloading pending defects:", err);
      return [];
    }
  };

  useEffect(() => {
    if (formData.sheet) {
      const cached = allPendingDefects.filter(d => d.sheet === formData.sheet);
      if (cached.length > 0) {
        setDefectList(cached);
      } else {
        fetchDefects();
      }
    } else {
      setDefectList([]);
    }
  }, [formData.sheet, allPendingDefects]);

  const fetchDefects = async () => {
    setIsLoadingList(true);
    try {
      const payload = { action: 'getPendingList', sheetName: formData.sheet, sheetId: SHEET_ID };
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
      
      // Gửi qua server proxy
      const response = await fetch('/api/proxy-apps-script', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: PROCESS_WEB_APP_URL,
          payload: payload
        }) 
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("ProcessingForm Proxy error:", errorData);
        throw new Error(errorData.details || "Lỗi server proxy (Processing)");
      }

      setShowSuccess1(true);
      setFormData({ sheet: '', row: '', tinhTrang: '', ghiChu: '', NVVH: '' });
      setImages([]);
      setDefectList([]);
      setMatchedItemInfo(null);
      // Reload pending defects list
      loadAllPendingDefects();
    } catch (err: any) { alert("Lỗi: " + err.message); } finally { setIsSubmitting(false); }
  };
if (showSuccess1) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center animate-in zoom-in duration-300">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-inner">
        <CheckCircle2 size={48} />
      </div>
      <h2 className="text-xl font-bold mb-2">
        Cập nhật tồn tại đã xử lý thành công!
      </h2>
      <button
        onClick={() => setShowSuccess1(false)}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
      >
        Quay lại
      </button>
    </div>
  );
}
  return (
    <div className="animate-in slide-in-from-right duration-500 w-full px-4 py-8">
      <div className="flex flex-col items-center mb-8"><h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">📸 Cập nhật xử lý tồn tại</h1></div>
      <form onSubmit={handleSubmit} className="space-y-6 pb-24">

        {/* AI Matched Defect Notification Banner */}
        {matchedItemInfo && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/80 rounded-2xl flex items-start justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow shrink-0 mt-0.5">
                <CheckCircle2 size={18} />
              </div>
              <div className="text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                    🎯 AI Đã Tự Khớp Tồn Tại Trong Bảng:
                  </span>
                  <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold text-[10px]">
                    {matchedItemInfo.sheet} • Dòng #{matchedItemInfo.row}
                  </span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                  ⚙️ {matchedItemInfo.equipment || matchedItemInfo.colE} {matchedItemInfo.location || matchedItemInfo.colF ? ` - 📍 ${matchedItemInfo.location || matchedItemInfo.colF}` : ''}
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                  📝 {matchedItemInfo.description || matchedItemInfo.colG}
                </p>
                {matchedItemInfo.matchReason && (
                  <p className="text-emerald-700 dark:text-emerald-400 text-[10px] mt-1 font-semibold italic">
                    ✨ {matchedItemInfo.matchReason}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMatchedItemInfo(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
              title="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        )}

        <section><FormLabel icon="📄">Chọn loại</FormLabel><select className="w-full p-3 rounded-lg border border-slate-300 bg-white" value={formData.sheet} onChange={(e) => setFormData({...formData, sheet: e.target.value, row: ''})}><option value="">-- Chọn loại --</option>{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></section>
        <section><FormLabel icon="📁">Chọn tồn tại</FormLabel><div className="relative"><select className="w-full p-3 rounded-lg border border-slate-300 bg-white disabled:bg-slate-50" value={formData.row} onChange={(e) => setFormData({...formData, row: e.target.value})} disabled={!formData.sheet || isLoadingList}><option value="">-- Chọn tồn tại --</option>{defectList.map((item, idx) => (<option key={idx} value={item.row}>{`[${item.colE}] - ${item.colF} - ${item.colG}`}</option>))}</select>{isLoadingList && <Loader2 className="absolute right-3 top-3.5 animate-spin text-blue-500" size={18} />}</div></section>
        
        <section>
          <div className="flex items-center justify-between mb-1.5">
            <FormLabel icon="⚠️">Tình trạng</FormLabel>
            {images.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-blue-200"
              >
                <Sparkles size={13} className="text-amber-500 animate-pulse" />
                ✨ AI Quét & Tìm Tồn Tại
              </button>
            )}
          </div>
          <input type="text" className="w-full p-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.tinhTrang} onChange={(e) => setFormData({...formData, tinhTrang: e.target.value})} placeholder="Ví dụ: Đã khắc phục hoàn tất / Đang xử lý..." />
        </section>

        <section>
          <FormLabel icon="📝">Ghi chú</FormLabel>
          <textarea rows={3} className="w-full p-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.ghiChu} onChange={(e) => setFormData({...formData, ghiChu: e.target.value})} placeholder="Ghi chú chi tiết quá trình xử lý, vật tư thay thế, v.v..." />
        </section>

        <section><FormLabel icon="📝">NVVH xử lý ( khi xác nhận kết thúc tồn tại thì không điền ô này)</FormLabel><textarea rows={3} className="w-full p-3 rounded-lg border border-slate-300 
             bg-white text-slate-900 
             placeholder:text-slate-400 
             resize-none
             focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.NVVH} onChange={(e) => setFormData({...formData, NVVH: e.target.value})} /></section>
        
        <section>
          <FormLabel icon="🖼️">Hình ảnh minh chứng ( bắt buộc phải có hình ảnh để kết thúc tồn tại)</FormLabel>
          <div className="flex items-center gap-4 p-3 border border-slate-300 rounded-lg bg-white">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-1.5 bg-slate-100 border border-slate-300 rounded text-sm font-medium hover:bg-slate-200 transition-colors">Chọn tệp</button>
            <span className="text-sm text-slate-500">{images.length > 0 ? `${images.length} tệp đã chọn` : "Chưa chọn"}</span>
            <input type="file" ref={fileInputRef} multiple className="hidden" onChange={(e) => { 
              if (e.target.files && e.target.files.length > 0) {
                const newFiles = Array.from(e.target.files).map((f: File) => ({ file: f, preview: URL.createObjectURL(f) }));
                setImages(prev => [...prev, ...newFiles]);
                setShowAiModal(true);
              }
            }} />
          </div>

          {images.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-blue-900 uppercase tracking-wider truncate">
                      AI Tự Động Tìm Tồn Tại & Điền Kết Quả
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Khớp ảnh với các tồn tại đang chờ và điền thông tin xử lý
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
                >
                  <Wand2 size={13} />
                  Quét ngay
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg border-2 overflow-hidden shadow-sm hover:scale-105 transition-transform">
                    <img src={img.preview} className="w-full h-full object-cover" alt={`Proof ${i}`} />
                    <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-200 active:scale-[0.98] transition-all">
          {isSubmitting ? <Loader2 size={24} className="animate-spin inline" /> : "Gửi dữ liệu"}
        </button>
      </form>

      {/* AI Vision Defect Analyzer Modal for Processing */}
      <AiVisionDefectAnalyzer
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        images={images}
        formType="process"
        pendingDefects={allPendingDefects.length > 0 ? allPendingDefects : defectList}
        onApplyProcess={(data) => {
          if (data.sheet) {
            setFormData(prev => ({
              ...prev,
              sheet: data.sheet,
              row: String(data.row || prev.row),
              tinhTrang: data.tinhTrang || prev.tinhTrang,
              ghiChu: data.ghiChu || prev.ghiChu,
            }));
            const filtered = allPendingDefects.filter(d => d.sheet === data.sheet);
            if (filtered.length > 0) {
              setDefectList(filtered);
            }
          } else {
            setFormData(prev => ({
              ...prev,
              tinhTrang: data.tinhTrang || prev.tinhTrang,
              ghiChu: data.ghiChu || prev.ghiChu,
            }));
          }

          if (data.matchedDefect) {
            setMatchedItemInfo(data.matchedDefect);
          }
        }}
      />
    </div>
  );
};

// --- App Shell ---

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'processing' | 'summary'>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [summaryJump, setSummaryJump] = useState<{ sheet: string, row?: number, status?: 'all' | 'processed' | 'pending' | 'nvvh' } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })), 10000);
    return () => clearInterval(timer);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleActivityClick = (sheet: string, row: number) => {
    setSummaryJump({ sheet, row, status: 'all' });
    setActiveTab('summary');
  };

  const handleStatClick = (sheet: string, status: 'all' | 'processed' | 'pending' | 'nvvh') => {
    setSummaryJump({ sheet, status });
    setActiveTab('summary');
  };

  return (
    <div 
      className={`h-screen relative flex flex-col pb-24 shadow-2xl overflow-hidden w-full bg-cover bg-center bg-no-repeat transition-all duration-500`}
      style={{ 
        backgroundImage: isDarkMode 
          ? `linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.85)), url('https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?auto=format&fit=crop&q=80&w=2000')`
          : `linear-gradient(rgba(248, 250, 252, 0.75), rgba(248, 250, 252, 0.75)), url('https://images.unsplash.com/photo-1553095066-5014bc7b7f2d?auto=format&fit=crop&q=80&w=2000')`
      }}
    >
      <button onClick={toggleDarkMode} className="fixed top-6 right-6 w-10 h-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center border border-white dark:border-slate-700 z-50 transition-all active:scale-90">
        {isDarkMode ? <Sun className="text-amber-400" size={18} /> : <Moon className="text-slate-600" size={18} />}
      </button>

      <div className="flex-1 min-h-0 overflow-hidden w-full flex flex-col">
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <Dashboard isDarkMode={isDarkMode} onActivityClick={handleActivityClick} onStatClick={handleStatClick} />
          </div>
        )}
        {activeTab === 'report' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <DefectForm />
          </div>
        )}
        {activeTab === 'processing' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ProcessingForm />
          </div>
        )}
        {activeTab === 'summary' && <DefectSummary jumpTo={summaryJump} />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 mx-auto h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-50 w-full md:max-w-5xl md:bottom-6 md:rounded-3xl md:shadow-2xl md:border">
        <button onClick={() => { setActiveTab('dashboard'); setSummaryJump(null); }} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'dashboard' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'dashboard' ? 'bg-blue-600/10' : ''}`}><LayoutDashboard size={22} /></div>
          <span className="text-[8px] font-black uppercase tracking-tight">Tổng quan</span>
        </button>
        <button onClick={() => { setActiveTab('report'); setSummaryJump(null); }} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'report' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'report' ? 'bg-blue-600/10' : ''}`}><ClipboardList size={22} /></div>
          <span className="text-[8px] font-black uppercase tracking-tight">Cập nhật tồn tại</span>
        </button>
        <button onClick={() => { setActiveTab('processing'); setSummaryJump(null); }} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'processing' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'processing' ? 'bg-blue-600/10' : ''}`}><Camera size={22} /></div>
          <span className="text-[8px] font-black uppercase tracking-tight">Cập nhật xử lý</span>
        </button>
        <button onClick={() => setActiveTab('summary')} className={`flex flex-col items-center gap-1.5 flex-1 transition-all ${activeTab === 'summary' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <div className={`p-2 rounded-xl ${activeTab === 'summary' ? 'bg-blue-600/10' : ''}`}><TableProperties size={22} /></div>
          <span className="text-[8px] font-black uppercase tracking-tight">Bảng tổng hợp</span>
        </button>
      </nav>
    </div>
  );
};
export default App;
