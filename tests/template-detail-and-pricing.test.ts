import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { getTemplatePricing } from '../src/lib/template-pricing';
import { getTemplateTier } from '../src/lib/template-tiers';
import { bundledTemplates } from '../src/lib/bundled-templates';
import { getTemplateWalkthrough } from '../src/lib/template-content';

const template = { title: 'Uploaded invite', filename: 'upload.html', category: 'Wedding' };
describe('accurate template details and pricing', () => {
  it('never invents discounts for missing or invalid original prices', () => {
    for (const original_price of [undefined, '', 'invalid', '999', '1999']) {
      const result = getTemplatePricing({ tier: 'simple', original_price });
      expect(result.discount).toBe('');
      expect(result.originalPrice).toBe('');
      expect(result.numericPrice).toBe(1999);
    }
  });
  it('prices each collection tier and adds 18% GST', () => {
    expect(getTemplatePricing({ tier: 'simple' })).toMatchObject({ price: '₹1,999', gst: '₹359.82', total: '₹2,358.82', numericTotal: 2358.82 });
    expect(getTemplatePricing({ tier: 'premium' })).toMatchObject({ price: '₹2,999', gst: '₹539.82', total: '₹3,538.82' });
    expect(getTemplatePricing({ tier: 'luxury' })).toMatchObject({ price: '₹3,999', gst: '₹719.82', total: '₹4,718.82' });
    // Templates without a tier are Premium; a stored price never overrides the tier.
    expect(getTemplatePricing({}).numericPrice).toBe(2999);
    expect(getTemplatePricing({ tier: 'luxury', price: '1499' } as { tier: string }).numericPrice).toBe(3999);
  });
  it('reads collection tiers and falls back to Premium for missing or unknown values', () => {
    expect(getTemplateTier({ tier: 'luxury' })).toBe('luxury');
    expect(getTemplateTier({ tier: ' Simple ' })).toBe('simple');
    for (const tier of [undefined, null, '', 'gold']) expect(getTemplateTier({ tier })).toBe('premium');
  });
  it('gives every bundled design a tier and its tier price', () => {
    const tierPrices = { simple: 1999, premium: 2999, luxury: 3999 } as const;
    for (const t of bundledTemplates) {
      expect(['simple', 'premium', 'luxury']).toContain(t.tier);
      expect(getTemplatePricing(t).numericPrice).toBe(tierPrices[t.tier as keyof typeof tierPrices]);
      expect(Number(t.price)).toBe(tierPrices[t.tier as keyof typeof tierPrices]);
    }
  });
  it('shows a discount only against a higher original price', () => {
    const result = getTemplatePricing({ tier: 'premium', original_price: '₹3,999' });
    expect(result.originalPrice).toBe('₹3,999');
    expect(result.saveAmount).toBe('Save ₹1,000');
    expect(result.discount).toBe('25% OFF');
  });
  it('does not claim audio, RSVP or gallery sections without a source', () => {
    const result = getTemplateWalkthrough(template);
    expect(result.steps).toEqual([]);
    expect(result.hasAudio).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/guestbook|gallery|60FPS|100%|Wax Seal/);
  });
  it('reads headings in document order and ignores script/style/comment text', () => {
    const result = getTemplateWalkthrough(template, '<!-- <h1>Fake</h1> --><script>const x="<h2>Fake</h2>"</script><style>/*<h2>Fake</h2>*/</style><h1>Our <em>Wedding</em></h1><h2>Venue &amp; Directions</h2><audio></audio><a href="https://maps.app.goo.gl/test">Map</a>');
    expect(result.steps.map(s => s.title)).toEqual(['Our Wedding', 'Venue & Directions']);
    expect(result.hasAudio).toBe(true);
    expect(result.highlights).toContain('Map directions link is present in the template');
  });
  it('restores contents for every bundled template, including script-rendered pages', () => {
    const directory = path.join(process.cwd(), 'public/templates');
    for (const filename of readdirSync(directory).filter(name => name.endsWith('.html'))) {
      const result = getTemplateWalkthrough({ ...template, filename }, readFileSync(path.join(directory, filename), 'utf8'));
      expect(result.steps.length, filename).toBeGreaterThan(0);
      expect(JSON.stringify(result)).not.toContain('data:image');
    }
  });
  it('shows config-backed event details and photo slots without executing script', () => {
    const result = getTemplateWalkthrough(template, `<script>const CFG = { name: 'Maya', venue: 'Rose Hall', photo: 'https://example.com/portrait.jpg' }; throw new Error('must not execute');</script>`);
    expect(result.steps.some(step => step.title === 'Venue & directions')).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/Maya|Rose Hall|example\.com/);
    expect(result.steps.flatMap(step => step.customizableFields)).toContain('Portrait');
    expect(result.highlights).toContain('Personalizable photo slots are included');
  });

});
