/* ==================== 风格增强词库 ==================== */
export const styleEnhancers = {
    auto: {
        common: 'highly detailed, professional quality, 8k resolution',
        modifiers: ['cinematic composition', 'dramatic lighting', 'emotional atmosphere']
    },
    photography: {
        common: 'shot on Sony A7R IV, 85mm lens, f/1.4 aperture, professional photography, sharp focus, shallow depth of field',
        modifiers: ['natural lighting', 'golden hour', 'studio lighting', 'Kodak Portra 400', 'Leica M10', 'film grain']
    },
    illustration: {
        common: 'digital painting, detailed illustration, artstation trending, vibrant colors',
        modifiers: ['watercolor style', 'oil painting style', 'concept art', 'flat design', 'vector art']
    },
    anime: {
        common: 'anime style, cel shaded, Studio Ghibli inspired, detailed anime art, vibrant colors',
        modifiers: ['soft lighting', 'detailed background', 'anime key visual', 'mahou shoujo', 'shonen']
    },
    concept: {
        common: 'concept art, design sheet, artstation trending, professional concept art quality',
        modifiers: ['fantasy environment', 'sci-fi design', 'character design', 'matte painting', 'blueprint style']
    },
    '3d': {
        common: '3D render, octane render, unreal engine 5, studio lighting, hyper-realistic',
        modifiers: ['ray tracing', 'global illumination', '8k render', 'cinematic composition', 'Cinema 4D']
    }
};

/* ==================== 提示词生成模板 ==================== */
export const promptTemplates = {
    portrait: [
        'Professional portrait photography of {subject}, {lighting}, {background}, shot on {camera}, {lens}, {mood}, 8k, ultra detailed, professional quality',
        'Editorial portrait of {subject}, {clothing}, {pose}, {lighting} lighting, magazine cover quality, Vogue aesthetic, {camera}, {details}',
        'Cinematic portrait, {subject}, {expression}, {lighting} lighting, {background}, dramatic atmosphere, film grain, {camera}, {mood}'
    ],
    landscape: [
        'Epic {subject} landscape at {time}, {lighting} sunlight, {atmosphere}, {details}, ultra detailed textures, National Geographic quality, 8k resolution, cinematic color grading',
        'Breathtaking {subject} scenery, {time} golden hour, {lighting} lighting, {atmosphere} atmosphere, {details}, nature photography, 8k, highly detailed',
        'Panoramic {subject} view, {time}, volumetric clouds, {lighting}, {atmosphere}, {details}, ultra wide angle, 8k, dramatic sky'
    ],
    anime: [
        'Beautiful anime illustration of {subject}, {expression}, {setting}, Studio Ghibli inspired, soft lighting, detailed background art, cel shaded, vibrant colors, {mood}',
        'Anime {subject} character design, {pose}, {clothing}, {setting}, {lighting} lighting, anime key visual, detailed face, {mood}, vibrant anime aesthetic',
        '{style} anime art of {subject}, {expression}, {setting}, dramatic {lighting} lighting, {background}, {mood}, high detail anime illustration'
    ],
    cyberpunk: [
        'Cyberpunk {subject}, {setting}, neon lights, {lighting} lighting, rain-soaked streets, holographic advertisements, futuristic technology, blade runner aesthetic, 8k',
        'Futuristic {subject} in cyberpunk city, neon signs, {lighting} atmosphere, wet streets reflecting lights, flying vehicles, {details}, cinematic composition, 8k',
        'Dystopian cyberpunk scene, {subject}, {setting}, {lighting} neon lights, {details}, volumetric fog, oppressive atmosphere, cinematic, 8k ultra detailed'
    ],
    fantasy: [
        'Fantasy {subject} in enchanted {setting}, magical atmosphere, {lighting} lighting, {details}, ethereal glow, {mood}, epic fantasy art, 8k, highly detailed',
        'Epic fantasy scene, {subject}, {action}, {setting}, dramatic {lighting} lighting, {atmosphere}, {details}, Lord of the Rings inspired, cinematic composition, 8k',
        'Mythical {subject} emerging from {setting}, {lighting} glow, magical {details}, {atmosphere} atmosphere, {mood}, fantasy art, 8k, ultra detailed'
    ],
    product: [
        'Professional {subject} product photography, minimalist {background}, {lighting} lighting, {details}, commercial quality, sharp focus, 8k, hyper-realistic textures',
        'Commercial product shot of {subject}, {background} studio setup, {lighting} light, {details}, product catalog quality, clean composition, 8k',
        'E-commerce hero image of {subject}, floating in {background}, {lighting} lighting, soft shadow, commercial photography quality, 8k, clean usable'
    ],
    poster: [
        'High-end {subject} poster design, {layout} composition, {typography} typography, {colors} color palette, {style} aesthetic, dramatic scale, {mood}, professional graphic design',
        'Editorial {subject} poster, {layout} layout, {lighting} lighting, {style} style, {mood} atmosphere, bold typography, museum-quality graphic design, cinematic',
        'Concept {subject} typography poster, {layout} composition, {colors} palette, {style} aesthetic, dramatic {mood}, premium paper texture, graphic design quality'
    ],
    concept: [
        'Professional concept art of {subject}, {style} style, {lighting} lighting, {atmosphere} atmosphere, {details}, artstation trending, professional concept art quality, 8k',
        'Concept design for {subject}, {style} aesthetic, {lighting} lighting, {atmosphere} environment, {details}, matte painting style, 8k, highly detailed',
        'Futuristic concept art, {subject}, {style} design, {lighting} atmosphere, {atmosphere} setting, {details}, digital art, 8k, concept art quality'
    ]
};

/* ==================== 生成变量池 ==================== */
export const variables = {
    subject: {
        common: ['a beautiful woman', 'a warrior', 'a wizard', 'a knight', 'an elf', 'a dragon'],
        portrait: ['young woman', 'elegant lady', 'handsome man', 'elderly person', 'warrior', 'queen'],
        landscape: ['mountain range', 'ancient forest', 'coastal cliff', 'floating islands', 'underwater world', 'crystal cave'],
        anime: ['anime girl', 'samurai', 'magical girl', 'demon slayer', 'mecha pilot', 'vampire'],
        cyberpunk: ['cybernetic warrior', 'hacker', 'AI entity', 'street vendor', 'corporate agent'],
        fantasy: ['phoenix', 'mermaid', 'dragon', 'sorcerer', 'fairy', 'unicorn']
    },
    lighting: ['soft', 'dramatic', 'golden hour', 'cinematic', 'neon', 'backlit', 'rim', 'volumetric', 'natural', 'studio'],
    background: ['studio', 'outdoor', 'abstract', 'bokeh', 'gradient', 'natural environment', 'urban'],
    camera: ['Canon 5D Mark IV', 'Sony A7R IV', 'Leica M10', 'Hasselblad', 'RED camera'],
    lens: ['85mm f/1.4', '50mm f/1.2', '35mm f/1.4', '70-200mm zoom'],
    mood: ['dramatic', 'peaceful', 'mysterious', 'energetic', 'melancholic', 'ethereal', 'powerful'],
    clothing: ['elegant dress', 'armor', 'casual outfit', 'traditional clothing', 'futuristic suit'],
    pose: ['dynamic action', 'confident stance', 'meditative', 'walking', 'turning around'],
    expression: ['determined', 'serene', 'mysterious', 'happy', 'intense', 'melancholic'],
    setting: ['mystical forest', 'ancient ruins', 'floating islands', 'underwater palace', 'futuristic city'],
    time: ['golden hour', 'sunset', 'dawn', 'midnight', 'blue hour', 'stormy day'],
    atmosphere: ['misty', 'foggy', 'clear', 'dramatic clouds', 'serene', 'mysterious'],
    details: ['intricate patterns', 'rich textures', 'elaborate decorations', 'subtle details', 'ornate design'],
    action: ['battling', 'exploring', 'meditating', 'celebrating', 'transforming'],
    layout: ['centered', 'asymmetric', 'diagonal', 'grid-based', 'minimalist'],
    typography: ['bold sans-serif', 'elegant serif', 'modern geometric', 'handwritten style'],
    colors: ['vibrant', 'muted', 'monochromatic', 'complementary', 'analogous', 'pastel'],
    style: ['modern', 'vintage', 'minimalist', 'maximalist', 'futuristic', 'retro']
};

/* ==================== 优化增强列表 ==================== */
export const enhancements = [
    'trending on artstation',
    'intricate details',
    'professional color grading',
    'sharp focus',
    'high dynamic range',
    'realistic textures',
    'emotional atmosphere',
    'award-winning composition'
];
