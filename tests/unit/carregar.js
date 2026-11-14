// Carrega scripts clássicos do jogo (js/*.js) num contexto isolado do Node, como o navegador faria:
// todos compartilham o mesmo escopo global, na ordem dada. Só serve para arquivos que não tocam DOM/Three.js.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function carregar(arquivos, extras = {}) {
  const contexto = vm.createContext({ console, Math, ...extras });
  for (const arq of arquivos) {
    const caminho = path.join(__dirname, "..", "..", "js", arq);
    vm.runInContext(fs.readFileSync(caminho, "utf8"), contexto, { filename: caminho });
  }
  // const/let do nível superior ficam no escopo léxico global do contexto: lê por expressão
  return nome => vm.runInContext(nome, contexto);
}

module.exports = { carregar };
