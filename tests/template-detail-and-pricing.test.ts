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
    for (const original_price of [undefined, '', 'invalid', '999', '1499']) {
      const result = getTemplatePricing({ price: '1499', original_price });
      expect(result.discount).toBe('');
      expect(result.originalPrice).toBe('');
      expect(result.numericPrice).toBe(1499);
    }
    expect(getTemplatePricing({ category: 'Wedding' }).discount).toBe('');
  });
  it('uses the uniform ₹1,999 starting price when no price is supplied', () => {
    for (const category of ['Wedding', 'Birthday', 'Traditional', 'New category']) {
      expect(getTemplatePricing({ category }).numericPrice).toBe(1999);
      expect(getTemplatePricing({ category }).originalPrice).toBe('');
    }
    const result = getTemplatePricing({ price: '2999', original_price: '3999' });
    expect(result.originalPrice).toBe('₹3,999');
    expect(result.saveAmount).toBe('Save ₹1,000');
  });
  it('reads collection tiers and falls back to Premium for missing or unknown values', () => {
    expect(getTemplateTier({ tier: 'luxury' })).toBe('luxury');
    expect(getTemplateTier({ tier: ' Simple ' })).toBe('simple');
    for (const tier of [undefined, null, '', 'gold']) expect(getTemplateTier({ tier })).toBe('premium');
  });
  it('gives every bundled design a tier and the ₹1,999 starting price', () => {
    for (const t of bundledTemplates) {
      expect(['simple', 'premium', 'luxury']).toContain(t.tier);
      expect(getTemplatePricing(t).numericPrice).toBe(1999);
    }
  });
  it('uses explicit original prices and preserves paise', () => {
    const result = getTemplatePricing({ price: '₹1,499.50', original_price: '₹2,999' });
    expect(result.numericPrice).toBe(1499.5);
    expect(result.price).toBe('₹1,499.5');
    expect(result.originalPrice).toBe('₹2,999');
    expect(result.discount).toBe('50% OFF');
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
