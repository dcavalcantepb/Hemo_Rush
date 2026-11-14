// =====================================================================
// ESTADO DO JOGO
// =====================================================================
// "jogo" vem antes de "poderes": novoEstadoPoderes() sorteia a Rede, que consulta pedidosSemSaida() → jogo.
let jogo = null;        // partida atual (preenchida por novoJogo)
let estado = "menu";
let poderes = null;     // estado dos poderes; inicializado em poderes.js, onde ficam as funções que o montam
let chegadas = [];     // bolsas a caminho: { tipo, origem, t }
let filaEntrada = [];  // já chegaram, esperando vaga no estoque
// Recarga no começo do plantão (Hemopleno e Hemossauro): um valor só para os dois telefones
function recargasIniciais() {
  return { captacao: CONFIG.recargaInicialTelefones, rede: CONFIG.recargaInicialTelefones, cafe: CONFIG.cafeRecarga };
}
function novoJogo() {
  efeitos.forEach(f => scene.remove(f)); efeitos.length = 0;
  // limpa cena
  vagas.forEach(v => { if (v.bolsa) { scene.remove(v.bolsa.mesh); v.bolsa = null; } });
  transportadores.forEach(t => { scene.remove(t.mesh); t.balao && t.balao.remove(); });
  transportadores.length = 0;
  if (carregando.mesh) { ada.remove(carregando.mesh); carregando.mesh = null; carregando.tipo = null; }
  ada.position.set(-3, 0, 0); ada.rotation.y = Math.PI / 2;

  jogo = { pontos: 0, crachas: CONFIG.crachas, tReposicao: 0, tChegada: 1.2, iso: 0, hetero: 0, erros: 0, perdidos: 0, descartes: 0, passo: 0 };
  poderes = novoEstadoPoderes();
  if (CONFIG.poderesComecamRecarregando) {
    const r = recargasIniciais();
    poderes.captacao.recarga = r.captacao;
    poderes.rede.recarga = r.rede;
    poderes.cafe.recarga = r.cafe;
  }
  chegadas = []; filaEntrada = [];
  $("painelPoder").hidden = true;
  for (let i = 0; i < CONFIG.estoqueInicial; i++) reporBolsa();
  desenharCrachas();
  atualizarHud();
}
const nivel = () => Math.floor(jogo.pontos / CONFIG.pontosPorNivel);
const intervaloReposicao = () => Math.min(CONFIG.reposicaoIntervaloMax, CONFIG.reposicaoIntervalo + nivel() * CONFIG.reposicaoAumentoPorNivel);
const intervaloChegada = () => Math.max(CONFIG.chegadaIntervaloMinimo, CONFIG.chegadaIntervaloInicial - nivel() * CONFIG.chegadaReducaoPorNivel);
const maxTransportadores = () => Math.min(CONFIG.transportadoresMax, CONFIG.transportadoresInicio + Math.floor(nivel() / CONFIG.niveisPorTransportadorExtra));
const tempoContador = () => Math.max(CONFIG.contadorMinimo, CONFIG.contadorInicial - nivel() * CONFIG.contadorReducaoPorNivel);
const qtdEstoque = () => vagas.filter(v => v.bolsa).length;

// Pedidos "sem saída": o transportador está no balcão (ou chegando) e não existe nenhuma bolsa
// compatível no estoque, na mão da Ada ou a caminho. A reposição e a Rede dão uma mãozinha nesses casos.
function pedidosSemSaida() {
  if (!jogo) return [];   // chamada antes do jogo existir (sorteio inicial da Rede)
  const temos = [...vagas.filter(v => v.bolsa).map(v => v.bolsa.tipo), ...chegadas.map(c => c.tipo), ...filaEntrada.map(c => c.tipo)];
  if (carregando.tipo) temos.push(carregando.tipo);
  return transportadores.filter(t => t.estado !== "saindo" && !temos.some(d => compativel(d, t.tipo))).map(t => t.tipo);
}
// sorteia um tipo que sirva para o paciente, respeitando as proporções reais
function sortearCompativel(receptor) {
  const p = {};
  for (const [tipo, w] of Object.entries(CONFIG.proporcoes)) if (compativel(tipo, receptor)) p[tipo] = w;
  return sortear(p);
}
const CHANCE_AJUDA_REPOSICAO = 0.35; // com pedido sem saída, ~1 em cada 3 bolsas novas serve para ele (discreto)
function tipoDaReposicao() {
  const sem = pedidosSemSaida();
  if (sem.length && Math.random() < CHANCE_AJUDA_REPOSICAO) return sortearCompativel(sem[Math.floor(Math.random() * sem.length)]);
  return sortear(CONFIG.proporcoes);
}
function reporBolsa() {
  if (qtdEstoque() >= CONFIG.estoqueCapacidade) return false; // estoque cheio: reposição pausa
  const livres = vagas.filter(v => !v.bolsa);
  const v = livres[Math.floor(Math.random() * livres.length)];
  colocarNaVaga(v, tipoDaReposicao(), null);
  return true;
}
function colocarNaVaga(v, tipo, origem) {
  const mesh = criarBolsa(tipo, origem);
  mesh.position.set(v.x, 0.95, v.z);
  scene.add(mesh);
  v.bolsa = { tipo, mesh, origem: origem || null };
}
function entrarNoEstoque() {
  if (filaEntrada.length && qtdEstoque() < CONFIG.estoqueCapacidade) Som.tocar("chegada");
  // bolsas que chegaram por telefone ocupam as vagas livres; se não houver, esperam na fila
  while (filaEntrada.length && qtdEstoque() < CONFIG.estoqueCapacidade) {
    const b = filaEntrada.shift();
    const livres = vagas.filter(v => !v.bolsa);
    colocarNaVaga(livres[Math.floor(Math.random() * livres.length)], b.tipo, b.origem);
  }
}

function pesosPacientes() {
  const boost = 1 + nivel() * CONFIG.rhNegativoAumentoPorNivel;
  const p = {};
  for (const [t, w] of Object.entries(CONFIG.proporcoes)) p[t] = rhPositivo(t) ? w : w * boost;
  return p;
}
function chegarTransportador() {
  const ocupadas = new Set(transportadores.map(t => t.vaga));
  const livres = POS_TRANSP.map((_, i) => i).filter(i => !ocupadas.has(i));
  if (!livres.length) return;
  const vaga = livres[Math.floor(Math.random() * livres.length)];
  const mesh = criarTransportador();
  mesh.position.set(XPORTA, 0, 0);   // todos entram pela porta (vão no meio da parede da direita)
  scene.add(mesh);
  transportadores.push({ vaga, mesh, tipo: sortear(pesosPacientes()), estado: "chegando", tempo: 0, total: 0, balao: null });
}
