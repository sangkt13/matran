export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    const { totalQuestions, problems, CLOs } = req.body || {};
    if (!totalQuestions || !Array.isArray(problems)) {
      return res.status(400).json({ ok: false, error: "Missing input" });
    }

    const prompt = `
Bạn là chuyên gia xây dựng blueprint đề thi y khoa.
Hãy đề xuất phân bổ câu hỏi theo từng vấn đề lâm sàng / phân môn / Bloom (Nhớ-Hiểu-Vận dụng-Phân tích) và gắn CLO phù hợp.

Ràng buộc:
- Tổng câu = ${totalQuestions}
- Mỗi vấn đề có weight %, tổng weight có thể chưa =100 thì vẫn đề xuất hợp lý.
- Ưu tiên phân bổ Bloom theo hướng: Nhớ/Hiểu 40–60%, Vận dụng/Phân tích 40–60% tùy loại vấn đề (cấp cứu ưu tiên vận dụng).
- Trả về JSON đúng schema.

CLOs: ${JSON.stringify(CLOs)}
Problems: ${JSON.stringify(problems)}

Trả về đúng JSON theo schema:
{
  "suggested": { "problems": [...] },
  "notes": ["..."]
}
`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "Bạn trả lời NGHIÊM NGẶT bằng JSON, không thêm chữ ngoài JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || "";

    let json;
    try { json = JSON.parse(text); }
    catch { return res.status(200).json({ ok: false, error: "AI did not return valid JSON", raw: text }); }

    return res.status(200).json({ ok: true, ...json });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
