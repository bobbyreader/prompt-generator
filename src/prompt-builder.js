const STYLE_LABELS = {
    auto: 'cinematic photography',
    photography: 'cinematic photography',
    illustration: 'editorial digital illustration',
    anime: 'anime key visual illustration',
    concept: 'high-end concept art',
    '3d': 'premium 3D render'
};

export const IMAGE_SIZE_RECOMMENDATIONS = {
    '1024x1024': {
        platform: '方图通用',
        composition: 'centered composition, stable focal point, balanced negative space on all sides',
        constraints: 'preserve a square-safe composition that remains legible in feed thumbnails',
        avoid: 'no edge-cropped subject, no important elements pushed into corners'
    },
    '1536x1024': {
        platform: '横版封面',
        composition: 'horizontal hero framing, left-right visual flow, keep breathing room near the edges',
        constraints: 'preserve a wide composition with strong foreground-background separation',
        avoid: 'no cramped center crop, no tiny subject lost in a wide frame'
    },
    '1024x1536': {
        platform: '竖版海报',
        composition: 'vertical poster framing, strong top-to-bottom rhythm, clear subject stack',
        constraints: 'preserve strong vertical silhouette and leave controlled breathing room above or below',
        avoid: 'no awkward head crop, no empty dead zone in the lower frame'
    },
    '1536x864': {
        platform: '视频横封',
        composition: 'cinematic widescreen layout, strong horizontal staging, safe title space',
        constraints: 'preserve widescreen readability and a banner-friendly focal structure',
        avoid: 'no narrow portrait crop, no crowded center mass'
    },
    '864x1536': {
        platform: '竖屏社媒',
        composition: 'mobile-first vertical composition, clear upper-third hook, layered depth down the frame',
        constraints: 'preserve thumb-stopping readability on mobile and keep the subject dominant in vertical view',
        avoid: 'no tiny subject, no important details hidden near the bottom edge'
    }
};

const STYLE_DETAIL_MAP = {
    auto: 'clear focal hierarchy, natural textures, polished but believable finish',
    photography: 'realistic skin and material texture, believable lighting falloff, refined color grading',
    illustration: 'clean shapes, controlled brushwork, readable silhouette, cohesive palette',
    anime: 'expressive eyes, clean cel shading, appealing character design, polished background art',
    concept: 'strong worldbuilding cues, production design detail, cinematic environment storytelling',
    '3d': 'physically plausible materials, controlled reflections, studio-grade rendering finish'
};

const PURPOSE_HINTS = [
    { keywords: ['海报', 'poster'], value: 'hero poster artwork' },
    { keywords: ['封面', 'cover'], value: 'cover image' },
    { keywords: ['壁纸', 'wallpaper'], value: 'wallpaper' },
    { keywords: ['小红书', 'instagram', '社媒', '社交', 'feed'], value: 'social media visual' },
    { keywords: ['产品', '商品', '电商'], value: 'commercial product image' },
    { keywords: ['头像', 'profile'], value: 'profile image' }
];

const PURPOSE_STRATEGIES = {
    'hero poster artwork': {
        composition: 'bold focal hierarchy, dramatic framing, clear headline-safe negative space',
        constraints: 'preserve a poster-ready silhouette and keep strong visual impact',
        avoid: 'no cluttered small props, no weak center of interest, no accidental text'
    },
    'cover image': {
        composition: 'clear focal point, balanced crop, negative space for title treatment',
        constraints: 'preserve readability at small sizes and keep the subject instantly recognizable',
        avoid: 'no busy edge details, no awkward crop, no low-contrast focal area'
    },
    'social media visual': {
        composition: 'thumb-stopping focal point, clean framing, safe space for overlay text if needed',
        constraints: 'preserve mobile-first readability and keep the visual instantly legible',
        avoid: 'no muddy color palette, no tiny distracting objects, no messy background'
    },
    'commercial product image': {
        composition: 'centered hero shot, premium spacing, clean alignment, strong product readability',
        constraints: 'preserve accurate product form, premium finish, and uncluttered composition',
        avoid: 'no warped geometry, no unnecessary props, no dirty reflections'
    },
    'profile image': {
        composition: 'tight portrait crop, clear face visibility, balanced headroom',
        constraints: 'preserve facial clarity and a strong single-subject portrait read',
        avoid: 'no busy background, no obstructed face, no extra characters'
    },
    wallpaper: {
        composition: 'immersive wide composition, strong depth layers, elegant breathing room',
        constraints: 'preserve visual depth and avoid crowding the frame center',
        avoid: 'no cramped composition, no flat depth, no intrusive text elements'
    },
    'high-quality image generation reference': {
        composition: 'clear focal point, intentional framing, balanced negative space',
        constraints: 'keep the scene visually coherent and avoid unrelated extra subjects',
        avoid: 'no logo, no watermark, no accidental extra text'
    }
};

const SCENE_HINTS = [
    { keywords: ['森林', 'forest'], value: 'in a layered forest clearing' },
    { keywords: ['海边', 'beach', '海岸'], value: 'by the sea with an open horizon' },
    { keywords: ['城市', '街头', 'street'], value: 'in an urban street setting' },
    { keywords: ['房间', '室内', 'indoor'], value: 'in a carefully styled interior' },
    { keywords: ['宇宙', '太空', 'space'], value: 'in a vast cosmic setting' },
    { keywords: ['山', 'mountain'], value: 'in a dramatic mountain landscape' }
];

const LIGHTING_HINTS = [
    { keywords: ['日落', '黄昏', 'sunset'], value: 'golden hour backlight with warm edge highlights' },
    { keywords: ['清晨', '早晨', 'dawn'], value: 'soft morning light with crisp atmosphere' },
    { keywords: ['夜晚', '夜景', 'night'], value: 'moody low-key lighting with selective highlights' },
    { keywords: ['霓虹', 'neon'], value: 'colored practical lighting with neon reflections' },
    { keywords: ['柔和', 'soft'], value: 'soft diffused light with gentle contrast' }
];

const MOOD_HINTS = [
    { keywords: ['温暖', '治愈', 'warm'], value: 'warm, intimate, reassuring' },
    { keywords: ['神秘', 'mysterious'], value: 'mysterious, quiet, suspenseful' },
    { keywords: ['震撼', '史诗', 'epic'], value: 'epic, awe-inspiring, cinematic' },
    { keywords: ['梦幻', 'dream'], value: 'dreamlike, airy, poetic' },
    { keywords: ['可爱', 'cute'], value: 'playful, charming, friendly' }
];

function matchHint(input, hintList, fallback) {
    const normalized = input.toLowerCase();
    const match = hintList.find(item => item.keywords.some(keyword => normalized.includes(keyword)));
    return match ? match.value : fallback;
}

function inferPurpose(input) {
    return matchHint(input, PURPOSE_HINTS, 'high-quality image generation reference');
}

function getPurposeStrategy(purpose) {
    return PURPOSE_STRATEGIES[purpose] || PURPOSE_STRATEGIES['high-quality image generation reference'];
}

function inferNegativeConstraints(input, selectedStyle, purpose) {
    const normalized = input.toLowerCase();
    const avoid = new Set();

    avoid.add('logo');
    avoid.add('watermark');

    if (purpose.includes('cover') || purpose.includes('poster') || purpose.includes('social media')) {
        avoid.add('text overlay');
        avoid.add('messy background');
    }

    if (purpose.includes('product')) {
        avoid.add('warped packaging');
        avoid.add('extra props');
        avoid.add('human hands');
    }

    if (normalized.includes('产品') || normalized.includes('商品') || normalized.includes('skincare') || normalized.includes('serum')) {
        avoid.add('warped packaging');
        avoid.add('incorrect label details');
        avoid.add('unnecessary props');
    }

    if (selectedStyle === 'photography') {
        avoid.add('anatomy errors');
        avoid.add('plastic-looking texture');
    }

    if (selectedStyle === 'anime') {
        avoid.add('over-rendered realistic skin');
    }

    if (selectedStyle === '3d') {
        avoid.add('low-detail materials');
        avoid.add('broken reflections');
    }

    if (normalized.includes('人像') || normalized.includes('portrait') || normalized.includes('女孩') || normalized.includes('男孩')) {
        avoid.add('extra fingers');
        avoid.add('deformed hands');
        avoid.add('asymmetrical eyes');
    }

    if (normalized.includes('动物') || normalized.includes('fox') || normalized.includes('猫') || normalized.includes('狗')) {
        avoid.add('unnatural anatomy');
        avoid.add('human-like hands');
    }

    return Array.from(avoid).join(', ');
}

function getImageSizeRecommendation(imageSize = '1024x1024') {
    return IMAGE_SIZE_RECOMMENDATIONS[imageSize] || IMAGE_SIZE_RECOMMENDATIONS['1024x1024'];
}

function inferScene(input) {
    return matchHint(input, SCENE_HINTS, 'in a visually coherent setting that supports the subject');
}

function inferLighting(input, style) {
    const fallback = style === '3d'
        ? 'controlled key light with soft fill and polished reflections'
        : 'soft directional lighting with natural contrast';
    return matchHint(input, LIGHTING_HINTS, fallback);
}

function inferMood(input) {
    return matchHint(input, MOOD_HINTS, 'cinematic, focused, emotionally clear');
}

function inferComposition(style) {
    if (style === 'product') {
        return 'centered hero shot, clean negative space, precise alignment';
    }

    if (style === '3d') {
        return 'hero composition, balanced perspective, strong focal separation';
    }

    if (style === 'anime') {
        return 'appealing character-focused framing, readable silhouette, layered depth';
    }

    return 'clear focal point, intentional framing, balanced negative space';
}

export function normalizeSchema(rawSchema = {}, selectedStyle = 'auto') {
    const style = rawSchema.style || STYLE_LABELS[selectedStyle] || STYLE_LABELS.auto;
    const schema = {
        purpose: rawSchema.purpose || '',
        subject: rawSchema.subject || '',
        scene: rawSchema.scene || '',
        action: rawSchema.action || '',
        style,
        composition: rawSchema.composition || '',
        lighting: rawSchema.lighting || '',
        mood: rawSchema.mood || '',
        details: rawSchema.details || '',
        constraints: rawSchema.constraints || '',
        avoid: rawSchema.avoid || ''
    };

    return schema;
}

export function buildLocalPromptPackage(userInput, selectedStyle = 'auto', imageSize = '1024x1024') {
    const styleLabel = STYLE_LABELS[selectedStyle] || STYLE_LABELS.auto;
    const purpose = inferPurpose(userInput);
    const purposeStrategy = getPurposeStrategy(purpose);
    const sizeStrategy = getImageSizeRecommendation(imageSize);
    const schema = normalizeSchema({
        purpose,
        subject: userInput,
        scene: inferScene(userInput),
        action: 'presented as a single cohesive moment',
        style: styleLabel,
        composition: `${purposeStrategy.composition || inferComposition(selectedStyle)}; ${sizeStrategy.composition}`,
        lighting: inferLighting(userInput, selectedStyle),
        mood: inferMood(userInput),
        details: STYLE_DETAIL_MAP[selectedStyle] || STYLE_DETAIL_MAP.auto,
        constraints: `${purposeStrategy.constraints}; ${sizeStrategy.constraints}`,
        avoid: `${purposeStrategy.avoid}; ${sizeStrategy.avoid}; ${inferNegativeConstraints(userInput, selectedStyle, purpose)}`
    }, selectedStyle);

    return {
        schema,
        prompt: schemaToPrompt(schema),
        summary: schemaToSummary(schema),
        recommendation: sizeStrategy
    };
}

export function applyImageSizeRecommendationToSchema(schemaInput = {}, imageSize = '1024x1024') {
    const schema = normalizeSchema(schemaInput);
    const recommendation = getImageSizeRecommendation(imageSize);
    const compositionParts = new Set(
        String(schema.composition || '')
            .split(';')
            .map(part => part.trim())
            .filter(Boolean)
    );
    compositionParts.add(recommendation.composition);
    schema.composition = Array.from(compositionParts).join('; ');

    const constraintParts = new Set(
        String(schema.constraints || '')
            .split(';')
            .map(part => part.trim())
            .filter(Boolean)
    );
    constraintParts.add(recommendation.constraints);
    schema.constraints = Array.from(constraintParts).join('; ');

    const avoidParts = new Set(
        String(schema.avoid || '')
            .split(';')
            .map(part => part.trim())
            .filter(Boolean)
    );
    avoidParts.add(recommendation.avoid);
    schema.avoid = Array.from(avoidParts).join('; ');

    return {
        schema,
        recommendation
    };
}

const CANDIDATE_PROFILES = [
    {
        id: 'balanced',
        label: '平衡版',
        summary: '兼顾主体、氛围和可用性，适合直接开跑。',
        tweak: schema => ({
            ...schema,
            composition: `${schema.composition}; balanced visual hierarchy, readable negative space`,
            details: `${schema.details}, polished but restrained detail density`
        })
    },
    {
        id: 'bold',
        label: '冲击版',
        summary: '更强调视觉钩子和情绪张力，适合封面和海报。',
        tweak: schema => ({
            ...schema,
            lighting: `${schema.lighting}, stronger contrast on the focal subject`,
            mood: `${schema.mood}, more dramatic and memorable`,
            composition: `${schema.composition}; stronger hero framing and attention hook`
        })
    },
    {
        id: 'clean',
        label: '克制版',
        summary: '更强调简洁、留白和高级感，适合产品图与品牌视觉。',
        tweak: schema => ({
            ...schema,
            composition: `${schema.composition}; cleaner layout with stricter visual restraint`,
            constraints: `${schema.constraints}; keep generous breathing room`,
            avoid: `${schema.avoid}; visual clutter; over-decoration`
        })
    }
];

function scoreFeedbackNote(note = '') {
    const normalized = note.toLowerCase();
    return {
        prefersBold: /冲击|张力|dramatic|bold|突出|抓眼|钩子/.test(normalized),
        prefersClean: /克制|高级|留白|干净|minimal|clean|restrained/.test(normalized),
        prefersBalanced: /平衡|稳|自然|通用|balanced/.test(normalized),
        wantsReadable: /清晰|一眼|mobile|标题|readable|可读/.test(normalized)
    };
}

export function deriveSceneKey(schemaInput = {}) {
    const purpose = String(schemaInput?.purpose || '').toLowerCase();
    const subject = String(schemaInput?.subject || '').toLowerCase();

    if (purpose.includes('product') || /产品|商品|serum|skincare|bottle/.test(subject)) {
        return 'product';
    }

    if (purpose.includes('cover') || purpose.includes('social media')) {
        return 'cover';
    }

    if (purpose.includes('poster')) {
        return 'poster';
    }

    if (/fox|dog|cat|pet|宠物|狐狸|猫|狗/.test(subject)) {
        return 'pet';
    }

    if (/person|portrait|woman|man|girl|boy|人物|人像/.test(subject)) {
        return 'portrait';
    }

    return 'general';
}

export function buildPreferenceProfile(feedbackItems = [], sceneKey = null) {
    const scopedItems = sceneKey
        ? feedbackItems.filter(item => item?.sceneKey === sceneKey)
        : feedbackItems;
    const profile = {
        favoriteCandidateId: null,
        sceneKey,
        totalItems: 0,
        source: sceneKey ? 'scene' : 'global',
        explanation: sceneKey ? '根据当前场景的历史选择学习' : '根据跨场景历史选择学习',
        counts: {
            balanced: 0,
            bold: 0,
            clean: 0
        },
        signals: {
            prefersBold: 0,
            prefersClean: 0,
            prefersBalanced: 0,
            wantsReadable: 0
        }
    };

    scopedItems.forEach(item => {
        profile.totalItems += 1;
        if (item?.candidateId && profile.counts[item.candidateId] !== undefined) {
            profile.counts[item.candidateId] += 1;
        }

        const noteSignals = scoreFeedbackNote(item?.note || '');
        Object.keys(noteSignals).forEach(key => {
            if (noteSignals[key]) {
                profile.signals[key] += 1;
            }
        });
    });

    const favoriteEntry = Object.entries(profile.counts).sort((a, b) => b[1] - a[1])[0];
    if (favoriteEntry && favoriteEntry[1] > 0) {
        profile.favoriteCandidateId = favoriteEntry[0];
    }

    return profile;
}

export function resolvePreferenceProfile(feedbackItems = [], sceneKey = 'general') {
    const sceneProfile = buildPreferenceProfile(feedbackItems, sceneKey);
    if (sceneProfile.totalItems > 0) {
        return sceneProfile;
    }

    const globalProfile = buildPreferenceProfile(feedbackItems, null);
    if (globalProfile.totalItems > 0) {
        globalProfile.source = 'global';
        globalProfile.explanation = '当前场景历史不足，回退到全局偏好学习';
    }
    return globalProfile;
}

export function applyExplicitPreference(preferenceProfile, explicitPreference = '') {
    if (!explicitPreference) {
        return preferenceProfile;
    }

    return {
        ...preferenceProfile,
        favoriteCandidateId: explicitPreference,
        source: 'explicit',
        explanation: '当前排序优先使用你的显式偏好设置'
    };
}

function applyPreferenceSignals(schema, profile, candidateId) {
    if (!profile) {
        return schema;
    }

    const next = { ...schema };

    if (profile.signals.wantsReadable > 0) {
        next.constraints = `${next.constraints}; prioritize instant readability at thumbnail size`;
    }

    if (candidateId === 'bold' && profile.signals.prefersBold > 0) {
        next.mood = `${next.mood}, more eye-catching and dynamic`;
    }

    if (candidateId === 'clean' && profile.signals.prefersClean > 0) {
        next.composition = `${next.composition}; elevated whitespace and stricter restraint`;
    }

    if (candidateId === 'balanced' && profile.signals.prefersBalanced > 0) {
        next.details = `${next.details}, versatile and production-safe`;
    }

    return next;
}

function buildCandidatesFromBaseSchema(baseSchema, selectedStyle = 'auto', preferenceProfile = null) {
    const candidates = CANDIDATE_PROFILES.map(profile => {
        const tweakedSchema = normalizeSchema(profile.tweak(baseSchema), selectedStyle);
        const preferredSchema = normalizeSchema(
            applyPreferenceSignals(tweakedSchema, preferenceProfile, profile.id),
            selectedStyle
        );
        const preferred = preferenceProfile?.favoriteCandidateId === profile.id;

        return {
            id: profile.id,
            label: profile.label,
            summary: preferred ? `${profile.summary} 更贴近你最近的选择。` : profile.summary,
            schema: preferredSchema,
            prompt: schemaToPrompt(preferredSchema),
            rationale: schemaToSummary(preferredSchema),
            preferred,
            explanation: preferred
                ? (preferenceProfile?.source === 'explicit'
                    ? '因为你在该场景里显式指定了这个默认方向'
                    : preferenceProfile?.source === 'scene'
                        ? '因为你在这个场景里最近更常选择这个方向'
                        : preferenceProfile?.source === 'global'
                            ? '因为你的全局历史里更偏好这个方向'
                            : '这是当前默认优先方向')
                : '可作为对比方向，帮助你快速切换不同创作倾向'
        };
    });

    if (!preferenceProfile?.favoriteCandidateId) {
        return candidates;
    }

    return [...candidates].sort((a, b) => Number(b.preferred) - Number(a.preferred));
}

export function buildPromptCandidates(userInput, selectedStyle = 'auto', imageSize = '1024x1024', preferenceProfile = null) {
    const base = buildLocalPromptPackage(userInput, selectedStyle, imageSize);
    return buildCandidatesFromBaseSchema(base.schema, selectedStyle, preferenceProfile);
}

export function buildCandidatesFromSchema(schemaInput = {}, selectedStyle = 'auto', imageSize = '1024x1024', preferenceProfile = null) {
    const normalized = normalizeSchema(schemaInput, selectedStyle);
    const { schema } = applyImageSizeRecommendationToSchema(normalized, imageSize);
    return buildCandidatesFromBaseSchema(schema, selectedStyle, preferenceProfile);
}

export function applyPolishToSchema(currentSchema = {}, selectedStyle = 'auto') {
    const schema = normalizeSchema(currentSchema, selectedStyle);
    const additions = [];
    const purposeStrategy = getPurposeStrategy(schema.purpose);

    if (!schema.details.includes('strong focal hierarchy')) {
        additions.push('strong focal hierarchy');
    }

    if (!schema.details.includes('purposeful material detail')) {
        additions.push('purposeful material detail');
    }

    schema.details = [schema.details, additions.join(', ')].filter(Boolean).join(', ');

    if (purposeStrategy.constraints && !schema.constraints.includes(purposeStrategy.constraints)) {
        schema.constraints = [schema.constraints, purposeStrategy.constraints].filter(Boolean).join('; ');
    }

    if (!schema.constraints.includes('preserve the main subject')) {
        schema.constraints = [schema.constraints, 'preserve the main subject and composition intent'].filter(Boolean).join('; ');
    }

    if (purposeStrategy.avoid && !schema.avoid.includes(purposeStrategy.avoid)) {
        schema.avoid = [schema.avoid, purposeStrategy.avoid].filter(Boolean).join('; ');
    }

    return schema;
}

export function schemaToPrompt(schemaInput = {}) {
    const schema = normalizeSchema(schemaInput);
    const parts = [];

    if (schema.purpose) {
        parts.push(`Create a ${schema.purpose}`);
    } else {
        parts.push('Create an image');
    }

    if (schema.subject) {
        parts.push(`featuring ${schema.subject}`);
    }

    if (schema.action) {
        parts.push(`${schema.action}`);
    }

    if (schema.scene) {
        parts.push(`set ${schema.scene}`);
    }

    let prompt = parts.join(' ') + '.';

    const descriptors = [
        schema.style,
        schema.composition,
        schema.lighting,
        schema.mood,
        schema.details
    ].filter(Boolean);

    if (descriptors.length > 0) {
        prompt += ` ${descriptors.join(', ')}.`;
    }

    if (schema.constraints) {
        prompt += ` Keep these constraints: ${schema.constraints}.`;
    }

    if (schema.avoid) {
        prompt += ` Avoid: ${schema.avoid}.`;
    }

    return prompt.replace(/\s+/g, ' ').trim();
}

export function schemaToSummary(schemaInput = {}) {
    const schema = normalizeSchema(schemaInput);
    const fragments = [
        schema.purpose && `用途：${schema.purpose}`,
        schema.subject && `主体：${schema.subject}`,
        schema.style && `风格：${schema.style}`,
        schema.lighting && `光线：${schema.lighting}`,
        schema.constraints && `约束：${schema.constraints}`
    ].filter(Boolean);

    return fragments.join(' | ');
}
