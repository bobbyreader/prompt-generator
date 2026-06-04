module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'imagen-3.0-generate-002';

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  console.log('=== Image Generation ===');
  console.log('Model:', modelName);

  try {
    // 尝试 Imagen 的 generateContent 端点（与 Gemini 兼容）
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
      }
    );

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data).substring(0, 500));

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'API failed',
        details: data 
      });
    }

    // 提取图片
    let imageBase64 = null;
    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          imageBase64 = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageBase64) {
      return res.status(200).json({ 
        success: false, 
        error: 'No image in response',
        response: data 
      });
    }

    return res.status(200).json({ success: true, image: imageBase64 });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
};
