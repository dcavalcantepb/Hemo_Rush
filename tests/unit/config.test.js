// Coerência dos números de balanceamento (js/config.js) e das regras fixas do jogo (ver CLAUDE.md).
const test = require("node:test");
const assert = require("node:assert/strict");
const { carregar } = require("./carregar");

const ler = carregar(["config.js", "regras.js"]);
const CONFIG = ler("CONFIG");
const NIVEIS = ler("NIVEIS");
const RANQUEADOS = ler("RANQUEADOS");
const TIPOS = ler("TIPOS");
const nivel = n => ({ ...CONFIG, ...NIVEIS[n] });

test("pontuação e crachás seguem as regras fixas do jogo", () => {
  assert.equal(CONFIG.pontosIso, 100);
  assert.equal(CONFIG.pontosHetero, 50);
  assert.equal(CONFIG.bonusRapidez, 20);
  assert.equal(CONFIG.crachas, 5);
});

test("proporções cobrem exatamente os 8 tipos e somam 100%", () => {
  assert.deepEqual(Object.keys(CONFIG.proporcoes).sort(), [...TIPOS].sort());
  const soma = Object.values(CONFIG.proporcoes).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(soma - 100) < 1e-9, `soma = ${soma}`);
});

test("cada nível só altera chaves que existem no CONFIG", () => {
  for (const [n, def] of Object.entries(NIVEIS)) {
    for (const chave of Object.keys(def)) {
      if (chave === "nome" || chave === "virada") continue;
      assert.ok(chave in CONFIG, `${n}.${chave} não existe no CONFIG`);
    }
    if (def.virada) {
      for (const chave of Object.keys(def.virada.ajustes)) assert.ok(chave in CONFIG, `${n}.virada.${chave}`);
    }
  }
});

test("mínimos e máximos são coerentes em todos os níveis (inclusive após a virada)", () => {
  const casos = Object.keys(NIVEIS).map(n => [n, nivel(n)]);
  for (const [n, def] of Object.entries(NIVEIS)) {
    if (def.virada) casos.push([`${n} (virada)`, { ...nivel(n), ...def.virada.ajustes }]);
  }
  for (const [n, c] of casos) {
    assert.ok(c.contadorMinimo <= c.contadorInicial, `${n}: contador`);
    assert.ok(c.chegadaIntervaloMinimo <= c.chegadaIntervaloInicial, `${n}: chegada`);
    assert.ok(c.transportadoresInicio <= c.transportadoresMax, `${n}: transportadores`);
    assert.ok(c.reposicaoIntervalo <= c.reposicaoIntervaloMax, `${n}: reposição`);
    assert.ok(c.estoqueInicial <= c.estoqueCapacidade, `${n}: estoque`);
    assert.ok(c.bonusRapidezFracao > 0 && c.bonusRapidezFracao < 1, `${n}: fração de rapidez`);
  }
});

test("ranking: só níveis existentes, e o Hemozen fica de fora", () => {
  for (const n of RANQUEADOS) assert.ok(n in NIVEIS, n);
  assert.ok(!RANQUEADOS.includes("hemozen"));
  assert.equal(NIVEIS.hemozen.zen, true);
});
