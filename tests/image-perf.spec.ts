import { test, expect } from '@playwright/test';

const routes = [
  '/',
  '/blog',
  '/ludoteca',
  '/torneos',
  '/slow-friending-ludico',
  '/sobre-nosotros',
];

const baseUrl = 'http://localhost:8080';

test('analyze image performance', async ({ page }) => {
  const results: any[] = [];

  for (const route of routes) {
    console.log(`Analyzing route: ${route}`);
    
    const routeResults: any[] = [];
    page.on('response', async (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] || '';
      
      if (contentType.startsWith('image/') || url.match(/\.(png|jpg|jpeg|webp|svg|gif|avif)(\?.*)?$/i)) {
        try {
          const buffer = await response.body();
          const size = buffer.length;
          const timing = response.timing();
          const duration = timing.responseEnd - timing.requestStart;
          const cacheControl = response.headers()['cache-control'] || 'none';
          
          routeResults.push({
            route,
            url,
            size,
            contentType,
            duration,
            cacheControl,
            status: response.status()
          });
        } catch (e) {
          // Body might not be available
        }
      }
    });

    try {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
    } catch (e) {
      console.error(`Error loading route ${route}: ${e.message}`);
    }
    
    results.push(...routeResults);
    page.removeAllListeners('response');
  }

  console.log('\n--- IMAGE ANALYSIS REPORT ---\n');
  
  const sortedBySize = [...results].sort((a, b) => b.size - a.size);
  console.log('Top 10 Heaviest Images:');
  sortedBySize.slice(0, 10).forEach(img => {
    console.log(`[${(img.size / 1024).toFixed(2)} KB] ${img.url} (Route: ${img.route})`);
    console.log(`  Type: ${img.contentType}, Cache: ${img.cacheControl}`);
  });

  const sortedByDuration = [...results].sort((a, b) => b.duration - a.duration);
  console.log('\nTop 10 Slowest Images:');
  sortedByDuration.slice(0, 10).forEach(img => {
    console.log(`[${img.duration.toFixed(0)} ms] ${img.url} (Route: ${img.route})`);
    console.log(`  Size: ${(img.size / 1024).toFixed(2)} KB, Status: ${img.status}`);
  });

  console.log(`\nTotal images analyzed: ${results.length}`);
});
