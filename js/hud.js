// =====================================================================
// HUD
// =====================================================================
function desenharCrachas() {
  const box = $("crachas"); box.innerHTML = "";
  if (CONFIG.zen) { box.innerHTML = '<span class="infinito" aria-label="crachás infinitos">∞</span>'; return; }
  for (let i = 0; i < CONFIG.crachas; i++) {
    const c = document.createElement("div");
    c.className = "cracha" + (i >= jogo.crachas ? " perdido" : "");
    box.appendChild(c);
  }
}
function atualizarHud() {
  escrever($("pontos"), fmt(jogo.pontos));
  escrever($("rotuloRecorde"), CONFIG.zen ? "Atendidos" : "Recorde");
  escrever($("rotuloPressao"), CONFIG.zen ? "Clima" : "Pressão");
  escrever($("recordeHud"), CONFIG.zen ? fmt(jogo.iso + jogo.hetero) : fmt(Math.max(recorde, jogo.pontos)));
  const aCaminho = chegadas.length + filaEntrada.length;
  escrever($("estoqueHud"), `${qtdEstoque()}/${CONFIG.estoqueCapacidade}` + (aCaminho ? ` +${aCaminho}` : ""));
  escrever($("nivelHud"), CONFIG.zen ? "Zen" : nivel() + 1);
  if (jogo.nivelVisto === undefined) jogo.nivelVisto = nivel();
  if (nivel() > jogo.nivelVisto) { jogo.nivelVisto = nivel(); if (estado === "jogando") Som.tocar("pressao"); }
}
let dicaAnterior = "";
function atualizarDica(alvo) {
  let txt;
  if (poderes.painel === "descarte") txt = "Confirme o <b>descarte</b>";
  else if (poderes.painel === "rede") txt = "Escolha o tipo na <b>Rede Hemominas</b>";
  else if (poderes.painel === "captacao") txt = "Confirme a <b>convocação de O−</b>";
  else if (alvo && alvo.tipo === "cafe") {
    const c = poderes.cafe;
    txt = c.recarga > 0 ? `Cafeteira passando café de novo: ${Math.ceil(c.recarga)} s` : "Espaço: tomar um <b>café</b>";
  }
  else if (alvo && alvo.tipo === "telefone") {
    const T = TELEFONES[alvo.qual], r = poderes[alvo.qual].recarga;
    txt = r > 0 ? `${T.nome} recarregando: ${Math.ceil(r)} s` : `Espaço: ligar para <b>${T.nome}</b>`;
  }
  else if (!alvo) txt = carregando.tipo ? `Levando <b>${nome(carregando.tipo)}</b>. Vá até um transportador.` : "Vá até o estoque e pegue uma bolsa.";
  else if (alvo.tipo === "vaga") {
    if (!carregando.tipo) txt = `Espaço: pegar <b>${nome(alvo.v.bolsa.tipo)}</b>`;
    else if (alvo.v.bolsa) txt = `Espaço: trocar <b>${nome(carregando.tipo)}</b> por <b>${nome(alvo.v.bolsa.tipo)}</b>`;
    else txt = `Espaço: devolver <b>${nome(carregando.tipo)}</b> ao estoque`;
  }
  else if (alvo.tipo === "descarte") txt = `Espaço: descartar <b>${nome(carregando.tipo)}</b> (pede confirmação)`;
  else txt = `Espaço: entregar <b>${nome(carregando.tipo)}</b> para paciente <b>${nome(alvo.t.tipo)}</b>`;
  if (txt !== dicaAnterior) { $("dica").innerHTML = txt; dicaAnterior = txt; }
}
