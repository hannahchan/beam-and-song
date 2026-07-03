/**
 * CR-3 / TR-7 — custom photo targets, processed entirely on this device.
 * Downscaled to a small JPEG data URL before storing; nothing is uploaded.
 */
const MAX_DIM = 512;
const JPEG_QUALITY = 0.8;
export const MAX_PHOTOS_PER_PROFILE = 3;

export interface ProcessedPhoto {
  dataUrl: string;
  /** Measured average relative luminance — feeds the safety model honestly (SR-3/SR-8). */
  lum: number;
}

export async function processPhotoFile(file: File): Promise<ProcessedPhoto> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser could not process the image.');
    ctx.drawImage(img, 0, 0, w, h);
    return { dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY), lum: measureLuminance(ctx, w, h) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Average WCAG relative luminance over a sparse pixel sample. */
export function measureLuminance(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const data = ctx.getImageData(0, 0, w, h).data;
  let sum = 0;
  let n = 0;
  const stride = Math.max(4, Math.floor(data.length / 4 / 4000)) * 4; // ~4k samples
  for (let i = 0; i < data.length; i += stride) {
    sum += pixelLuminance(data[i], data[i + 1], data[i + 2]);
    n++;
  }
  return n ? Math.min(1, sum / n) : 1;
}

export function pixelLuminance(r: number, g: number, b: number): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('That image could not be read.'));
    img.src = src;
  });
}
