'use client';

import jsQR from 'jsqr';

export async function decodeQrFromImageFile(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          resolve(code.data);
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export function scanCanvasForQr(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement
): string | null {
  if (videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
    return null;
  }

  const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;

  ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

  const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });

  return code?.data || null;
}
