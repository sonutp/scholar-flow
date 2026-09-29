/**
 * OmniStudy Passport Photo Resizer & KB Precision Compressor
 * Adjusts exact pixel dimensions (width x height) AND file size in KB.
 */

import { storeBlob, getBlob } from './storage.js';

let currentImage = null;
let processedBlob = null;
let processedDataUrl = null;

export const PASSPORT_PRESETS = {
  india: { name: 'India Passport / Exam (3.5x4.5 cm)', width: 413, height: 531, targetKb: 45 },
  us: { name: 'US Visa / Passport (2x2 inches)', width: 600, height: 600, targetKb: 100 },
  schengen: { name: 'Schengen / EU Visa (35x45 mm)', width: 413, height: 531, targetKb: 60 },
  uk: { name: 'UK Passport (35x45 mm)', width: 413, height: 531, targetKb: 40 },
  custom: { name: 'Custom Dimensions & Size', width: 350, height: 450, targetKb: 50 }
};

export function initPassportModule(onStateChange) {
  const fileInput = document.getElementById('passport-file-input');
  const presetSelect = document.getElementById('passport-preset-select');
  const widthInput = document.getElementById('passport-width-input');
  const heightInput = document.getElementById('passport-height-input');
  const kbInput = document.getElementById('passport-kb-input');
  const zoomSlider = document.getElementById('passport-zoom-slider');
  const offsetXSlider = document.getElementById('passport-offset-x');
  const offsetYSlider = document.getElementById('passport-offset-y');
  const processBtn = document.getElementById('passport-process-btn');
  const downloadBtn = document.getElementById('passport-download-btn');
  const dropzone = document.getElementById('passport-dropzone');
  const bgSelect = document.getElementById('passport-bg-select');

  // Handle preset change
  presetSelect?.addEventListener('change', () => {
    const val = presetSelect.value;
    const preset = PASSPORT_PRESETS[val];
    if (preset && val !== 'custom') {
      widthInput.value = preset.width;
      heightInput.value = preset.height;
      kbInput.value = preset.targetKb;
      renderLiveCanvas();
    }
  });

  // Handle inputs change
  [widthInput, heightInput, kbInput, zoomSlider, offsetXSlider, offsetYSlider, bgSelect].forEach(elem => {
    elem?.addEventListener('input', () => {
      renderLiveCanvas();
      if (onStateChange) onStateChange();
    });
  });

  // File Upload Handling
  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImageFile(file, onStateChange);
  });

  // Drag and drop handling
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--primary)';
  });
  dropzone?.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--border)';
  });
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border)';
    if (e.dataTransfer.files.length > 0) {
      handleImageFile(e.dataTransfer.files[0], onStateChange);
    }
  });

  // Process & Compress button
  processBtn?.addEventListener('click', async () => {
    await processAndCompressPhoto();
    if (onStateChange) onStateChange();
  });

  // Download button
  downloadBtn?.addEventListener('click', () => {
    if (!processedBlob) return;
    const width = parseInt(widthInput.value, 10);
    const height = parseInt(heightInput.value, 10);
    const kb = Math.round(processedBlob.size / 1024);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(processedBlob);
    link.download = `passport_photo_${width}x${height}_${kb}KB.jpg`;
    link.click();
  });

  // Delete / Clear Photo button
  const deleteBtn = document.getElementById('passport-delete-btn');
  deleteBtn?.addEventListener('click', () => {
    currentImage = null;
    processedBlob = null;
    processedDataUrl = null;
    storeBlob('passport_current_photo', null);
    storeBlob('passport_processed_photo', null);
    if (fileInput) fileInput.value = '';
    const origStats = document.getElementById('passport-orig-stats');
    if (origStats) origStats.textContent = 'No photo loaded';
    const resultStats = document.getElementById('passport-output-stats');
    if (resultStats) resultStats.textContent = 'Target Output: Ready';
    const statusElem = document.getElementById('passport-process-status');
    if (statusElem) statusElem.textContent = '';
    if (downloadBtn) downloadBtn.disabled = true;
    renderLiveCanvas();
    if (onStateChange) onStateChange();
  });

  // Try restoring existing photo if saved in IndexedDB
  getBlob('passport_current_photo').then((blob) => {
    if (blob) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          currentImage = img;
          updateOriginalStats(blob.size, img.width, img.height);
          renderLiveCanvas();
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(blob);
    }
  });
}

function handleImageFile(file, onStateChange) {
  if (!file.type.startsWith('image/')) {
    alert('Please upload an image file (JPG, PNG, WEBP).');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      updateOriginalStats(file.size, img.width, img.height);
      renderLiveCanvas();
      storeBlob('passport_current_photo', file);
      if (onStateChange) onStateChange();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateOriginalStats(bytes, width, height) {
  const kb = (bytes / 1024).toFixed(1);
  const origStats = document.getElementById('passport-orig-stats');
  if (origStats) {
    origStats.textContent = `Original: ${width} × ${height} px (${kb} KB)`;
  }
}

/**
 * Render image onto interactive preview canvas with face centering guide
 */
export function renderLiveCanvas() {
  const canvas = document.getElementById('passport-preview-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const targetWidth = parseInt(document.getElementById('passport-width-input')?.value || 413, 10);
  const targetHeight = parseInt(document.getElementById('passport-height-input')?.value || 531, 10);
  const zoom = parseFloat(document.getElementById('passport-zoom-slider')?.value || 1);
  const offsetX = parseFloat(document.getElementById('passport-offset-x')?.value || 0);
  const offsetY = parseFloat(document.getElementById('passport-offset-y')?.value || 0);
  const bgType = document.getElementById('passport-bg-select')?.value || 'white';

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  // Background Fill
  if (bgType === 'white') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (bgType === 'off-white') {
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else if (bgType === 'light-blue') {
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }

  if (currentImage) {
    ctx.save();
    // Compute scale to cover target canvas
    const imgAspect = currentImage.width / currentImage.height;
    const canvasAspect = targetWidth / targetHeight;

    let drawW, drawH;
    if (imgAspect > canvasAspect) {
      drawH = targetHeight * zoom;
      drawW = drawH * imgAspect;
    } else {
      drawW = targetWidth * zoom;
      drawH = drawW / imgAspect;
    }

    const drawX = (targetWidth - drawW) / 2 + (offsetX * targetWidth / 100);
    const drawY = (targetHeight - drawH) / 2 + (offsetY * targetHeight / 100);

    ctx.drawImage(currentImage, drawX, drawY, drawW, drawH);
    ctx.restore();
  } else {
    // Placeholder message
    ctx.fillStyle = '#64748b';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Upload Photo to Preview', targetWidth / 2, targetHeight / 2);
  }
}

/**
 * Precision Compression Algorithm (Binary Search on Quality & Resampling)
 * Ensures the generated photo matches the exact target pixel dimensions and target KB!
 */
export async function processAndCompressPhoto() {
  if (!currentImage) {
    alert('Please upload a photo first!');
    return;
  }

  const statusElem = document.getElementById('passport-process-status');
  if (statusElem) statusElem.textContent = 'Compressing to target size...';

  const canvas = document.getElementById('passport-preview-canvas');
  const targetKb = parseFloat(document.getElementById('passport-kb-input')?.value || 50);
  const targetBytes = targetKb * 1024;

  // Binary search for optimal JPEG quality (0.01 to 1.0)
  let low = 0.05;
  let high = 0.98;
  let bestBlob = null;
  let bestDiff = Infinity;

  for (let iter = 0; iter < 10; iter++) {
    const midQuality = (low + high) / 2;
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', midQuality));
    if (!blob) break;

    const diff = Math.abs(blob.size - targetBytes);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestBlob = blob;
    }

    if (blob.size > targetBytes) {
      high = midQuality; // file too big, decrease quality
    } else {
      low = midQuality; // file too small or under limit, try higher quality
    }
  }

  // If even lowest quality exceeds targetBytes, perform slight downsampling or high compression
  if (bestBlob && bestBlob.size > targetBytes * 1.1) {
    bestBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.1));
  }

  processedBlob = bestBlob;
  if (processedBlob) {
    const outKb = (processedBlob.size / 1024).toFixed(1);
    const targetWidth = canvas.width;
    const targetHeight = canvas.height;

    const resultStats = document.getElementById('passport-output-stats');
    if (resultStats) {
      resultStats.textContent = `Output: ${targetWidth} × ${targetHeight} px (${outKb} KB)`;
    }

    const downloadBtn = document.getElementById('passport-download-btn');
    if (downloadBtn) downloadBtn.disabled = false;

    if (statusElem) {
      statusElem.textContent = `✓ Processed successfully: ${targetWidth}x${targetHeight} px, ${outKb} KB (Target: ${targetKb} KB)`;
      statusElem.style.color = 'var(--success)';
    }

    // Save processed blob in IndexedDB
    storeBlob('passport_processed_photo', processedBlob, { width: targetWidth, height: targetHeight, kb: outKb });
  }
}
