// Gera dist/hemorush/: só os arquivos que vão para o site, prontos para entregar a quem for hospedar.
// Testes, scripts, documentação e node_modules ficam de fora.
// Uso: `npm run pacote`.
const fs = require("node:fs");
const path = require("node:path");
const { PUBLICO } = require("./servidor");

const RAIZ = path.resolve(__dirname, "..");
const DESTINO = path.join(RAIZ, "dist", "hemorush");

fs.rmSync(path.join(RAIZ, "dist"), { recursive: true, force: true });
fs.mkdirSync(DESTINO, { recursive: true });
let arquivos = 0, bytes = 0;
for (const item of PUBLICO) {
  const origem = path.join(RAIZ, item);
  if (!fs.existsSync(origem)) throw new Error(`não encontrado: ${item}`);
  fs.cpSync(origem, path.join(DESTINO, item), {
    recursive: true,
    filter: o => !path.basename(o).startsWith(".")
  });
}
(function contar(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) contar(p); else { arquivos++; bytes += fs.statSync(p).size; }
  }
})(DESTINO);
console.log(`Pacote pronto em dist/hemorush/: ${arquivos} arquivos, ${(bytes / 1024).toFixed(0)} KB.`);
