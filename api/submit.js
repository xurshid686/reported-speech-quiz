export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, score, total, answers, rating } = req.body || {};

    if (!name || typeof score !== 'number' || typeof total !== 'number') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      const lines = [
        '📝 Reported Speech Quiz Submission',
        '',
        `👤 Name: ${name}`,
        `✅ Score: ${score}/${total}`,
        `⭐ Rating: ${rating}`,
        '',
        'Answers:',
        ...answers.map((a, i) => `${i + 1}. ${a.correct ? '✅' : '❌'} ${a.question}`)
      ];

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: lines.join('\n')
        })
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}