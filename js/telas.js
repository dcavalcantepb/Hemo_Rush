// =====================================================================
// FLUXO DE TELAS
// =====================================================================
function mostrar(id, sim) {
  $(id).hidden = !sim;
  if (sim && $(id).classList.contains("tela")) requestAnimationFrame(() => ajustarTela($(id)));
}
// Telas do jogo (menus, pausa, fim) sempre cabem na tela do aparelho: se o cartão for mais alto
// que o espaço, ele é reduzido proporcionalmente. Telas de texto (Sobre e tutorial) podem rolar.
const TELAS_DE_TEXTO = ["sobreTipos", "sobreAda", "tutorial"];
function ajustarTela(tela) {
  const c = tela && tela.querySelector(".cartao");
  if (!c) return;
  c.style.zoom = "";
  if (TELAS_DE_TEXTO.includes(tela.id)) return;
  const cs = getComputedStyle(tela);
  const altoLivre = tela.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const largoLivre = tela.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  // offsetHeight/offsetWidth ignoram a rotação do celular em pé (getBoundingClientRect não)
  const z = Math.min(1, altoLivre / c.offsetHeight, largoLivre / c.offsetWidth);
  if (z < 0.999) c.style.zoom = Math.max(0.5, z).toFixed(3);
}
window.addEventListener("resize", () => { const t = document.querySelector(".tela:not([hidden])"); if (t) ajustarTela(t); });
// Celular: tenta tela cheia + travar na horizontal (alguns navegadores não deixam; aí vale o aviso "Gire o celular")
const toque = window.matchMedia && matchMedia("(pointer: coarse)").matches;
function travarHorizontal() {
  if (!toque) return;
  try {
    const el = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) { travarSo(); return; }
    const pedir = el.requestFullscreen || el.webkitRequestFullscreen;
    const p = pedir ? pedir.call(el, { navigationUI: "hide" }) : null;
    const travar = () => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape").catch(() => {}); } catch (e) {} };
    if (p && p.then) p.then(travar).catch(() => {}); else travar();
  } catch (e) {}
}
function travarSo() { try { screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape").catch(() => {}); } catch (e) {} }
// celular virou para em pé no meio do plantão: pausa (o aviso "Gire o celular" cobre a tela)
if (toque && window.matchMedia) {
  const emPe = matchMedia("(orientation: portrait)");
  const aoGirar = () => { if (emPe.matches && estado === "jogando") pausar(true); };
  emPe.addEventListener ? emPe.addEventListener("change", aoGirar) : emPe.addListener(aoGirar);
}
const TELAS = ["carregando", "opcoes", "recordes", "inicio", "sobre", "sobreTipos", "sobreAda", "menu", "tutorial", "pausa", "fim", "saida"];
// a arte da Ada é a mesma da tela de dificuldade; reaproveita a imagem sem duplicar o arquivo
(function () { const src = document.querySelector("#menu .arte").src; $("arteInicio").src = src; $("arteAda").src = src; })();
const TELAS_PROPRIAS = ["carregando", "entrada", "opcoes", "recordes", "inicio", "sobre", "sobreTipos", "sobreAda", "menu", "tutorial", "saida"];
function abrirTela(id, foco) {
  estado = id;
  esconderTelas(); mostrar("hud", false); mostrar("dica", false);
  mostrar(id, true);
  focar($(foco));
}
function abrirInicio() {
  registrarRecorde();
  novoJogo();
  abrirTela("inicio", "btnIniciar");
}
function esconderTelas() { TELAS.forEach(id => mostrar(id, false)); }
function focar(b) { if (!b) return; try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } }
// ---------- Ranking local: 10 melhores por nível, guardados neste aparelho ----------
const RANKING_MAX = 10;
function lerRanking(n) {
  try { const r = JSON.parse(localStorage.getItem("hemorush-ranking-" + n) || "[]"); return Array.isArray(r) ? r : []; } catch (e) { return []; }
}
function salvarRanking(n, lista) { try { localStorage.setItem("hemorush-ranking-" + n, JSON.stringify(lista)); } catch (e) {} }
function ultimoNome() { try { return localStorage.getItem("hemorush-nome") || ""; } catch (e) { return ""; } }
function limparNome(t) { return (t || "").replace(/\s+/g, " ").trim().slice(0, 10); }
// entra no ranking assim que o plantão acaba (com o último nome usado); o jogador pode trocar o nome em seguida
let entradaRanking = null;
function entrarNoRanking(n, pontos) {
  if (pontos <= 0) return null;
  const lista = lerRanking(n);
  if (lista.length >= RANKING_MAX && pontos <= lista[lista.length - 1].pontos) return null;
  const item = { id: Date.now() + "-" + Math.random().toString(36).slice(2, 6), nome: limparNome(ultimoNome()) || "Jogador", pontos, data: new Date().toISOString().slice(0, 10) };
  lista.push(item);
  lista.sort((a, b) => b.pontos - a.pontos);
  lista.length = Math.min(lista.length, RANKING_MAX);
  salvarRanking(n, lista);
  return { nivel: n, id: item.id, posicao: lista.findIndex(x => x.id === item.id) + 1 };
}
function renomearNoRanking(nomeNovo) {
  if (!entradaRanking) return;
  const nomeOk = limparNome(nomeNovo) || "Jogador";
  const lista = lerRanking(entradaRanking.nivel);
  const item = lista.find(x => x.id === entradaRanking.id);
  if (item) { item.nome = nomeOk; salvarRanking(entradaRanking.nivel, lista); }
  try { localStorage.setItem("hemorush-nome", nomeOk); } catch (e) {}
}
function registrarRecorde() {
  if (CONFIG.zen) return false;
  if (jogo && jogo.pontos > recorde) { recorde = jogo.pontos; salvarRecorde(nivelAtual, recorde); return true; }
  return false;
}
function desenharMenu() {
  $("rec-hemozen").textContent = "Sem placar: é só curtir";
  RANQUEADOS.forEach(n => {
    const r = lerRecorde(n);
    $("rec-" + n).textContent = r > 0 ? `Recorde: ${fmt(r)} pontos` : "Sem recorde ainda";
  });
}
function abrirMenu() {
  registrarRecorde();
  if (typeof marcarEscolhido === "function") marcarEscolhido(null);
  estado = "menu";
  esconderTelas(); mostrar("hud", false); mostrar("dica", false);
  novoJogo();
  desenharMenu();
  mostrar("menu", true);
  focar($("nv-" + nivelAtual));
}
let tutorialOrigem = "menu";
function irPagina(n) {
  $("pag1").hidden = n !== 1; $("pag2").hidden = n !== 2;
  focar(n === 1 ? $("btnTutProx") : $("btnTutFim"));
}
function abrirTutorial(origem) {
  tutorialOrigem = origem;
  estado = "tutorial";
  esconderTelas();
  $("tagCrachas").textContent = CONFIG.zen ? "∞ crachás" : `${CONFIG.crachas} crachás`;
  $("textoCrachas").textContent = CONFIG.zen
    ? "O plantão só acaba quando você quiser: pause e escolha Encerrar plantão. O Hemozen fica fora do ranking."
    : "Perdeu todos, acabou o plantão. Quanto mais pontos, maior a pressão.";
  $("tagErro").textContent = CONFIG.zen ? "Errou?" : "−1 crachá";
  $("textoErro").textContent = CONFIG.zen
    ? "Sem perder crachá: a Ada explica por que a bolsa não serve e você tenta de novo. Se o tempo acabar, o transportador volta depois."
    : "Bolsa incompatível ou pedido com tempo esgotado.";
  $("tagRapidez").textContent = `+${CONFIG.bonusRapidez}`;
  $("textoRapidez").textContent = "Rapidez: entregue com mais da metade do tempo do pedido sobrando e ganhe pontos extras."
    + (NIVEIS[nivelAtual].virada ? ` Depois de ${fmt(NIVEIS[nivelAtual].virada.pontos)} pontos, só vale com mais de 60% do tempo.` : "");
  $("avisoRecarga").innerHTML = CONFIG.poderesComecamRecarregando
    ? `<b>Atenção:</b> no Hemopleno e no Hemossauro, os telefones e o café começam o plantão recarregando. Os telefones liberam em ${CONFIG.recargaInicialTelefones} s e o café em ${CONFIG.cafeRecarga} s.`
    : "";
  $("btnTutFim").textContent = origem === "pausa" ? "Voltar à pausa" : `Começar plantão ${NIVEIS[nivelAtual].nome}`;
  mostrar("tutorial", true);
  irPagina(1);
}
function fimTutorial() {
  if (tutorialOrigem === "pausa") { estado = "pausado"; esconderTelas(); mostrar("pausa", true); focar($("btnContinuar")); }
  else comecar();
}
// tela de carregamento: espera a condição ficar pronta (com um limite, para nunca travar)
function aguardar(texto, pronto, limiteMs, depois) {
  if (pronto()) { depois(); return; }
  abrirTela("carregando");
  $("textoCarregando").textContent = texto;
  const t0 = performance.now();
  const checar = () => { if (pronto() || performance.now() - t0 > limiteMs) depois(); else setTimeout(checar, 100); };
  checar();
}
function comecar() {
  // a música do plantão é gravada em segundo plano; se ainda não ficou pronta, espera um instante
  const trilha = CONFIG.zen ? "zen" : "jogo";
  if (!Som.pronta(trilha, 0)) { aguardar("Afinando a música do plantão…", () => Som.pronta(trilha, 0), 8000, comecarAgora); return; }
  comecarAgora();
}
function comecarAgora() {
  travarHorizontal();
  aplicarNivel(nivelAtual); // volta os números do nível ao original (desfaz a virada da partida anterior)
  novoJogo();
  Som.recomecar();
  estado = "jogando";
  esconderTelas();
  mostrar("hud", true); mostrar("dica", true);
  const faixa = $("faixaPlantao");
  $("faixaNivel").textContent = `Plantão ${NIVEIS[nivelAtual].nome}`;
  faixa.hidden = true; void faixa.offsetWidth; faixa.hidden = false;   // reinicia a animação
  clearTimeout(faixa._t); faixa._t = setTimeout(() => { faixa.hidden = true; }, 1900);
  canvas.focus();
}
function pausar(sim) {
  if (sim && estado === "jogando") {
    estado = "pausado";
    $("faixaPlantao").hidden = true;
    for (const k in entrada) entrada[k] = false;
    $("btnEncerrar").hidden = !CONFIG.zen;
    esconderTelas(); mostrar("pausa", true);
    focar($("btnContinuar"));
  } else if (!sim && estado === "pausado") {
    estado = "jogando"; mostrar("pausa", false); canvas.focus();
  }
}
function sairDoJogo() {
  registrarRecorde();
  estado = "saida";
  esconderTelas(); mostrar("hud", false); mostrar("dica", false);
  try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); } catch (e) {}
  mostrar("saida", true);
  focar($("btnSaidaMenu"));
}
function fimDeJogo() {
  estado = "fim";
  $("faixaPlantao").hidden = true;
  const novo = registrarRecorde();
  $("fimPontos").textContent = fmt(jogo.pontos);
  $("fimRecorde").textContent = fmt(recorde);
  $("fimIso").textContent = jogo.iso; $("fimHetero").textContent = jogo.hetero;
  $("fimErros").textContent = jogo.erros; $("fimPerdidos").textContent = jogo.perdidos;
  $("fimDescartes").textContent = jogo.descartes;
  const nv = NIVEIS[nivelAtual].nome;
  $("rotuloFimRecorde").textContent = CONFIG.zen ? "Atendidos" : "Recorde";
  if (CONFIG.zen) {
    const atend = jogo.iso + jogo.hetero;
    $("fimRecorde").textContent = fmt(atend);
    const pct = atend ? Math.round(jogo.iso / atend * 100) : 0;
    $("fimTexto").textContent = atend
      ? `Plantão Hemozen encerrado: ${atend} ${atend === 1 ? "paciente atendido" : "pacientes atendidos"}, ${pct}% em isogrupo. Bom descanso, Ada!`
      : "Plantão Hemozen encerrado. Volte quando quiser relaxar.";
    Som.tocar("recorde");
    entradaRanking = null;
    $("rankingNovo").hidden = true;
    esconderTelas(); mostrar("fim", true); mostrar("dica", false);
    desarmarFim();
    fimBloqueadoAte = performance.now() + 600;
    focar($("btnDeNovo"));
    atualizarHud();
    return;
  }
  $("fimTexto").innerHTML = novo && jogo.pontos > 0
    ? `<span class="novo-recorde">Novo recorde no ${nv}!</span> A Ada fechou o plantão com a melhor marca até agora.`
    : `Plantão ${nv}: a Ada perdeu os ${CONFIG.crachas} crachás. Bora tentar de novo?`;
  Som.tocar(novo && jogo.pontos > 0 ? "recorde" : "fim");
  entradaRanking = entrarNoRanking(nivelAtual, jogo.pontos);
  const caixaNome = $("rankingNovo");
  caixaNome.hidden = !entradaRanking;
  if (entradaRanking) {
    $("rankingMsg").textContent = `Você ficou em ${entradaRanking.posicao}º lugar no ranking do ${nv}! Seu nome:`;
    $("nomeRanking").value = ultimoNome();
    $("nomeRanking").disabled = false; $("btnSalvarNome").disabled = false;
    $("rankingDica").textContent = "Até 10 letras. Enter salva.";
  }
  esconderTelas(); mostrar("fim", true); mostrar("dica", false);
  desarmarFim();
  fimBloqueadoAte = performance.now() + 1200;
  focar($("btnDeNovo"));
  // o campo de nome só recebe o foco depois do respiro, para o Espaço "do furor" não cair nele
  if (entradaRanking) setTimeout(() => { if (estado === "fim") { const c = $("nomeRanking"); focar(c); c.select(); } }, 1250);
  atualizarHud();
}
// No celular não existe "passar o mouse": o 1º toque escolhe o nível (e mostra a arte), o 2º confirma.
const semMouse = window.matchMedia ? matchMedia("(hover: none)") : { matches: false };
let nivelEscolhido = null;
function marcarEscolhido(n) {
  nivelEscolhido = n;
  Object.keys(NIVEIS).forEach(k => $("nv-" + k).classList.toggle("escolhido", k === n));
}
Object.keys(NIVEIS).forEach(n => $("nv-" + n).addEventListener("click", () => {
  if (semMouse.matches && nivelEscolhido !== n) { marcarEscolhido(n); mostrarArteNivel(n); return; }
  marcarEscolhido(null);
  aplicarNivel(n); abrirTutorial("menu");
}));
$("btnTutProx").addEventListener("click", () => irPagina(2));
$("btnTutVoltar").addEventListener("click", () => irPagina(1));
$("btnTutFim").addEventListener("click", fimTutorial);
$("btnPausa").addEventListener("click", () => pausar(true));
$("btnContinuar").addEventListener("click", () => pausar(false));
$("btnReiniciar").addEventListener("click", comecar);
$("btnEncerrar").addEventListener("click", fimDeJogo);
$("btnTutorialPausa").addEventListener("click", () => abrirTutorial("pausa"));
$("btnMenu").addEventListener("click", abrirInicio);

// Arte da Ada para cada dificuldade. Quando as imagens ficarem prontas, é só preencher aqui
// (o mesmo formato da arte atual, quase quadrado). Nível sem imagem usa a arte padrão.
const ARTE_NIVEIS = {
  hemobaby: "assets/img/nivel-hemobaby.webp",
  hemopleno: "assets/img/nivel-hemopleno.webp",
  hemossauro: "assets/img/nivel-hemossauro.webp",
  hemozen: "assets/img/nivel-hemozen.webp"
};
const arteMenu = document.querySelector("#menu .arte");
const ARTE_PADRAO = arteMenu.getAttribute("src");
Object.values(ARTE_NIVEIS).forEach(src => { if (src) { const i = new Image(); i.src = src; } }); // pré-carrega
let trocaArte = null;
function mostrarArteNivel(n) {
  const src = (n && ARTE_NIVEIS[n]) || ARTE_PADRAO;
  if (arteMenu.getAttribute("src") === src) return;
  clearTimeout(trocaArte);
  arteMenu.classList.add("trocando");
  trocaArte = setTimeout(() => { arteMenu.src = src; arteMenu.classList.remove("trocando"); }, 120);
}
Object.keys(NIVEIS).forEach(n => {
  const b = $("nv-" + n);
  b.addEventListener("mouseenter", () => mostrarArteNivel(n));   // mouse em cima
  b.addEventListener("focus", () => mostrarArteNivel(n));        // setas do teclado
});
document.querySelector("#menu .niveis").addEventListener("mouseleave", () => {
  const f = document.activeElement;
  mostrarArteNivel(f && f.dataset ? f.dataset.nivel : null);
});
// Modo evento: dificuldade travada no Hemopleno (todos disputam o mesmo ranking)
let modoEvento = false;
try { modoEvento = localStorage.getItem("hemorush-evento") === "1"; } catch (e) {}
function desenharEvento() {
  $("btnOpEvento").textContent = modoEvento ? "Modo evento: ligado" : "Modo evento: desligado";
  $("btnOpEvento").classList.toggle("ligado", modoEvento);
  $("seloEvento").hidden = !modoEvento;
}
$("btnOpEvento").addEventListener("click", () => {
  modoEvento = !modoEvento;
  try { localStorage.setItem("hemorush-evento", modoEvento ? "1" : "0"); } catch (e) {}
  desenharEvento();
});
desenharEvento();
function iniciar() {
  if (modoEvento) { aplicarNivel("hemopleno"); abrirTutorial("menu"); }  // pula a escolha de dificuldade
  else abrirMenu();
}
$("btnIniciar").addEventListener("click", iniciar);
$("btnSobre").addEventListener("click", () => abrirTela("sobre", "btnSobreTipos"));
$("btnSairInicio").addEventListener("click", sairDoJogo);

$("btnSobreTipos").addEventListener("click", () => abrirTela("sobreTipos", "btnTiposVoltar"));
$("btnSobreAda").addEventListener("click", () => abrirTela("sobreAda", "btnAdaVoltar"));
$("btnSobreVoltar").addEventListener("click", () => abrirTela("inicio", "btnSobre"));
$("btnTiposVoltar").addEventListener("click", () => abrirTela("sobre", "btnSobreTipos"));
$("btnAdaVoltar").addEventListener("click", () => abrirTela("sobre", "btnSobreAda"));
$("btnMenuVoltar").addEventListener("click", () => abrirTela("inicio", "btnIniciar"));
$("btnPausa").addEventListener("click", () => Som.tocar("abrir"));
function desenharSom() {
  $("icoSomOn").hidden = Som.mudo; $("icoSomOff").hidden = !Som.mudo;
  $("btnSom").setAttribute("aria-label", Som.mudo ? "Ligar o som" : "Desligar o som");
  const op = document.getElementById("btnOpSom");
  if (op) op.textContent = Som.mudo ? "Som e música: desligados" : "Som e música: ligados";
}
$("btnSom").addEventListener("click", () => { Som.alternar(); desenharSom(); });
desenharSom();
// som de clique em qualquer botão das telas (mouse, toque ou Espaço)
document.addEventListener("click", e => { if (e.target.closest && e.target.closest(".tela button")) Som.tocar("confirmar"); });
$("btnSair").addEventListener("click", sairDoJogo);
$("btnSaidaMenu").addEventListener("click", abrirInicio);
// Tela de fim: no furor do jogo é fácil apertar Espaço sem querer. Por isso:
// 1) por 1,2 s depois do fim, nenhuma tecla ou clique vale;  2) sair pede confirmação ("Tem certeza?").
let fimBloqueadoAte = 0;
const ROTULOS_FIM = { btnDeNovo: "Jogar de novo", btnFimMenu: "Voltar ao menu" };
function desarmarFim() {
  Object.entries(ROTULOS_FIM).forEach(([id, txt]) => { const b = $(id); b.textContent = txt; b.classList.remove("confirmar"); delete b.dataset.armado; });
}
function cliqueComConfirmacao(id, acao) {
  $(id).addEventListener("click", () => {
    if (performance.now() < fimBloqueadoAte) return;
    const b = $(id);
    if (b.dataset.armado) { desarmarFim(); acao(); return; }
    desarmarFim();
    b.dataset.armado = "1"; b.classList.add("confirmar");
    b.textContent = "Tem certeza? Confirme de novo";
    clearTimeout(b._t); b._t = setTimeout(() => { if (b.dataset.armado) desarmarFim(); }, 4000);
  });
}
cliqueComConfirmacao("btnDeNovo", comecar);
function confirmarNome() {
  if (!entradaRanking) return;
  renomearNoRanking($("nomeRanking").value);
  $("nomeRanking").disabled = true; $("btnSalvarNome").disabled = true;
  $("rankingDica").textContent = "Nome salvo!";
  Som.tocar("confirmar");
  focar($("btnDeNovo"));
}
$("btnSalvarNome").addEventListener("click", confirmarNome);
// sair da tela de fim sem apertar "Salvar" também guarda o nome que estiver digitado
["btnDeNovo", "btnFimMenu"].forEach(id => $(id).addEventListener("click", () => { if (entradaRanking && !$("nomeRanking").disabled && $("nomeRanking").value.trim()) renomearNoRanking($("nomeRanking").value); }, true));

// ---------- tela de recordes ----------
let abaRanking = "hemopleno";
function desenharRanking(n) {
  abaRanking = n;
  RANQUEADOS.forEach(k => { const a = $("aba-" + k); a.classList.toggle("ativa", k === n); a.setAttribute("aria-selected", k === n); });
  const lista = lerRanking(n), ol = $("listaRanking");
  ol.innerHTML = "";
  if (!lista.length) { const li = document.createElement("li"); li.className = "vazio"; li.textContent = "Ninguém neste ranking ainda. Que tal ser o primeiro?"; ol.appendChild(li); }
  lista.forEach(item => {
    const li = document.createElement("li");
    if (entradaRanking && entradaRanking.id === item.id) li.classList.add("destaque");
    const [, m, d] = (item.data || "").split("-");
    li.innerHTML = `<span class="nome"></span><span class="pts">${fmt(item.pontos)}</span><span class="data">${d && m ? d + "/" + m : ""}</span>`;
    li.querySelector(".nome").textContent = item.nome;   // nome digitado entra como texto, nunca como código
    ol.appendChild(li);
  });
}
RANQUEADOS.forEach(k => $("aba-" + k).addEventListener("click", () => desenharRanking(k)));
$("btnRecordes").addEventListener("click", () => {
  const n = RANQUEADOS.includes(nivelAtual) ? nivelAtual : "hemopleno";
  desenharRanking(n); abrirTela("recordes", "aba-" + n);
});
$("btnRecordesVoltar").addEventListener("click", () => abrirTela("inicio", "btnRecordes"));

// ---------- Opções ----------
$("btnOpcoes").addEventListener("click", () => { desarmarLimpar(); abrirTela("opcoes", "btnOpSom"); });
$("btnOpVoltar").addEventListener("click", () => abrirTela("inicio", "btnOpcoes"));
$("btnOpSom").addEventListener("click", () => { Som.alternar(); desenharSom(); });
function desenharGraficos() { $("btnOpGraficos").textContent = Qualidade.descricao(); }
$("btnOpGraficos").addEventListener("click", () => { Qualidade.proximoModo(); desenharGraficos(); });
desenharGraficos();
function desarmarLimpar() {
  const b = $("btnLimparRecordes");
  delete b.dataset.armado; b.classList.remove("confirmar"); b.textContent = "Limpar recordes";
  $("avisoLimpar").textContent = "Apaga o ranking e os recordes dos três níveis neste aparelho.";
}
function limparRecordes() {
  Object.keys(NIVEIS).forEach(n => {
    try { localStorage.removeItem("hemorush-ranking-" + n); localStorage.removeItem("hemominas-recorde-" + n); } catch (e) {}
  });
  try { localStorage.removeItem("hemominas-recorde"); } catch (e) {}
  recorde = 0; entradaRanking = null;
}
// pede confirmação: o 1º clique arma o botão, o 2º apaga
$("btnLimparRecordes").addEventListener("click", () => {
  const b = $("btnLimparRecordes");
  if (b.dataset.armado) {
    limparRecordes(); desarmarLimpar();
    $("avisoLimpar").textContent = "Pronto, os recordes foram apagados.";
    return;
  }
  b.dataset.armado = "1"; b.classList.add("confirmar");
  b.textContent = "Tem certeza? Confirme de novo";
  clearTimeout(b._t); b._t = setTimeout(() => { if (b.dataset.armado) desarmarLimpar(); }, 4000);
});
cliqueComConfirmacao("btnFimMenu", abrirInicio);

// Teclado nas telas (menu, tutorial, pausa, fim): setas andam entre os botões, Espaço ou Enter confirmam
function botoesDaTela() {
  const t = TELAS.map(id => $(id)).find(el => !el.hidden);
  return t ? [...t.querySelectorAll("button, a.doacao")].filter(b => !b.disabled && b.getClientRects().length) : [];
}
function navegarTela(e) {
  if (estado === "fim" && performance.now() < fimBloqueadoAte) { e.preventDefault(); return; }
  const bs = botoesDaTela();
  if (!bs.length) return;
  const i = bs.indexOf(document.activeElement);
  if (MAPA[e.code]) {
    e.preventDefault();
    const volta = MAPA[e.code] === "up" || MAPA[e.code] === "left";
    focar(bs[i < 0 ? 0 : (i + (volta ? -1 : 1) + bs.length) % bs.length]);
    Som.tocar("mover");
  } else if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    if (!e.repeat) (i >= 0 ? bs[i] : bs[0]).click();
  }
}
