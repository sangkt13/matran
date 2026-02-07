import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const id = req.query?.id;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const result = await sql`
      SELECT id, title, data, created_at
      FROM blueprints
      WHERE id = ${id}
      LIMIT 1;
    `;

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({
      error: String(err?.message || err)
    });
  }
}
