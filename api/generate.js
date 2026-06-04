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

  console.log('=== MiniMax Image Generation ===');
  console.log('API URL:', apiUrl);
  console.log('Model:', model);
  console.log('Prompt:', prompt);
  console.log('API Key exists:', !!apiKey);

  if (!apiKey) {
    console.error('API key not configured');
    return res.status(500).json({ error: 'API key not configured on server' });
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

    console.log('Response status:', response.status);

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `API error: ${response.status}`,
        details: data 
      });
    }

    // MiniMax M3 可能返回的格式
    let imageUrl = null;
    
    // 尝试多种可能的返回格式
    if (data.data && data.data[0]) {
      imageUrl = data.data[0].url || data.data[0].b64_json || data.data[0].image_url;
    } else if (data.images && data.images[0]) {
      imageUrl = data.images[0].url || data.images[0].b64_json;
    } else if (data.image_url) {
      imageUrl = data.image_url;
    } else if (data.url) {
      imageUrl = data.url;
    } else if (data.output) {
      imageUrl = data.output;
    }

    if (!imageUrl) {
      console.log('No image URL found in response');
      return res.status(200).json({
        success: true,
        raw_response: data,
        error: 'No image in response'
      });
    }

    return res.status(200).json({
      success: true,
      image: imageUrl,
      revised_prompt: data.revised_prompt || null,
    });

  } catch (error) {
    console.error('Generate image error:', error);
    return res.status(500).json({ 
      error: 'Server error: ' + error.message,
      stack: error.stack
    });
  }
};
