// Gera os ícones do site (favicon, ícone do iPhone/Android) a partir de assets/icons/icone.svg.
// Uso: `npm run icones`. Rode de novo sempre que mudar o desenho do SVG.
const fs = require("node:fs");
const path = require("node:path");
const { abrirNavegador } = require("./navegador");

const RAIZ = path.resolve(__dirname, "..");
const SVG = fs.readFileSync(path.join(RAIZ, "assets/icons/icone.svg"), "utf8");
const PNGS = { "favicon-32.png": 32, "apple-touch-icon.png": 180, "icone-192.png": 192, "icone-512.png": 512 };
const ICO = [16, 32, 48];

// .ico com PNGs dentro (formato aceito por todos os navegadores atuais)
function montarIco(imagens) {
  const cab = Buffer.alloc(6); cab.writeUInt16LE(0, 0); cab.writeUInt16LE(1, 2); cab.writeUInt16LE(imagens.length, 4);
  let deslocamento = 6 + 16 * imagens.length;
  const entradas = imagens.map(({ tam, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(tam >= 256 ? 0 : tam, 0); e.writeUInt8(tam >= 256 ? 0 : tam, 1);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(png.length, 8); e.writeUInt32LE(deslocamento, 12);
    deslocamento += png.length; return e;
  });
  return Buffer.concat([cab, ...entradas, ...imagens.map(i => i.png)]);
}

(async () => {
  const browser = await abrirNavegador();
  const page = await browser.newPage();
  const renderizar = async tam => {
    await page.setViewport({ width: tam, height: tam, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0;background:transparent">${SVG.replace("<svg ", `<svg width="${tam}" height="${tam}" `)}</body></html>`);
    return Buffer.from(await page.screenshot({ type: "png", omitBackground: true, clip: { x: 0, y: 0, width: tam, height: tam } }));
  };
  for (const [nome, tam] of Object.entries(PNGS)) fs.writeFileSync(path.join(RAIZ, "assets/icons", nome), await renderizar(tam));
  const ico = [];
  for (const tam of ICO) ico.push({ tam, png: await renderizar(tam) });
  fs.writeFileSync(path.join(RAIZ, "favicon.ico"), montarIco(ico));
  await browser.close();
  console.log("Ícones gerados:", [...Object.keys(PNGS), "favicon.ico"].join(", "));
})().catch(e => { console.error(e.message); process.exit(1); });
