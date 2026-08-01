const path = require('path');
const Jimp = require('jimp-compact');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'assets', 'branding', 'logos', 'logo-image.png');
const outputPath = path.join(root, 'assets', 'branding', 'logos', 'logo-adaptive-foreground.png');

async function main() {
  const canvas = new Jimp(1024, 1024, 0x00000000);
  const logo = await Jimp.read(sourcePath);
  logo.resize(720, 720);
  canvas.composite(logo, 152, 152);
  await canvas.writeAsync(outputPath);
  console.log(outputPath);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
