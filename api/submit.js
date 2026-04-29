export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, score, total, answers, rating } = req.body || {};
    if (!name || typeof score !== 'number') return res.status(400).json({ error: 'Invalid payload' });

    // Save to Upstash Redis
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      const entry = JSON.stringify({ name, score, rating, date: new Date().toISOString() });
      await fetch(`${redisUrl}/lpush/leaderboard/${encodeURIComponent(entry)}`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      // Keep only latest 200 entries
      await fetch(`${redisUrl}/ltrim/leaderboard/0/199`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
    }

    // Send Telegram report
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId) {
      const lines = [
        '\ud83d\udcdd Reported Speech Quiz Submission',
        '',
        `\ud83d\udc64 Name: ${name}`,
        `\u2705 Score: ${score}/${total}`,
        `\u2b50 Rating: ${rating}`,
        '',
        'Answers:',
        ...answers.map((a, i) => `${i + 1}. ${a.correct ? '\u2705' : '\u274c'} ${a.question}`)
      ];
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: lines.join('\n') })
      });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
}