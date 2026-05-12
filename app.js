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
let historyStack = [];

let dragOffset = { x: 0, y: 0 };
let isDragging = false;
let isResizing = false;
let isRotating = false;

// Load user image
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

// Add new accessory
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

// Helper: check if mouse is inside accessory
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
    if (isMouseOnAccessory(accessories[i], mx, my)) {
      selectedAccessory = accessories[i];
      dragOffset.x = mx - selectedAccessory.x;
      dragOffset.y = my - selectedAccessory.y;

      // Check handles for resize or rotate
      const handleSize = 15;
      // Bottom-right resize handle
      if (mx >= selectedAccessory.x + selectedAccessory.width - handleSize &&
          mx <= selectedAccessory.x + selectedAccessory.width + handleSize &&
          my >= selectedAccessory.y + selectedAccessory.height - handleSize &&
          my <= selectedAccessory.y + selectedAccessory.height + handleSize) {
        isResizing = true;
      }
      // Top-center rotate handle
      else if (mx >= selectedAccessory.x + selectedAccessory.width/2 - handleSize/2 &&
               mx <= selectedAccessory.x + selectedAccessory.width/2 + handleSize/2 &&
               my >= selectedAccessory.y - 30 &&
               my <= selectedAccessory.y - 20) {
        isRotating = true;
      }
      else {
        isDragging = true;
      }

      drawCanvas();
      break;
    }
  }
});

// Mouse move
canvas.addEventListener('mousemove', e => {
  if (!selectedAccessory) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (isDragging) {
    selectedAccessory.x = mx - dragOffset.x;
    selectedAccessory.y = my - dragOffset.y;
  }
  else if (isResizing) {
    selectedAccessory.width = Math.max(20, mx - selectedAccessory.x);
    selectedAccessory.height = Math.max(20, my - selectedAccessory.y);
  }
  else if (isRotating) {
    const cx = selectedAccessory.x + selectedAccessory.width/2;
    const cy = selectedAccessory.y + selectedAccessory.height/2;
    const angle = Math.atan2(my - cy, mx - cx);
    selectedAccessory.rotation = angle * 180 / Math.PI + 90;
  }

  drawCanvas();
});

// Mouse up
canvas.addEventListener('mouseup', () => {
  isDragging = isResizing = isRotating = false;
});

// Draw everything
function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (userImage) {
    const x = (canvas.width - userImageDims.w)/2;
    const y = (canvas.height - userImageDims.h)/2;
    ctx.drawImage(userImage, x, y, userImageDims.w, userImageDims.h);
  }

  accessories.forEach(acc => {
    ctx.save();
    ctx.translate(acc.x + acc.width/2, acc.y + acc.height/2);
    ctx.rotate(acc.rotation * Math.PI / 180);
    ctx.drawImage(acc.img, -acc.width/2, -acc.height/2, acc.width, acc.height);

    if (acc === selectedAccessory) {
      // Resize handle
      ctx.fillStyle = 'red';
      ctx.fillRect(acc.width/2 - 5, acc.height/2 - 5, 10, 
