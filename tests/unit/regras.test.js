// Regras de compatibilidade de concentrado de hemácias (ABO/Rh): o coração educativo do jogo.
// A tabela abaixo é a de referência (escrita à mão, independente do código): receptor → doadores aceitos.
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregar } = require("./carregar");

const ler = carregar(["regras.js"]);
const compativel = ler("compativel");
const isogrupo = ler("isogrupo");
const nome = ler("nome");
const motivoIncompativel = ler("motivoIncompativel");
const sortear = ler("sortear");
const TIPOS = ler("TIPOS");

const REFERENCIA = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
};

test("os 8 tipos do jogo são exatamente os da referência", () => {
  assert.deepEqual([...TIPOS].sort(), Object.keys(REFERENCIA).sort());
});

test("as 64 combinações doador × receptor batem com a tabela de referência", () => {
  for (const receptor of TIPOS) {
    for (const doador of TIPOS) {
      assert.equal(compativel(doador, receptor), REFERENCIA[receptor].includes(doador), `${doador} → ${receptor}`);
    }
  }
});

test("O− é doador universal e AB+ é receptor universal", () => {
  for (const t of TIPOS) {
    assert.ok(compativel("O-", t));
    assert.ok(compativel(t, "AB+"));
  }
});

test("isogrupo é só o mesmo tipo", () => {
  assert.ok(isogrupo("A+", "A+"));
  assert.ok(!isogrupo("A-", "A+"));
});

test("nome() usa o sinal de menos tipográfico (U+2212)", () => {
  assert.equal(nome("AB-"), "AB−");
  assert.equal(nome("O+"), "O+");
});

test("motivoIncompativel explica anticorpo e Rh", () => {
  assert.equal(motivoIncompativel("A+", "O-"), "Paciente O− tem anti-A e é Rh−: não recebe A+");
  assert.equal(motivoIncompativel("AB-", "O-"), "Paciente O− tem anti-A e anti-B: não recebe AB−");
  assert.equal(motivoIncompativel("O+", "B-"), "Paciente B− é Rh−: não recebe O+");
});

test("sortear respeita os pesos e nunca devolve chave de peso zero", () => {
  const original = Math.random;
  try {
    const contagem = { a: 0, b: 0, c: 0 };
    let x = 0;
    Math.random = () => (x = (x + 0.0137) % 1); // varredura determinística de [0, 1)
    for (let i = 0; i < 2000; i++) contagem[sortear({ a: 3, b: 1, c: 0 })]++;
    assert.equal(contagem.c, 0);
    assert.ok(Math.abs(contagem.a / contagem.b - 3) < 0.2, JSON.stringify(contagem));
  } finally {
    Math.random = original;
  }
});
