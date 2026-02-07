import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body || {};
    const title = body.title || "Untitled";
    const data = body.data;

    if (!data) {
      return res.status(400).json({ error: "Missing data" });
    }

    const result = await sql`
      INSERT INTO blueprints (title, data)
      VALUES (${title}, ${JSON.stringify(data)}::jsonb)
      RETURNING id;
    `;

    return res.status(200).json({ id: result.rows[0].id });
  } catch (err) {
    return res.status(500).json({
      error: String(err?.message || err)
    });
  }
}
