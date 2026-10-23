/* ==================== 增强版风格增强词库 ==================== */
// 基于 GPT Image 2 最佳实践：清晰描述 > 关键词堆砌
export const styleEnhancers = {
    auto: {
        // 自动模式：摄影优先
        common: 'shot on professional camera, natural lighting, sharp focus, high detail',
        modifiers: ['cinematic composition', 'emotional atmosphere', 'narrative depth']
    },
    photography: {
        // 摄影风格：专业相机参数 + 光线描述
        common: 'shot on Canon EOS R5, 85mm f/1.4 lens, natural available light, sharp focus, professional color grading',
        modifiers: [
            'soft window light, golden hour', 'dramatic Rembrandt lighting', ' diffused overcast light',
            'high-key studio lighting', 'low-key dramatic shadows', 'golden rim light',
            'moody atmospheric fog', 'sharp volumetric sunbeams', 'soft fill light'
        ]
    },
    illustration: {
        // 插画风格：数字艺术专业描述
        common: 'digital painting, detailed illustration, artstation trending, vibrant colors, professional art quality',
        modifiers: [
            'watercolor texture', 'oil painting brushstrokes', 'concept art style',
            'flat design vector', 'character design sheet', 'matte painting technique'
        ]
    },
    anime: {
        // 动漫风格：日漫美学
        common: 'anime style, cel shaded, Studio Ghibli inspired, detailed anime art, vibrant colors',
        modifiers: [
            'soft diffused lighting', 'detailed background art', 'anime key visual composition',
            'mahou shoujo aesthetic', 'shonen action style', 'slice of life warmth',
            'dramatic mecha detail', 'fantasy RPG character art'
        ]
    },
    concept: {
        // 概念艺术：电影感 + 叙事性
        common: 'concept art, artstation trending, professional concept art quality, cinematic composition',
        modifiers: [
            'fantasy environment design', 'sci-fi vehicle design', 'character design sheet',
            'matte painting style', 'blueprint technical drawing', 'epic fantasy illustration'
        ]
    },
    '3d': {
        // 3D渲染：虚幻引擎 + 物理正确
        common: '3D render, Unreal Engine 5, octane render, studio lighting, hyper-realistic materials',
        modifiers: [
            'ray tracing enabled', 'global illumination', 'photorealistic subsurface scattering',
            'cinematic depth of field', 'HDRI environment lighting', 'architectural visualization'
        ]
    }
};

/* ==================== 专业光线词库 ==================== */
export const lightingDescriptions = {
    quality: [
        'natural daylight', 'golden hour light', 'blue hour ambient', 'soft diffused light',
        'hard direct sunlight', 'overcast diffused', 'dramatic side light', 'backlit silhouette'
    ],
    direction: [
        'from above', 'from below', 'side lighting', 'backlight rim', 'front fill',
        'three-point lighting', 'practical lighting', 'motivated lighting'
    ],
    mood: [
        'warm inviting', 'cool mysterious', 'harsh contrast', 'soft romantic',
        'moody dramatic', 'ethereal dreamlike', 'gritty realism', 'high key bright'
    ]
};

/* ==================== 专业构图词库 ==================== */
export const compositionDescriptions = {
    camera: [
        'shot on Sony A7R IV', 'shot on Canon 5D Mark IV', 'shot on Leica M10',
        'shot on Hasselblad X2D', 'shot on RED camera', 'shot on ARRI Alexa'
    ],
    lens: [
        '85mm portrait lens', '35mm wide angle', '50mm standard lens', '135mm telephoto',
        '24mm ultra wide', 'macro lens', 'tilt-shift lens', 'fisheye lens'
    ],
    angle: [
        'eye-level shot', 'low angle looking up', 'high angle looking down', 'bird-eye view',
        'dutch angle tilted', 'worm-eye view', 'over-the-shoulder', 'dolly zoom effect'
    ],
    framing: [
        'close-up portrait', 'medium shot', 'full body framing', 'extreme close-up',
        'wide establishing shot', 'cowboy shot', 'two-shot composition', 'rule of thirds'
    ],
    depth: [
        'shallow depth of field', 'deep focus throughout', 'selective focus on subject',
        'bokeh background blur', 'tilt-shift miniature effect', 'rack focus transition'
    ]
};

/* ==================== 氛围情绪词库 ==================== */
export const atmosphereDescriptions = [
    'misty morning fog', 'rain-soaked atmosphere', 'dust particles in sunlight',
    'volumetric light rays', 'lens flare glow', 'golden dust motes',
    'dramatic storm clouds', 'peaceful stillness', 'tense anticipation',
    'nostalgic warmth', 'cold isolation', 'joyful energy', 'melancholic solitude'
];

/* ==================== 电影级构图描述 ==================== */
export const cinematicDescriptions = [
    'cinematic widescreen composition', 'anamorphic lens letterbox',
    'Roger Deakins inspired cinematography', 'Wes Anderson color palette',
    'Blade Runner neon atmosphere', 'Christopher Nolan dramatic tension',
    'Studio Ghibli warmth and wonder', 'Terrence Malick contemplative beauty'
];

/* ==================== 提示词生成模板（增强版） ==================== */
// 使用结构化公式：[主体] doing [动作] in [场景]. [构图]. [光线]. [风格]. [画质]
export const promptTemplates = {
    portrait: [
        'Editorial portrait of {subject} with {expression}, {clothing}, {pose}, {lighting} lighting, {background} background, {camera}, {lens}, {mood} mood, sharp focus on eyes, professional color grading',
        'Cinematic portrait of {subject}, {expression}, wearing {clothing}, {atmosphere} atmosphere, {angle} camera angle, {lighting} light, {depth} depth of field, film grain, {mood} mood',
        'Fine art portrait, {subject}, {expression}, natural {lighting}, {background}, soft {mood} atmosphere, shot on {camera} with {lens}, {composition} composition, high detail skin texture'
    ],
    landscape: [
        'Epic {subject} landscape at {time}, {lighting} sunlight, {atmosphere} atmosphere, {details} foreground details, {camera}, {lens}, {mood} mood, {composition} composition, National Geographic quality',
        'Breathtaking {subject} vista, {time} golden light, {atmosphere} misty air, volumetric clouds, {camera}, wide angle {lens}, {mood} dramatic mood, {depth} depth of field, ultra detailed textures',
        'Cinematic nature shot, {subject}, {time} blue hour, {lighting} soft ambient light, {atmosphere} atmospheric fog, {camera}, {lens}, {composition} framing, epic scale, ultra wide angle'
    ],
    anime: [
        'Beautiful anime illustration of {subject}, {expression}, {clothing}, {setting} background, {lighting} lighting, Studio Ghibli inspired, soft cel shaded, detailed background art, {mood} atmosphere, vibrant colors',
        'Anime character art of {subject}, {pose}, {clothing}, {setting} environment, {lighting} light effect, {atmosphere} anime atmosphere, detailed face, {mood} mood, high detail anime illustration, cel shading',
        'Anime key visual, {subject} in {setting}, {expression}, {action}, {lighting} lighting, dramatic {atmosphere} background, {style} anime aesthetic, detailed hair and eyes, cinematic composition'
    ],
    cyberpunk: [
        'Cyberpunk scene, {subject} in {setting}, neon lights, {lighting} lighting, rain-soaked streets, holographic advertisements, {camera} shot, {atmosphere} atmosphere, blade runner aesthetic, cinematic mood',
        'Futuristic cyberpunk cityscape, {subject}, neon signs in {lighting} colors, wet reflective streets, flying vehicles, {atmosphere} fog, {camera}, wide angle {lens}, {mood} dystopian mood',
        'Dystopian cyberpunk portrait, {subject}, {expression}, {clothing}, {setting} background, {lighting} neon lights, {atmosphere} volumetric fog, {camera} shot, {mood} mood, ultra detailed, cinematic composition'
    ],
    fantasy: [
        'Fantasy {subject} in {setting}, magical atmosphere, {lighting} ethereal light, {atmosphere} mystical fog, {camera}, {lens}, {mood} epic mood, Lord of the Rings inspired, cinematic composition',
        'Epic fantasy scene, {subject}, {action}, {setting}, dramatic {lighting} lighting, {atmosphere} magical particles, {camera}, {lens}, {mood} dramatic atmosphere, ultra detailed, hyper-realistic textures',
        'Mythical {subject} emerging from {setting}, {lighting} magical glow, {atmosphere} enchanted atmosphere, {camera} wide shot, {lens} perspective, {mood} ethereal mood, fantasy art, 8k resolution'
    ],
    product: [
        'Professional {subject} product photography, {background} minimalist background, {lighting} lighting setup, {camera}, {lens}, sharp focus, commercial quality, ultra detailed textures, clean composition',
        'Commercial product shot of {subject}, {background} studio setup, {lighting} professional light, {camera}, soft shadow, product catalog quality, clean {composition} composition, 8k commercial photography',
        'E-commerce hero image, {subject} floating in {background}, {lighting} lighting, {camera}, {lens}, soft drop shadow, commercial photography quality, clean minimalist style, ultra sharp'
    ],
    poster: [
        'High-end {subject} poster design, {layout} composition, {colors} color palette, {style} aesthetic, {camera} cinematography, {mood} dramatic mood, bold typography, museum-quality graphic design, cinematic',
        'Editorial {subject} poster, {layout} layout, {lighting} lighting, {style} visual style, {mood} atmosphere, bold graphic elements, professional design, cinematic composition, print quality',
        'Concept {subject} poster, {layout} dynamic composition, {colors} vibrant palette, {style} aesthetic, {camera} shot, {atmosphere} dramatic atmosphere, premium paper texture, graphic design quality'
    ],
    concept: [
        'Professional concept art of {subject}, {style} aesthetic, {lighting} lighting design, {atmosphere} environment atmosphere, {camera} perspective, {lens} lens choice, artstation trending, professional concept art quality',
        'Concept design for {subject}, {style} visual style, {lighting} atmospheric lighting, {atmosphere} setting atmosphere, {camera} cinematic view, {lens} wide angle, matte painting style, highly detailed',
        'Futuristic concept art, {subject}, {style} design language, {lighting} dramatic lighting, {atmosphere} futuristic atmosphere, {camera} establishing shot, {composition} composition, digital art, 8k detail'
    ]
};

/* ==================== 生成变量池（增强版） ==================== */
export const variables = {
    subject: {
        common: ['a person', 'a character', 'a figure', 'a subject'],
        portrait: ['young woman', 'elegant lady', 'handsome man', 'elderly person', 'warrior', 'queen', 'child', 'artist'],
        landscape: ['mountain range', 'ancient forest', 'coastal cliff', 'floating islands', 'underwater world', 'crystal cave'],
        anime: ['anime girl', 'samurai', 'magical girl', 'demon slayer', 'mecha pilot', 'vampire', 'witch', 'knight'],
        cyberpunk: ['cybernetic warrior', 'hacker', 'AI entity', 'street vendor', 'corporate agent', 'cyborg detective'],
        fantasy: ['phoenix', 'mermaid', 'dragon', 'sorcerer', 'fairy', 'unicorn', 'elf archer', 'dark lord']
    },
    lighting: [
        'soft natural', 'golden hour', 'blue hour', 'dramatic Rembrandt', ' diffused soft',
        'harsh direct', 'moody low-key', 'bright high-key', 'warm amber', 'cool blue',
        'neon pink', 'neon cyan', 'practical lamp', 'candlelight'
    ],
    background: [
        'studio white', 'outdoor natural', 'urban street', 'abstract gradient', 'bokeh blur',
        'gradient sunset', 'solid color', 'textured wall', 'architectural', 'forest setting'
    ],
    camera: [
        'Canon EOS R5', 'Sony A7R IV', 'Leica M10', 'Hasselblad X2D', 'RED Komodo',
        'ARRI Alexa', 'Canon 5D Mark IV', 'Nikon Z9'
    ],
    lens: [
        '85mm f/1.4', '50mm f/1.2', '35mm f/1.4', '24mm f/1.8', '135mm f/2.0',
        '70-200mm f/2.8', '100mm macro', '15mm fisheye'
    ],
    mood: [
        'dramatic', 'peaceful', 'mysterious', 'energetic', 'melancholic', 'ethereal',
        'powerful', 'serene', 'tense', 'nostalgic', 'raw', 'intimate'
    ],
    clothing: [
        'elegant dress', 'casual outfit', 'formal suit', 'vintage clothing', 'futuristic armor',
        'traditional garment', 'streetwear', 'military uniform', 'fantasy robes'
    ],
    pose: [
        'confident stance', 'dynamic action', 'contemplative pose', 'walking motion',
        'turning mid-movement', 'seated relaxed', 'standing tall', 'leaning against wall'
    ],
    expression: [
        'determined gaze', 'serene smile', 'mysterious half-smile', 'intense stare',
        'joyful laughter', 'melancholic thought', 'fierce battle ready', 'peaceful rest'
    ],
    setting: [
        'mystical forest', 'ancient ruins', 'floating islands', 'underwater palace',
        'futuristic city', 'desert oasis', 'snow mountain', 'volcanic terrain'
    ],
    time: [
        'golden hour', 'sunset', 'dawn', 'midnight', 'blue hour', 'stormy afternoon',
        'clear midday', 'overcast day', 'starry night', 'twilight'
    ],
    atmosphere: [
        'misty', 'foggy', 'clear', 'dramatic clouds', 'rainy', 'snowy',
        'dusty', 'humid', 'crisp', 'hazy'
    ],
    details: [
        'intricate patterns', 'rich textures', 'elaborate decorations', 'subtle details',
        'ornate design', 'weathered surfaces', 'pristine finish', 'worn authenticity'
    ],
    action: [
        'battling', 'exploring', 'meditating', 'celebrating', 'transforming',
        'running', 'leaping', 'standing guard', 'casting spell'
    ],
    layout: [
        'centered', 'asymmetric', 'diagonal', 'grid-based', 'minimalist',
        'full bleed', 'split composition', 'rule of thirds'
    ],
    typography: [
        'bold sans-serif', 'elegant serif', 'modern geometric', 'handwritten style',
        'vintage letterpress', 'futuristic type', 'classic roman'
    ],
    colors: [
        'vibrant saturated', 'muted earth tones', 'monochromatic', 'complementary contrast',
        'analogous harmony', 'pastel soft', 'high contrast', 'desaturated film look'
    ],
    style: [
        'modern', 'vintage', 'minimalist', 'maximalist', 'futuristic', 'retro',
        'brutalist', 'organic', 'geometric', 'ethereal'
    ],
    composition: [
        'rule of thirds', 'golden ratio', 'centered symmetrical', 'diagonal leading lines',
        'frame within frame', 'negative space', 'symmetrical balance', 'dynamic asymmetry'
    ],
    depth: [
        'shallow DoF', 'deep focus', 'selective focus', 'bokeh blur', 'tilt-shift effect'
    ],
    angle: [
        'eye level', 'low angle', 'high angle', 'birds eye view', 'worms eye view',
        'dutch tilt', 'over shoulder', 'dolly in'
    ]
};

/* ==================== 优化增强列表（精简版） ==================== */
// 移除无效的关键词堆砌，只保留真正有用的描述
export const enhancements = [
    'ultra sharp focus',
    'professional color grading',
    'high dynamic range',
    'realistic textures',
    'emotional atmosphere',
    'cinematic composition',
    'natural film grain',
    'award winning quality'
];

/* ==================== 图片生成规格 ==================== */
export const imageSizePresets = [
    {
        value: '1024x1024',
        label: '1:1 方图',
        description: '适合头像、商品主图和社媒配图'
    },
    {
        value: '1536x1024',
        label: '3:2 横图',
        description: '适合横版海报、封面和场景图'
    },
    {
        value: '1024x1536',
        label: '2:3 竖图',
        description: '适合手机壁纸、人物海报和封面图'
    },
    {
        value: '1536x864',
        label: '16:9 横屏',
        description: '适合演示封面、视频头图和横幅'
    },
    {
        value: '864x1536',
        label: '9:16 竖屏',
        description: '适合小红书、短视频和手机长图'
    }
];

export const DEFAULT_IMAGE_SIZE = imageSizePresets[0].value;
