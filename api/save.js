import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { title, data } = req.body;

  const result = await sql`
    INSERT INTO blueprints (title, data)
    VALUES (${title}, ${JSON.stringify(data)}::jsonb)
    RETURNING id;
  `;

  res.json({ id: result.rows[0].id });
}
