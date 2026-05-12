const uploadInput = document.getElementById('upload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 500;
canvas.height = 500;

let userImage = null;
let accessories = [];
let selectedAccessory = null;

// Load user image
uploadInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      userImage = img;
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
  selectedAccessory = {
    img: e.target,
    x: 100,
    y: 100,
    width: e.target.width,
    height: e.target.height
  };
  accessories.push(selectedAccessory);

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
    ctx.drawImage(userImage, 0, 0, canvas.width, canvas.height);
  }

  accessories.forEach(acc => {
    ctx.drawImage(acc.img, acc.x, acc.y, acc.width, acc.height);
  });
}