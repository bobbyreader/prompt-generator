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

  try {
    // 尝试 Imagen 3 的 generateImage 端点
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateImage?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          numberOfImages: 1,
          aspectRatio: "1:1",
          safetySetting: "block_fewer_nudity",
          personGeneration: "allow_adult"
        }),
      }
    );

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(data).substring(0, 500));

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'API failed', 
        details: data 
      });
    }

    let imageBase64 = null;
    
    // Imagen 3 返回格式
    if (data.generatedImages && data.generatedImages[0]) {
      const img = data.generatedImages[0];
      if (img.image?.b64_json) {
        imageBase64 = `data:image/png;base64,${img.image.b64_json}`;
      } else if (img.encodedData) {
        imageBase64 = `data:image/png;base64,${img.encodedData}`;
      }
    }

    if (!imageBase64) {
      return res.status(200).json({ 
        success: false, 
        error: 'No image in response',
        raw_response: data 
      });
    }

    return res.status(200).json({ success: true, image: imageBase64 });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
};
