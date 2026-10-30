import { templateFields } from "./template-fields";

/**
 * Template Content & Walkthrough Analyzer
 * Extracts and synthesizes the exact starting-to-end journey of an invitation template.
 */

export interface TemplateStepItem {
  step: number;
  title: string;
  badge: string;
  phase: 'start' | 'experience' | 'details' | 'interaction' | 'end';
  headline: string;
  description: string;
  points: string[];
  whatGuestsExperience: string;
  customizableFields: string[];
  features: string[];
}

export interface TemplateWalkthrough {
  openingAction: string;
  openingDescription: string;
  hasAudio: boolean;
  audioDescription: string;
  totalSteps: number;
  steps: TemplateStepItem[];
  highlights: string[];
  techSpecs: {
    label: string;
    value: string;
  }[];
}

/** Read headings and supported media from HTML; never infer features from a category. */
export function getTemplateWalkthrough(template: { title: string; filename: string; category: string }, html = ''): TemplateWalkthrough {
  const content = html.replace(/<!--[^]*?-->|<(script|style)\b[^>]*>[^]*?<\/\1\s*>/gi, '');
  const cleanText = (value: string) => value.replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  const headings = Array.from(content.matchAll(/<h[1-3]\b[^>]*>([^]*?)<\/h[1-3]\s*>/gi))
    .map(match => cleanText(match[1])).filter(Boolean);
  const hasAudio = /<audio\b|new\s+(?:window\.)?Audio\s*\(|AudioContext|webkitAudioContext/i.test(html);
  let hasMaps = /href\s*=\s*["'][^"']*(?:maps\.google|google\.[^/]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.apple)/i.test(content);
  const steps: TemplateStepItem[] = headings.map((heading, index) => ({
    step: index + 1, title: heading, badge: 'SECTION', phase: 'details', headline: '',
    description: 'Heading present in this template.', points: ['Introduce this part of your celebration.', 'Personalize the wording available in this section.', 'Give guests a clear, easy-to-follow invitation.'], whatGuestsExperience: '', customizableFields: [], features: [],
  }));
  // Most invitations render their pages from literal configuration rather than h1/h2 tags.
  // Read those literals safely; never execute uploaded JavaScript or guess from the category.
  const fields = templateFields(html);
  hasMaps ||= fields.some(f => /map/i.test(f.id) && /(?:maps\.google|google\.[^/]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.apple)/i.test(String(f.value)));
  const label = (value: string) => value.replace(/\b(welcome|dress|gifts|favours|cake|notes)\b/g,
    key => ({ welcome: 'Welcome message', dress: 'Dress code', gifts: 'Gift note', favours: 'Party favours', cake: 'Cake cutting', notes: 'Guest note' })[key] || key);
  const groups = new Map<string, typeof fields>();
  for (const field of fields) {
    if (!groups.has(field.group)) groups.set(field.group, []);
    groups.get(field.group)!.push(field);
  }
  for (const [group, items] of groups) {
    const media = items.filter(f => f.kind === 'image' || f.kind === 'url');
    steps.push({
      step: steps.length + 1, title: group, badge: 'CONTENTS', phase: 'details', headline: '',
      description: ({
        'Opening & event details': 'Introduce your celebration with personalized wording and event details.',
        'Date & time': 'Present the celebration date and timings clearly for your guests.',
        'Venue & directions': 'Help guests find the celebration with venue information and available directions.',
        'RSVP & contacts': 'Make it easy for guests to respond and reach the hosts.',
        'Closing & thank you': 'Finish the invitation with a personal closing message.',
        'Events & programme': 'Guide guests through the events and celebration programme.',
        'Photos, story & speakers': 'Personalize the photos and story elements included in this design.',
        'Guest information': 'Share the practical information guests need for the celebration.',
      } as Record<string, string>)[group] || 'Personalizable content included in this template.',
      points: ({
        'Opening & event details': ['Introduce your celebration to guests.', 'Personalize the available names and invitation wording.', 'Set the tone for your special occasion.'],
        'Date & time': ['Tell guests when the celebration takes place.', 'Update the available date and timing details.', 'Help everyone plan their attendance.'],
        'Venue & directions': ['Help guests find your celebration.', 'Personalize the available venue and location details.',
          items.some(f => /map/i.test(f.id) && /https?:/i.test(String(f.value))) ? 'Add your map link for easy directions.' : 'Give guests clear location information before they travel.'],
        'RSVP & contacts': ['Give guests a way to respond to the invitation.', 'Personalize the available reply and contact details.', 'Make it easier to coordinate attendance with your guests.'],
        'Closing & thank you': ['End the invitation with a warm message.', 'Personalize the closing words for your celebration.', 'Leave guests with a thoughtful final impression.'],
        'Events & programme': ['Introduce the celebration programme.', 'Personalize the available event details.', 'Help guests follow the order of your celebrations.'],
        'Photos, story & speakers': ['Bring a personal touch to the invitation.', 'Personalize the media and story elements available here.', 'Help guests connect with your celebration.'],
        'Guest information': ['Share useful information before the celebration.', 'Personalize the available guest notes.', 'Help guests prepare and arrive with confidence.'],
      } as Record<string, string[]>)[group] || ['Introduce this part of your celebration.', 'Personalize the content available in this section.', 'Keep the invitation clear and useful for guests.'],
      whatGuestsExperience: '', customizableFields: [...new Set(items.map(f => label(f.label)))],
      features: [...new Set(media.map(f => f.kind === 'image' ? 'Photo slot' : 'Directions or information link'))],
    });
  }
  const hasPhotos = fields.some(f => f.kind === 'image');
  return {
    openingAction: template.title,
    openingDescription: 'Open the live preview to see the entrance, animations and full invitation.',
    hasAudio, audioDescription: hasAudio ? 'Audio support is present in this template.' : '',
    totalSteps: steps.length, steps,
    highlights: [
      'Personalize the wording available in this template',
      ...(hasAudio ? ['Audio support is present in the template'] : []),
      ...(hasPhotos ? ['Personalizable photo slots are included'] : []),
      ...(hasMaps ? ['Map directions link is present in the template'] : []),
    ],
    techSpecs: [
      { label: 'Preview', value: 'Interactive browser preview' },
      ...(hasAudio ? [{ label: 'Audio', value: 'Audio support detected' }] : []),
      ...(hasPhotos ? [{ label: 'Photos', value: 'Personalizable photo slots' }] : []),
      ...(hasMaps ? [{ label: 'Directions', value: 'Map link detected' }] : []),
    ],
  };
}
