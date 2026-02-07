export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const { totalQuestions, problems, CLOs } = req.body || {};
    if (!totalQuestions || !Array.isArray(problems) || !Array.isArray(CLOs)) {
      return res.status(400).json({ ok: false, error: "Missing input: totalQuestions/problems/CLOs" });
    }

    // Schema bắt buộc AI phải trả về (để tránh lỗi JSON)
    const schemaHint = `
Trả về NGHIÊM NGẶT JSON (không kèm giải thích ngoài JSON) theo schema:
{
  "suggestedProblems": [
    {
      "id": number|string,
      "name": string,
      "weight": number,
      "specialties": [
        {
          "name": string,
          "cloId": string,
          "levels": [number, number, number, number]
        }
      ]
    }
  ],
  "notes": [string]
}
- levels = [Nho, Hieu, VanDung, PhanTich], số nguyên >=0
- Duy trì name/weight/id như đầu vào, chỉ điều chỉnh cloId/levels (có thể điều chỉnh specialties nếu cần nhưng ưu tiên giữ).
- Tổng tất cả levels của mọi specialties = totalQuestions.
- Mỗi vấn đề: tổng câu của vấn đề ≈ round(weight% * totalQuestions). Nếu lệch do làm tròn, phân bổ lệch nhỏ nhất.
`;

    const prompt = `
Bạn là chuyên gia thiết kế test blueprint y khoa.
Hãy phân bổ số câu cho từng ô Bloom cho mỗi phân môn trong từng vấn đề lâm sàng.

Ràng buộc:
1) Tổng số câu toàn đề = ${totalQuestions}
2) Mỗi vấn đề có weight %, mục tiêu số câu của vấn đề = round(weight/100 * totalQuestions)
3) Ưu tiên phân bổ theo đặc thù:
   - Cấp cứu/ngoại/kỹ năng xử trí: tăng Vận dụng + Phân tích
   - Nội khoa/kiến thức nền: cân bằng Nhớ + Hiểu với Vận dụng
4) Không tạo số âm, không số thập phân.
5) CLO: chọn cloId phù hợp nhất với tên phân môn/vấn đề, dùng danh sách CLOs.

CLOs:
${JSON.stringify(CLOs)}

Problems hiện tại:
${JSON.stringify(problems)}

${schemaHint}
`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Bạn chỉ được trả về JSON hợp lệ, không thêm chữ ngoài JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || "";

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      return res.status(200).json({ ok: false, error: "AI returned invalid JSON", raw: text });
    }

    // validate sơ bộ
    if (!Array.isArray(json.suggestedProblems)) {
      return res.status(200).json({ ok: false, error: "Missing suggestedProblems", raw: json });
    }

    return res.status(200).json({ ok: true, ...json });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
