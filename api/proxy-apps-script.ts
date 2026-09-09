import axios from "axios";

export default async function handler(req: any, res: any) {
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

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { url, payload } = body || {};

  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const jsonString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const response = await axios.post(url, jsonString, {
      headers: { 'Content-Type': 'text/plain' },
      timeout: 30000,
      validateStatus: () => true
    });

    if (response.status === 401) {
      return res.status(401).json({ 
        error: "Unauthorized", 
        details: "Lỗi 401: Google Apps Script yêu cầu xác thực hoặc chưa được cấu hình 'Anyone' có quyền truy cập." 
      });
    }

    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      const errorMatch = response.data.match(/errorMessage">([^<]+)/) || response.data.match(/SyntaxError: ([^<]+)/);
      const errorDetail = errorMatch ? errorMatch[1] : "Lỗi thực thi Script (kiểm tra lại mã GAS)";
      return res.status(500).json({ 
        error: "Google Apps Script Error", 
        details: errorDetail,
        debugHtml: response.data 
      });
    }

    return res.status(200).send(response.data);
  } catch (error: any) {
    return res.status(500).json({ error: "Proxy Connection Error", details: error.message });
  }
}
