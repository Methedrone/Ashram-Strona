import { scanGalleryImages, scanContentImages } from '../utils/image-scanner';

const SITE_URL = 'https://babaji.org.pl';

/**
 * Escapes special XML characters to ensure valid XML output
 * @param str - The string to escape
 * @returns XML-safe string
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Converts pageUrl to correct URL format
 * English slugs come as 'en/xxx' which produces /events/en/xxx
 * But actual URL is /en/events/xxx
 * Polish slugs come as 'pl/xxx' which produces /events/pl/xxx
 * But actual URL is /events/xxx (no prefix for default locale)
 * @param pageUrl - The pageUrl from scanner
 * @returns Correct URL path
 */
function normalizePageUrl(pageUrl: string): string {
  // Check if URL starts with /events/en/ or /teachings/en/
  // Convert /events/en/xxx to /en/events/xxx
  if (pageUrl.startsWith('/events/en/')) {
    return '/en/events/' + pageUrl.replace('/events/en/', '');
  }
  if (pageUrl.startsWith('/teachings/en/')) {
    return '/en/teachings/' + pageUrl.replace('/teachings/en/', '');
  }
  // Check for Polish slugs: /events/pl/xxx -> /events/xxx
  if (pageUrl.startsWith('/events/pl/')) {
    return '/events/' + pageUrl.replace('/events/pl/', '');
  }
  if (pageUrl.startsWith('/teachings/pl/')) {
    return '/teachings/' + pageUrl.replace('/teachings/pl/', '');
  }
  // Already correct: /events/xxx, /teachings/xxx
  return pageUrl;
}

/**
 * Generates the image sitemap XML
 */
export async function GET() {
  // Get gallery images
  const galleryImages = scanGalleryImages();
  
  // Get content images for both languages
  const contentImagesPl = await scanContentImages('pl');
  const contentImagesEn = await scanContentImages('en');

  // Build URL set with images - group by page URL
  const urlSet = new Map<string, { lang: string; images: Array<{ path: string; title: string; alt: string }> }>();

  // Add gallery images to gallery page
  if (galleryImages.length > 0) {
    urlSet.set('/gallery', {
      lang: 'pl',
      images: galleryImages.map(img => ({
        path: img.path,
        title: img.title,
        alt: img.alt
      }))
    });
  }

  // Add content images (events, teachings) for Polish
  for (const img of contentImagesPl) {
    const pageUrl = normalizePageUrl(img.pageUrl);
    const existing = urlSet.get(pageUrl);
    if (existing) {
      existing.images.push({
        path: img.path,
        title: img.title,
        alt: img.alt
      });
    } else {
      urlSet.set(pageUrl, {
        lang: 'pl',
        images: [{
          path: img.path,
          title: img.title,
          alt: img.alt
        }]
      });
    }
  }

  // Add content images for English
  for (const img of contentImagesEn) {
    const pageUrl = normalizePageUrl(img.pageUrl);
    const existing = urlSet.get(pageUrl);
    if (existing) {
      existing.images.push({
        path: img.path,
        title: img.title,
        alt: img.alt
      });
    } else {
      urlSet.set(pageUrl, {
        lang: 'en',
        images: [{
          path: img.path,
          title: img.title,
          alt: img.alt
        }]
      });
    }
  }

  // Build XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  // Sort URLs for consistent output
  const sortedUrls = Array.from(urlSet.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  for (const [pageUrl, data] of sortedUrls) {
    const loc = SITE_URL + pageUrl;
    xml += `  <url>
    <loc>${escapeXml(loc)}</loc>
`;
    
    // Add each image
    for (const image of data.images) {
      const imageLoc = SITE_URL + image.path;
      xml += `    <image:image>
      <image:loc>${escapeXml(imageLoc)}</image:loc>
      <image:title>${escapeXml(image.title)}</image:title>
      <image:alt>${escapeXml(image.alt)}</image:alt>
    </image:image>
`;
    }
    
    xml += `  </url>
`;
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600'
    }
  });
}
