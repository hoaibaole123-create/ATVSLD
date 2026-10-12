/**
 * Danh mục vị trí / cao trình chuẩn của nhà máy Ialy.
 *
 * Dùng chung cho:
 *  - App.tsx (danh sách chọn Địa điểm trên biểu mẫu)
 *  - api/_locationPrompt.ts (prompt + schema Gemini, cả Vercel lẫn server.ts)
 *  - AiVisionDefectAnalyzer (đối chiếu kết quả AI về đúng tên vị trí chuẩn)
 *
 * Tệp này KHÔNG được import thư viện phía server (vd. @google/genai) vì trình duyệt cũng dùng.
 */

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

export const AREA_KEYS = Object.keys(AREA_LOCATIONS_MAP);

/** Giá trị AI trả về khi không đủ bằng chứng để chọn vị trí */
export const UNKNOWN_LOCATION = 'Không xác định';

/**
 * Dấu hiệu nhận biết bằng mắt của từng vị trí, gửi kèm prompt để AI suy luận khi ảnh không có biển cao trình.
 * Đây là gợi ý ban đầu suy ra từ tên phòng — hãy bổ sung đặc điểm THỰC TẾ của nhà máy
 * (màu sơn sàn/tường, thiết bị chỉ có ở tầng đó, biển tên phòng...) để AI nhận diện chính xác hơn.
 */
export const LOCATION_HINTS: Record<string, string> = {
  'Trạm OPY ▼ 550': 'Ngoài trời: máy cắt, dao cách ly, cột thép, dây dẫn trên cao, chuỗi sứ 500kV',
  'Trạm Phân Phối Ngoài Trời - Trạm OPY ▼ 550': 'Ngoài trời: máy cắt, dao cách ly, cột thép, dây dẫn trên cao, chuỗi sứ 500kV',
  'Phòng Điều Khiển - Trạm OPY ▼ 550': 'Phòng điều khiển trạm: bàn điều khiển, màn hình, tủ bảo vệ rơle',
  'CNN Ialy Hiện Hữu ▼522': 'Ngoài trời trên đỉnh cửa nhận nước: cầu trục chân dê, khe lưới chắn rác, cửa van, mặt hồ',
  'CNN Ialy Mở Rộng ▼522': 'Ngoài trời trên đỉnh cửa nhận nước: cầu trục chân dê, khe lưới chắn rác, cửa van, mặt hồ',
  'Đập Tràn ▼ 522': 'Ngoài trời trên đỉnh đập tràn: cửa van cung, trụ pin, mặt hồ',
  'THB11 - Đập tràn ▼522': 'Tủ/thiết bị điện tại đập tràn',
  'Tời Nâng - Đập tràn ▼522': 'Tời / cơ cấu nâng cửa van đập tràn, cáp thép, tang tời',
  'Trạm bơm chữa cháy ▼ 348': 'Máy bơm chữa cháy (thường sơn đỏ), đường ống và van chữa cháy',
  'Trạm Diezel dự phòng ▼ 348': 'Tổ máy phát diesel, ống xả, bồn dầu DO',
  'Phòng máy phát Diezel ▼ 355,7 - nhà PK': 'Tổ máy phát diesel, ống xả, bồn dầu DO',
  'Phòng ĐKTT - nhà PK': 'Phòng điều khiển trung tâm: bàn điều khiển, nhiều màn hình SCADA, tường hiển thị',
  'Xưởng Sửa Chữa GBA': 'Máy công cụ, bàn nguội, dụng cụ sửa chữa',
  'Xưởng Sửa Chữa ▼ 303 - GM': 'Máy công cụ, bàn nguội, dụng cụ sửa chữa',
  'Thông Gió Hút ▼352': 'Quạt thông gió hút công suất lớn, ống gió, cửa gió',
  'Thông Gió Đẩy - nhà PK': 'Quạt thông gió đẩy công suất lớn, ống gió, cửa gió',
  'GIAN MÁY': 'Sàn gian máy chung (chưa rõ cao trình)',
  'Gian Máy': 'Sàn gian máy chung (chưa rõ cao trình)',
  'Gian Biến Áp': 'Gian máy biến áp chung (chưa rõ cao trình): máy biến áp lực, thanh cái, sứ xuyên',
  // --- Ialy mở rộng: theo bản vẽ 'Bố trí thiết bị các cao trình' (TKKT 05/2021) ---
  'Máy biến áp 500kV ▼ 348': 'Ngăn máy biến áp AT1, AT2 có tường ngăn cháy, sứ xuyên cao áp, bộ tản nhiệt; cạnh đó là Gian trung chuyển và sửa chữa MBA, Tiền sảnh, Phòng trực chữa cháy, sân hạ lưu nhà máy',
  'CÁC HỆ THỐNG, THIẾT BỊ ▼ 348': 'Tầng mái/đỉnh nhà máy ▼348: Tiền sảnh, Phòng trực chữa cháy, Gian trung chuyển và sửa chữa MBA, sân hạ lưu; nhìn xuống gian máy qua lan can',
  'Trạm xử lý nước, dầu ▼ 348': 'Nhà xử lý nước lẫn dầu ▼348,45 (nhà nhỏ riêng ở đầu hồi nhà máy): bể chứa, bơm, đường ống, thiết bị tách dầu',
  'Phòng ĐKTT ▼ 339,1': 'Phòng Điều khiển trung tâm ▼339,1: bàn điều khiển cong, dãy màn hình/tủ; cùng tầng có P. Thông tin, P. Ắc quy (giá ắc quy xếp hàng), P. trực ca, Phòng họp, WC',
  'Cao trình 339,1': 'Hành lang ▼339,1 dọc tường thượng lưu, có lan can nhìn xuống gian máy; dãy phòng: P. Thông tin, P. Điều khiển trung tâm, P. Ắc quy, P. trực ca, Phòng họp',
  'Phòng Tự dùng ▼ 331,4': 'Phòng thiết bị điện áp máy phát và tự dùng ▼331,4: dãy tủ hợp bộ điện áp máy phát, máy biến áp tự dùng, thanh dẫn',
  'Cao trình 331,4': 'Hành lang ▼331,4 có lan can nhìn xuống gian máy; dãy phòng: Phòng thiết bị điện áp máy phát và tự dùng, Phòng vật tư, lỗ thả thiết bị',
  'Xưởng sửa chữa cơ khí ▼ 323,7': 'Xưởng sửa chữa cơ khí ▼323,7: máy công cụ, bàn nguội; ngay cạnh sàn lắp ráp và đường xe goòng 12T',
  'Cao trình 323,7': 'SÀN LẮP RÁP ▼323,7 (đầu hồi gian máy): nơi đặt rotor máy phát, nắp tua bin, giá chữ thập trên/dưới, trục tua bin, trục máy phát khi sửa chữa; đường ray xe goòng 12T; cùng tầng có Phòng thiết bị điện AC & DC (dãy tủ điện), P. bể tự hoại',
  'Phòng TG hút ▼ 316,6': 'Phòng thiết bị thông gió hút ▼316,6: quạt và ống gió lớn',
  'Phòng thiết bị khí nén ▼ 316,6': 'Phòng thiết bị khí nén ▼316,6 (phòng dài ở đầu hồi): dãy máy nén khí, bình khí nén; cùng tầng có P. cấp khí chữa cháy, hành lang',
  'Cao trình 309,5-GM': 'SÀN MÁY PHÁT ▼309,5 = sàn chính gian máy MR: đứng trên sàn đá granit vàng be thấy 2 nắp máy phát tròn chia múi (H5, H6), không gian cao thông lên mái, cầu trục gian máy phía trên',
  'Phòng thiết bị kích từ ▼ 309,5-GM': 'Phòng thiết bị kích từ và điều khiển tổ máy ▼309,5: dãy tủ kích từ, tủ điều khiển tổ máy, biến áp kích từ',
  'Phòng máy nén khí bù ▼ 309,5-GM': 'Phòng khí nén chạy bù ▼309,5: máy nén khí, bình khí nén',
  'Phòng thông gió đẩy ▼ 309,5-GM': 'Phòng thiết bị thông gió cấp ▼309,5 (phòng dài ở đầu hồi): quạt và ống gió cấp',
  'Cao trình 303,9-GM': 'Tầng ▼303,9: hành lang hẹp sàn gạch ceramic bao quanh 2 GIẾNG MÁY PHÁT hình trụ tròn bằng bê tông, có cửa vào buồng máy phát',
  'Buồng MF H5 ▼ 303,9-GM': 'Bên trong/cửa vào giếng máy phát tổ H5 (vách bê tông tròn): stator, thanh dẫn, phanh, ổ đỡ máy phát',
  'Buồng MF H6 ▼ 303,9-GM': 'Bên trong/cửa vào giếng máy phát tổ H6 (vách bê tông tròn): stator, thanh dẫn, phanh, ổ đỡ máy phát',
  'Cao trình 298,3-GM': 'Tầng tua bin ▼298,3: khối bê tông lớn bao buồng xoắn, đường ống áp lực Ø3,7m có van trước tua bin, tủ thiết bị điều tốc',
  'Hầm tua bin ▼ 298,3-GM': 'Hố/hầm tua bin ▼298,3: lối vào hẹp tới trục tua bin, servomotor cánh hướng, vành điều chỉnh, ổ hướng tua bin',
  'Cao trình 292,7-GM': 'Tầng ▼292,7 (và chiếu nghỉ ▼296,8): P. thiết bị dầu tua bin (thùng dầu áp lực, bơm dầu), cụm bơm và van đường ống, khối bê tông ống hút/côn ống hút; sàn bê tông mài',
  'Cao trình 288,3-GM': 'Tầng thấp nhất có người ▼288,3 (và ▼284,6 bên dưới): Phòng bơm tiêu nước, hành lang kiểm tra ống hút, cửa thăm ống hút, giếng tập trung nước; sàn bê tông mài, ẩm',
  'NMTĐ IALY MỞ RỘNG': 'Bên ngoài nhà máy Ialy mở rộng: đường vào nhà máy, bãi đỗ xe chữa cháy, tường chắn, sân hạ lưu',
};

/**
 * Mô tả cấu trúc theo chiều đứng của từng khu vực, giúp AI hiểu tầng nào nhìn thấy gì.
 * Ialy mở rộng: tổng hợp từ bản vẽ mặt bằng các cao độ 348 → 284,6 (TKKT 05/2021).
 */
export const AREA_LAYOUT_NOTES: Record<string, string> = {
  'ialy-mo-rong': `Nhà máy Ialy mở rộng có 2 tổ máy (H5, H6; trên bản vẽ thiết kế ký hiệu TM1, TM2). Cấu trúc theo chiều đứng:
- Gian máy là một không gian lớn, sàn chính là SÀN MÁY PHÁT ▼309,5 (thấy 2 nắp máy phát tròn chia múi), thông cao lên tới mái ▼348. Đầu hồi phía bên kia là SÀN LẮP RÁP ▼323,7 (rotor, nắp tua bin, giá chữ thập, xe goòng).
- Dọc tường thượng lưu là dãy phòng xếp chồng nhiều tầng, mỗi tầng có hành lang với LAN CAN nhìn xuống gian máy: ▼316,6 (thông gió hút, khí nén, cấp khí chữa cháy) → ▼323,7 (điện AC & DC, xưởng cơ khí) → ▼331,4 (điện áp máy phát & tự dùng, phòng vật tư) → ▼339,1 (Điều khiển trung tâm, Thông tin, Ắc quy, trực ca, phòng họp) → ▼348 (MBA AT1/AT2, gian sửa chữa MBA, trực chữa cháy, tiền sảnh).
- Ảnh chụp từ hành lang có lan can, nhìn XUỐNG thấy nắp máy phát nhỏ ở phía dưới → là một trong các tầng ▼316,6–▼348 (không phải ▼309,5). Càng nhìn xuống sâu thì tầng càng cao.
- Bên dưới sàn máy phát: ▼303,9 hành lang quanh giếng máy phát tròn → ▼298,3 tầng tua bin (khối bê tông buồng xoắn, ống áp lực Ø3,7m, van) → ▼296,8/▼292,7 thiết bị dầu tua bin, bơm, van, côn ống hút → ▼288,3/▼284,6 phòng bơm tiêu nước, hành lang ống hút.
- Cầu thang bộ ký hiệu CT.1–CT.4, có thang máy (TM) và giếng thông gió (HG hút, TG cấp) ở mọi tầng.`,
};

export interface CatalogLocation {
  location: string;
  area: string;
  areaName: string;
  /** Cao trình (m) đọc từ tên vị trí, null nếu tên không ghi cao trình */
  elevation: number | null;
}

const ELEVATION_MIN = 270;
const ELEVATION_MAX = 560;

/** Lấy các số cao trình (270–560m) xuất hiện trong chuỗi. "309,5" và "309.5" là như nhau. */
export function parseElevations(text: string): { value: number; hasDecimal: boolean }[] {
  const out: { value: number; hasDecimal: boolean }[] = [];
  // Không dùng lookbehind (?<!...) vì Safari iOS cũ không hỗ trợ và sẽ làm hỏng cả ứng dụng
  const re = /(^|[^\d.,])(\d{3})(?:[.,](\d{1,2}))?(?!\d)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(String(text || ''))) !== null) {
    const value = parseFloat(m[3] ? `${m[2]}.${m[3]}` : m[2]);
    if (value >= ELEVATION_MIN && value <= ELEVATION_MAX) {
      out.push({ value, hasDecimal: !!m[3] });
    }
  }
  return out;
}

export const ALL_LOCATIONS: CatalogLocation[] = Object.entries(AREA_LOCATIONS_MAP).flatMap(([area, cfg]) =>
  cfg.locations.map((location) => ({
    location,
    area,
    areaName: cfg.name,
    // "Máy biến áp 500kV ▼ 348" → bỏ qua 500 (cấp điện áp), lấy số sau dấu ▼ nếu có
    elevation: (() => {
      const afterMarker = location.includes('▼') ? location.slice(location.indexOf('▼')) : location;
      return parseElevations(afterMarker)[0]?.value ?? null;
    })(),
  }))
);

const normKey = (v: string) => String(v || '').toLowerCase().replace(/\s+/g, ' ').replace(/\s*▼\s*/g, ' ▼ ').trim();

/** Tìm vị trí chuẩn đúng tên (không phân biệt hoa thường/khoảng trắng) */
export function findCatalogLocation(name?: string): CatalogLocation | null {
  if (!name) return null;
  const key = normKey(name);
  return ALL_LOCATIONS.find((l) => normKey(l.location) === key) || null;
}

/**
 * Các vị trí có cao trình khớp với số đọc được. Số nguyên "309" ưu tiên khớp đúng 309, sau đó mới tới 309,x.
 * Có khu vực thì lọc theo khu vực trước (vd Ialy mở rộng + "309" → 309,5), không có ứng viên mới xét toàn bộ.
 */
function candidatesForElevation(value: number, hasDecimal: boolean, area?: string): CatalogLocation[] {
  const match = (pool: CatalogLocation[]) => {
    const withElev = pool.filter((l) => l.elevation != null);
    const exact = withElev.filter((l) => Math.abs((l.elevation as number) - value) < 0.05);
    if (exact.length > 0 || hasDecimal) return exact;
    return withElev.filter((l) => Math.floor(l.elevation as number) === value);
  };
  if (area) {
    const inArea = match(ALL_LOCATIONS.filter((l) => l.area === area));
    if (inArea.length > 0) return inArea;
  }
  return match(ALL_LOCATIONS);
}

/** Trong nhóm vị trí cùng cao trình, chọn mục tổng quát "Cao trình ..." thay vì đoán một phòng cụ thể */
function pickGeneric(cands: CatalogLocation[]): CatalogLocation {
  return cands.find((c) => /^cao trình/i.test(c.location)) || cands[0];
}

/** "Ialy mở rộng" → "ialy-mo-rong" (tên khu vực ghi trên Google Sheet → mã khu vực) */
export function areaKeyFromName(name?: string): string | undefined {
  const n = String(name || '').toLowerCase();
  if (!n) return undefined;
  if (n.includes('mở rộng') || n.includes('mo rong')) return 'ialy-mo-rong';
  if (n.includes('hiện hữu') || n.includes('hien huu')) return 'ialy-hien-huu';
  if (n.includes('opy')) return 'opy-500';
  if (n.includes('nhận nước') || n.includes('đập') || n.includes('cnn')) return 'cua-nhan-nuoc';
  return AREA_KEYS.includes(n) ? n : undefined;
}

/**
 * Quy một chuỗi vị trí ghi tự do (vd "Phòng trực chính GM (CT 309)", "Cao trình 288.3m")
 * về vị trí chuẩn trong danh mục. Chỉ nhận kết quả nằm đúng khu vực đã biết, tránh gán nhầm nhà máy.
 */
export function matchLocationText(text?: string, area?: string): CatalogLocation | null {
  const exact = findCatalogLocation(text);
  if (exact) return !area || exact.area === area ? exact : null;
  for (const { value, hasDecimal } of parseElevations(text || '')) {
    const cands = candidatesForElevation(value, hasDecimal, area).filter((c) => !area || c.area === area);
    if (cands.length > 0) return pickGeneric(cands);
    // Ghi tay hay lệch vài tấc so với tên chuẩn (vd sàn 292,3 thuộc tầng ▼292,7) → lấy tầng gần nhất trong ±0,6m
    const near = ALL_LOCATIONS.filter(
      (l) => l.elevation != null && (!area || l.area === area) && Math.abs((l.elevation as number) - value) <= 0.6
    );
    if (near.length > 0) {
      const dist = (l: CatalogLocation) => Math.abs((l.elevation as number) - value);
      const best = Math.min(...near.map(dist));
      return pickGeneric(near.filter((l) => dist(l) === best));
    }
  }
  return null;
}

export type LocationConfidence = 'high' | 'medium' | 'low';

/** Vị trí đã được người dùng xác nhận cho mã thiết bị đọc được trong ảnh */
export interface LocationMemoryMatch {
  location: string;
  code: string;
  /** Số lần vị trí này được xác nhận cho mã đó */
  votes: number;
  /** Mã từng được ghi ở nhiều vị trí khác nhau */
  conflict: boolean;
  source: 'device' | 'sheet';
}

export interface ResolvedLocation {
  location: string;
  area: string;
  elevation: number | null;
  confidence: LocationConfidence;
  /** sign = biển cao trình trong ảnh; memory = mã thiết bị đã được xác nhận vị trí; ai = AI suy luận */
  source: 'sign' | 'memory' | 'ai' | 'none';
  note: string;
}

/**
 * Chốt vị trí cuối cùng từ kết quả AI.
 * Cao trình đọc được trên biển/tường trong ảnh là bằng chứng mạnh nhất nên được ưu tiên
 * hơn phỏng đoán của AI; khi không có biển thì giữ lựa chọn của AI kèm độ tin cậy AI tự đánh giá.
 */
export function resolveLocation(params: {
  aiLocation?: string;
  aiConfidence?: string;
  elevationSignText?: string;
  areaHint?: string;
  memory?: LocationMemoryMatch | null;
}): ResolvedLocation | null {
  const aiEntry = findCatalogLocation(params.aiLocation);
  const aiConf: LocationConfidence = ['high', 'medium', 'low'].includes(String(params.aiConfidence))
    ? (params.aiConfidence as LocationConfidence)
    : 'low';

  for (const { value, hasDecimal } of parseElevations(params.elevationSignText || '')) {
    const memEntry = findCatalogLocation(params.memory?.location);
    // Khu vực ưu tiên: theo mã thiết bị đã học, sau đó theo khu vực người dùng chọn
    const cands = candidatesForElevation(value, hasDecimal, memEntry?.area || params.areaHint);
    if (cands.length === 0) continue;
    if (memEntry && cands.some((c) => c.location === memEntry.location)) {
      return {
        location: memEntry.location,
        area: memEntry.area,
        elevation: memEntry.elevation,
        confidence: 'high',
        source: 'sign',
        note: `Khớp biển cao trình ▼${String(value).replace('.', ',')} và mã thiết bị ${params.memory!.code} đã học`,
      };
    }

    const signLabel = String(value).replace('.', ',');
    if (aiEntry && cands.some((c) => c.location === aiEntry.location)) {
      return {
        location: aiEntry.location,
        area: aiEntry.area,
        elevation: aiEntry.elevation,
        confidence: 'high',
        source: 'sign',
        note: `Khớp biển cao trình ▼${signLabel} đọc được trong ảnh`,
      };
    }
    const pick = pickGeneric(cands);
    return {
      location: pick.location,
      area: pick.area,
      elevation: pick.elevation,
      confidence: cands.length === 1 || new Set(cands.map((c) => c.area)).size === 1 ? 'high' : 'medium',
      source: 'sign',
      note: aiEntry
        ? `Đọc được biển ▼${signLabel} trong ảnh nên chọn theo biển (AI đoán "${aiEntry.location}")`
        : `Đọc được biển cao trình ▼${signLabel} trong ảnh`,
    };
  }

  const mem = params.memory;
  const memEntry = findCatalogLocation(mem?.location);
  if (mem && memEntry) {
    const from = mem.source === 'sheet' ? 'theo Sổ theo dõi trên Google Sheet' : 'đã được xác nhận trên máy này';
    return {
      location: memEntry.location,
      area: memEntry.area,
      elevation: memEntry.elevation,
      confidence: mem.conflict ? 'medium' : 'high',
      source: 'memory',
      note: `Mã thiết bị ${mem.code} ${from} ở vị trí này (${mem.votes} lần)` +
        (mem.conflict ? ' — mã này từng được ghi ở vị trí khác, hãy kiểm tra' : '') +
        (aiEntry && aiEntry.location !== memEntry.location ? ` (AI đoán "${aiEntry.location}")` : ''),
    };
  }

  if (aiEntry) {
    return {
      location: aiEntry.location,
      area: aiEntry.area,
      elevation: aiEntry.elevation,
      confidence: aiConf,
      source: 'ai',
      note: 'AI suy luận từ thiết bị và bối cảnh trong ảnh (không thấy biển cao trình)',
    };
  }

  return null;
}
