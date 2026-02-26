import * as fs from 'fs';
import * as path from 'path';
import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Interface representing information about a gallery image for sitemap generation
 */
export interface ImageInfo {
  /** Full path from site root (e.g., /images/optimized/gallery/image.jpg) */
  path: string;
  /** Human-readable title for the image */
  title: string;
  /** Alt text description for accessibility and SEO */
  alt: string;
}

/** Supported image file extensions for gallery scanning */
const SUPPORTED_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png', '.avif'];

/** Preferred size suffix for sitemap (largest available) */
const PREFERRED_SIZE = 'w1600';

/**
 * Checks if a file is an image based on its extension
 * @param filename - The filename to check
 * @returns True if the file has a supported image extension
 */
function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Extracts the base name from an optimized image filename
 * Converts: "image-name-w1600.webp" → "image name"
 * @param filename - The optimized image filename
 * @returns The formatted title/alt text
 */
function extractBaseName(filename: string): string {
  // Remove extension
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Remove size suffix (e.g., -w1600, -w1024, -w768, -w480)
  const withoutSize = withoutExt.replace(/-w\d+$/, '');
  
  // Replace hyphens with spaces and capitalize first letter of each word
  return withoutSize
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Determines if this is the preferred size variant for sitemap inclusion
 * Prefer largest size (w1600) and webp format for optimal SEO
 * @param filename - The filename to evaluate
 * @returns True if this is the optimal variant to include
 */
function isPreferredVariant(filename: string): boolean {
  // Check if it's webp format
  const ext = path.extname(filename).toLowerCase();
  if (ext !== '.webp') {
    return false;
  }
  
  // Check if it has the preferred size suffix
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  return withoutExt.endsWith(`-${PREFERRED_SIZE}`);
}

/**
 * Recursively scans a directory for image files
 * @param dirPath - The directory path to scan
 * @param baseDir - The base directory for calculating relative paths
 * @param images - Array to collect found images
 */
function scanDirectory(dirPath: string, baseDir: string, images: ImageInfo[]): void {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively scan subdirectories (e.g., albums/)
      scanDirectory(fullPath, baseDir, images);
    } else if (entry.isFile() && isImageFile(entry.name)) {
      // Only include preferred variants (largest webp images)
      if (isPreferredVariant(entry.name)) {
        // Calculate path relative to public directory (for site root paths)
        const relativePath = path.relative(baseDir, fullPath);
        const webPath = '/' + relativePath.replace(/\\/g, '/');
        
        // Generate title and alt from filename
        const title = extractBaseName(entry.name);
        const alt = `Image: ${title}`;
        
        images.push({
          path: webPath,
          title,
          alt
        });
      }
    }
  }
}

/**
 * Scans the gallery directory and returns image information for sitemap generation.
 * Returns only the largest (w1600) webp variants to avoid duplicates in the sitemap.
 * 
 * @param galleryPath - Optional custom path to gallery directory. 
 *                     Defaults to 'public/images/optimized/gallery'
 * @returns Array of ImageInfo objects with path, title, and alt for each image
 * 
 * @example
 * ```typescript
 * const images = scanGalleryImages();
 * // Returns: [
 * //   { path: '/images/optimized/gallery/image-w1600.webp', title: 'Image', alt: 'Image: Image' },
 * //   { path: '/images/optimized/gallery/albums/1997-1998/photo-w1600.webp', title: 'Photo', alt: 'Image: Photo' }
 * // ]
 * ```
 */
export function scanGalleryImages(galleryPath?: string): ImageInfo[] {
  // Default to public/images/optimized/gallery from project root
  const defaultPath = path.join(process.cwd(), 'public', 'images', 'optimized', 'gallery');
  const targetPath = galleryPath || defaultPath;
  
  // Verify directory exists
  if (!fs.existsSync(targetPath)) {
    console.warn(`Gallery directory not found: ${targetPath}`);
    return [];
  }
  
  const images: ImageInfo[] = [];
  const publicDir = path.join(process.cwd(), 'public');
  
  scanDirectory(targetPath, publicDir, images);
  
  // Sort images by path for consistent ordering
  return images.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Scans gallery images asynchronously for better performance with large directories
 * 
 * @param galleryPath - Optional custom path to gallery directory
 * @returns Promise resolving to array of ImageInfo objects
 */
export async function scanGalleryImagesAsync(galleryPath?: string): Promise<ImageInfo[]> {
  return new Promise((resolve) => {
    const images = scanGalleryImages(galleryPath);
    resolve(images);
  });
}

/**
 * Gets the total count of unique gallery images (only counting preferred variants)
 * 
 * @param galleryPath - Optional custom path to gallery directory
 * @returns Number of unique images found
 */
export function getGalleryImageCount(galleryPath?: string): number {
  return scanGalleryImages(galleryPath).length;
}

/**
 * Information about an image found in content collections (events, teachings)
 */
export interface ContentImageInfo {
  /** Full path to the image (e.g., /images/gallery/meditation.webp) */
  path: string;
  /** Title of the content entry */
  title: string;
  /** Alt text for the image (derived from title) */
  alt: string;
  /** URL to the content page */
  pageUrl: string;
  /** Type of content: 'event' or 'teaching' */
  contentType: 'event' | 'teaching';
  /** Slug of the content entry */
  slug: string;
}

/**
 * Scans content collections (events, teachings) for featured images
 * @param lang - Language code ('pl' or 'en')
 * @returns Array of content image information
 */
export async function scanContentImages(lang: 'pl' | 'en'): Promise<ContentImageInfo[]> {
  const images: ContentImageInfo[] = [];

  // Scan events collection
  const events = await getCollection('events', (entry: CollectionEntry<'events'>) => entry.data.lang === lang);
  for (const event of events) {
    if (event.data.featuredImage) {
      images.push({
        path: event.data.featuredImage,
        title: event.data.title,
        alt: `${event.data.title} - featured image`,
        pageUrl: `/events/${event.slug}`,
        contentType: 'event',
        slug: event.slug,
      });
    }
  }

  // Scan teachings collection
  const teachings = await getCollection('teachings', (entry: CollectionEntry<'teachings'>) => entry.data.lang === lang);
  for (const teaching of teachings) {
    if (teaching.data.featuredImage) {
      images.push({
        path: teaching.data.featuredImage,
        title: teaching.data.title,
        alt: `${teaching.data.title} - featured image`,
        pageUrl: `/teachings/${teaching.slug}`,
        contentType: 'teaching',
        slug: teaching.slug,
      });
    }
  }

  return images;
}
