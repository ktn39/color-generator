const INITIAL_COLOR = '#4F46E5';

const colorPicker = document.querySelector('#colorPicker');
const hexInput = document.querySelector('#hexInput');
const hexError = document.querySelector('#hexError');
const palettesEl = document.querySelector('#palettes');
const toast = document.querySelector('#toast');
const randomButton = document.querySelector('#randomButton');
const copyCssButton = document.querySelector('#copyCssButton');
const heroSwatch = document.querySelector('#heroSwatch');

let currentHex = INITIAL_COLOR;
let toastTimer;

function normalizeHex(hex) {
  const value = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toUpperCase();
  if (/^[0-9a-fA-F]{6}$/.test(value)) return `#${value}`.toUpperCase();
  return null;
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (value) => Math.round(value).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsl({ r, g, b }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    if (max === red) h = (green - blue) / delta + (green < blue ? 6 : 0);
    if (max === green) h = (blue - red) / delta + 2;
    if (max === blue) h = (red - green) / delta + 4;
    h *= 60;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness - chroma / 2;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (hue < 60) [red, green, blue] = [chroma, x, 0];
  else if (hue < 120) [red, green, blue] = [x, chroma, 0];
  else if (hue < 180) [red, green, blue] = [0, chroma, x];
  else if (hue < 240) [red, green, blue] = [0, x, chroma];
  else if (hue < 300) [red, green, blue] = [x, 0, chroma];
  else [red, green, blue] = [chroma, 0, x];

  return {
    r: Math.round((red + m) * 255),
    g: Math.round((green + m) * 255),
    b: Math.round((blue + m) * 255),
  };
}

function hslToHex(hsl) {
  return rgbToHex(hslToRgb(hsl));
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createColor(hsl, hueShift = 0, saturationShift = 0, lightnessShift = 0) {
  return hslToHex({
    h: hsl.h + hueShift,
    s: clamp(hsl.s + saturationShift, 8, 100),
    l: clamp(hsl.l + lightnessShift, 8, 94),
  });
}

function buildPalettes(hex) {
  const hsl = rgbToHsl(hexToRgb(hex));

  return [
    {
      title: '補色',
      description: '強いコントラストで主役を引き立てる組み合わせ',
      colors: [hex, createColor(hsl, 180), createColor(hsl, 180, -12, 14), createColor(hsl, 0, -10, -10)],
    },
    {
      title: '類似色',
      description: '自然でまとまりのある近接色のグラデーション',
      colors: [createColor(hsl, -36), createColor(hsl, -18), hex, createColor(hsl, 18), createColor(hsl, 36)],
    },
    {
      title: 'トライアド',
      description: '色相環を三等分したバランスの良いアクセント配色',
      colors: [hex, createColor(hsl, 120), createColor(hsl, 240), createColor(hsl, 120, -8, 12), createColor(hsl, 240, -8, 12)],
    },
    {
      title: 'モノクロマチック',
      description: '同じ色相で彩度と明度を調整した上品な配色',
      colors: [createColor(hsl, 0, -18, 26), createColor(hsl, 0, -8, 12), hex, createColor(hsl, 0, 4, -12), createColor(hsl, 0, 8, -26)],
    },
    {
      title: '明度違い',
      description: 'UIの背景・境界線・テキストにも使いやすい明暗展開',
      colors: [createColor(hsl, 0, -18, 38), createColor(hsl, 0, -10, 24), createColor(hsl, 0, 0, 10), hex, createColor(hsl, 0, 4, -18), createColor(hsl, 0, 8, -34)],
    },
  ];
}

function colorCardTemplate(hex) {
  const rgb = hexToRgb(hex);
  return `
    <button class="color-card" type="button" style="--card-color: ${hex}" data-hex="${hex}" aria-label="${hex}をコピー">
      <span class="color-card__swatch"></span>
      <span class="color-card__body">
        <span class="color-card__hex">${hex}</span>
        <span class="color-card__rgb">RGB ${rgb.r}, ${rgb.g}, ${rgb.b}</span>
      </span>
    </button>
  `;
}

function render(hex) {
  const palettes = buildPalettes(hex);
  document.documentElement.style.setProperty('--accent', hex);
  document.documentElement.style.setProperty('--accent-soft', `${hex}1F`);
  heroSwatch.style.background = hex;
  palettesEl.innerHTML = palettes.map((palette) => `
    <article class="palette">
      <div class="palette__header">
        <h2>${palette.title}</h2>
        <p class="palette__description">${palette.description}</p>
      </div>
      <div class="color-grid">
        ${palette.colors.map(colorCardTemplate).join('')}
      </div>
    </article>
  `).join('');
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1100);
}

function getAllColors() {
  return [...new Set(buildPalettes(currentHex).flatMap((palette) => palette.colors))];
}

function buildCssVariables() {
  return getAllColors()
    .map((hex, index) => `--palette-${String(index + 1).padStart(2, '0')}: ${hex};`)
    .join('\n');
}

function updateColor(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    hexError.textContent = '6桁のHEXコードを入力してください（例: #4F46E5）';
    return;
  }

  currentHex = normalized;
  hexError.textContent = '';
  colorPicker.value = normalized;
  hexInput.value = normalized;
  render(normalized);
}

function randomHex() {
  return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`.toUpperCase();
}

colorPicker.addEventListener('input', (event) => updateColor(event.target.value));
hexInput.addEventListener('input', (event) => {
  const normalized = normalizeHex(event.target.value);
  if (normalized) updateColor(normalized);
  else hexError.textContent = '6桁のHEXコードを入力してください（例: #4F46E5）';
});
randomButton.addEventListener('click', () => updateColor(randomHex()));
copyCssButton.addEventListener('click', () => copyText(buildCssVariables()));
palettesEl.addEventListener('click', (event) => {
  const card = event.target.closest('.color-card');
  if (card) copyText(card.dataset.hex);
});

updateColor(INITIAL_COLOR);
