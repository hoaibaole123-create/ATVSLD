import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY trên Vercel. Vui lòng vào Vercel Dashboard -> Settings -> Environment Variables và thêm GEMINI_API_KEY.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function generateWithFallback(ai: GoogleGenAI, generateParams: any) {
  const models = ["gemini-3.1-flash-lite", "gemini-3.7-flash", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of models) {
    try {
      const modelConfig = { ...generateParams.config };
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

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { imageBase64, mimeType = "image/jpeg", formType = "report", pendingDefects = [] } = body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: "Dữ liệu hình ảnh không được để trống" });
    }

    const ai = getGenAI();
    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const isProcessing = formType === 'process';

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
   - observations = Liệt kê chi tiết quan sát
   - descriptions: 3 phương án mô tả rõ lỗi vi phạm và quy định an toàn
   - remedySuggestion = Yêu cầu chấn chỉnh ngay

2. NẾU LỖI 5S / TPM / CƠ KHÍ:
   - hasDefect = true
   - category = "iso-kaizen" (ISO, KAIZEN 5S, TPM)

3. NẾU HIỆN TRƯỜNG VÀ CON NGƯỜI HOÀN TOÀN ĐẠT CHUẨN:
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
          thinkingBudget: 0,
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
            suggestedLocation: { type: Type.STRING, description: "Vị trí lắp đặt chi tiết" },
            severity: { type: Type.STRING, description: "Mức độ rủi ro: Bình thường | Thấp | Trung bình | Cao | Khẩn cấp" },
            observations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Danh sách 2-4 chi tiết quan sát thấy trong ảnh"
            },
            descriptions: {
              type: Type.OBJECT,
              properties: {
                concise: { type: Type.STRING, description: "Gợi ý mô tả súc tích (1 câu)" },
                standard: { type: Type.STRING, description: "Gợi ý mô tả tiêu chuẩn" },
                detailed: { type: Type.STRING, description: "Gợi ý mô tả chi tiết chuyên sâu" }
              },
              required: ["concise", "standard", "detailed"]
            },
            remedySuggestion: { type: Type.STRING, description: "Biện pháp xử lý hoặc khuyến nghị kỹ thuật" },
            processStatus: { type: Type.STRING, description: "Gợi ý cập nhật tình trạng xử lý" },
            processNote: { type: Type.STRING, description: "Gợi ý nội dung ghi chú xử lý" },
            matchedDefect: {
              type: Type.OBJECT,
              properties: {
                sheet: { type: Type.STRING },
                row: { type: Type.INTEGER },
                equipment: { type: Type.STRING },
                location: { type: Type.STRING },
                description: { type: Type.STRING },
                confidence: { type: Type.STRING },
                matchReason: { type: Type.STRING }
              }
            }
          },
          required: ["defectTitle", "category", "equipmentName", "severity", "descriptions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.status(200).json({ success: true, analysis: parsed });
  } catch (err: any) {
    console.error("Vercel AI Analysis error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Lỗi khi xử lý hình ảnh qua AI",
      details: String(err)
    });
  }
}
