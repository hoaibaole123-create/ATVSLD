import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialize Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Helper with retry & multi-model fallback for Gemini requests
async function generateWithFallback(ai: GoogleGenAI, generateParams: any) {
  // Try ultra-fast gemini-3.1-flash-lite (highest throughput, ultra-fast latency, avoids 503 high demand), then gemini-3.7-flash, then gemini-flash-latest
  const models = ["gemini-3.1-flash-lite", "gemini-3.7-flash", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const modelConfig = { ...generateParams.config };
      // thinkingConfig is only valid on gemini-3.7 models; delete it for other models to prevent 400 errors
      if (!model.includes("3.7")) {
        delete modelConfig.thinkingConfig;
      }

      const response = await ai.models.generateContent({
        ...generateParams,
        model: model,
        config: modelConfig,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Attempt] Model ${model} failed:`, err?.message || err);
    }
  }
  throw lastError;
}

// API Route: AI Image Evaluation & Description Suggestions
app.post("/api/analyze-defect-image", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg", formType = "report", pendingDefects = [] } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: "Dữ liệu hình ảnh không được để trống" });
  }

  try {
    const ai = getGenAI();
    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

    const isProcessing = formType === 'process';
    
    // Build candidate defect list text if provided for defect matching
    let defectsPromptContext = "";
    if (pendingDefects && Array.isArray(pendingDefects) && pendingDefects.length > 0) {
      defectsPromptContext = `\n\nDANH SÁCH CÁC TỒN TẠI ĐANG CHỜ XỬ LÝ TRONG HỆ THỐNG:\n` +
        pendingDefects.slice(0, 40).map((d: any, idx: number) => 
          `[Mục #${idx + 1}] Sheet: "${d.sheet || ''}" | Row: ${d.row} | Thiết bị: "${d.colE || d.equipment || ''}" | Vị trí: "${d.colF || d.location || ''}" | Nội dung tồn tại: "${d.colG || d.description || ''}"`
        ).join("\n") +
        `\n\nNhiệm vụ khớp tồn tại: Hãy đối chiếu hình ảnh với danh sách tồn tại trên. Nhận diện xem ảnh này khớp nhất với tồn tại nào (chỉ rõ sheet, row, tên thiết bị, nội dung, độ tin cậy "high"|"medium"|"low", và lý do nhận diện cụ thể). Nếu không có mục nào khớp thì matchedDefect có thể để trống hoặc confidence là "low".`;
    }

    const prompt = isProcessing
      ? `Bạn là chuyên gia thẩm định kỹ thuật, an toàn vệ sinh lao động (ATVSLĐ) và 5S/TPM tại nhà máy công nghiệp / thủy điện Ialy.
Hãy phân tích nhanh hình ảnh minh chứng kết quả xử lý / khắc phục tồn tại này.
1. Tự động nhận diện và đối chiếu xem ảnh này thuộc về tồn tại nào đã lưu trong danh sách tồn tại đang chờ xử lý.
2. Đưa ra nhận định thực tế về tình trạng thiết bị / hiện trường sau xử lý, gợi ý nội dung cập nhật Tình trạng (ví dụ: "Đã khắc phục hoàn tất") và Ghi chú chuẩn xác.${defectsPromptContext}`
      : `Bạn là chuyên gia giám định an toàn vệ sinh lao động (ATVSLĐ), trang bị bảo hộ cá nhân (BHLĐ/PPE) và kỹ thuật 5S/TPM tại nhà máy công nghiệp / thủy điện Ialy.
Hãy quan sát kỹ toàn bộ bức ảnh (bao gồm cả con người, hành vi, trang phục BHLĐ, thiết bị và môi trường xung quanh):

ĐẶC BIỆT KIỂM TRA CÁC VI PHẠM AN TOÀN VỆ SINH LAO ĐỘNG (ATVSLĐ & PPE) CỦA CON NGƯỜI:
- KHÔNG ĐỘI MŨ BẢO HỘ: Người lao động ở trong phòng điều khiển, gian máy, trạm phân phối, công trường... không đội mũ bảo hộ (hoặc tháo mũ để trên bàn/tủ/ghế).
- KHÔNG MANG GIÀY BẢO HỘ: Đi chân đất, chỉ đi tất/vớ, đi dép lê, dép tổ ong, giày vải, giày thể thao không có mũi thép bảo vệ trong khu vực sản xuất/vận hành kỹ thuật.
- VI PHẠM BHLĐ KHÁC: Không đeo găng tay khi thao tác điện/nhiệt/hóa chất, không đeo dây an toàn trên cao, không mặc áo phản quang/quần áo bảo hộ đúng quy chuẩn.
- CÁC NGUY CƠ AN TOÀN KHÁC: Hở điện, vật cản lối thoát hiểm, sàn trơn trượt, nguy cơ vật rơi, thiếu rào chắn/biển báo.

QUY TẮC PHÂN LOẠI:
1. NẾU CÓ BẤT KỲ VI PHẠM BHLĐ NÀO (như không đội mũ, không mang giày bảo hộ...) hoặc rủi ro tai nạn/điện giật/chấn thương:
   - hasDefect = true
   - category = "safety" (An toàn vệ sinh lao động)
   - categoryLabel = "An toàn vệ sinh lao động"
   - defectTitle = Nêu rõ vi phạm (ví dụ: "Vi phạm BHLĐ: Không đội mũ bảo hộ và không mang giày bảo hộ trong khu vực vận hành")
   - equipmentName = Tên khu vực/thiết bị (ví dụ: "Trang bị BHLĐ cá nhân / Phòng điều khiển trung tâm")
   - severity = "Cao" hoặc "Khẩn cấp" hoặc "Trung bình"
   - observations = Liệt kê chi tiết quan sát (ví dụ: "Nhân viên không đội mũ bảo hộ (mũ đặt trên nóc tủ thiết bị)", "Nhân viên chỉ đi tất/dép, không mang giày bảo hộ lao động đúng quy định")
   - descriptions: 3 phương án mô tả rõ lỗi vi phạm và quy định an toàn
   - remedySuggestion = Yêu cầu chấn chỉnh ngay: bắt buộc trang bị đầy đủ mũ và giày bảo hộ trước khi vào khu vực làm việc.

2. NẾU LỖI 5S / TPM / CƠ KHÍ (không nguy hiểm tính mạng: rò rỉ dầu mỡ, đồ đạc bừa bãi, rỉ sét vỏ máy...):
   - hasDefect = true
   - category = "iso-kaizen" (ISO, KAIZEN 5S, TPM)

3. NẾU HIỆN TRƯỜNG VÀ CON NGƯỜI HOÀN TOÀN ĐẠT CHUẨN (đầy đủ BHLĐ mũ giày găng tay, thiết bị sạch đẹp an toàn):
   - hasDefect = false
   - severity = "Bình thường"
   - defectTitle = "Hiện trường & Thiết bị đạt chuẩn an toàn"`;

    const response = await generateWithFallback(ai, {
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: cleanBase64,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        thinkingConfig: {
          thinkingBudget: 0, // Turn off extended thinking for ultra-fast instant response
        },
        temperature: 0.2,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasDefect: { type: Type.BOOLEAN, description: "True nếu phát hiện lỗi/tồn tại/nguy cơ, False nếu ảnh bình thường/đạt chuẩn" },
            defectTitle: { type: Type.STRING, description: "Tiêu đề ngắn gọn về tình trạng quan sát được" },
            category: { type: Type.STRING, description: "Phân loại: safety hoặc iso-kaizen" },
            categoryLabel: { type: Type.STRING, description: "Tên phân loại tiếng Việt: An toàn vệ sinh lao động hoặc ISO, KAIZEN 5S, TPM" },
            equipmentName: { type: Type.STRING, description: "Tên thiết bị hoặc kết cấu nhận diện được" },
            suggestedArea: { type: Type.STRING, description: "Gợi ý khu vực: ialy-hien-huu, ialy-mo-rong, cua-nhan-nuoc, opy-500" },
            suggestedLocation: { type: Type.STRING, description: "Vị trí lắp đặt chi tiết, ưu tiên khớp chính xác với danh sách chuẩn: Trạm OPY ▼ 550, Phòng Điều Khiển - Trạm OPY ▼ 550, Trạm Phân Phối Ngoài Trời - Trạm OPY ▼ 550, CNN, CNN Ialy Hiện Hữu ▼522, CNN Ialy Mở Rộng ▼522, Đập Tràn ▼ 522, THB11 - Đập tràn ▼522, Tời Nâng - Đập tràn ▼522, NMTĐ IALY MỞ RỘNG, TRẠM CHUYỂN TIẾP ▼ 358,5, CÁC HỆ THỐNG, THIẾT BỊ ▼ 348, Máy biến áp 500kV ▼ 348, Trạm xử lý nước, dầu ▼ 348, Trạm bơm chữa cháy ▼ 348, Trạm Diezel dự phòng ▼ 348, Khu vực hạ lưu NM ▼ 348, GIAN MÁY, Cao trình 288,3-GM, Cao trình 292,7-GM, Cao trình 298,3-GM, Hầm tua bin ▼ 298,3-GM, Cao trình 303,9-GM, Buồng MF H5 ▼ 303,9-GM, Buồng MF H6 ▼ 303,9-GM, Cao trình 309,5-GM, Phòng thiết bị kích từ ▼ 309,5-GM, Phòng máy nén khí bù ▼ 309,5-GM, Phòng thông gió đẩy ▼ 309,5-GM, Phòng TG hút ▼ 316,6, Phòng thiết bị khí nén ▼ 316,6, Cao trình 323,7, Xưởng sửa chữa cơ khí ▼ 323,7, Cao trình 331,4, Phòng Tự dùng ▼ 331,4, Cao trình 339,1, Phòng ĐKTT ▼ 339,1, Cao Trình 309 - GM, Cao Trình 303 - GM, Cao Trình 299,2 - GM, Cao Trình 288,8 - GM, Cao Trình 284,2 - GM, Cao Trình 277 - GM, Gian Biến Áp, Cao Trình 327,8 - GBA, Cao Trình 323,8 - GBA, Cao Trình 340 - GBA, Cao Trình 332 - GBA, Cao Trình 336,5 - GBA, Nhà Khử Khí ▼ 355,7, Các Hệ Thống, Thiết Bị Nhà PK, Trạm Hợp Bộ 6 - nhà PK, Thông Gió Đẩy - nhà PK, Phòng ĐKTT - nhà PK" },
            severity: { type: Type.STRING, description: "Mức độ rủi ro: Bình thường | Thấp | Trung bình | Cao | Khẩn cấp" },
            observations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách 2-4 chi tiết quan sát thấy trong ảnh (điểm lỗi hoặc điểm đạt chuẩn)"
            },
            descriptions: {
              type: Type.OBJECT,
              properties: {
                concise: { type: Type.STRING, description: "Gợi ý mô tả súc tích (1 câu)" },
                standard: { type: Type.STRING, description: "Gợi ý mô tả tiêu chuẩn (đầy đủ hiện tượng và vị trí)" },
                detailed: { type: Type.STRING, description: "Gợi ý mô tả chi tiết chuyên sâu kèm nhận định nguy cơ" }
              },
              required: ["concise", "standard", "detailed"]
            },
            remedySuggestion: { type: Type.STRING, description: "Biện pháp xử lý hoặc khuyến nghị kỹ thuật" },
            processStatus: { type: Type.STRING, description: "Gợi ý cho ô Tình trạng khi hoàn thành (ví dụ: Đã khắc phục hoàn tất)" },
            processNote: { type: Type.STRING, description: "Gợi ý cho ô Ghi chú xử lý (ví dụ: Đã vệ sinh, thay mới gioăng và siết lại bulông chắc chắn)" },
            matchedDefect: {
              type: Type.OBJECT,
              description: "Tồn tại khớp nhất tìm thấy trong danh sách đã lưu",
              properties: {
                sheet: { type: Type.STRING, description: "Tên sheet của tồn tại: An toàn vệ sinh lao động hoặc TPM, Kaizen" },
                row: { type: Type.INTEGER, description: "Số dòng (row) trong sheet" },
                equipment: { type: Type.STRING, description: "Tên thiết bị của tồn tại khớp" },
                location: { type: Type.STRING, description: "Vị trí của tồn tại khớp" },
                description: { type: Type.STRING, description: "Nội dung tồn tại khớp" },
                confidence: { type: Type.STRING, description: "Mức độ khớp: high, medium hoặc low" },
                matchReason: { type: Type.STRING, description: "Giải thích ngắn lý do AI nhận diện bức ảnh này khớp với tồn tại trên" }
              }
            }
          },
          required: ["defectTitle", "category", "equipmentName", "severity", "descriptions", "remedySuggestion"]
        }
      }
    });

    let rawText = response.text || "{}";
    rawText = rawText.trim();
    if (rawText.startsWith("```json")) {
      rawText = rawText.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
    } else if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    }
    const result = JSON.parse(rawText || "{}");
    res.json({ success: true, analysis: result });
  } catch (error: any) {
    console.error("Gemini Vision Analysis Error:", error);
    const isOverloaded = error?.status === 503 || error?.code === 503 || String(error?.message).includes("503") || String(error?.message).includes("demand");
    res.status(500).json({ 
      error: isOverloaded 
        ? "Máy chủ AI hiện đang chịu tải cao tạm thời. Hệ thống đã thử lại tự động, vui lòng thử lại sau giây lát!" 
        : "Không thể phân tích hình ảnh qua AI", 
      details: error?.message || String(error) 
    });
  }
});

// API Route: Generic Proxy for Google Apps Script POST requests
app.post("/api/proxy-apps-script", async (req, res) => {
  const { url, payload } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const jsonString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const response = await axios.post(url, jsonString, {
      headers: { 'Content-Type': 'text/plain' },
      timeout: 30000,
      validateStatus: () => true // Allow handling all status codes manually
    });

    console.log("GAS Response Status:", response.status);

    if (response.status === 401) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        details: "Lỗi 401: Google Apps Script yêu cầu xác thực hoặc chưa được cấu hình 'Anyone' (Bất kỳ ai) có quyền truy cập. Vui lòng kiểm tra lại phần 'Deploy' trong Google Script." 
      });
    }

    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      const errorMatch = response.data.match(/errorMessage">([^<]+)/) || response.data.match(/SyntaxError: ([^<]+)/);
      const errorDetail = errorMatch ? errorMatch[1] : "Lỗi thực thi Script (kiểm tra lại mã GAS)";
      
      // Log the full HTML for debugging in the server console
      console.error("Full GAS Error HTML:", response.data);
      
      return res.status(500).json({ 
        error: "Google Apps Script Error", 
        details: errorDetail,
        debugHtml: response.data // Gửi kèm HTML để người dùng có thể xem chi tiết lỗi trong Console
      });
    }
    res.send(response.data);
  } catch (error: any) {
    res.status(500).json({ error: "Proxy Connection Error", details: error.message });
  }
});

// API Route: Image Proxy to bypass CORS
app.get("/api/proxy-image", async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send("URL is required");
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000, // 10s timeout
    });

    const contentType = response.headers["content-type"];
    res.setHeader("Content-Type", contentType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 1 day
    res.send(response.data);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).send("Failed to fetch image");
  }
});

// Vite middleware for development
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

// Export the app for Vercel
export default app;

// Start the server
const PORT = 3000;
setupServer().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
