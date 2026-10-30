import { readFileSync, statSync } from 'node:fs';
import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TemplateCard from '../src/components/TemplateCard';
import { getTemplatePoster } from '../src/lib/template-posters';

afterEach(cleanup);
describe('fast template covers', () => {
  it('renders a real image rather than starting an animated iframe for a known template', () => {
    const view = render(<TemplateCard template={{ id: 3, title: 'Birthday Sparkle', filename: 'birthday-invitation.html', category: 'Birthday', badge: 'BIRTHDAY' }} />);
    expect(view.container.querySelector('iframe')).toBeNull();
    expect(view.getByAltText('Birthday Sparkle invitation preview').getAttribute('src')).toBe('/template-posters/birthday-invitation.webp');
    expect(view.getByRole('link', { name: 'Preview Birthday Sparkle in new tab' }).getAttribute('href')).toBe('/templates/3/preview');
  });
  it('supports encoded filenames and uploaded templates with real, small cover files', () => {
    for (const filename of ['invitation (2).html', 'https://example.com/base-templates/2e1171ae-aab1-4889-904d-8b5190d39f10.html',
      ...['7000976f-027a-42b7-a947-4e4040a62f0b', 'ff132fd0-358a-4d33-a4b1-a36a97296ec1', 'c0c8e07c-38f0-450d-8a24-c77e494b20bc', '6513baff-07a1-4ce1-a3cf-fc0ea704e8bf'].map(id => `https://example.com/base-templates/${id}.html`),
    ]) {
      const poster = getTemplatePoster(filename)!;
      const file = `public${decodeURIComponent(poster)}`;
      expect(readFileSync(file).subarray(8, 12).toString()).toBe('WEBP');
      expect(statSync(file).size).toBeLessThan(150000);
    }
    expect(getTemplatePoster('new-upload.html')).toBeNull();
  });
});
