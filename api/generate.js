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
  let apiUrl = process.env.MINIMAX_API_URL;
  const model = process.env.MINIMAX_MODEL || 'image-01';

  // 如果没有设置URL，使用默认的 MiniMax M3 API
  if (!apiUrl) {
    apiUrl = 'https://api.minimax.chat/v1/image_generation';
  }

  console.log('=== MiniMax Image Generation ===');
  console.log('API URL:', apiUrl);
  console.log('Model:', model);
  console.log('Prompt length:', prompt.length);
  console.log('API Key exists:', !!apiKey);

  if (!apiKey) {
    console.error('API key not configured');
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2分钟超时

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        num_images: 1,
        width: 1024,
        height: 1024,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

    const data = await response.json();
    console.log('Response data keys:', Object.keys(data));

    if (!response.ok) {
      console.error('API Error Response:', data);
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
    } else if (data.base64_image) {
      imageUrl = 'data:image/png;base64,' + data.base64_image;
    }

    console.log('Extracted image URL:', imageUrl ? 'Found (' + imageUrl.substring(0, 50) + '...)' : 'Not found');

    if (!imageUrl) {
      console.log('Full response:', JSON.stringify(data));
      return res.status(200).json({
        success: true,
        raw_response: data,
        error: 'No image URL found in response'
      });
    }

    return res.status(200).json({
      success: true,
      image: imageUrl,
      revised_prompt: data.revised_prompt || null,
    });

  } catch (error) {
    console.error('Generate image error:', error.name, error.message);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ 
        error: 'Request timeout',
        details: 'API request took too long'
      });
    }
    
    return res.status(500).json({ 
      error: 'Server error: ' + error.message,
      type: error.type || 'unknown'
    });
  }
};
