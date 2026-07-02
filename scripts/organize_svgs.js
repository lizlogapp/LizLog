const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\暫存\\Antigravity\\蜥日日記\\temp';
const destAssets = 'C:\\暫存\\Antigravity\\蜥日日記\\assets';

const mappings = {
  // 頁籤圖示 (Tab Bar)
  '項目=分析, 選擇=預設.svg': 'tab-bar/analytics-default.svg',
  '項目=分析, 選擇=選擇.svg': 'tab-bar/analytics-active.svg', // 如果有
  '項目=寵物, 選擇=預設.svg': 'tab-bar/pets-default.svg',
  '項目=首頁, 選擇=預設.svg': 'tab-bar/home-default.svg',
  '項目=紀錄, 選擇=預設.svg': 'tab-bar/records-default.svg',
  '項目=設定, 選擇=預設.svg': 'tab-bar/settings-default.svg',
  
  // 浮動按鈕圖示
  '新增.svg': 'floating-actions/add.svg',
  '瀏覽日記.svg': 'floating-actions/diary.svg',
  '瀏覽月曆.svg': 'floating-actions/calendar.svg',
  '確認.svg': 'floating-actions/confirm.svg',
  '編輯.svg': 'floating-actions/edit.svg',
  '退回.svg': 'floating-actions/back.svg',

  // 插圖
  '插圖-蜥蜴-1-淺.svg': 'illustrations/lizard-1-light.svg',
  '插圖-蜥蜴-2-深.svg': 'illustrations/lizard-2-dark.svg',
  '插圖-蜥蜴-3.svg': 'illustrations/lizard-3.svg',
  '插圖-蜥蜴-4.svg': 'illustrations/lizard-4.svg',
  '插圖-蜥蜴-5.svg': 'illustrations/lizard-5.svg',
  '插圖-蜥蜴-6.svg': 'illustrations/lizard-6.svg',

  // LOGO
  'LOGO-字.svg': 'branding/logos/logo-text.svg',
  'LOGO-圖.svg': 'branding/logos/logo-icon.svg',
  'LOGO-圖加字-方形.svg': 'branding/logos/logo-square-with-text.svg',
  'LOGO-圖加字-長形.svg': 'branding/logos/logo-rectangle-with-text.svg',
};

// Ensure directories exist
const ensureDir = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Copy mapped files and keep track of unmatched
const files = fs.readdirSync(srcDir);
let handled = 0;

for (const file of files) {
  if (mappings[file]) {
    const dest = path.join(destAssets, mappings[file]);
    ensureDir(dest);
    fs.copyFileSync(path.join(srcDir, file), dest);
    console.log(`[Moved] ${file} -> ${mappings[file]}`);
    handled++;
  } else if (file.endsWith('.svg')) {
    // If it's not strictly mapped, categorize dynamically
    let destPath = '';
    if (file.startsWith('天氣-')) {
      const en = file.replace('天氣-', 'weather-').replace('.svg', '');
      let base = en === 'weather-多雲' ? 'cloudy' :
                 en === 'weather-多風' ? 'windy' :
                 en === 'weather-太陽' ? 'sunny' :
                 en === 'weather-太陽與雲' ? 'partly-cloudy' :
                 en === 'weather-月亮' ? 'moon' :
                 en === 'weather-雨' ? 'rainy' :
                 en === 'weather-雪' ? 'snowy' :
                 en === 'weather-雷' ? 'stormy' : 'unknown';
      destPath = `icons/weather/weather-${base}.svg`;
    } else if (file.startsWith('Property 1=')) {
      const base = file.replace('Property 1=', '').replace('.svg', '').trim();
      // Handle the sub-categories, or dump in general icons
      destPath = `icons/general/icon-${base}.svg`;
    } else if (file.startsWith('項目=')) { // unmapped active/default tab items
      const name = file.replace('項目=', '').replace(', 選擇=', '-').replace('.svg', '').trim();
      destPath = `tab-bar/tab-${name}.svg`;
    } else {
      destPath = `icons/misc/${file}`;
    }

    const dest = path.join(destAssets, destPath);
    ensureDir(dest);
    fs.copyFileSync(path.join(srcDir, file), dest);
    console.log(`[Auto-Mapped] ${file} -> ${destPath}`);
    handled++;
  }
}
console.log(`Successfully mapped ${handled} SVG files.`);
