/**
 * Tự động học từ Google Sheet.
 *
 * Lấy các dòng tồn tại ĐÃ CÓ SẴN trên Sổ theo dõi (Google Sheet) làm ví dụ mẫu chuẩn
 * cho AI. Đây là nguồn "kinh nghiệm tập thể" của cả tổ: cách gọi tên thiết bị, cao trình,
 * văn phong mô tả tồn tại và câu chữ ghi chú xử lý mà nhà máy Ialy đang dùng thực tế.
 *
 * Khác với [aiKnowledgeBase] (chỉ lưu các ca do chính người dùng sửa trên máy mình),
 * dữ liệu ở đây dùng chung cho mọi người vì đọc thẳng từ Sheet.
 *
 * Đọc qua endpoint gviz công khai của Google Sheet (giống DefectSummary trong App.tsx),
 * kết quả được cache tại localStorage để không phải tải lại mỗi lần quét ảnh.
 */

export interface SheetExample {
  /** Tên sheet = phân loại tồn tại */
  sheet: string;
  equipment: string;
  location: string;
  description: string;
  tinhTrang: string;
  ghiChu: string;
}

const CACHE_KEY = 'ai_sheet_examples_v1';
/** Thời hạn cache: 6 giờ */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
/** Số ví dụ tối đa gửi kèm mỗi lần quét */
export const MAX_SHEET_EXAMPLES = 12;

/**
 * Vị trí cột mặc định nếu không dò được theo tiêu đề.
 * Đối chiếu với Sheet thực tế (10/2026):
 * F=Tên thiết bị/công trình, G=Vị trí, H=Mô tả hư hỏng/tồn tại,
 * J=Tình trạng sau khắc phục, K=Ghi chú.
 */
const FALLBACK_IDX = { equipment: 5, location: 6, description: 7, tinhTrang: 9, ghiChu: 10 };

const norm = (v: any): string => String(v ?? '').replace(/\s+/g, ' ').trim();

/** Dò chỉ số cột theo tên tiêu đề, có fallback về vị trí cột cố định */
function resolveColumns(headers: string[]) {
  const find = (keywords: string[], fallback: number) => {
    const idx = headers.findIndex((h) => {
      const low = norm(h).toLowerCase();
      return low && keywords.some((k) => low.includes(k));
    });
    return idx >= 0 ? idx : fallback;
  };
  return {
    equipment: find(['thiết bị', 'thiet bi'], FALLBACK_IDX.equipment),
    location: find(['vị trí', 'vi tri'], FALLBACK_IDX.location),
    description: find(['nội dung', 'noi dung', 'mô tả', 'mo ta', 'tồn tại'], FALLBACK_IDX.description),
    tinhTrang: find(['tình trạng', 'tinh trang', 'kết quả', 'ket qua'], FALLBACK_IDX.tinhTrang),
    ghiChu: find(['ghi chú', 'ghi chu'], FALLBACK_IDX.ghiChu),
  };
}

async function fetchSheetRows(sheetId: string, sheetName: string): Promise<SheetExample[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(
    sheetName
  )}&t=${Date.now()}`;
  const response = await fetch(url);
  const text = await response.text();
  const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
  if (!match) return [];

  const json = JSON.parse(match[1]);
  if (!json?.table?.rows) return [];

  const headers: string[] = (json.table.cols || []).map((c: any) => c?.label || '');
  const col = resolveColumns(headers);

  return json.table.rows.map((row: any) => {
    const cells = (row?.c || []).map((cell: any) =>
      !cell ? '' : cell.f != null ? String(cell.f) : cell.v != null ? String(cell.v) : ''
    );
    const at = (i: number) => norm(cells[i]);
    return {
      sheet: sheetName,
      equipment: at(col.equipment),
      location: at(col.location),
      description: at(col.description),
      tinhTrang: at(col.tinhTrang),
      ghiChu: at(col.ghiChu),
    };
  });
}

/**
 * Chọn lọc ví dụ tốt nhất: ưu tiên dòng mới nhất (cuối sheet), đã có nội dung mô tả,
 * và đa dạng thiết bị (mỗi thiết bị chỉ lấy 1 ví dụ để AI học được nhiều tình huống).
 */
function pickBestExamples(rows: SheetExample[], limit: number): SheetExample[] {
  const seenEquipment = new Set<string>();
  const picked: SheetExample[] = [];

  // Duyệt từ dưới lên = từ tồn tại mới nhất trở về trước
  for (let i = rows.length - 1; i >= 0 && picked.length < limit; i--) {
    const r = rows[i];
    if (!r.description || r.description.length < 10) continue;
    const key = (r.equipment || r.description).toLowerCase();
    if (seenEquipment.has(key)) continue;
    seenEquipment.add(key);
    picked.push(r);
  }
  return picked;
}

/** Đọc cache ví dụ (đồng bộ, dùng ngay khi quét ảnh) */
export function getCachedSheetExamples(): SheetExample[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.examples)) return [];
    return parsed.examples;
  } catch {
    return [];
  }
}

function isCacheFresh(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return typeof parsed?.savedAt === 'number' && Date.now() - parsed.savedAt < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

export function clearSheetExamplesCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Tải ví dụ mẫu từ Google Sheet và lưu cache.
 * @param force bỏ qua cache còn hạn, tải lại từ đầu
 */
export async function refreshSheetExamples(
  sheetId: string,
  sheetNames: string[],
  force = false
): Promise<SheetExample[]> {
  if (!force && isCacheFresh()) return getCachedSheetExamples();

  try {
    const results = await Promise.allSettled(sheetNames.map((name) => fetchSheetRows(sheetId, name)));

    // Lấy đều ví dụ ở cả hai sheet để AI không thiên lệch về một phân loại
    const perSheet = Math.max(2, Math.ceil(MAX_SHEET_EXAMPLES / Math.max(1, sheetNames.length)));
    const examples = results
      .flatMap((r) => (r.status === 'fulfilled' ? pickBestExamples(r.value, perSheet) : []))
      .slice(0, MAX_SHEET_EXAMPLES);

    if (examples.length > 0) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), examples }));
    }
    return examples;
  } catch (err) {
    console.warn('[SheetKnowledge] Không tải được ví dụ mẫu từ Google Sheet:', err);
    return getCachedSheetExamples();
  }
}

/** Rút gọn ví dụ trước khi gửi lên API để prompt không quá dài */
export function serializeSheetExamplesForApi(examples: SheetExample[]) {
  return examples.slice(0, MAX_SHEET_EXAMPLES).map((e) => ({
    sheet: e.sheet,
    equipment: e.equipment.slice(0, 120),
    location: e.location.slice(0, 120),
    description: e.description.slice(0, 300),
    tinhTrang: e.tinhTrang.slice(0, 120),
    ghiChu: e.ghiChu.slice(0, 200),
  }));
}
