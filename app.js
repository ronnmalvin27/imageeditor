const uploadInput = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const undoBtn = document.getElementById('undoBtn');
const downloadBtn = document.getElementById('downloadBtn');

canvas.width = 500;
canvas.height = 500;

let userImage = null;
let userImageDims = { w: 0, h: 0 };
let accessories = [];
let selectedAccessory = null;
let hoveredAccessory = null;
let historyStack = [];

let dragOffset = { x: 0, y: 0 };
let isDragging = false;
let isResizing = false;
let isRotating = false;

// Load user image (JPG/PNG supported)
uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      tempCtx.drawImage(img, 0, 0);
      const dataURL = tempCanvas.toDataURL('image/png');

      const finalImg = new Image();
      finalImg.onload = function() {
        userImage = finalImg;
        const scale = Math.min(canvas.width / finalImg.width, canvas.height / finalImg.height);
        userImageDims.w = finalImg.width * scale;
        userImageDims.h = finalImg.height * scale;

        accessories = [];
        historyStack = [];
        drawCanvas();
      };
      finalImg.src = dataURL;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Add accessory to canvas
document.querySelectorAll('.accessory').forEach(img => {
  img.addEventListener('mousedown', () => {
    const acc = {
      img: img,
      x: 150,
      y: 150,
      width: img.naturalWidth / 4,
      height: img.naturalHeight / 4,
      rotation: 0
    };
    accessories.push(acc);
    saveHistory();
    drawCanvas();
  });
});

// Helper: check if mouse is inside accessory (ignores rotation)
function isMouseOnAccessory(acc, mx, my) {
  const cx = acc.x + acc.width / 2;
  const cy = acc.y + acc.height / 2;
  const dx = mx - cx;
  const dy = my - cy;
  const angle = -acc.rotation * Math.PI / 180;
  const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
  const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
  return rx > -acc.width / 2 && rx < acc.width / 2 && ry > -acc.height / 2 && ry < acc.height / 2;
}

// Mouse down
canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  selectedAccessory = null;

  for (let i = accessories.length - 1; i >= 0; i--) {
    const acc = accessories[i];

    // Rotate handle (blue) - rotated
    const cx = acc.x + acc.width / 2;
    const cy = acc.y + acc.height / 2;
    const handleOffset = { x: 0, y: -acc.height/2 - 20 };
    const angle = acc.rotation * Math.PI / 180;
    const handleX = cx + handleOffset.x * Math.cos(angle) - handleOffset.y * Math.sin(angle);
    const handleY = cy + handleOffset.x * Math.sin(angle) + handleOffset.y * Math.cos(angle);

    if (mx >= handleX - 5 && mx <= handleX + 5 && my >= handleY - 5 && my <= handleY + 5) {
      selectedAccessory = acc;
      isRotating = true;
      return;
    }

    // Resize handle (red) - bottom-right
    const resizeX = acc.x + acc.width;
    const resizeY = acc.y + acc.height;
    if (mx >= resizeX - 5 && mx <= resizeX + 5 && my >= resizeY - 5 && my <= resizeY + 5) {
      selectedAccessory = acc;
      isResizing = true;
      return;
    }

    // Accessory body for dragging
    if (isMouseOnAccessory(acc, mx, my)) {
      selectedAccessory = acc;
      isDragging = true;
      dragOffset.x = mx - acc.x;
      dragOffset.y = my - acc.y;
      return;
    }
  }
});

// Mouse move
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // Hover detection
  hoveredAccessory = null;
  for (let i = accessories.length - 1; i >= 0; i--) {
    if (isMouseOnAccessory(accessories[i], mx, my)) {
      hoveredAccessory = accessories[i];
      break;
    }
  }

  // Cursor changes
  if (hoveredAccessory) {
    canvas.style.cursor = 'move';
  } else {
    canvas.style.cursor = 'default';
  }

  if (!selectedAccessory) {
    drawCanvas();
  }

  if (!selectedAccessory) return;

  if (isDragging) {
    selectedAccessory.x = mx - dragOffset.x;
    selectedAccessory.y = my - dragOffset.y;
  } else if (isResizing) {
    selectedAccessory.width = Math.max(20, mx - selectedAccessory.x);
    selectedAccessory.height = Math.max(20, my - selectedAccessory.y);
  } else if (isRotating) {
    const cx = selectedAccessory.x + selectedAccessory.width / 2;
    const cy = selectedAccessory.y + selectedAccessory.height / 2;
    const angle = Math.atan2(my - cy, mx - cx);
    selectedAccessory.rotation = angle * 180 / Math.PI + 90;
  }

  drawCanvas();
});

// Mouse up
canvas.addEventListener('mouseup', () => {
  isDragging = isResizing = isRotating = false;
});

// Draw canvas
function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw user image
  if (userImage) {
    const x = (canvas.width - userImageDims.w) / 2;
    const y = (canvas.height - userImageDims.h) / 2;
    ctx.drawImage(userImage, x, y, userImageDims.w, userImageDims.h);
  }

  // Draw accessories
  accessories.forEach(acc => {
    ctx.save();
    ctx.translate(acc.x + acc.width / 2, acc.y + acc.height / 2);
    ctx.rotate(acc.rotation * Math.PI / 180);
    ctx.drawImage(acc.img, -acc.width / 2, -acc.height / 2, acc.width, acc.height);
    ctx.restore();

    // Draw handles **only on hover**
    if (acc === selectedAccessory && acc === hoveredAccessory) {
      // Red resize handle
      ctx.fillStyle = 'red';
      ctx.fillRect(acc.x + acc.width - 5, acc.y + acc.height - 5, 10, 10);

      // Blue rotate handle
      const cx = acc.x + acc.width / 2;
      const cy = acc.y + acc.height / 2;
      const angle = acc.rotation * Math.PI / 180;
      const handleOffset = { x: 0, y: -acc.height / 2 - 20 };
      const handleX = cx + handleOffset.x * Math.cos(angle) - handleOffset.y * Math.sin(angle);
      const handleY = cy + handleOffset.x * Math.sin(angle) + handleOffset.y * Math.cos(angle);
      ctx.fillStyle = 'blue';
      ctx.fillRect(handleX - 5, handleY - 5, 10, 10);
    }
  });
}

// Undo
function saveHistory() {
  historyStack.push(accessories.map(acc => ({ ...acc })));
}

undoBtn.addEventListener('click', () => {
  if (historyStack.length > 0) {
    historyStack.pop();
    accessories = historyStack.length > 0 ? historyStack[historyStack.length - 1].map(acc => ({ ...acc })) : [];
    drawCanvas();
  }
});

// Download
downloadBtn.addEventListener('click', () => {
  // Hide handles before download
  const savedSelected = selectedAccessory;
  selectedAccessory = null;
  drawCanvas();

  const link = document.createElement('a');
  link.download = 'my_photo.png';
  link.href = canvas.toDataURL('image/png');
  link.click();

  // Restore handles
  selectedAccessory = savedSelected;
  drawCanvas();
