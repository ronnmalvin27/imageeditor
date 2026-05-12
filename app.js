const uploadInput = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const undoBtn = document.getElementById('undoBtn');
const downloadBtn = document.getElementById('downloadBtn');

canvas.width = 500;
canvas.height = 500;

let userImage = null;
let userImageDims = { w: 0, h: 0 }; // Store scaled dimensions
let accessories = [];
let selectedAccessory = null;
let historyStack = []; // Stack for undo

// Load user image
uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      userImage = img;

      // Scale image to fit canvas while maintaining aspect ratio
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      userImageDims.w = img.width * scale;
      userImageDims.h = img.height * scale;

      accessories = [];
      historyStack = [];
      drawCanvas();
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Accessory drag & drop
document.querySelectorAll('.accessory').forEach(img => {
  img.addEventListener('mousedown', startDrag);
});

function startDrag(e) {
  const img = e.target;

  // Use naturalWidth and naturalHeight for actual image size
  selectedAccessory = {
    img: img,
    x: 100,
    y: 100,
    width: img.naturalWidth / 4, // scale down if needed
    height: img.naturalHeight / 4
  };

  accessories.push(selectedAccessory);
  saveHistory();

  canvas.addEventListener('mousemove', dragAccessory);
  canvas.addEventListener('mouseup', dropAccessory);
}

function dragAccessory(e) {
  const rect = canvas.getBoundingClientRect();
  selectedAccessory.x = e.clientX - rect.left - selectedAccessory.width / 2;
  selectedAccessory.y = e.clientY - rect.top - selectedAccessory.height / 2;
  drawCanvas();
}

function dropAccessory() {
  canvas.removeEventListener('mousemove', dragAccessory);
  canvas.removeEventListener('mouseup', dropAccessory);
  selectedAccessory = null;
}

// Draw everything
function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (userImage) {
    // Draw image centered
    const x = (canvas.width - userImageDims.w) / 2;
    const y = (canvas.height - userImageDims.h) / 2;
    ctx.drawImage(userImage, x, y, userImageDims.w, userImageDims.h);
  }

  accessories.forEach(acc => {
    ctx.drawImage(acc.img, acc.x, acc.y, acc.width, acc.height);
  });
}

// Undo functionality
function saveHistory() {
  // Save a copy of accessories array
  historyStack.push(accessories.map(acc => ({ ...acc })));
}

undoBtn.addEventListener('click', () => {
  if (historyStack.length > 0) {
    historyStack.pop(); // Remove last action
    accessories = historyStack.length > 0 ? historyStack[historyStack.length - 1].map(acc => ({ ...acc })) : [];
    drawCanvas();
  }
});

// Download image
downloadBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'my_photo.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
