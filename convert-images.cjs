const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './public/images/fromFacebook';
const outputDir = './public/images/fromFacebook';

// Quality settings
const WEBP_QUALITY = 85;
const AVIF_QUALITY = 70;

async function convertImages() {
  try {
    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.jpg'));
    console.log(`Found ${files.length} JPG files to convert`);

    for (const file of files) {
      const inputPath = path.join(inputDir, file);
      const baseName = path.basename(file, '.jpg');
      
      console.log(`\nProcessing: ${file}`);
      
      // Convert to WebP
      const webpPath = path.join(outputDir, `${baseName}.webp`);
      await sharp(inputPath)
        .webp({ quality: WEBP_QUALITY, effort: 6 })
        .toFile(webpPath);
      
      const originalSize = fs.statSync(inputPath).size;
      const webpSize = fs.statSync(webpPath).size;
      const webpSavings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
      console.log(`  ✓ WebP: ${webpSavings}% smaller (${(originalSize/1024).toFixed(1)}KB → ${(webpSize/1024).toFixed(1)}KB)`);
      
      // Convert to AVIF
      const avifPath = path.join(outputDir, `${baseName}.avif`);
      await sharp(inputPath)
        .avif({ quality: AVIF_QUALITY, effort: 2 })
        .toFile(avifPath);
      
      const avifSize = fs.statSync(avifPath).size;
      const avifSavings = ((originalSize - avifSize) / originalSize * 100).toFixed(1);
      console.log(`  ✓ AVIF: ${avifSavings}% smaller (${(originalSize/1024).toFixed(1)}KB → ${(avifSize/1024).toFixed(1)}KB)`);
    }
    
    console.log('\n✅ Conversion complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

convertImages();
