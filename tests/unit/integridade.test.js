// Integridade do site: tudo que o HTML, o CSS e o JS referenciam existe, e nada viola a política de segurança.
// Pega os erros mais comuns ao mexer nos arquivos (id renomeado, imagem movida, script esquecido no index.html).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const RAIZ = path.join(__dirname, "..", "..");
const ler = rel => fs.readFileSync(path.join(RAIZ, rel), "utf8");
const existe = rel => fs.existsSync(path.join(RAIZ, rel));
const html = ler("index.html");
const arquivosJs = fs.readdirSync(path.join(RAIZ, "js")).filter(f => f.endsWith(".js"));
const codigoJs = Object.fromEntries(arquivosJs.map(f => [f, ler("js/" + f)]));
const idsHtml = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));

test("todo script de js/ está no index.html, e todo script do index.html existe", () => {
  const listados = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map(m => m[1]);
  for (const src of listados) assert.ok(existe(src), `script inexistente: ${src}`);
  for (const f of arquivosJs) assert.ok(listados.includes("js/" + f), `js/${f} não é carregado pelo index.html`);
});

test("todos os scripts usam defer (ordem garantida e HTML pronto antes de rodar)", () => {
  for (const tag of html.match(/<script[^>]*>/g)) assert.match(tag, /\sdefer\b/, tag);
});

test("nenhum script ou manipulador de evento embutido no HTML (exigência da CSP)", () => {
  assert.ok(!/<script(?![^>]*\ssrc=)[^>]*>/.test(html), "há <script> sem src");
  assert.ok(!/\son[a-z]+\s*=/i.test(html), "há atributo on...= no HTML");
  assert.match(html, /http-equiv="Content-Security-Policy"/);
});

test("todo id usado com $(\"...\") ou getElementById existe no HTML", () => {
  for (const [f, codigo] of Object.entries(codigoJs)) {
    for (const m of codigo.matchAll(/(?:\$|getElementById)\(\s*"([^"]+)"\s*\)/g)) {
      assert.ok(idsHtml.has(m[1]), `${f}: id "${m[1]}" não existe no index.html`);
    }
  }
});

test("todo arquivo local referenciado pelo HTML, CSS, JS e manifesto existe", () => {
  const refs = [];
  for (const m of html.matchAll(/\s(?:src|href)="([^"#:]+)"/g)) refs.push(["index.html", m[1]]);
  const css = ler("css/style.css");
  for (const m of css.matchAll(/url\("?(?!data:)([^")]+)"?\)/g)) refs.push(["css/style.css", path.posix.join("css", m[1])]);
  for (const [f, codigo] of Object.entries(codigoJs)) {
    for (const m of codigo.matchAll(/"(assets\/[^"]+)"/g)) refs.push([f, m[1]]);
  }
  for (const i of JSON.parse(ler("manifest.webmanifest")).icons) refs.push(["manifest.webmanifest", i.src]);
  assert.ok(refs.length > 10, "poucas referências encontradas: o teste pode estar quebrado");
  for (const [origem, ref] of refs) assert.ok(existe(path.posix.normalize(ref)), `${origem}: ${ref} não existe`);
});

test("nenhum recurso externo é carregado (tudo servido pelo próprio site)", () => {
  const externos = [...html.matchAll(/<(?:script|link|img)[^>]*\s(?:src|href)="(https?:[^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(externos, []);
  for (const [f, codigo] of Object.entries(codigoJs)) {
    assert.ok(!/fetch\(|XMLHttpRequest|https?:\/\/(?!www\.w3\.org)/.test(codigo), `${f} acessa a rede`);
  }
});

test("o Three.js vendorizado é exatamente o r128 oficial (hash do cdnjs)", () => {
  const conteudo = fs.readFileSync(path.join(RAIZ, "vendor/three/three.min.js"));
  const hash = crypto.createHash("sha512").update(conteudo).digest("base64");
  assert.equal(hash, "dLxUelApnYxpLt6K2iomGngnHO83iUvZytA3YjDUCjT0HDOHKXnVYdf3hU4JjM8uEhxf9nD1/ey98U3t2vZ0qQ==");
});
