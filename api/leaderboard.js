export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return res.status(200).json({ entries: [] });
  }

  try {
    const r = await fetch(`${redisUrl}/lrange/leaderboard/0/199`, {
      headers: { Authorization: `Bearer ${redisToken}` }
    });
    const data = await r.json();
    const entries = (data.result || []).map(e => {
      try { return JSON.parse(e); } catch { return null; }
    }).filter(Boolean);

    // Sort by score desc, keep top 20
    const sorted = entries.sort((a, b) => b.score - a.score).slice(0, 20);
    return res.status(200).json({ entries: sorted });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}