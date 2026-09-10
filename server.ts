/**
 * Máy chủ cho môi trường phát triển (npm run dev).
 *
 * Toàn bộ logic API nằm trong thư mục api/ — đó cũng chính là các Serverless
 * Function chạy trên Vercel. Tệp này chỉ dựng Express + Vite middleware rồi
 * gọi thẳng vào các handler đó, nên chạy local và chạy production dùng chung
 * một mã nguồn, không còn cảnh phải sửa prompt ở hai nơi.
 */
import express from "express";
import path from "path";

import analyzeDefectImage from "./api/analyze-defect-image";
import proxyAppsScript from "./api/proxy-apps-script";
import proxyImage from "./api/proxy-image";

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.post("/api/analyze-defect-image", (req, res) => analyzeDefectImage(req, res));
app.post("/api/proxy-apps-script", (req, res) => proxyAppsScript(req, res));
app.get("/api/proxy-image", (req, res) => proxyImage(req, res));

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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
}

export default app;

const PORT = 3000;
setupServer().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
