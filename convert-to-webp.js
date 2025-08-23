const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function findImages(dir, fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      if (!file.name.includes('node_modules') && !file.name.startsWith('.')) {
        await findImages(filePath, fileList);
      }
    } else if (/\.(jpg|jpeg|png)$/i.test(file.name)) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function convertToWebP(imagePath) {
  const webpPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  
  try {
    await sharp(imagePath)
      .webp({ 
        quality: 90,
        effort: 6,
        lossless: false,
        nearLossless: false,
        smartSubsample: true,
        reductionEffort: 6
      })
      .toFile(webpPath);
    
    const originalStats = await fs.stat(imagePath);
    const webpStats = await fs.stat(webpPath);
    const reduction = ((1 - webpStats.size / originalStats.size) * 100).toFixed(1);
    
    console.log(`✓ ${path.basename(imagePath)} → ${path.basename(webpPath)} (${reduction}% smaller)`);
    return { success: true, reduction };
  } catch (error) {
    console.error(`✗ Failed to convert ${imagePath}: ${error.message}`);
    return { success: false };
  }
}

async function main() {
  console.log('Finding images...');
  const images = await findImages('./src');
  
  console.log(`Found ${images.length} images to convert\n`);
  
  let converted = 0;
  let totalReduction = 0;
  
  for (const imagePath of images) {
    const result = await convertToWebP(imagePath);
    if (result.success) {
      converted++;
      totalReduction += parseFloat(result.reduction);
    }
  }
  
  console.log(`\n✓ Successfully converted ${converted}/${images.length} images`);
  if (converted > 0) {
    console.log(`Average size reduction: ${(totalReduction / converted).toFixed(1)}%`);
  }
}

main().catch(console.error);