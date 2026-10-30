import { chromium as playwright } from 'playwright-core';
import chromium from '@sparticuz/chromium';
import sharp from 'sharp';

// Uploaded invitations run without application cookies or access to internal services.
// Embedded images/scripts still work; only these public asset hosts can use the network.
const assetHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'images.unsplash.com', 'images.pexels.com']);
const previewUrl = 'https://template-preview.invalid/';
const previewPolicy = `default-src data: blob: 'unsafe-inline' 'unsafe-eval' ${Array.from(assetHosts, host => `https://${host}`).join(' ')}; sandbox allow-scripts; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'none'`;
let capturing = false;

export async function generateTemplatePoster(html: string): Promise<Buffer> {
  if (capturing) throw new Error('Another cover is being generated. Please try again shortly.');
  capturing = true;
  let browser: Awaited<ReturnType<typeof playwright.launch>> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    const localPath = process.env.TEMPLATE_CHROME_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);
    browser = await playwright.launch({
      executablePath: localPath || await chromium.executablePath(),
      args: localPath ? [] : chromium.args,
      headless: true,
      timeout: 15000,
    });
    const captureBrowser = browser;
    deadline = setTimeout(() => { void captureBrowser.close(); }, 25000);
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, serviceWorkers: 'block', acceptDownloads: false });
    await context.route('**/*', async route => {
      const request = route.request();
      if (request.url() === previewUrl && request.isNavigationRequest()) {
        await route.fulfill({ contentType: 'text/html', body: html, headers: { 'Content-Security-Policy': previewPolicy } });
        return;
      }
      const url = new URL(request.url());
      if (request.method() === 'GET' && !request.isNavigationRequest() && url.protocol === 'https:' && !url.port && assetHosts.has(url.hostname)) await route.continue();
      else await route.abort();
    });
    await context.routeWebSocket('**/*', socket => socket.close());
    const page = await context.newPage();
    page.on('dialog', dialog => { void dialog.dismiss(); });
    await page.goto(previewUrl, { waitUntil: 'load', timeout: 15000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images, image => image.decode().catch(() => {})));
      document.querySelectorAll('audio,video').forEach(media => { (media as HTMLMediaElement).muted = true; });
      window.scrollTo(0, 0);
    });
    // Let the front-page entrance animation settle without opening the invitation.
    await page.waitForTimeout(1800);
    const screenshot = await page.screenshot({ type: 'png', timeout: 5000 });
    return await sharp(screenshot).webp({ quality: 85 }).toBuffer();
  } finally {
    clearTimeout(deadline);
    await browser?.close().catch(() => {});
    capturing = false;
  }
}
