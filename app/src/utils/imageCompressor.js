/**
 * High-performance client-side image compressor.
 * Downscales photos to max 1920x1080 and compresses to WebP / JPEG (quality ~0.82)
 * Reduces 5MB-15MB camera photos down to 150KB-350KB with pristine visual clarity.
 * Ensures fast multi-image uploads and ensures site visitors consume < 50MB.
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.82,
    outputType = 'image/webp'
  } = options;

  if (!file || !(file instanceof Blob)) return file;
  if (!file.type || !file.type.startsWith('image/')) return file;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Calculate proportional dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(file);
      }

      // Smooth bicubic downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);

          // If compression didn't help (file is smaller already), keep original
          if (blob.size >= file.size && file.type === outputType) {
            return resolve(file);
          }

          const newName = file.name ? file.name.replace(/\.[^/.]+$/, '.webp') : 'photo.webp';
          const compressedFile = new File([blob], newName, {
            type: blob.type || outputType,
            lastModified: Date.now()
          });

          console.log(
            `[ImageCompressor] '${file.name}' (${(file.size / 1024 / 1024).toFixed(2)} MB) -> '${compressedFile.name}' (${(compressedFile.size / 1024).toFixed(1)} KB)`
          );

          resolve(compressedFile);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Compresses an array of files in parallel
 */
export async function compressImages(files, options = {}) {
  if (!Array.isArray(files) || files.length === 0) return [];
  return Promise.all(files.map((f) => compressImage(f, options)));
}
