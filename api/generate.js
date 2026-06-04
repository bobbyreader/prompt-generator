module.exports = async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  const apiUrl = process.env.MINIMAX_API_URL || 'https://api.minimaxi.chat/v1/image_generation';
  const model = process.env.MINIMAX_MODEL || 'image-01';

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MiniMax API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `API request failed: ${response.status}`,
        details: errorText 
      });
    }

    const data = await response.json();
    console.log('MiniMax API response:', JSON.stringify(data));

    // 返回图片 URL 或 base64
    return res.status(200).json({
      success: true,
      image: data.data?.[0]?.url || data.data?.[0]?.b64_json || null,
      revised_prompt: data.data?.[0]?.revised_prompt || null,
    });

  } catch (error) {
    console.error('Generate image error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message 
    });
  }
};
