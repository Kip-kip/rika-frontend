// ============================================================
// Rika Measurement — image pipeline
// Reuses the same EXIF + downscale approach as the visualizer
// ============================================================

export function getExifOrientation(imageFile) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const view = new DataView(e.target.result);
        if (view.byteLength < 2) return resolve(1);
        if (view.getUint16(0, false) !== 0xffd8) return resolve(1);
        let offset = 2;
        while (offset < view.byteLength) {
          if (view.getUint8(offset) !== 0xff) break;
          const marker = view.getUint8(offset + 1);
          if (marker === 0xe1 || marker === 0xdd) {
            if (
              view.getUint16(offset + 4, false) === 0x4578 && // EX
              view.getUint16(offset + 6, false) === 0x6966 // IF
            ) {
              const tiffOffset = offset + 10;
              const littleEndian = view.getUint16(tiffOffset, false) === 0x4949;
              const ifdOffset = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian);
              const numEntries = view.getUint16(tiffOffset + ifdOffset, littleEndian);
              for (let i = 0; i < numEntries; i++) {
                const entryOffset = tiffOffset + ifdOffset + 2 + i * 12;
                if (view.getUint16(entryOffset, littleEndian) === 0x0112) {
                  return resolve(view.getUint16(entryOffset + 8, littleEndian));
                }
              }
            }
            break;
          } else {
            const length = view.getUint16(offset + 2, false);
            if (length < 2) break;
            offset += length;
          }
        }
        resolve(1);
      } catch {
        resolve(1);
      }
    };
    reader.onerror = () => resolve(1);
    reader.readAsArrayBuffer(imageFile.slice(0, 65536));
  });
}

export function loadImageWithOrientation(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const orientation = getExifOrientation(file);
      orientation.then((orient) => {
        URL.revokeObjectURL(url);
        const needsRotate = orient > 3;
        const needsFlip = orient === 2 || orient === 4 || orient === 5 || orient === 8;
        let w = img.naturalWidth, h = img.naturalHeight;

        // Build canvas with correct orientation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (needsRotate) {
          canvas.width = h;
          canvas.height = w;
          if (needsFlip) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.translate(0, canvas.height);
          ctx.rotate(0);
          ctx.rotate((orient - 1) * Math.PI / 2);
          if (needsFlip && (orient === 5 || orient === 8)) {
            ctx.translate(0, -canvas.height);
          }
        } else {
          canvas.width = w;
          canvas.height = h;
        }

        ctx.drawImage(img, 0, 0, w, h);

        const output = canvas.toDataURL('image/jpeg', 0.92);
        const resultImg = new Image();
        resultImg.onload = () => resolve({ image: resultImg, width: canvas.width, height: canvas.height, dataUrl: output });
        resultImg.onerror = reject;
        resultImg.src = output;
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };
    img.src = url;
  });
}

export function downscale(dataUrl, maxEdge = 1400) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const longest = Math.max(w, h);
      if (longest <= maxEdge) {
        resolve({ image: img, width: w, height: h, dataUrl });
        return;
      }
      const scale = maxEdge / longest;
      const nw = Math.round(w * scale), nh = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = nw;
      canvas.height = nh;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, nw, nh);
      const out = canvas.toDataURL('image/jpeg', 0.92);
      const resultImg = new Image();
      resultImg.onload = () => resolve({ image: resultImg, width: nw, height: nh, dataUrl: out });
      resultImg.onerror = reject;
      resultImg.src = out;
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
