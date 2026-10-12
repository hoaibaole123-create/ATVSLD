/**
 * Bộ nhớ "mã thiết bị → vị trí" giúp AI xác định cao trình ngày càng chính xác.
 *
 * Mã thiết bị trên thẻ tên (vd "NCC-V07aM", "HCC-02-PK") gắn cố định ở một chỗ, nên chỉ cần
 * xác nhận vị trí một lần là lần sau quét lại ảnh có mã đó sẽ ra đúng ngay, không phụ thuộc AI đoán.
 *
 * Hai nguồn học:
 *  - Trên máy này (localStorage): mỗi lần người dùng bấm "Áp dụng" hoặc gửi báo cáo với vị trí đã chọn.
 *  - Dùng chung cả tổ (Google Sheet): các báo cáo đã gửi có mã thiết bị trong cột Tên thiết bị / Mô tả,
 *    kèm cột Khu vực + Vị trí. Báo cáo của người này giúp máy người khác nhận đúng vị trí.
 */
import { LocationMemoryMatch, areaKeyFromName, findCatalogLocation, matchLocationText } from './locationCatalog';

type VoteMap = Record<string, Record<string, number>>; // mã → { vị trí chuẩn → số lần }

const DEVICE_KEY = 'ai_location_memory_v1';
const SHEET_CACHE_KEY = 'ai_location_memory_sheet_v1';
const SHEET_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_CODES = 500;

/** Trọng số: gửi báo cáo là xác nhận cuối cùng nên nặng hơn bấm "Áp dụng" trong khung AI */
export const WEIGHT_APPLY = 1;
export const WEIGHT_SUBMIT = 2;

const normCode = (c: string) => String(c || '').toUpperCase().replace(/\s+/g, '').replace(/[.,;:)]+$/, '');

/**
 * Lấy các chuỗi trông giống mã thiết bị: có cả chữ và số, dài ≥ 4 ký tự, vd "NCC-V07aM", "HCC-02-PK", "P1103".
 * Bỏ qua mã tổ máy trơn (H1, TM2), số kèm đơn vị (500kV, 12T, 288.3m) vì không chỉ ra một vị trí cụ thể.
 */
export function extractEquipmentCodes(texts: Array<string | undefined | null>): string[] {
  const out = new Set<string>();
  // Không nối qua dấu "/" vì người dùng hay viết "H5/H6", "TPM/5S"
  const re = /[A-Za-zĐđ0-9]+(?:[-_.][A-Za-zĐđ0-9]+)*/g;
  for (const t of texts) {
    for (const raw of String(t || '').match(re) || []) {
      const code = normCode(raw);
      const compact = code.replace(/[-_.]/g, '');
      if (compact.length < 4 || compact.length > 20) continue;
      if (!/[A-ZĐ]/.test(compact) || !/\d/.test(compact)) continue;
      if (/^\d+([.,]\d+)?(KV|V|KW|MW|MVA|M|MM|CM|T|KG|BAR|MPA|L|A)$/.test(code)) continue;
      if (/^(H|TM|TĐ|MF)\d$/.test(compact)) continue;
      out.add(code);
    }
  }
  return [...out];
}

function load(key: string): VoteMap {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    const votes = key === SHEET_CACHE_KEY ? parsed?.votes : parsed;
    return votes && typeof votes === 'object' ? votes : {};
  } catch {
    return {};
  }
}

function addVotes(map: VoteMap, codes: string[], location: string, weight: number) {
  for (const code of codes) {
    map[code] = map[code] || {};
    map[code][location] = (map[code][location] || 0) + weight;
  }
}

/** Ghi nhận vị trí người dùng đã chọn cho các mã thiết bị trong ảnh */
export function rememberLocation(codes: string[], location: string, weight = WEIGHT_APPLY): void {
  const entry = findCatalogLocation(location);
  if (!entry || codes.length === 0) return;
  try {
    const map = load(DEVICE_KEY);
    addVotes(map, codes.map(normCode), entry.location, weight);
    const trimmed = Object.fromEntries(Object.entries(map).slice(-MAX_CODES));
    localStorage.setItem(DEVICE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('[LocationMemory] Không lưu được bộ nhớ vị trí:', err);
  }
}

function bestFor(map: VoteMap, code: string) {
  const votes = map[code];
  if (!votes) return null;
  const ranked = Object.entries(votes).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return null;
  return { location: ranked[0][0], votes: ranked[0][1], conflict: ranked.length > 1 && ranked[1][1] * 2 > ranked[0][1] };
}

/** Tra vị trí đã học cho các mã đọc được trong ảnh. Ưu tiên dữ liệu trên máy (mới nhất), sau đó tới Google Sheet. */
export function lookupLocationMemory(codes: string[]): LocationMemoryMatch | null {
  const normalized = codes.map(normCode);
  for (const [map, source] of [[load(DEVICE_KEY), 'device'], [load(SHEET_CACHE_KEY), 'sheet']] as const) {
    const hits = normalized
      .map((code) => ({ code, best: bestFor(map, code) }))
      .filter((h) => h.best && findCatalogLocation(h.best.location))
      .sort((a, b) => b.best!.votes - a.best!.votes);
    if (hits.length > 0) {
      const { code, best } = hits[0];
      return { code, location: best!.location, votes: best!.votes, conflict: best!.conflict, source };
    }
  }
  return null;
}

export function countLearnedCodes(): { device: number; sheet: number } {
  return { device: Object.keys(load(DEVICE_KEY)).length, sheet: Object.keys(load(SHEET_CACHE_KEY)).length };
}

export function clearDeviceLocationMemory(): void {
  try {
    localStorage.removeItem(DEVICE_KEY);
  } catch {
    /* ignore */
  }
}

async function fetchSheetTable(sheetId: string, sheetName: string) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
  const text = await (await fetch(url)).text();
  const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
  if (!match) return null;
  const json = JSON.parse(match[1]);
  const headers: string[] = (json?.table?.cols || []).map((c: any) => String(c?.label || '').toLowerCase());
  const rows: string[][] = (json?.table?.rows || []).map((row: any) =>
    (row?.c || []).map((cell: any) => (!cell ? '' : String(cell.f ?? cell.v ?? '')))
  );
  return { headers, rows };
}

/**
 * Học mã thiết bị → vị trí từ toàn bộ báo cáo trên Google Sheet (cache 6 giờ).
 * Cột Vị trí trên Sheet ghi tự do nên được quy về vị trí chuẩn theo cột Khu vực; dòng nào không quy được thì bỏ qua.
 */
export async function refreshLocationMemoryFromSheet(sheetId: string, sheetNames: string[], force = false): Promise<void> {
  try {
    const raw = localStorage.getItem(SHEET_CACHE_KEY);
    if (!force && raw && Date.now() - (JSON.parse(raw)?.savedAt || 0) < SHEET_TTL_MS) return;
  } catch {
    /* tải lại */
  }

  try {
    const tables = await Promise.allSettled(sheetNames.map((n) => fetchSheetTable(sheetId, n)));
    const map: VoteMap = {};
    for (const t of tables) {
      if (t.status !== 'fulfilled' || !t.value) continue;
      const { headers, rows } = t.value;
      const col = (keys: string[], fallback: number) => {
        const i = headers.findIndex((h) => keys.some((k) => h.includes(k)));
        return i >= 0 ? i : fallback;
      };
      const areaIdx = col(['khu vực'], 4);
      const equipIdx = col(['thiết bị'], 5);
      const locIdx = col(['vị trí'], 6);
      const descIdx = col(['mô tả', 'tồn tại'], 7);
      for (const r of rows) {
        const entry = matchLocationText(r[locIdx], areaKeyFromName(r[areaIdx]));
        if (!entry) continue;
        const codes = extractEquipmentCodes([r[equipIdx], r[descIdx]]);
        addVotes(map, codes, entry.location, 1);
      }
    }
    localStorage.setItem(SHEET_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), votes: map }));
  } catch (err) {
    console.warn('[LocationMemory] Không học được từ Google Sheet:', err);
  }
}
