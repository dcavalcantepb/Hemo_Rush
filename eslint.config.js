// ESLint (flat config).
// O jogo usa scripts clássicos que compartilham o escopo global, carregados em ordem pelo index.html
// (ver docs/ARQUITETURA.md). Para o lint entender isso, cada arquivo de js/ recebe como globais os nomes
// declarados no nível superior dos OUTROS arquivos. Assim, nome digitado errado entre arquivos vira erro.
const fs = require("node:fs");
const path = require("node:path");
const js = require("@eslint/js");
const globals = require("globals");
const espree = require("espree");

const PASTA_JS = path.join(__dirname, "js");

function nomesDeclarados(arquivo) {
  const ast = espree.parse(fs.readFileSync(arquivo, "utf8"), { ecmaVersion: "latest", sourceType: "script" });
  const nomes = [];
  for (const no of ast.body) {
    if ((no.type === "FunctionDeclaration" || no.type === "ClassDeclaration") && no.id) nomes.push(no.id.name);
    if (no.type === "VariableDeclaration") for (const d of no.declarations) if (d.id.type === "Identifier") nomes.push(d.id.name);
  }
  return nomes;
}

const arquivosJogo = fs.readdirSync(PASTA_JS).filter(f => f.endsWith(".js"));
let declaracoes = {};
try { declaracoes = Object.fromEntries(arquivosJogo.map(f => [f, nomesDeclarados(path.join(PASTA_JS, f))])); }
catch { /* arquivo com erro de sintaxe: o próprio ESLint vai apontar */ }

const regrasComuns = {
  ...js.configs.recommended.rules,
  // nível superior de um arquivo é usado pelos outros: só cobra variáveis locais não usadas
  "no-unused-vars": ["error", { vars: "local", args: "none", caughtErrors: "none" }],
  "no-empty": ["error", { allowEmptyCatch: true }],
  eqeqeq: ["error", "smart"],
  "no-var": "error",
  "prefer-const": ["error", { destructuring: "all" }]
};

module.exports = [
  { ignores: ["node_modules/**", "vendor/**", "tests/saida/**"] },
  ...arquivosJogo.map(arquivo => {
    const deOutros = {};
    for (const [outro, nomes] of Object.entries(declaracoes)) if (outro !== arquivo) for (const n of nomes) deOutros[n] = "writable";
    for (const n of declaracoes[arquivo] || []) delete deOutros[n];
    return {
      files: [`js/${arquivo}`],
      languageOptions: { ecmaVersion: "latest", sourceType: "script", globals: { ...globals.browser, THREE: "readonly", ...deOutros } },
      // prefer-const não enxerga reatribuição feita em outro arquivo (ex.: estado), então fica desligada aqui
      rules: { ...regrasComuns, "prefer-const": "off" }
    };
  }),
  {
    files: ["scripts/**/*.js", "tests/**/*.js", "eslint.config.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "commonjs", globals: globals.node },
    rules: regrasComuns
  }
];
