const REQUEST_TIMEOUT_MS = 45000;
const MAX_PROMPT_LENGTH = 4000;

/* ==================== Provider 配置 ==================== */
function getImageProvider() {
  return (process.env.AI_IMAGE_PROVIDER || 'agnes').trim().toLowerCase();
}

/* ==================== Gemini Provider ==================== */
function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY;
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || 'gemini-3.1-flash-image-preview';
}

function extractGeminiImageData(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        mimeType: part.inlineData.mimeType || 'image/png',
        data: part.inlineData.data
      };
    }
  }
  return null;
}

/* ==================== Agnes Provider ==================== */
function getAgnesApiKey() {
  return process.env.AGNES_API_KEY;
}

function getAgnesModel() {
  return process.env.AGNES_IMAGE_MODEL || 'agnes-image-2.0-flash';
}

function extractAgnesImageData(data) {
  const item = data?.data?.[0];
  if (!item) return null;

  if (item.b64_json) {
    return {
      mimeType: 'image/png',
      data: item.b64_json
    };
  }

  if (item.url) {
    return {
      url: item.url
    };
  }

  return null;
}

function parseJsonSafe(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function fetchWithRetry(url, options, retries = 2, delay = 1500) {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error('Request timeout')), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      if (response.status === 429 && i < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }

      return response;
    } catch (error) {
      if (i < retries && error.name !== 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new Error('Retry limit exceeded');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({
      error: `Prompt is too long. Keep it under ${MAX_PROMPT_LENGTH} characters.`
    });
  }

  try {
    let imageData;
    let modelUsed;
    const provider = getImageProvider();

    if (provider === 'agnes') {
      // Agnes AI Provider
      const apiKey = getAgnesApiKey();
      if (!apiKey) {
        return res.status(500).json({ error: 'Agnes API key not configured. Set AGNES_API_KEY environment variable.' });
      }

      modelUsed = getAgnesModel();
      const apiUrl = 'https://apihub.agnes-ai.com/v1/images/generations';

      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelUsed,
          prompt,
          size: '1024x1024'
        })
      });

      const responseText = await response.text();
      const data = parseJsonSafe(responseText);

      if (!response.ok) {
        const providerMessage = data?.error?.message || data?.message || responseText.slice(0, 300);
        return res.status(response.status).json({
          error: 'Agnes image generation request failed',
          details: providerMessage || `HTTP ${response.status}`,
          status: response.status
        });
      }

      if (!data) {
        return res.status(502).json({
          error: 'Invalid response from Agnes API',
          details: responseText.slice(0, 300)
        });
      }

      imageData = extractAgnesImageData(data);
      if (!imageData) {
        return res.status(200).json({
          success: false,
          error: 'No image was returned. Try a more visual prompt.',
          details: data?.error || null,
          modelUsed
        });
      }
    } else {
      // Gemini Provider (fallback)
      const apiKey = getGeminiApiKey();
      if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }

      modelUsed = getGeminiModel();
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelUsed}:generateContent?key=${apiKey}`;

      const response = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        })
      });

      const responseText = await response.text();
      const data = parseJsonSafe(responseText);

      if (!response.ok) {
        const providerMessage = data?.error?.message || data?.message || responseText.slice(0, 300);
        return res.status(response.status).json({
          error: 'Image generation request failed',
          details: providerMessage || `HTTP ${response.status}`,
          status: response.status
        });
      }

      if (!data) {
        return res.status(502).json({
          error: 'Invalid response from image provider',
          details: responseText.slice(0, 300)
        });
      }

      imageData = extractGeminiImageData(data);
      if (!imageData) {
        return res.status(200).json({
          success: false,
          error: 'No image was returned. Try a more visual prompt.',
          details: data?.candidates?.[0]?.finishReason || null,
          modelUsed
        });
      }
    }

    return res.status(200).json({
      success: true,
      image: imageData.url || `data:${imageData.mimeType};base64,${imageData.data}`,
      modelUsed
    });
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'Image generation timed out' : 'Server error during image generation',
      details: error.message
    });
  }
};
