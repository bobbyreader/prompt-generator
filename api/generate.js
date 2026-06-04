module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.1-flash-image-preview';

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // 指数退避重试函数
  async function fetchWithRetry(url, options, retries = 3, delay = 3000) {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, options);
        
        if (response.status === 429 && i < retries) {
          console.warn(`触发 429 限流，等待 ${delay}ms 后重试... (${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // 指数退避
          continue;
        }
        
        return response;
      } catch (error) {
        if (i < retries) {
          console.warn(`请求失败，等待 ${delay}ms 后重试... (${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          throw error;
        }
      }
    }
    throw new Error('重试次数耗尽');
  }

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetchWithRetry(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      }),
    }, 3, 3000);

    const responseText = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'API failed: ' + response.status,
        response: responseText.substring(0, 500)
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid JSON', response: responseText.substring(0, 300) });
    }

    let imageBase64 = null;
    if (data.candidates?.[0]?.content?.parts) {
      for (const part of data.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          imageBase64 = `data:${mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageBase64) {
      return res.status(200).json({ 
        success: false, 
        error: 'No image generated. Try a more visual prompt.',
        model_used: modelName
      });
    }

    return res.status(200).json({ success: true, image: imageBase64 });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
};
