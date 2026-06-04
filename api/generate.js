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
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateImages?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        numberOfImages: 1,
        aspectRatio: "1:1",
        outputMimeType: "image/png"
      }),
    });

    const responseText = await response.text();
    console.log('Status:', response.status, 'Length:', responseText.length);

    if (!response.ok) {
      return res.status(response.status).json({ error: 'API failed', response: responseText.substring(0, 300) });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return res.status(500).json({ error: 'Invalid JSON', response_preview: responseText.substring(0, 300) });
    }

    let imageBase64 = null;
    if (data.generatedImages && data.generatedImages[0]) {
      const img = data.generatedImages[0];
      if (img.image?.b64_json) {
        imageBase64 = `data:image/png;base64,${img.image.b64_json}`;
      } else if (img.encodedData) {
        imageBase64 = `data:image/png;base64,${img.encodedData}`;
      }
    }

    if (!imageBase64) {
      return res.status(200).json({ success: false, error: 'No image', response_keys: Object.keys(data) });
    }

    return res.status(200).json({ success: true, image: imageBase64 });

  } catch (error) {
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
};
