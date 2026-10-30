import { describe, it, expect } from 'vitest';
import { analyzeTemplate } from '../src/lib/template-analyzer';

describe('template-analyzer', () => {
  it('identifies full compatibility for well-formed template', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Royal Wedding</title>
        <style>:root { --gold: #d4af37; } h1, h2 { color: var(--gold); }</style>
      </head>
      <body>
        <div id="dots"><button aria-label="Welcome">1</button></div>
        <section class="pg">
          <h1>Royal Celebration</h1>
          <p>We invite you to our wedding ceremony with joy and blessings.</p>
        </section>
        <button id="snd" aria-pressed="false">Sound</button>
        <script>
          const CFG = {
            groom: "Aditya",
            bride: "Ananya",
            photo: "https://example.com/photo.jpg"
          };
        </script>
      </body>
      </html>
    `;

    const report = analyzeTemplate(html);
    expect(report.score).toBeGreaterThanOrEqual(90);
    expect(report.items.find(i => i.key === 'config')?.status).toBe('pass');
    expect(report.items.find(i => i.key === 'sections')?.status).toBe('pass');
    expect(report.items.find(i => i.key === 'images')?.status).toBe('pass');
    expect(report.items.find(i => i.key === 'music')?.status).toBe('pass');
    expect(report.items.find(i => i.key === 'canvas')?.status).toBe('pass');
    expect(report.items.find(i => i.key === 'text')?.status).toBe('pass');
    expect(report.items.find(i => i.key === 'colors')?.status).toBe('pass');
  });

  it('detects canvas text rendering failure (fillText / strokeText)', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <canvas id="c"></canvas>
        <script>
          const ctx = document.getElementById('c').getContext('2d');
          ctx.fillText("Permanent Inscription", 100, 100);
        </script>
      </body>
      </html>
    `;

    const report = analyzeTemplate(html);
    const canvasItem = report.items.find(i => i.key === 'canvas');
    expect(canvasItem).toBeDefined();
    expect(canvasItem?.status).toBe('fail');
    expect(canvasItem?.message).toContain('fillText');
  });

  it('detects fallback section elements (<section>, .page, .card)', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <section><h2>Ceremony</h2><p>Sacred rituals at the auspicious time</p></section>
        <div class="page"><h2>Reception</h2><p>Dinner and dancing with friends</p></div>
      </body>
      </html>
    `;

    const report = analyzeTemplate(html);
    const sectionItem = report.items.find(i => i.key === 'sections');
    expect(sectionItem?.status).toBe('pass');
    expect(sectionItem?.message).toContain('Found 2 section-like element');
  });

  it('warns about large embedded base64 artwork images', () => {
    // Generate simulated large base64 image (>70k chars)
    const largeData = 'data:image/png;base64,' + 'A'.repeat(75000);
    const html = `<html><body><img src="${largeData}" alt="artwork" /></body></html>`;

    const report = analyzeTemplate(html);
    const imgTextItem = report.items.find(i => i.key === 'embeddedText');
    expect(imgTextItem?.status).toBe('warn');
    expect(imgTextItem?.message).toContain('large embedded image');
  });

  it('warns when no event details config block is present', () => {
    const html = '<html><body><h1>Party</h1><p>Join us tonight at eight o clock sharp for festivities.</p></body></html>';
    const report = analyzeTemplate(html);
    const configItem = report.items.find(i => i.key === 'config');
    expect(configItem?.status).toBe('warn');
  });
});
