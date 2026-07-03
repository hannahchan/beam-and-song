import type { Scene, SceneItem } from '../lib/types';
import { mixHex } from '../safety/luminance';

/**
 * Thin canvas drawing pass over a computed Scene. All logic lives in
 * scenes.ts; this file only turns items into pixels. Glow halos are layered
 * radial gradients (cheaper and steadier than shadowBlur on low-end tablets).
 */

export interface PhotoCache {
  get(dataUrl: string): HTMLCanvasElement | null;
}

/** Feathers a photo into a soft-edged ellipse so it never has hard borders. */
export function createPhotoCache(): PhotoCache {
  const cache = new Map<string, HTMLCanvasElement | null>();
  return {
    get(dataUrl: string) {
      if (cache.has(dataUrl)) return cache.get(dataUrl) ?? null;
      cache.set(dataUrl, null); // reserve while loading
      const img = new Image();
      img.onload = () => {
        const size = 512;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const g = c.getContext('2d')!;
        const scale = Math.max(size / img.width, size / img.height);
        g.drawImage(
          img,
          (size - img.width * scale) / 2,
          (size - img.height * scale) / 2,
          img.width * scale,
          img.height * scale,
        );
        // Soft elliptical mask.
        g.globalCompositeOperation = 'destination-in';
        const grad = g.createRadialGradient(size / 2, size / 2, size * 0.28, size / 2, size / 2, size * 0.5);
        grad.addColorStop(0, 'rgba(0,0,0,1)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, size, size);
        cache.set(dataUrl, c);
      };
      img.src = dataUrl;
      return null;
    },
  };
}

export function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  w: number,
  h: number,
  photos: PhotoCache,
): void {
  ctx.fillStyle = scene.bg;
  ctx.fillRect(0, 0, w, h);
  const minDim = Math.min(w, h);

  for (const it of scene.items) {
    const x = it.x * w;
    const y = it.y * h;
    const r = Math.max(it.r * minDim, 1);
    if (it.alpha <= 0.003) continue;
    ctx.save();
    ctx.globalAlpha = Math.min(it.alpha, 1);

    if (it.glow > 0.01) {
      const halo = r * (1 + it.glow);
      const grad = ctx.createRadialGradient(x, y, r * 0.4, x, y, halo);
      grad.addColorStop(0, hexA(it.color, 0.5));
      grad.addColorStop(1, hexA(it.color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, halo, 0, Math.PI * 2);
      ctx.fill();
    }

    switch (it.shape) {
      case 'orb':
      case 'bloom':
        drawOrb(ctx, it, x, y, r);
        break;
      case 'star':
        drawStar(ctx, it, x, y, r);
        break;
      case 'ball':
        drawBall(ctx, it, x, y, r);
        break;
      case 'duck':
        drawDuck(ctx, it, x, y, r);
        break;
      case 'boat':
        drawBoat(ctx, it, x, y, r);
        break;
      case 'balloon':
        drawBalloon(ctx, it, x, y, r);
        break;
      case 'drop':
        drawDrop(ctx, it, x, y, r);
        break;
      case 'moon':
        drawMoon(ctx, it, x, y, r);
        break;
      case 'photo': {
        const c = it.photoDataUrl ? photos.get(it.photoDataUrl) : null;
        if (c) {
          const d = r * 2.4;
          ctx.drawImage(c, x - d / 2, y - d / 2, d, d);
        } else {
          drawOrb(ctx, it, x, y, r * 0.5); // gentle placeholder while decoding
        }
        break;
      }
    }
    ctx.restore();
  }
}

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const v = parseInt(h, 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

function drawOrb(ctx: CanvasRenderingContext2D, it: SceneItem, x: number, y: number, r: number): void {
  const grad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.1, x, y, r);
  grad.addColorStop(0, mixHex(it.color, '#ffffff', 0.35));
  grad.addColorStop(0.55, it.color);
  grad.addColorStop(1, mixHex(it.color, '#000000', 0.25));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(ctx: CanvasRenderingContext2D, it: SceneItem, x: number, y: number, r: number): void {
  ctx.translate(x, y);
  ctx.rotate(it.rot ?? 0);
  ctx.beginPath();
  const spikes = 5;
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.46;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
  grad.addColorStop(0, mixHex(it.color, '#ffffff', 0.45));
  grad.addColorStop(1, it.color);
  ctx.fillStyle = grad;
  // Rounded joins soften the points — nothing sharp or harsh on screen.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = it.color;
  ctx.lineWidth = r * 0.22;
  ctx.stroke();
  ctx.fill();
}

function drawBall(ctx: CanvasRenderingContext2D, it: SceneItem, x: number, y: number, r: number): void {
  drawOrb(ctx, it, x, y, r);
  // A simple rolling stripe hint, low contrast so the form stays simple.
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(it.rot ?? 0);
  ctx.fillStyle = mixHex(it.color, '#000000', 0.22);
  ctx.beginPath();
  ctx.ellipse(0, r * 0.62, r * 0.85, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDuck(ctx: CanvasRenderingContext2D, it: SceneItem, x: number, y: number, r: number): void {
  ctx.translate(x, y);
  ctx.rotate((it.rot ?? 0) * 0.4);
  const c = it.color;
  ctx.fillStyle = c;
  // Body
  ctx.beginPath();
  ctx.ellipse(0, r * 0.25, r * 1.05, r * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tail lift
  ctx.beginPath();
  ctx.ellipse(-r * 0.85, r * 0.05, r * 0.34, r * 0.28, -0.5, 0, Math.PI * 2);
  ctx.fill();
  // Head
  ctx.beginPath();
  ctx.arc(r * 0.62, -r * 0.5, r * 0.48, 0, Math.PI * 2);
  ctx.fill();
  // Beak — slightly darker, same hue family (keeps internal contrast low).
  ctx.fillStyle = mixHex(c, '#000000', 0.25);
  ctx.beginPath();
  ctx.moveTo(r * 1.04, -r * 0.56);
  ctx.quadraticCurveTo(r * 1.42, -r * 0.5, r * 1.06, -r * 0.34);
  ctx.closePath();
  ctx.fill();
  // Eye
  ctx.fillStyle = mixHex(c, '#000000', 0.55);
  ctx.beginPath();
  ctx.arc(r * 0.72, -r * 0.6, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

/** Teen-band vessel for the glide lessons: simple hull and one soft sail. */
function drawBoat(ctx: CanvasRenderingContext2D, it: SceneItem, x: number, y: number, r: number): void {
  ctx.translate(x, y);
  ctx.rotate((it.rot ?? 0) * 0.4);
  // Sail
  ctx.fillStyle = it.color;
  ctx.beginPath();
  ctx.moveTo(r * 0.05, -r * 0.15);
  ctx.quadraticCurveTo(r * 0.1, -r * 1.3, r * 0.02, -r * 1.35);
  ctx.quadraticCurveTo(r * 0.75, -r * 0.55, r * 0.85, -r * 0.18);
  ctx.closePath();
  ctx.fill();
  // Hull — slightly darker, same hue family (low internal contrast)
  ctx.fillStyle = mixHex(it.color, '#000000', 0.28);
  ctx.beginPath();
  ctx.moveTo(-r * 1.0, -r * 0.05);
  ctx.lineTo(r * 1.0, -r * 0.05);
  ctx.quadraticCurveTo(r * 0.75, r * 0.5, 0, r * 0.52);
  ctx.quadraticCurveTo(-r * 0.75, r * 0.5, -r * 1.0, -r * 0.05);
  ctx.closePath();
  ctx.fill();
}

function drawBalloon(ctx: CanvasRenderingContext2D, it: SceneItem, x: number, y: number, r: number): void {
  ctx.translate(x, y);
  ctx.rotate((it.rot ?? 0) * 0.5);
  const grad = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r * 1.1);
  grad.addColorStop(0, mixHex(it.color, '#ffffff', 0.35));
  grad.addColorStop(1, it.color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.82, r, 0, 0, Math.PI * 2);
  ctx.fill();
  // Knot + string
  ctx.beginPath();
  ctx.moveTo(0, r);
  ctx.lineTo(-r * 0.1, r * 1.16);
  ctx.lineTo(r * 0.1, r * 1.16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = hexA(it.color, 0.55);
  ctx.lineWidth = Math.max(r * 0.05, 1);
  ctx.beginPath();
  ctx.moveTo(0, r * 1.16);
  ctx.quadraticCurveTo(r * 0.3, r * 1.7, -r * 0.08, r * 2.2);
  ctx.stroke();
}

function drawDrop(ctx: CanvasRenderingContext2D, it: SceneItem, x: number, y: number, r: number): void {
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.25);
  ctx.bezierCurveTo(r * 0.95, -r * 0.1, r * 0.72, r, 0, r);
  ctx.bezierCurveTo(-r * 0.72, r, -r * 0.95, -r * 0.1, 0, -r * 1.25);
  const grad = ctx.createRadialGradient(-r * 0.2, 0, r * 0.1, 0, 0.2, r * 1.3);
  grad.addColorStop(0, mixHex(it.color, '#ffffff', 0.4));
  grad.addColorStop(1, it.color);
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawMoon(ctx: CanvasRenderingContext2D, it: SceneItem, x: number, y: number, r: number): void {
  ctx.translate(x, y);
  ctx.fillStyle = it.color;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(r * 0.42, -r * 0.18, r * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}
