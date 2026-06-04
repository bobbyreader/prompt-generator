module.exports = async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-image';

  console.log('=== Gemini Image Generation ===');
  console.log('Model:', modelName);
  console.log('Prompt:', prompt.substring(0, 100));
  console.log('API Key exists:', !!apiKey);

  if (!apiKey) {
    console.error('API key not configured');
    return res.status(500).json({ error: 'Gemini API key not configured. Please set GEMINI_API_KEY in Vercel environment variables.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
          }
        }),
      }
    );

    const data = await response.json();
    console.log('Response status:', response.status);

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'API request failed',
        details: data
      });
    }

    // 从响应中提取图片
    let imageBase64 = null;

    if (data.candidates && data.candidates[0]) {
      const candidate = data.candidates[0];
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType && part.inlineData.data) {
            // 返回 base64 图片
            const mimeType = part.inlineData.mimeType; // 通常是 image/png 或 image/webp
            imageBase64 = `data:${mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
    }

    if (!imageBase64) {
      console.log('No image in response:', JSON.stringify(data).substring(0, 500));
      return res.status(200).json({
        success: false,
        error: 'No image generated. Gemini may have returned text only.',
        suggestion: 'Try a more visual prompt (e.g., "画一只猫" instead of "what is a cat")',
        response: data
      });
    }

    console.log('Image generated successfully, size:', imageBase64.length);

    return res.status(200).json({
      success: true,
      image: imageBase64,
    });

  } catch (error) {
    console.error('Generate image error:', error);
    return res.status(500).json({
      error: 'Server error: ' + error.message,
    });
  }
};
