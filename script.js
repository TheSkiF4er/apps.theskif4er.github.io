const SITE_PASSWORD = 'fpv58';
const ACCESS_KEY = 'fpv-table-access';
const MARKS_KEY = 'fpv-table-marked-cells-v2';
const LEGEND_KEY = 'fpv-table-legend-v2';
const DEFAULT_COLOR = '#D32F2F';

const passwordScreen = document.getElementById('password-screen');
const app = document.getElementById('app');
const passwordForm = document.getElementById('password-form');
const passwordInput = document.getElementById('password-input');
const passwordError = document.getElementById('password-error');
const resetButton = document.getElementById('reset-button');
const cells = [...document.querySelectorAll('.toggle-cell')];

const colorPicker = document.getElementById('color-picker');
const colorHex = document.getElementById('color-hex');
const currentColorPreview = document.getElementById('current-color-preview');
const legendText = document.getElementById('legend-text');
const addLegendButton = document.getElementById('add-legend-button');
const legendList = document.getElementById('legend-list');
const legendEmpty = document.getElementById('legend-empty');
const clearLegendButton = document.getElementById('clear-legend-button');

let selectedColor = DEFAULT_COLOR;
let markedCells = {};
let legend = {};

function normalizeHex(color) {
  const value = String(color || '').trim().toUpperCase();
  const fullHex = /^#[0-9A-F]{6}$/;
  const shortHex = /^#[0-9A-F]{3}$/;

  if (fullHex.test(value)) {
    return value;
  }

  if (shortHex.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }

  return null;
}

function getReadableTextColor(hex) {
  const normalized = normalizeHex(hex) || DEFAULT_COLOR;
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 160 ? '#111111' : '#FFFFFF';
}

function setSelectedColor(color) {
  const normalized = normalizeHex(color) || DEFAULT_COLOR;
  selectedColor = normalized;
  colorPicker.value = normalized;
  colorHex.value = normalized;
  currentColorPreview.style.backgroundColor = normalized;
  addLegendButton.style.backgroundColor = normalized;
  addLegendButton.style.color = getReadableTextColor(normalized);
}

function saveMarks() {
  localStorage.setItem(MARKS_KEY, JSON.stringify(markedCells));
}

function saveLegend() {
  localStorage.setItem(LEGEND_KEY, JSON.stringify(legend));
}

function applyCellStyles() {
  cells.forEach((cell) => {
    const color = markedCells[cell.dataset.key];

    if (color) {
      cell.classList.add('active');
      cell.style.backgroundColor = color;
      cell.style.color = getReadableTextColor(color);
    } else {
      cell.classList.remove('active');
      cell.style.backgroundColor = '';
      cell.style.color = '';
    }
  });
}

function renderLegend() {
  const entries = Object.entries(legend).sort((a, b) => a[0].localeCompare(b[0]));
  legendList.innerHTML = '';
  legendEmpty.classList.toggle('hidden', entries.length > 0);

  entries.forEach(([color, text]) => {
    const item = document.createElement('div');
    item.className = 'legend-item';

    const colorBox = document.createElement('div');
    colorBox.className = 'legend-color-box';
    colorBox.style.backgroundColor = color;

    const code = document.createElement('div');
    code.className = 'legend-code';
    code.textContent = color;

    const input = document.createElement('input');
    input.className = 'legend-input';
    input.type = 'text';
    input.value = text;
    input.placeholder = 'Введите подпись для цвета';
    input.addEventListener('input', () => {
      legend[color] = input.value;
      saveLegend();
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'delete-legend-button';
    deleteButton.textContent = 'Удалить';
    deleteButton.addEventListener('click', () => {
      delete legend[color];
      saveLegend();
      renderLegend();
    });

    item.append(colorBox, code, input, deleteButton);
    legendList.appendChild(item);
  });
}

function loadState() {
  try {
    markedCells = JSON.parse(localStorage.getItem(MARKS_KEY) || '{}') || {};
  } catch {
    markedCells = {};
  }

  try {
    legend = JSON.parse(localStorage.getItem(LEGEND_KEY) || '{}') || {};
  } catch {
    legend = {};
  }

  applyCellStyles();
  renderLegend();
}

function unlockPage() {
  passwordScreen.classList.add('hidden');
  app.classList.remove('hidden');
}

function tryLogin(password) {
  if (password === SITE_PASSWORD) {
    sessionStorage.setItem(ACCESS_KEY, 'true');
    unlockPage();
    loadState();
    passwordError.textContent = '';
    passwordForm.reset();
    return;
  }

  passwordError.textContent = 'Неверный пароль';
  passwordInput.focus();
  passwordInput.select();
}

function saveLegendFromInputs() {
  const normalized = normalizeHex(selectedColor);
  const text = legendText.value.trim();

  if (!normalized) {
    return;
  }

  legend[normalized] = text;
  saveLegend();
  renderLegend();
  legendText.value = '';
}

if (sessionStorage.getItem(ACCESS_KEY) === 'true') {
  unlockPage();
  loadState();
}

setSelectedColor(DEFAULT_COLOR);

passwordForm.addEventListener('submit', (event) => {
  event.preventDefault();
  tryLogin(passwordInput.value.trim());
});

colorPicker.addEventListener('input', (event) => {
  setSelectedColor(event.target.value);
});

colorHex.addEventListener('change', () => {
  setSelectedColor(colorHex.value);
});

colorHex.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    setSelectedColor(colorHex.value);
  }
});

addLegendButton.addEventListener('click', () => {
  saveLegendFromInputs();
});

legendText.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveLegendFromInputs();
  }
});

cells.forEach((cell) => {
  cell.addEventListener('click', () => {
    const key = cell.dataset.key;
    const currentColor = markedCells[key];

    if (currentColor === selectedColor) {
      delete markedCells[key];
    } else {
      markedCells[key] = selectedColor;
    }

    saveMarks();
    applyCellStyles();
  });
});

resetButton.addEventListener('click', () => {
  markedCells = {};
  saveMarks();
  applyCellStyles();
});

clearLegendButton.addEventListener('click', () => {
  legend = {};
  saveLegend();
  renderLegend();
});
