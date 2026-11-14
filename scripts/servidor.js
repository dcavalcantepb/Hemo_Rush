// Servidor estático mínimo: serve a raiz do projeto como o site publicado faria.
// Uso: `npm start` (porta 8080, ou PORT=xxxx). Também é usado pelo teste em navegador.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const RAIZ = path.resolve(__dirname, "..");
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".webp": "image/webp", ".png": "image/png",
  ".ico": "image/x-icon", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json", ".txt": "text/plain; charset=utf-8"
};
// só o que vai para o site publicado; o resto do repositório (testes, scripts, node_modules) não é servido
const PUBLICO = ["index.html", "css", "js", "assets", "vendor", "manifest.webmanifest", "favicon.ico"];

function iniciar(porta = 0) {
  const servidor = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const relativo = url === "/" ? "index.html" : url.replace(/^\/+/, "");
    const arquivo = path.resolve(RAIZ, relativo);
    const permitido = PUBLICO.some(p => arquivo === path.join(RAIZ, p) || arquivo.startsWith(path.join(RAIZ, p) + path.sep));
    if (!permitido || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("não encontrado"); return;
    }
    res.writeHead(200, { "Content-Type": TIPOS[path.extname(arquivo)] || "application/octet-stream", "Cache-Control": "no-cache" });
    fs.createReadStream(arquivo).pipe(res);
  });
  return new Promise(ok => servidor.listen(porta, "127.0.0.1", () => ok({ servidor, url: `http://127.0.0.1:${servidor.address().port}/` })));
}

if (require.main === module) {
  iniciar(Number(process.env.PORT) || 8080).then(({ url }) => console.log(`HemoRush rodando em ${url}`));
}

module.exports = { iniciar, PUBLICO };
