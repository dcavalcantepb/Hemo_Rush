// Localiza um Chrome/Edge instalado para os scripts que usam o navegador (teste de fumaça, geração de ícones).
const fs = require("node:fs");
const puppeteer = require("puppeteer-core");

const CANDIDATOS = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
].filter(Boolean);

function abrirNavegador() {
  const executablePath = CANDIDATOS.find(p => fs.existsSync(p));
  if (!executablePath) throw new Error("Chrome/Edge não encontrado. Defina a variável CHROME_PATH.");
  return puppeteer.launch({
    executablePath, headless: true,
    // WebGL por software (SwiftShader): funciona em máquinas e servidores de CI sem placa de vídeo
    args: ["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"]
  });
}

module.exports = { abrirNavegador };
