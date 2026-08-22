const { execSync } = require('child_process');

const routes = [
  '/',
  '/blog',
  '/ludoteca',
  '/torneos',
  '/slow-friending-ludico',
];

const baseUrl = 'http://localhost:8080';

const images = new Set();

console.log('Fetching pages and extracting image URLs...');

routes.forEach(route => {
  try {
    const html = execSync(`curl -s ${baseUrl}${route}`).toString();
    
    // Extract src from img tags
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      images.add({ url: match[1], route });
    }
    
    // Extract from style tags or inline styles (e.g. background-image: url(...))
    const styleRegex = /url\(["']?([^"'\)]+)["']?\)/g;
    while ((match = styleRegex.exec(html)) !== null) {
      images.add({ url: match[1], route });
    }

    // Also look for data-src or other attributes that might hold images
    const dataSrcRegex = /data-src=["']([^"']+)["']/g;
    while ((match = dataSrcRegex.exec(html)) !== null) {
      images.add({ url: match[1], route });
    }
  } catch (e) {
    console.error(`Error fetching ${route}: ${e.message}`);
  }
});

console.log(`Found ${images.size} unique image entries. Analyzing...`);

const results = [];

for (const entry of images) {
  let fullUrl = entry.url;
  if (fullUrl.startsWith('//')) {
    fullUrl = 'https:' + fullUrl;
  } else if (fullUrl.startsWith('/')) {
    fullUrl = baseUrl + fullUrl;
  } else if (!fullUrl.startsWith('http')) {
    // Relative path, might be tricky without base tag, but let's assume it's from root for now
    fullUrl = baseUrl + '/' + fullUrl;
  }

  // Skip base64
  if (fullUrl.startsWith('data:')) continue;

  try {
    // Get headers and timing using curl
    // -w format: %{http_code},%{content_type},%{size_download},%{time_total},%{header_json}
    const output = execSync(`curl -s -o /dev/null -w "%{http_code}|%{content_type}|%{size_download}|%{time_total}" "${fullUrl}"`).toString();
    const [status, contentType, size, timeTotal] = output.split('|');
    
    // Get cache-control separately as it's not in the simple -w
    const headers = execSync(`curl -s -I "${fullUrl}"`).toString().toLowerCase();
    const cacheControlMatch = headers.match(/cache-control:\s*(.*)/);
    const cacheControl = cacheControlMatch ? cacheControlMatch[1].trim() : 'none';

    results.push({
      route: entry.route,
      url: fullUrl,
      status: parseInt(status),
      contentType,
      size: parseInt(size),
      duration: parseFloat(timeTotal) * 1000, // to ms
      cacheControl
    });
  } catch (e) {
    // console.error(`Error analyzing ${fullUrl}: ${e.message}`);
  }
}

console.log('\n--- IMAGE ANALYSIS REPORT (via CURL) ---\n');

const sortedBySize = [...results].sort((a, b) => b.size - a.size);
console.log('Top 10 Heaviest Images:');
sortedBySize.slice(0, 10).forEach(img => {
  console.log(`[${(img.size / 1024).toFixed(2)} KB] ${img.url} (Found in: ${img.route})`);
  console.log(`  Type: ${img.contentType}, Cache: ${img.cacheControl}`);
});

const sortedByDuration = [...results].sort((a, b) => b.duration - a.duration);
console.log('\nTop 10 Slowest Images:');
sortedByDuration.slice(0, 10).forEach(img => {
  console.log(`[${img.duration.toFixed(0)} ms] ${img.url} (Found in: ${img.route})`);
  console.log(`  Size: ${(img.size / 1024).toFixed(2)} KB, Status: ${img.status}`);
});

console.log(`\nTotal images analyzed: ${results.length}`);
