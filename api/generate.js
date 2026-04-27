export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, jobTitle, skills, experience, education, tone } = req.body;

  if (!name || !jobTitle || !skills) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server not configured' });

  const prompt = `Create a professional resume for the following person. Format it cleanly with clear sections using markdown.

Name: ${name}
Target Role: ${jobTitle}
Skills: ${skills}
Experience: ${experience || 'Fresh graduate with no work experience yet'}
Education: ${education}
Tone: ${tone || 'Professional'}

Write a complete resume with:
1. Name as a large heading
2. A strong professional summary (3-4 lines)
3. Skills section (formatted as categories)
4. Experience section (or Projects/Activities if fresher)
5. Education section

Make it ATS-friendly, impactful, and tailored to the ${jobTitle} role. Use action verbs. Keep it to 1 page worth of content.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(500).json({ error: err.error?.message || 'AI error' });
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    return res.status(200).json({ resume: text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
