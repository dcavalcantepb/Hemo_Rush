// Teste de fumaça em navegador real (Chrome/Edge headless): abre o jogo como PC e como celular deitado,
// passa pela abertura, entra no menu, começa uma partida e falha se houver erro de console, erro de página,
// violação da política de segurança (CSP), arquivo que não carrega ou fonte que não foi aplicada.
// Não valida a jogabilidade, só que o jogo sobe e roda. Capturas de tela ficam em tests/saida/.
// Uso: `npm run test:e2e` (precisa de Chrome ou Edge instalado; ou defina CHROME_PATH).
const fs = require("node:fs");
const path = require("node:path");
const { iniciar } = require("../../scripts/servidor");
const { abrirNavegador } = require("../../scripts/navegador");

const SAIDA = path.join(__dirname, "..", "saida");
const PERFIS = [
  { nome: "pc", viewport: { width: 1280, height: 720, deviceScaleFactor: 1 } },
  { nome: "celular", viewport: { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true } }
];

async function esperar(page, expr, ms, rotulo) {
  try { await page.waitForFunction(expr, { timeout: ms, polling: 100 }); }
  catch { throw new Error(`tempo esgotado esperando: ${rotulo} (estado=${await page.evaluate("typeof estado === 'undefined' ? '?' : estado").catch(() => "?")})`); }
}

async function rodarPerfil(browser, url, perfil) {
  const erros = [];
  const page = await browser.newPage();
  await page.setViewport(perfil.viewport);
  page.on("pageerror", e => erros.push("erro de página: " + e.message));
  page.on("console", m => { if (m.type() === "error") erros.push("console: " + m.text()); });
  page.on("requestfailed", r => erros.push("falhou: " + r.url() + " " + (r.failure() || {}).errorText));
  page.on("response", r => { if (r.status() >= 400) erros.push(`HTTP ${r.status()}: ${r.url()}`); });

  await page.goto(url, { waitUntil: "load" });
  await esperar(page, 'estado === "entrada"', 30000, "tela de entrada");
  await page.click("#btnEntrar");
  await esperar(page, 'estado === "inicio"', 5000, "tela inicial");
  await page.screenshot({ path: path.join(SAIDA, `${perfil.nome}-inicio.png`) });
  await page.click("#btnIniciar");
  await esperar(page, 'estado === "menu"', 5000, "menu de níveis");
  await page.click("#nv-hemopleno");
  // no toque, o primeiro toque só seleciona o nível (mostra a arte) e o segundo confirma
  if (perfil.viewport.hasTouch) await page.click("#nv-hemopleno");
  await esperar(page, 'estado === "tutorial"', 15000, "tutorial");
  await page.evaluate('$("btnTutFim").click()');
  await esperar(page, 'estado === "jogando"', 15000, "partida em andamento");
  await new Promise(r => setTimeout(r, 3000));   // deixa o loop do jogo rodar alguns segundos
  const info = await page.evaluate(`({ estado, estoque: qtdEstoque(), fonte: document.fonts.check('16px "Lexend"') })`);
  await page.screenshot({ path: path.join(SAIDA, `${perfil.nome}-jogo.png`) });
  if (!info.fonte) erros.push("fonte Lexend não foi carregada");
  if (info.estoque <= 0) erros.push("estoque vazio no início da partida");
  await page.close();
  return { erros, info };
}

(async () => {
  fs.mkdirSync(SAIDA, { recursive: true });
  const { servidor, url } = await iniciar();
  const browser = await abrirNavegador();
  let falhou = false;
  for (const perfil of PERFIS) {
    try {
      const { erros, info } = await rodarPerfil(browser, url, perfil);
      if (erros.length) { falhou = true; console.error(`✗ ${perfil.nome}:\n  - ${erros.join("\n  - ")}`); }
      else console.log(`✓ ${perfil.nome}: abriu, entrou no plantão e rodou (estoque=${info.estoque})`);
    } catch (e) { falhou = true; console.error(`✗ ${perfil.nome}: ${e.message}`); }
  }
  await browser.close(); servidor.close();
  process.exit(falhou ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
