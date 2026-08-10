import * as fs from 'fs';
import * as path from 'path';
import { getCollection, type CollectionEntry } from 'astro:content';

export interface ImageInfo {
  path: string;
  title: string;
  alt: string;
}

const SUPPORTED_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png', '.avif'];

const PREFERRED_SIZE = 'w1600';

export interface ContentImageInfo {
  path: string;
  title: string;
  alt: string;
  pageUrl: string;
  contentType: 'event' | 'teaching';
  slug: string;
}

function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

// "image-name-w1600.webp" → "Image Name"
function extractBaseName(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/-w\d+$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isPreferredVariant(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  if (ext !== '.webp') return false;
  return filename.replace(/\.[^/.]+$/, '').endsWith(`-${PREFERRED_SIZE}`);
}

function scanDirectory(dirPath: string, baseDir: string, images: ImageInfo[]): void {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath, baseDir, images);
    } else if (entry.isFile() && isImageFile(entry.name)) {
      // Keep only the largest (w1600) webp variants — avoids sitemap duplicates
      if (isPreferredVariant(entry.name)) {
        const relativePath = path.relative(baseDir, fullPath);
        const webPath = '/' + relativePath.replace(/\\/g, '/');
        const title = extractBaseName(entry.name);
        images.push({ path: webPath, title, alt: `Image: ${title}` });
      }
    }
  }
}

/**
 * Scans the gallery and returns only the largest (w1600) webp variants,
 * so the image sitemap contains each image exactly once.
 */
export function scanGalleryImages(galleryPath?: string): ImageInfo[] {
  const defaultPath = path.join(process.cwd(), 'public', 'images', 'optimized', 'gallery');
  const targetPath = galleryPath || defaultPath;

  if (!fs.existsSync(targetPath)) {
    console.warn(`Gallery directory not found: ${targetPath}`);
    return [];
  }

  const images: ImageInfo[] = [];
  const publicDir = path.join(process.cwd(), 'public');
  scanDirectory(targetPath, publicDir, images);
  return images.sort((a, b) => a.path.localeCompare(b.path));
}

// base filename (with/without .webp) -> optimized w1600 path, so content
// images can be matched to their optimized variants
function scanGalleryImageMap(galleryPath?: string): Map<string, string> {
  const defaultPath = path.join(process.cwd(), 'public', 'images', 'optimized', 'gallery');
  const targetPath = galleryPath || defaultPath;
  
  if (!fs.existsSync(targetPath)) {
    console.warn(`Gallery directory not found: ${targetPath}`);
    return new Map();
  }
  
  const imageMap = new Map<string, string>();
  const publicDir = path.join(process.cwd(), 'public');
  
  function scanDir(dirPath: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && isImageFile(entry.name)) {
        if (isPreferredVariant(entry.name)) {
          const relativePath = path.relative(publicDir, fullPath);
          const webPath = '/' + relativePath.replace(/\\/g, '/');
          
          const withoutExt = entry.name.replace(/\.[^/.]+$/, '');
          const baseName = withoutExt.replace(/-w\d+$/, '');
          // Lookups come both with and without the .webp suffix
          imageMap.set(baseName, webPath);
          imageMap.set(baseName + '.webp', webPath);
        }
      }
    }
  }
  
  scanDir(targetPath);
  return imageMap;
}

export async function scanContentImages(lang: 'pl' | 'en'): Promise<ContentImageInfo[]> {
  const images: ContentImageInfo[] = [];
  const galleryMap = scanGalleryImageMap();

  const events = await getCollection('events', (entry: CollectionEntry<'events'>) => entry.data.lang === lang);
  for (const event of events) {
    if (event.data.featuredImage) {
      const baseName = event.data.featuredImage.replace(/\.[^/.]+$/, '').replace(/^\/images\/gallery\//, '');
      const optimizedPath = galleryMap.get(baseName) || galleryMap.get(baseName + '.webp') || event.data.featuredImage;
      
      images.push({
        path: optimizedPath,
        title: event.data.title,
        alt: `${event.data.title} - featured image`,
        pageUrl: `/events/${event.id}`,
        contentType: 'event',
        slug: event.id,
      });
    }
  }

  const teachings = await getCollection('teachings', (entry: CollectionEntry<'teachings'>) => entry.data.lang === lang);
  for (const teaching of teachings) {
    if (teaching.data.featuredImage) {
      const baseName = teaching.data.featuredImage.replace(/\.[^/.]+$/, '').replace(/^\/images\/gallery\//, '');
      const optimizedPath = galleryMap.get(baseName) || galleryMap.get(baseName + '.webp') || teaching.data.featuredImage;
      
      images.push({
        path: optimizedPath,
        title: teaching.data.title,
        alt: `${teaching.data.title} - featured image`,
        pageUrl: `/teachings/${teaching.id}`,
        contentType: 'teaching',
        slug: teaching.id,
      });
    }
  }

  return images;
}
