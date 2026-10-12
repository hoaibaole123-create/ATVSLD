/**
 * Phần prompt + schema giúp Gemini xác định đúng vị trí / cao trình của ảnh.
 *
 * Dùng chung cho cả hai môi trường:
 *  - api/analyze-defect-image.ts (Vercel Serverless Function)
 *  - server.ts (Express, chạy local `npm run dev`)
 *
 * Tệp bắt đầu bằng dấu "_" nên Vercel không coi đây là một route API.
 */
import { Type } from "@google/genai";
import {
  AREA_KEYS,
  AREA_LAYOUT_NOTES,
  AREA_LOCATIONS_MAP,
  LOCATION_HINTS,
  UNKNOWN_LOCATION,
  findCatalogLocation,
} from "../src/lib/locationCatalog.js";

const ALL_LOCATION_NAMES = Object.values(AREA_LOCATIONS_MAP).flatMap((a) => a.locations);

function formatCatalog(): string {
  return Object.entries(AREA_LOCATIONS_MAP)
    .map(([areaKey, cfg]) => {
      const lines = cfg.locations.map((loc) => {
        const hint = LOCATION_HINTS[loc];
        return `  - "${loc}"${hint ? ` — dấu hiệu: ${hint}` : ""}`;
      });
      const layout = AREA_LAYOUT_NOTES[areaKey]
        ? `Cấu trúc khu vực:\n${AREA_LAYOUT_NOTES[areaKey]}\nDanh sách vị trí:\n`
        : "";
      return `[Khu vực "${cfg.name}" → suggestedArea = "${areaKey}"]\n${layout}${lines.join("\n")}`;
    })
    .join("\n");
}

/** Hướng dẫn xác định vị trí, gắn vào cuối prompt chế độ báo cáo tồn tại */
export function buildLocationPrompt(areaHint?: string): string {
  const hintArea = areaHint && AREA_LOCATIONS_MAP[areaHint] ? AREA_LOCATIONS_MAP[areaHint] : null;

  return `

XÁC ĐỊNH VỊ TRÍ / CAO TRÌNH NƠI CHỤP ẢNH (bắt buộc):
Trước khi chọn vị trí, hãy quan sát và ghi lại bằng chứng theo thứ tự ưu tiên:
1. CHỮ VÀ BIỂN BÁO ĐỌC ĐƯỢC TRONG ẢNH (bằng chứng mạnh nhất):
   - Tìm kỹ ở mọi góc ảnh, kể cả chữ nhỏ/mờ/xa: biển cao trình, ký hiệu "▼", "▽", "EL.", "El", "CT", "Cao trình", "+309.5", số sơn trên tường/cột/cầu thang/cửa thang máy, biển tên phòng, mã thiết bị/mã tủ.
   - Ghi NGUYÊN VĂN mọi chữ đọc được vào "visibleText".
   - Nếu thấy con số cao trình, ghi riêng vào "elevationSignText" (ví dụ "▼ 309,5"). KHÔNG ghi cấp điện áp (500kV, 220kV...), nhiệt độ hay số khác vào trường này. Không thấy thì để chuỗi rỗng.
   - Dấu phẩy và dấu chấm thập phân là như nhau: 309.5 = 309,5.
   - Mã thiết bị trên thẻ tên/tủ/van (vd "NCC-V07aM", "HCC-02-PK") ghi nguyên văn vào "equipmentCodes", đồng thời ghi kèm mã vào "equipmentName" (vd "Van nước chữa cháy NCC-V07aM").
2. MÃ TỔ MÁY: H1, H2, H3, H4 thuộc Ialy hiện hữu; H5, H6 thuộc Ialy mở rộng.
3. THIẾT BỊ ĐẶC TRƯNG của từng phòng (xem phần "dấu hiệu" trong danh mục bên dưới).
4. Không có bằng chứng rõ ràng → KHÔNG ĐOÁN cao trình cụ thể. Chọn mục tổng quát (ví dụ "GIAN MÁY", "Gian Máy", "Gian Biến Áp", "NMTĐ IALY") hoặc "${UNKNOWN_LOCATION}", và đặt locationConfidence = "low".

QUY TẮC ĐỘ TIN CẬY (locationConfidence):
- "high": đọc được biển cao trình / tên phòng, hoặc thấy mã tổ máy kèm thiết bị chỉ có ở một vị trí.
- "medium": suy ra từ thiết bị đặc trưng nhưng không có chữ xác nhận.
- "low": chỉ đoán theo bối cảnh chung. Lưu ý các tầng gian máy của Ialy hiện hữu và Ialy mở rộng trông rất giống nhau, chỉ phân biệt được qua biển cao trình hoặc mã tổ máy.
- "locationEvidence": giải thích ngắn gọn dựa vào đâu để chọn vị trí (trích chữ đọc được nếu có).
- "alternativeLocations": tối đa 2 vị trí khác cũng có khả năng đúng.
${hintArea ? `\nNgười dùng đã chọn sẵn khu vực "${hintArea.name}" (${areaHint}) trên biểu mẫu → ưu tiên vị trí thuộc khu vực này, trừ khi ảnh có bằng chứng rõ ràng (biển cao trình, mã tổ máy) cho thấy khu vực khác.\n` : ""}
DANH MỤC VỊ TRÍ CHUẨN (suggestedLocation phải là ĐÚNG NGUYÊN VĂN một mục dưới đây, và suggestedArea phải là khu vực chứa mục đó):
${formatCatalog()}`;
}

const LOCATION_PROPERTIES = {
  visibleText: {
    type: Type.ARRAY,
    items: { type: Type.STRING },
    description: "Nguyên văn mọi chữ, số, ký hiệu, biển báo đọc được trong ảnh",
  },
  equipmentCodes: {
    type: Type.ARRAY,
    items: { type: Type.STRING },
    description: "Mã thiết bị đọc được trên thẻ tên/tủ/van (vd 'NCC-V07aM', 'HCC-02-PK'), ghi đúng nguyên văn. Rỗng nếu không thấy",
  },
  elevationSignText: {
    type: Type.STRING,
    description: "Chuỗi cao trình đọc được trên biển/tường trong ảnh (vd '▼ 309,5'). Rỗng nếu không thấy",
  },
  locationEvidence: {
    type: Type.STRING,
    description: "Lý do chọn vị trí: biển/chữ đọc được, mã tổ máy, thiết bị đặc trưng",
  },
  suggestedArea: {
    type: Type.STRING,
    enum: AREA_KEYS,
    description: "Khu vực chứa vị trí đã chọn",
  },
  suggestedLocation: {
    type: Type.STRING,
    enum: [...ALL_LOCATION_NAMES, UNKNOWN_LOCATION],
    description: "Vị trí chuẩn, đúng nguyên văn trong danh mục",
  },
  locationConfidence: {
    type: Type.STRING,
    enum: ["high", "medium", "low"],
    description: "Độ tin cậy của vị trí đã chọn",
  },
  alternativeLocations: {
    type: Type.ARRAY,
    items: { type: Type.STRING, enum: ALL_LOCATION_NAMES },
    description: "Tối đa 2 vị trí khác cũng có khả năng đúng",
  },
};

/**
 * Bổ sung các trường vị trí vào responseSchema.
 * Đặt propertyOrdering để Gemini sinh "chữ đọc được" và "bằng chứng" TRƯỚC khi chốt vị trí
 * (mặc định Gemini sinh theo thứ tự bảng chữ cái, khiến nó chọn vị trí trước rồi mới tìm lý do).
 */
export function withLocationSchema(schema: { properties: Record<string, any>; required?: string[]; [k: string]: any }) {
  const { suggestedArea: _a, suggestedLocation: _l, ...rest } = schema.properties;
  const leading = ["hasDefect", "observations"].filter((k) => k in rest);
  const others = Object.keys(rest).filter((k) => !leading.includes(k));
  return {
    ...schema,
    properties: { ...rest, ...LOCATION_PROPERTIES },
    required: [...(schema.required || []), "suggestedArea", "suggestedLocation", "locationConfidence"],
    propertyOrdering: [...leading, ...Object.keys(LOCATION_PROPERTIES), ...others],
  };
}

/** Đảm bảo suggestedArea luôn nhất quán với suggestedLocation đã chọn */
export function normalizeLocationFields(analysis: any) {
  if (!analysis || typeof analysis !== "object") return analysis;
  const entry = findCatalogLocation(analysis.suggestedLocation);
  if (entry) analysis.suggestedArea = entry.area;
  return analysis;
}
