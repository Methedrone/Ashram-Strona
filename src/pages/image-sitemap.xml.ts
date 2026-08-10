import { scanContentImages, scanGalleryImages } from '../utils/image-scanner';

const SITE_URL = import.meta.env.SITE;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Slug prefixes differ per locale: collections return 'en/xxx' but the URL is
 * /en/events/xxx, and 'pl/xxx' maps to /events/xxx (no prefix for the default locale).
 */
function normalizePageUrl(pageUrl: string): string {
  if (pageUrl.startsWith('/events/en/')) {
    return `/en/events/${pageUrl.replace('/events/en/', '')}`;
  }
  if (pageUrl.startsWith('/teachings/en/')) {
    return `/en/teachings/${pageUrl.replace('/teachings/en/', '')}`;
  }
  if (pageUrl.startsWith('/events/pl/')) {
    return `/events/${pageUrl.replace('/events/pl/', '')}`;
  }
  if (pageUrl.startsWith('/teachings/pl/')) {
    return `/teachings/${pageUrl.replace('/teachings/pl/', '')}`;
  }
  return pageUrl;
}

export async function GET() {
  const galleryImages = scanGalleryImages();

  const contentImagesPl = await scanContentImages('pl');
  const contentImagesEn = await scanContentImages('en');

  const urlSet = new Map<string, { lang: string; images: Array<{ path: string; title: string; alt: string }> }>();

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

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  const sortedUrls = Array.from(urlSet.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  for (const [pageUrl, data] of sortedUrls) {
    const loc = SITE_URL + pageUrl;
    xml += `  <url>
    <loc>${escapeXml(loc)}</loc>
`;

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
