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

// Load user image
uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      // Convert JPGs to canvas-friendly RGB format automatically
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      tempCtx.drawImage(img, 0, 0);

      const dataURL = tempCanvas.toDataURL('image/png'); // always PNG for canvas
      const finalImg = new Image();
      finalImg.onload = function() {
        userImage = finalImg;

        // Scale image to fit canvas while keeping aspect ratio
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

// Accessory drag & drop
document.querySelectorAll('.accessory').forEach(img => {
  img.addEventListener('mousedown', startDrag);
});

function startDrag(e) {
  const img = e.target;

  selectedAccessory = {
    img: img,
    x: 100,
    y: 100,
    width: img.naturalWidth / 4, // scale down
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
    const x = (canvas.width - userImageDims.w) / 2;
    const y = (canvas.height - userImageDims.h) / 2;
    ctx.drawImage(userImage, x, y, userImageDims.w, userImageDims.h);
  }

  accessories.forEach(acc => {
    ctx.drawImage(acc.img, acc.x, acc.y, acc.width, acc.height);
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
  const link = document.createElement('a');
  link.download = 'my_photo.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});
