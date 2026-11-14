// =====================================================================
// AÇÕES
// =====================================================================
function alvoAtual() {
  const p = ada.position;
  let tel = null, dTel = ALCANCE_TELEFONE;
  Object.entries(TELEFONES).forEach(([qual, T]) => { const d = Math.hypot(T.x - p.x, T.z - p.z); if (d < dTel) { dTel = d; tel = qual; } });
  if (tel) return { tipo: "telefone", qual: tel };
  if (Math.hypot(CAFE.x - p.x, CAFE.z - p.z) < CAFE.alcance) return { tipo: "cafe" };
  if (carregando.tipo) {
    let melhor = null, d = CONFIG.alcanceTransportador;
    transportadores.forEach(t => {
      if (t.estado !== "esperando") return;
      const dist = Math.hypot(t.mesh.position.x - p.x, t.mesh.position.z - p.z);
      if (dist < d) { d = dist; melhor = { tipo: "transportador", t }; }
    });
    const dDescarte = Math.hypot(DESCARTE.x - p.x, DESCARTE.z - p.z);
    if (dDescarte < DESCARTE.alcance && dDescarte < d) return { tipo: "descarte" };
    if (melhor) return melhor;
  }
  const pertoEsquerda = p.x < -5.6, pertoFundo = p.z < -5.4;
  if (!pertoEsquerda && !pertoFundo) return null;
  let melhor = null, s = 0.7;
  vagas.forEach(v => {
    if (!carregando.tipo && !v.bolsa) return; // de mãos vazias, só vagas com bolsa
    if (v.eixo === "z" && !pertoEsquerda) return;
    if (v.eixo === "x" && !pertoFundo) return;
    const score = v.eixo === "z" ? Math.abs(v.z - p.z) : Math.abs(v.x - p.x);
    if (score < s) { s = score; melhor = { tipo: "vaga", v }; }
  });
  return melhor;
}

function agir() {
  if (estado !== "jogando") return;
  const alvo = alvoAtual();
  if (!alvo) return;
  if (alvo.tipo === "vaga") {
    const v = alvo.v;
    const naMao = carregando.tipo ? { tipo: carregando.tipo, mesh: carregando.mesh, origem: carregando.origem } : null;
    const naVaga = v.bolsa; // bolsa que está na vaga (ou null)
    if (naMao) { ada.remove(naMao.mesh); carregando.tipo = null; carregando.mesh = null; carregando.origem = null; }
    v.bolsa = null;
    if (naVaga) {
      // pega a bolsa da vaga (ou troca pela que estava na mão)
      scene.remove(naVaga.mesh);
      naVaga.mesh.position.set(0, 0.95, 0.85);
      ada.add(naVaga.mesh);
      carregando.tipo = naVaga.tipo; carregando.mesh = naVaga.mesh; carregando.origem = naVaga.origem;
    }
    if (naMao) {
      // devolve a bolsa da mão para essa vaga, mantendo a marcação
      naMao.mesh.position.set(v.x, 0.95, v.z);
      scene.add(naMao.mesh);
      v.bolsa = naMao;
    }
    Som.tocar(naVaga ? "pegar" : "soltar");
  } else if (alvo.tipo === "cafe") {
    if (poderes.cafe.recarga <= 0) {
      poderes.cafe.ativo = CONFIG.cafeDuracao;
      poderes.cafe.recarga = CONFIG.cafeRecarga;
      flutuar("Café! Ada no gás", "#7a4a26", CAFE.x, 2.0, CAFE.z - 0.6);
      Som.tocar("cafe");
    }
    return;
  } else if (alvo.tipo === "telefone") {
    if (poderes[alvo.qual].recarga <= 0) abrirPainel(alvo.qual);
    return;
  } else if (alvo.tipo === "descarte") {
    abrirPainel("descarte"); // descarte sempre pede confirmação
    return;
  } else {
    entregar(alvo.t);
  }
  atualizarHud();
}

function entregar(t) {
  const d = carregando.tipo, r = t.tipo;
  if (CONFIG.zen && !compativel(d, r)) {
    // Hemozen: o transportador devolve a bolsa, a Ada explica e ninguém perde crachá
    jogo.erros++;
    const pos = t.mesh.position;
    flutuar(motivoIncompativel(d, r), "#b45309", pos.x - 1.5, 2.6, pos.z, true);
    Som.tocar("erro");
    return;
  }
  ada.remove(carregando.mesh);
  carregando.tipo = null; carregando.mesh = null;
  const pos = t.mesh.position;
  if (!compativel(d, r)) {
    jogo.erros++;
    flutuar(`${nome(d)} é incompatível com ${nome(r)}! −1 crachá`, "#c81e3a", pos.x - 1.5, 2.6, pos.z);
    Som.tocar("erro");
    soltarFaiscas(pos.x - 0.6, pos.z, 0xc81e3a, 10);
    perderCracha();
    return; // transportador continua esperando
  }
  const rapido = CONFIG.bonusRapidez > 0 && t.total > 0 && t.tempo / t.total > CONFIG.bonusRapidezFracao;
  const extra = rapido ? CONFIG.bonusRapidez : 0;
  const txtExtra = rapido ? ` · rapidez +${extra}` : "";
  jogo.pontos += extra;
  if (isogrupo(d, r)) { jogo.pontos += CONFIG.pontosIso; jogo.iso++; Som.tocar("iso"); jogo.pulo = 0.35; soltarFaiscas(pos.x - 0.6, pos.z, 0x1d8a4e, 12); flutuar(`Isogrupo +${CONFIG.pontosIso}${txtExtra}`, "#1d8a4e", pos.x - 1.2, 2.6, pos.z); }
  else { jogo.pontos += CONFIG.pontosHetero; jogo.hetero++; Som.tocar("hetero"); soltarFaiscas(pos.x - 0.6, pos.z, 0x2f7fd0, 8); flutuar(`Compatível +${CONFIG.pontosHetero}${txtExtra}`, "#1f5f99", pos.x - 1.2, 2.6, pos.z); }
  sair(t);
}
function sair(t) {
  t.estado = "saindo";
  if (t.balao) { t.balao.remove(); t.balao = null; }
}
function perderCracha() {
  jogo.crachas--;
  desenharCrachas();
  if (jogo.crachas <= 0) fimDeJogo();
}
