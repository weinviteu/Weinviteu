/**
 * Template Compatibility Analyzer
 * Inspects uploaded HTML templates to check whether their sections,
 * photos, music, and assets support customization in the editor.
 */

export interface CompatibilityItem {
  key: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export interface CompatibilityReport {
  score: number;           // 0–100 overall compatibility
  items: CompatibilityItem[];
  summary: string;
}

/** Check for a `const CFG = { … }` config block the editor needs for Event Details. */
function checkConfigBlock(html: string): CompatibilityItem {
  const roots = ['CFG', 'INVITE', 'EVENTS', 'PHOTOS', 'STORY', 'RSVP', 'INFO', 'THANKS'];
  const scripts = html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi);
  const found: string[] = [];
  for (const script of scripts) {
    for (const root of roots) {
      if (new RegExp(`\\bconst\\s+${root}\\s*=\\s*[\\[{]`).test(script[1])) {
        found.push(root);
      }
    }
  }
  if (found.length === 0) {
    return {
      key: 'config',
      label: 'Event details config',
      status: 'warn',
      message: 'No editable config block found (e.g. const CFG = { … }). The "Event details" tab will be empty — all text must be edited on the "Page text" tab instead.',
    };
  }
  return {
    key: 'config',
    label: 'Event details config',
    status: 'pass',
    message: `Found ${found.length} config block${found.length > 1 ? 's' : ''}: ${found.join(', ')}. Names, dates, venue and other details can be edited in the Event details tab.`,
  };
}

/** Check for section/page markers the editor uses to group text fields. */
function checkSections(html: string): CompatibilityItem {
  // Primary selectors the runtime uses
  const primaryPatterns = [
    /class\s*=\s*["'][^"']*\bpg\b[^"']*["']/i,
    /class\s*=\s*["'][^"']*\bpgu\b[^"']*["']/i,
    /class\s*=\s*["'][^"']*\bsec\b[^"']*["']/i,
  ];
  const primaryCount = primaryPatterns.reduce((n, p) => n + (html.match(new RegExp(p.source, 'gi'))?.length || 0), 0);

  // Fallback selectors
  const fallbackPatterns = [
    /<section[\s>]/gi,
    /class\s*=\s*["'][^"']*\bpage\b[^"']*["']/gi,
    /class\s*=\s*["'][^"']*\bslide\b[^"']*["']/gi,
    /class\s*=\s*["'][^"']*\bcard\b[^"']*["']/gi,
    /data-section\s*=/gi,
  ];
  const fallbackCount = fallbackPatterns.reduce((n, p) => n + (html.match(p)?.length || 0), 0);

  if (primaryCount > 0) {
    return {
      key: 'sections',
      label: 'Page sections',
      status: 'pass',
      message: `Found ${primaryCount} section marker${primaryCount > 1 ? 's' : ''} (.pg, .pgu or section.sec). Text fields will be grouped by section for easy editing.`,
    };
  }
  if (fallbackCount > 0) {
    return {
      key: 'sections',
      label: 'Page sections',
      status: 'pass',
      message: `Found ${fallbackCount} section-like element${fallbackCount > 1 ? 's' : ''} (<section>, .page, .slide, .card, or [data-section]). Text fields will be grouped automatically.`,
    };
  }
  return {
    key: 'sections',
    label: 'Page sections',
    status: 'warn',
    message: 'No page section markers found. All editable text will appear in a single group. Consider adding <section> tags or class="pg" to improve the editing experience.',
  };
}

/** Check for portrait / photo image slots the editor can replace. */
function checkImageSlots(html: string): CompatibilityItem {
  const imageKeys = /\b(photo|couplePhoto|then|now|logo)\s*:/gi;
  const photoArrayKey = /\bPHOTOS\s*=\s*\[/i;
  const imgTags = html.match(/<img\b/gi)?.length || 0;

  const configImages = html.match(imageKeys)?.length || 0;
  const hasPhotoArray = photoArrayKey.test(html);

  if (configImages > 0 || hasPhotoArray) {
    return {
      key: 'images',
      label: 'Portrait & photo slots',
      status: 'pass',
      message: `Found ${configImages + (hasPhotoArray ? 1 : 0)} image slot${configImages > 1 ? 's' : ''} in the config. Photos can be replaced in the Photos & music tab.`,
    };
  }
  if (imgTags > 0) {
    return {
      key: 'images',
      label: 'Portrait & photo slots',
      status: 'warn',
      message: `Found ${imgTags} <img> tag${imgTags > 1 ? 's' : ''} but none are declared in a config block. To enable photo replacement, add photo keys to the config (e.g. photo: "url").`,
    };
  }
  return {
    key: 'images',
    label: 'Portrait & photo slots',
    status: 'warn',
    message: 'No image slots detected. The Photos tab will show no replaceable portraits or gallery images.',
  };
}

/** Check for audio/music support. */
function checkMusic(html: string): CompatibilityItem {
  const hasAudioTag = /<audio\b/i.test(html);
  const hasSndButton = /id\s*=\s*["']snd["']/i.test(html);
  const hasSongButton = /id\s*=\s*["']song["']/i.test(html);
  const hasAudioContext = /AudioContext|webkitAudioContext/i.test(html);

  if (hasSndButton || hasSongButton || hasAudioTag) {
    return {
      key: 'music',
      label: 'Background music',
      status: 'pass',
      message: 'Sound controls detected. Custom music uploaded in the editor will replace the template\'s original audio.',
    };
  }
  if (hasAudioContext) {
    return {
      key: 'music',
      label: 'Background music',
      status: 'pass',
      message: 'Web Audio API detected (sound effects). Custom music can be added via the editor and will play alongside or replace the effects.',
    };
  }
  return {
    key: 'music',
    label: 'Background music',
    status: 'warn',
    message: 'No audio elements or sound controls found. Custom music can still be added — a floating play button will appear for guests.',
  };
}

/** Check for canvas-rendered text that cannot be auto-edited. */
function checkCanvasText(html: string): CompatibilityItem {
  const hasCanvas = /<canvas\b/i.test(html);
  const hasFillText = /\.fillText\s*\(/i.test(html);
  const hasStrokeText = /\.strokeText\s*\(/i.test(html);
  const hasCanvasText = hasFillText || hasStrokeText;

  if (!hasCanvas) {
    return {
      key: 'canvas',
      label: 'Canvas artwork text',
      status: 'pass',
      message: 'No <canvas> elements found. All visible text is in the DOM and fully editable.',
    };
  }
  if (hasCanvasText) {
    return {
      key: 'canvas',
      label: 'Canvas artwork text',
      status: 'fail',
      message: 'Text is drawn on a canvas via fillText/strokeText. This text cannot be edited through the customizer — it is baked into the artwork. Move important text (names, dates) into the HTML DOM to make it editable.',
    };
  }
  return {
    key: 'canvas',
    label: 'Canvas artwork text',
    status: 'pass',
    message: 'Canvas is used for decorative effects only (no text rendering detected). All visible text should be editable.',
  };
}

/** Check for editable DOM text content. */
function checkTextContent(html: string): CompatibilityItem {
  // Strip script, style, and tags to see how much raw text is in the body
  const bodyMatch = html.match(/<body[\s\S]*?>([\s\S]*)<\/body\s*>/i);
  if (!bodyMatch) {
    return {
      key: 'text',
      label: 'Editable text content',
      status: 'fail',
      message: 'No <body> tag found. The template may not render correctly.',
    };
  }
  const body = bodyMatch[1]
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const wordCount = body.split(/\s+/).filter(w => w.length > 1).length;

  if (wordCount >= 10) {
    return {
      key: 'text',
      label: 'Editable text content',
      status: 'pass',
      message: `Found approximately ${wordCount} words of visible text. All DOM text can be edited in the "Page text" tab.`,
    };
  }
  if (wordCount > 0) {
    return {
      key: 'text',
      label: 'Editable text content',
      status: 'warn',
      message: `Only about ${wordCount} words of visible text found. Most content may be generated by JavaScript — text will appear once the preview loads.`,
    };
  }
  return {
    key: 'text',
    label: 'Editable text content',
    status: 'warn',
    message: 'Very little static text found in the HTML body. Content is likely generated by JavaScript — editable fields will appear after the preview loads.',
  };
}

/** Check for inline images with embedded text (large base64 images). */
function checkEmbeddedImageText(html: string): CompatibilityItem {
  // Find large base64 images (>50KB) which may contain baked-in text
  const largeImages = html.match(/src\s*=\s*["']data:image\/[^"']{70000,}["']/gi);

  if (largeImages && largeImages.length > 0) {
    return {
      key: 'embeddedText',
      label: 'Images with possible text',
      status: 'warn',
      message: `Found ${largeImages.length} large embedded image${largeImages.length > 1 ? 's' : ''} (>50 KB). If these images contain text (like names, dates, or titles), that text cannot be edited — it is baked into the image pixels. Move important text to the HTML DOM.`,
    };
  }
  return {
    key: 'embeddedText',
    label: 'Images with possible text',
    status: 'pass',
    message: 'No large embedded images that might contain baked-in text.',
  };
}

/** Check for color-customizable elements. */
function checkColorSupport(html: string): CompatibilityItem {
  const hasHeadings = /<h[1-3]\b/i.test(html);
  const hasCssVars = /--[\w-]+\s*:/i.test(html);

  if (hasHeadings) {
    return {
      key: 'colors',
      label: 'Color customization',
      status: 'pass',
      message: `Headings found${hasCssVars ? ' with CSS variables' : ''}. Accent and background colors can be changed in the Colors tab.`,
    };
  }
  return {
    key: 'colors',
    label: 'Color customization',
    status: 'warn',
    message: 'No standard headings (<h1>–<h3>) detected. Color overrides will have limited visible effect.',
  };
}

/** Run all checks and produce a compatibility report. */
export function analyzeTemplate(html: string): CompatibilityReport {
  const items = [
    checkConfigBlock(html),
    checkSections(html),
    checkImageSlots(html),
    checkMusic(html),
    checkCanvasText(html),
    checkTextContent(html),
    checkEmbeddedImageText(html),
    checkColorSupport(html),
  ];

  // Calculate score: pass = full weight, warn = half, fail = 0
  const weights: Record<string, number> = {
    config: 25, sections: 15, images: 15, music: 10,
    canvas: 10, text: 10, embeddedText: 5, colors: 10,
  };
  let earned = 0;
  let total = 0;
  for (const item of items) {
    const w = weights[item.key] || 10;
    total += w;
    if (item.status === 'pass') earned += w;
    else if (item.status === 'warn') earned += w * 0.5;
  }
  const score = Math.round((earned / total) * 100);

  const failures = items.filter(i => i.status === 'fail');
  const warnings = items.filter(i => i.status === 'warn');

  let summary: string;
  if (failures.length > 0) {
    summary = `This template has ${failures.length} issue${failures.length > 1 ? 's' : ''} that will limit customization. Review the details below before publishing.`;
  } else if (warnings.length > 0) {
    summary = `This template is usable but has ${warnings.length} area${warnings.length > 1 ? 's' : ''} with limited customization support.`;
  } else {
    summary = 'This template fully supports all customization features. Ready to publish!';
  }

  return { score, items, summary };
}
