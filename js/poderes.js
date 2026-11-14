// =====================================================================
// PODERES: Captação! (O−) e Rede Hemominas
// =====================================================================
function gerarEstoqueRede() {
  // embaralhamento de Fisher-Yates (o sort com Math.random favorecia os primeiros tipos da lista)
  const tipos = [...TIPOS];
  for (let i = tipos.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [tipos[i], tipos[j]] = [tipos[j], tipos[i]]; }
  tipos.length = CONFIG.redeTiposDisponiveis;
  const est = {};
  tipos.forEach(t => { est[t] = 1 + Math.floor(Math.random() * CONFIG.redeMaxPorTipo); });
  garantirRede(est);
  return est;
}
// Se algum pedido está sem saída, a Rede sempre tem pelo menos um tipo que sirva para ele
// (troca um dos tipos sorteados por um compatível, mantendo o mesmo número de tipos)
function garantirRede(est) {
  for (const r of pedidosSemSaida()) {
    if (Object.keys(est).some(d => est[d] > 0 && compativel(d, r))) continue;
    const trocaveis = Object.keys(est).filter(d => !pedidosSemSaida().some(x => compativel(d, x)));
    const sai = trocaveis.length ? trocaveis[Math.floor(Math.random() * trocaveis.length)] : Object.keys(est)[0];
    if (sai) delete est[sai];
    est[sortearCompativel(r)] = 1 + Math.floor(Math.random() * CONFIG.redeMaxPorTipo);
  }
}
function novoEstadoPoderes() {
  return { painel: null, sel: 0, captacao: { recarga: 0 }, rede: { recarga: 0, estoque: gerarEstoqueRede() }, cafe: { recarga: 0, ativo: 0 } };
}
poderes = novoEstadoPoderes();   // estado inicial (novoJogo recria a cada partida)
const ORDEM_REDE = ["O-", "A-", "B-", "AB-", "O+", "A+", "B+", "AB+"];
const COLUNAS_REDE = 4;
const disponivelRede = i => (poderes.rede.estoque[ORDEM_REDE[i]] || 0) > 0;

function descartarBolsa() {
  if (!carregando.tipo) return;
  const t = carregando.tipo;
  ada.remove(carregando.mesh);
  carregando.tipo = null; carregando.mesh = null; carregando.origem = null;
  jogo.descartes++;
  flutuar(`${nome(t)} descartada`, "#4b6074", DESCARTE.x - 0.6, 2.2, DESCARTE.z - 0.6);
  Som.tocar("descarte");
  atualizarHud();
}
function abrirPainel(qual) {
  poderes.painel = qual;
  if (qual === "rede" && poderes.rede.estoque) garantirRede(poderes.rede.estoque); // pedido novo desde o último sorteio
  Som.tocar("abrir");
  for (const k in entrada) entrada[k] = false;
  const painel = $("painelPoder"), corpo = $("painelCorpo");
  painel.classList.toggle("rede", qual === "rede");
  painel.classList.toggle("descarte", qual === "descarte");
  corpo.innerHTML = "";
  if (qual === "descarte") {
    $("painelTitulo").innerHTML = `<span>Descarte</span> Descartar a bolsa ${nome(carregando.tipo)}?`;
    const op = document.createElement("div"); op.className = "opcoes-descarte";
    ["Descartar", "Cancelar"].forEach((txt, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "botao-poder"; b.id = "desc-" + i; b.textContent = txt;
      b.addEventListener("click", () => { poderes.sel = i; confirmarPainel(); });
      op.appendChild(b);
    });
    corpo.appendChild(op);
    poderes.sel = 0;
    $("painelDica").innerHTML = `O plantão continua correndo. <kbd>←</kbd><kbd>→</kbd> escolher · <kbd>Espaço</kbd> confirmar.`;
    marcarSelecao();
  } else if (qual === "captacao") {
    $("painelTitulo").innerHTML = "<span>Captação!</span> Convocar O−";
    const b = document.createElement("button");
    b.type = "button"; b.className = "botao-poder sel";
    b.textContent = `Convocar doadores O− (${CONFIG.captacaoBolsas} bolsas)`;
    b.addEventListener("click", confirmarPainel);
    corpo.appendChild(b);
    $("painelDica").innerHTML = `Chegam em ${CONFIG.captacaoTempoChegada} s. Depois, ${CONFIG.captacaoRecarga} s para convocar de novo. <kbd>Espaço</kbd> confirma.`;
  } else {
    $("painelTitulo").innerHTML = "<span>Rede Hemominas</span> O que as unidades têm agora";
    const grade = document.createElement("div"); grade.className = "grade-tipos";
    ORDEM_REDE.forEach((t, i) => {
      const qtd = poderes.rede.estoque[t] || 0;
      const b = document.createElement("button");
      b.type = "button"; b.id = "rede-" + i; b.disabled = !qtd;
      b.innerHTML = `${nome(t)}<small>${qtd ? qtd + (qtd > 1 ? " bolsas" : " bolsa") : "não tem"}</small>`;
      b.addEventListener("click", () => { poderes.sel = i; confirmarPainel(); });
      grade.appendChild(b);
    });
    corpo.appendChild(grade);
    poderes.sel = ORDEM_REDE.findIndex((_, i) => disponivelRede(i));
    $("painelDica").innerHTML = `<kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> escolher · <kbd>Espaço</kbd> pedir. Chegam em ${CONFIG.redeTempoChegada} s.`;
    marcarSelecao();
  }
  painel.hidden = false;
}
function fecharPainel() {
  poderes.painel = null;
  $("painelPoder").hidden = true;
}
$("btnFecharPainel").addEventListener("click", fecharPainel);
function marcarSelecao() {
  [0, 1].forEach(i => { const b = $("desc-" + i); if (b) b.classList.toggle("sel", i === poderes.sel); });
  ORDEM_REDE.forEach((_, i) => { const b = $("rede-" + i); if (b) b.classList.toggle("sel", i === poderes.sel); });
}
function moverSelecao(direcao) {
  Som.tocar("mover");
  if (poderes.painel === "descarte") { poderes.sel = 1 - poderes.sel; marcarSelecao(); return; }
  if (poderes.painel !== "rede") return;
  const linhas = ORDEM_REDE.length / COLUNAS_REDE;
  // o cursor anda livre por todos os tipos; só a escolha de um tipo indisponível é bloqueada
  const sel = poderes.sel, col = sel % COLUNAS_REDE, lin = Math.floor(sel / COLUNAS_REDE);
  if (direcao === "left") poderes.sel = lin * COLUNAS_REDE + (col + COLUNAS_REDE - 1) % COLUNAS_REDE;
  if (direcao === "right") poderes.sel = lin * COLUNAS_REDE + (col + 1) % COLUNAS_REDE;
  if (direcao === "up") poderes.sel = ((lin + linhas - 1) % linhas) * COLUNAS_REDE + col;
  if (direcao === "down") poderes.sel = ((lin + 1) % linhas) * COLUNAS_REDE + col;
  marcarSelecao();
}
function confirmarPainel() {
  if (!poderes.painel || estado !== "jogando") return;
  if (poderes.painel === "descarte") {
    if (poderes.sel === 0) descartarBolsa();
    fecharPainel();
    return;
  }
  const T = TELEFONES[poderes.painel];
  if (poderes.painel === "captacao") {
    for (let i = 0; i < CONFIG.captacaoBolsas; i++) chegadas.push({ tipo: "O-", origem: "captacao", t: CONFIG.captacaoTempoChegada + i * 0.4 });
    poderes.captacao.recarga = CONFIG.captacaoRecarga;
    Som.tocar("telefone");
    flutuar(`Doadores O− convocados!`, "#c81e3a", T.x, 1.8, T.z - 0.6);
  } else {
    if (!disponivelRede(poderes.sel)) return; // tipo indisponível: só não pede
    const t = ORDEM_REDE[poderes.sel], qtd = poderes.rede.estoque[t];
    for (let i = 0; i < qtd; i++) chegadas.push({ tipo: t, origem: "rede", t: CONFIG.redeTempoChegada + i * 0.4 });
    poderes.rede.recarga = CONFIG.redeRecarga;
    Som.tocar("telefone");
    poderes.rede.estoque = null; // a rede reabastece quando o telefone recarregar
    flutuar(`Rede: ${qtd}× ${nome(t)} a caminho`, "#1f6fc0", T.x, 1.8, T.z - 0.6);
  }
  fecharPainel();
}
function atualizarPoderes(dt) {
  if (poderes.cafe.ativo > 0) poderes.cafe.ativo = Math.max(0, poderes.cafe.ativo - dt);
  ["captacao", "rede", "cafe"].forEach(q => { if (poderes[q].recarga > 0) poderes[q].recarga = Math.max(0, poderes[q].recarga - dt); });
  if (poderes.rede.recarga <= 0 && !poderes.rede.estoque) { poderes.rede.estoque = gerarEstoqueRede(); poderes.rede.tAtualiza = 0; }
  // o estoque das outras unidades muda com o tempo, mesmo sem ligar (nunca com o painel aberto)
  poderes.rede.tAtualiza = (poderes.rede.tAtualiza || 0) + dt;
  if (poderes.rede.tAtualiza >= CONFIG.redeAtualiza && poderes.painel !== "rede" && poderes.rede.estoque) {
    poderes.rede.estoque = gerarEstoqueRede(); poderes.rede.tAtualiza = 0;
  }
  for (let i = chegadas.length - 1; i >= 0; i--) {
    chegadas[i].t -= dt;
    if (chegadas[i].t <= 0) { filaEntrada.push(chegadas[i]); chegadas.splice(i, 1); }
  }
  entrarNoEstoque();
}
// status dos poderes: chips no canto de baixo, longe dos objetos da sala
// Só escreve no DOM quando o texto muda (o HUD é atualizado a cada quadro; regravar o mesmo texto força recálculo de estilo)
function escrever(el, texto) { texto = String(texto); if (el._txt !== texto) { el._txt = texto; el.textContent = texto; } }
function atualizarChip(id, texto, pronto, ativo) {
  const el = $(id);
  escrever(el.querySelector("span"), texto);
  el.classList.toggle("pronto", pronto);
  el.classList.toggle("ativo", !!ativo);
}
const telaEstreita = window.matchMedia ? matchMedia("(max-width: 760px), (pointer: coarse)") : { matches: false };
function atualizarTelefones() {
  $("statusPoderes").hidden = !(estado === "jogando" || estado === "pausado" || estado === "fim");
  const curto = telaEstreita.matches;
  Object.entries(TELEFONES).forEach(([qual, T]) => {
    const r = poderes[qual].recarga, rotulo = qual === "captacao" ? (curto ? "Captação" : "Captação!") : (curto ? "Rede" : "Rede Hemominas");
    atualizarChip("chip-" + qual, r > 0 ? `${rotulo} · ${Math.ceil(r)} s` : `${rotulo} pronta`, r <= 0);
    T.mat.color.setHex(r > 0 ? T.apagado : T.cor);
  });
  const c = poderes.cafe;
  atualizarChip("chip-cafe", c.ativo > 0 ? `Café ativo · ${Math.ceil(c.ativo)} s` : c.recarga > 0 ? `Café · ${Math.ceil(c.recarga)} s` : "Café pronto", c.recarga <= 0, c.ativo > 0);
  CAFE.luz.material.color.setHex(c.recarga > 0 ? 0xc81e3a : 0x3ad16f);
  const tempo = performance.now() / 1000;
  vapor.forEach(v => {
    const f = (tempo * 0.5 + v.userData.fase) % 1;
    v.visible = c.recarga <= 0;
    v.position.set(CAFE.x - 0.05 + Math.sin((f + v.userData.fase) * 6) * 0.05, 1.55 + f * 0.7, CAFE.z - 0.1);
    v.material.opacity = 0.55 * (1 - f);
    v.scale.setScalar(0.7 + f * 0.8);
  });
}
