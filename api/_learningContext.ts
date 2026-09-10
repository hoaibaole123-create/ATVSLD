/**
 * Dựng phần "học theo ngữ cảnh" cho prompt Gemini.
 *
 * Dùng chung cho cả hai môi trường:
 *  - api/analyze-defect-image.ts (Vercel Serverless Function)
 *  - server.ts (Express, chạy local `npm run dev`)
 *
 * Tệp bắt đầu bằng dấu "_" nên Vercel không coi đây là một route API.
 */

/** Một ca người dùng đã chỉnh sửa lại kết quả AI (Sổ tay kinh nghiệm cá nhân) */
export interface LessonPayload {
  formType?: string;
  corrections?: Array<{ field?: string; aiSaid?: string; userFixed?: string }>;
}

/** Một dòng tồn tại có sẵn trên Google Sheet (kinh nghiệm tập thể) */
export interface SheetExamplePayload {
  sheet?: string;
  equipment?: string;
  location?: string;
  description?: string;
  tinhTrang?: string;
  ghiChu?: string;
}

const MAX_LESSONS_IN_PROMPT = 10;
const MAX_SHEET_EXAMPLES_IN_PROMPT = 12;

/** Ví dụ mẫu lấy từ Sổ theo dõi tồn tại trên Google Sheet */
export function buildSheetExamplesContext(sheetExamples: SheetExamplePayload[]): string {
  if (!sheetExamples || !Array.isArray(sheetExamples) || sheetExamples.length === 0) return "";

  const exampleLines = sheetExamples
    .slice(0, MAX_SHEET_EXAMPLES_IN_PROMPT)
    .map((e, idx) => {
      const desc = String(e?.description || "").trim();
      if (!desc) return "";
      const parts = [
        `[Mẫu #${idx + 1}] Phân loại: "${e.sheet || ''}"`,
        `Thiết bị: "${e.equipment || ''}"`,
        `Vị trí: "${e.location || ''}"`,
        `Nội dung tồn tại: "${desc}"`,
      ];
      if (e.tinhTrang) parts.push(`Tình trạng sau khắc phục: "${e.tinhTrang}"`);
      if (e.ghiChu) parts.push(`Ghi chú: "${e.ghiChu}"`);
      return parts.join(" | ");
    })
    .filter(Boolean)
    .join("\n");

  if (!exampleLines) return "";

  return `\n\nVÍ DỤ MẪU CHUẨN TỪ SỔ THEO DÕI TỒN TẠI (dữ liệu thật do cán bộ nhà máy Ialy đã ghi trên Google Sheet):\n${exampleLines}\n\nQUY TẮC ÁP DỤNG VÍ DỤ MẪU:\n- Hãy viết theo ĐÚNG văn phong, độ dài và cấu trúc câu như các mẫu trên.\n- Dùng đúng cách gọi tên thiết bị, ký hiệu, cao trình và tên vị trí như trong các mẫu (ví dụ cách ghi "Cao trình 288.3m", mã tổ máy H1/H2/H3, tên gian máy/trạm).\n- Đây CHỈ là mẫu văn phong và thuật ngữ. Tuyệt đối KHÔNG sao chép nội dung tồn tại của mẫu nếu ảnh hiện tại không thể hiện đúng tồn tại đó — luôn mô tả theo những gì thực sự nhìn thấy trong ảnh.`;
}

/** Các ca AI từng đánh giá sai và đã được người dùng sửa lại cho chuẩn */
export function buildLessonsContext(lessons: LessonPayload[]): string {
  if (!lessons || !Array.isArray(lessons) || lessons.length === 0) return "";

  const lessonLines = lessons
    .slice(0, MAX_LESSONS_IN_PROMPT)
    .map((l, idx) => {
      const corrections = Array.isArray(l?.corrections) ? l.corrections : [];
      if (corrections.length === 0) return "";
      const detail = corrections
        .slice(0, 6)
        .map((c) => `   - ${c.field}: AI từng ghi "${c.aiSaid}" → Chuẩn phải là "${c.userFixed}"`)
        .join("\n");
      return `[Bài học #${idx + 1}]\n${detail}`;
    })
    .filter(Boolean)
    .join("\n");

  if (!lessonLines) return "";

  return `\n\nSỔ TAY KINH NGHIỆM THỰC TẾ (các ca chuyên gia nhà máy đã chỉnh sửa lại kết quả của AI):\n${lessonLines}\n\nQUY TẮC ÁP DỤNG SỔ TAY:\n- Đây là chuẩn từ ngữ, cách gọi tên thiết bị, cao trình và văn phong đánh giá thực tế của nhà máy Ialy. Hãy bám theo phong cách này.\n- Ưu tiên dùng đúng thuật ngữ, tên thiết bị/vị trí theo cột "Chuẩn phải là" khi gặp tình huống tương tự.\n- Tránh lặp lại đúng những lỗi đã bị chỉnh sửa ở trên.\n- Nếu ảnh hiện tại KHÁC hẳn các ca trên thì vẫn đánh giá độc lập theo quan sát thực tế, chỉ mượn văn phong và thuật ngữ.`;
}

/**
 * Ghép toàn bộ phần học theo ngữ cảnh, gắn vào cuối prompt gốc.
 * Ví dụ mẫu từ Sheet đặt trước, sổ tay ca đã sửa đặt sau cùng để có trọng số cao hơn.
 */
export function buildLearningContext(params: {
  lessons?: LessonPayload[];
  sheetExamples?: SheetExamplePayload[];
}): string {
  return (
    buildSheetExamplesContext(params.sheetExamples || []) + buildLessonsContext(params.lessons || [])
  );
}
