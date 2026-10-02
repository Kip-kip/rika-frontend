// ============================================================
// Rika Visualizer — image pipeline
// Upload, EXIF orientation, downscale.
// ============================================================

// Load an image file, apply EXIF orientation if needed.
// Returns a Promise resolving to [source, width, height] or [null, 0, 0] on error.
export function loadImageWithOrientation(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      getExifOrientation(file).then((exif) => {
        if (exif !== 1) {
          const canvas = document.createElement('canvas');
          const w = img.naturalWidth, h = img.naturalHeight;
          let tw = w, th = h;
          if (exif === 3 || exif === 6 || exif === 8) { tw = h; th = w; }
          canvas.width = tw; canvas.height = th;
          const ctx = canvas.getContext('2d');
          switch (exif) {
            case 2: ctx.translate(w, 0); ctx.scale(-1, 1); break;
            case 3: ctx.translate(w, h); ctx.scale(-1, -1); break;
            case 4: ctx.translate(0, h); ctx.scale(1, -1); break;
            case 5: ctx.translate(h, 0); ctx.scale(-1, 1); ctx.translate(0, -w); ctx.rotate(Math.PI/2); break;
            case 6: ctx.translate(h, 0); ctx.rotate(Math.PI/2); break;
            case 7: ctx.translate(h, w); ctx.scale(-1, -1); ctx.rotate(-Math.PI/2); break;
            case 8: ctx.scale(-1, 1); ctx.rotate(-Math.PI/2); break;
          }
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve([canvas, tw, th]);
        } else {
          URL.revokeObjectURL(url);
          resolve([img, img.naturalWidth, img.naturalHeight]);
        }
      });
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve([null, 0, 0]); };
    img.src = url;
  });
}

// Read EXIF orientation tag (0x0112) from JPEG bytes.
export function getExifOrientation(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const view = new DataView(e.target.result);
        if (view.getUint16(0) !== 0xFFD8) return resolve(1);
        let offset = 2;
        while (offset < view.byteLength) {
          if (view.getUint8(offset) !== 0xFF) break;
          const marker = view.getUint16(offset);
          if (marker === 0xFFE1) {
            const ifdStart = offset + 10;
            const numEntries = view.getUint16(ifdStart, true);
            for (let i = 0; i < numEntries; i++) {
              const entry = ifdStart + 2 + i * 12;
              if (view.getUint16(entry, true) === 0x0112) {
                return resolve(view.getUint16(entry + 8, true));
              }
            }
          }
          offset += 2 + view.getUint16(offset + 2, true);
        }
      } catch { /* ignore */ }
      resolve(1);
    };
    reader.readAsArrayBuffer(file.slice(0, 256));
  });
}

// Downscale an image source to maxEdge pixels on its longest side.
// Returns a canvas.
export function downscale(source, maxEdge) {
  const w = source.width || source.naturalWidth;
  const h = source.height || source.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const tw = Math.round(w * scale), th = Math.round(h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = tw; canvas.height = th;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, tw, th);
  return canvas;
}

// Validate an uploaded file. Returns an error string or null if OK.
export function validateImageFile(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) return 'Please choose a JPG, PNG, or WebP image.';
  if (file.size > 20 * 1024 * 1024) return 'Image is too large (max 20MB).';
  return null;
}
