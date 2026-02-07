import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  const { id } = req.query;

  const result = await sql`
    SELECT * FROM blueprints
    WHERE id=${id};
  `;

  res.json(result.rows[0]);
}
