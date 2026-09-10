/**
 * Sổ tay kinh nghiệm thực tế (Knowledge Base) cho AI Vision.
 *
 * Cơ chế: mỗi khi AI gợi ý chưa chuẩn và người dùng sửa lại trước khi gửi biểu mẫu,
 * hệ thống lưu lại ca đó thành một "bài học kinh nghiệm". Ở các lần quét ảnh sau,
 * các bài học này được gửi kèm vào prompt của Gemini (Few-Shot / In-Context Learning)
 * để AI học dần phong cách, từ ngữ kỹ thuật đặc thù của nhà máy Ialy.
 *
 * Dữ liệu lưu tại localStorage của trình duyệt (không cần backend).
 */

export interface AiLesson {
  id: string;
  createdAt: string;
  formType: 'report' | 'process';
  /** Các trường AI gợi ý ban đầu */
  aiSuggestion: Record<string, string>;
  /** Các trường người dùng đã sửa lại cho chuẩn */
  userCorrection: Record<string, string>;
  /** Chỉ chứa các trường thực sự khác nhau (đây mới là bài học) */
  correctedFields: string[];
}

const STORAGE_KEY = 'ai_vision_knowledge_base_v1';
/** Giới hạn số bài học lưu trữ để prompt không phình quá lớn */
export const MAX_LESSONS = 40;
/** Số bài học gửi kèm mỗi lần quét */
export const LESSONS_PER_SCAN = 8;

/** Nhãn tiếng Việt của từng trường, dùng để AI đọc hiểu bài học */
const FIELD_LABELS: Record<string, string> = {
  category: 'Phân loại',
  area: 'Khu vực',
  equipmentName: 'Tên thiết bị',
  location: 'Vị trí lắp đặt',
  description: 'Nội dung mô tả tồn tại',
  tinhTrang: 'Tình trạng xử lý',
  ghiChu: 'Ghi chú xử lý',
  matchedSheet: 'Sheet tồn tại được khớp',
  matchedRow: 'Dòng (row) tồn tại được khớp',
};

const norm = (v: any): string => String(v ?? '').replace(/\s+/g, ' ').trim();

export function loadLessons(): AiLesson[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLessons(lessons: AiLesson[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons.slice(0, MAX_LESSONS)));
  } catch (err) {
    console.warn('[KnowledgeBase] Không lưu được bài học:', err);
  }
}

export function clearLessons(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function countLessons(): number {
  return loadLessons().length;
}

/**
 * Ghi nhận một ca thực tế. Chỉ lưu khi người dùng thực sự sửa khác gợi ý của AI.
 * Trả về bài học vừa lưu, hoặc null nếu AI đã đúng (không có gì để học).
 */
export function recordLesson(params: {
  formType: 'report' | 'process';
  aiSuggestion: Record<string, any>;
  userCorrection: Record<string, any>;
}): AiLesson | null {
  const { formType } = params;
  const aiSuggestion: Record<string, string> = {};
  const userCorrection: Record<string, string> = {};
  const correctedFields: string[] = [];

  for (const key of Object.keys(params.aiSuggestion || {})) {
    const aiVal = norm(params.aiSuggestion[key]);
    const userVal = norm(params.userCorrection?.[key]);
    if (!aiVal && !userVal) continue;
    aiSuggestion[key] = aiVal;
    userCorrection[key] = userVal;
    // Bài học chỉ phát sinh khi AI có gợi ý nhưng người dùng sửa sang giá trị khác
    if (aiVal && userVal && userVal.toLowerCase() !== aiVal.toLowerCase()) {
      correctedFields.push(key);
    }
  }

  if (correctedFields.length === 0) return null;

  const lesson: AiLesson = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    formType,
    aiSuggestion,
    userCorrection,
    correctedFields,
  };

  // Bài học mới nhất đứng đầu để luôn được ưu tiên đưa vào prompt
  saveLessons([lesson, ...loadLessons()]);
  return lesson;
}

/**
 * Lấy các bài học phù hợp nhất để gửi kèm lần quét mới.
 * Ưu tiên bài học cùng loại biểu mẫu và mới nhất.
 */
export function getLessonsForScan(
  formType: 'report' | 'process',
  limit = LESSONS_PER_SCAN
): AiLesson[] {
  const all = loadLessons();
  const sameType = all.filter((l) => l.formType === formType);
  const others = all.filter((l) => l.formType !== formType);
  return [...sameType, ...others].slice(0, limit);
}

/**
 * Chuyển bài học thành dạng gọn nhẹ để gửi lên API (giảm dung lượng prompt).
 */
export function serializeLessonsForApi(lessons: AiLesson[]) {
  return lessons.map((l) => ({
    formType: l.formType,
    corrections: l.correctedFields.map((f) => ({
      field: FIELD_LABELS[f] || f,
      aiSaid: l.aiSuggestion[f] || '(bỏ trống)',
      userFixed: l.userCorrection[f] || '(bỏ trống)',
    })),
  }));
}

/** Tiện ích gọi trực tiếp trong component: lấy + serialize trong 1 bước */
export function buildLessonPayload(formType: 'report' | 'process') {
  return serializeLessonsForApi(getLessonsForScan(formType));
}
