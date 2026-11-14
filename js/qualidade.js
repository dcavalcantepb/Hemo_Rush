// =====================================================================
// QUALIDADE ADAPTATIVA — ajusta resolução e sombra ao aparelho, medindo os quadros por segundo do plantão.
// Só baixa quando está ruim de verdade (abaixo de FPS_RUIM por uma janela inteira), espera o jogo assentar
// depois de cada troca e só sobe após um bom tempo liso. Um nível que travou não é tentado de novo na sessão,
// para não ficar oscilando. O último nível que funcionou fica guardado para a próxima visita.
// Em Opções, o jogador pode travar um nível ("Gráficos"). Com ?debug na URL, aparece um medidor no canto.
// =====================================================================
const NIVEIS_QUALIDADE = [
  { nome: "Mínima", pixelRatio: 1,    sombra: 0 },
  { nome: "Baixa",  pixelRatio: 1.25, sombra: 512 },
  { nome: "Média",  pixelRatio: 1.5,  sombra: 1024 },
  { nome: "Alta",   pixelRatio: 2,    sombra: EH_CELULAR ? 1024 : 2048 }
];
const Qualidade = (() => {
  const MAX = NIVEIS_QUALIDADE.length - 1;
  const CHAVE_MODO = "hemorush-graficos";         // "auto" ou o índice do nível travado em Opções
  const CHAVE_NIVEL = "hemorush-graficos-nivel";  // último nível que o automático usou
  const JANELA_MS = 2000;             // mede os fps em janelas de 2 s
  const FPS_RUIM = 40;                // abaixo disso por uma janela inteira: baixa um nível
  const ESPERA_APOS_TROCA_MS = 4000;  // depois de trocar, espera o jogo assentar antes de julgar de novo
  const LISO_PARA_SUBIR_MS = 15000;   // só sobe depois de tanto tempo liso seguido
  const SOLUCO_MS = 300;              // um quadro maior que isso é soluço (troca de aba, compilação): descarta a janela

  let modo = "auto", nivel = MAX, nivelRuim = MAX + 1;   // nivelRuim: menor nível que travou nesta sessão
  let refresh = 60, pulsos = 0, pulsoInicio = 0;         // taxa da tela (Hz), medida pelos requestAnimationFrame
  let quadros = 0, janelaInicio = 0, ultimoQuadro = 0, maiorIntervalo = 0;
  let ultimaTroca = 0, lisoDesde = 0, fpsMedido = 0;
  try {
    const m = localStorage.getItem(CHAVE_MODO);
    if (m !== null && m !== "auto" && NIVEIS_QUALIDADE[Number(m)]) modo = Number(m);
    const n = localStorage.getItem(CHAVE_NIVEL);   // cuidado: Number(null) é 0, e 0 é um nível válido (Mínima)
    if (n !== null && NIVEIS_QUALIDADE[Number(n)]) nivel = Number(n);
  } catch (e) {}

  const debug = /[?&]debug\b/.test(location.search) ? document.createElement("div") : null;
  if (debug) { debug.className = "debug-qualidade"; document.body.appendChild(debug); }
  function mostrarDebug() {
    if (debug) debug.textContent = `${fpsMedido} fps · ${NIVEIS_QUALIDADE[nivel].nome} · tela ${refresh} Hz · alvo ${Math.round(alvo())}`;
  }

  // fps que este aparelho consegue com o limite de quadros do celular (90 Hz → 45, 120 Hz → 60); no PC, até 60
  function alvo() { return Math.min(60, EH_CELULAR ? refresh / Math.ceil(refresh / 60) : refresh); }

  function aplicar(n, agora) {
    nivel = n;
    const q = NIVEIS_QUALIDADE[n];
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.pixelRatio));   // já reaplica o tamanho
    if (q.sombra) {
      sol.castShadow = true;
      if (sol.shadow.mapSize.x !== q.sombra) {
        sol.shadow.mapSize.set(q.sombra, q.sombra);
        if (sol.shadow.map) { sol.shadow.map.dispose(); sol.shadow.map = null; }   // o Three recria no tamanho novo
      }
    } else sol.castShadow = false;
    ultimaTroca = agora; lisoDesde = 0; quadros = 0; janelaInicio = 0; maiorIntervalo = 0;
    if (modo === "auto") try { localStorage.setItem(CHAVE_NIVEL, String(n)); } catch (e) {}
    mostrarDebug();
  }

  // Chamado a cada requestAnimationFrame, antes do limite de quadros: a maior contagem por segundo é a taxa da tela
  // (nos menus a cena nem é desenhada, então ali a medida sai limpa).
  function pulso(agora) {
    if (!pulsoInicio) pulsoInicio = agora;
    pulsos++;
    const decorrido = agora - pulsoInicio;
    if (decorrido >= 1000) {
      const hz = Math.round(pulsos * 1000 / decorrido / 10) * 10;
      if (hz > refresh) { refresh = hz; mostrarDebug(); }
      pulsos = 0; pulsoInicio = agora;
    }
  }

  // Chamado a cada quadro desenhado durante o plantão.
  function quadro(agora) {
    if (!janelaInicio) { janelaInicio = agora; ultimoQuadro = agora; return; }
    const intervalo = agora - ultimoQuadro;
    ultimoQuadro = agora; quadros++;
    if (intervalo > maiorIntervalo) maiorIntervalo = intervalo;
    const decorrido = agora - janelaInicio;
    if (decorrido < JANELA_MS) return;
    const fps = quadros * 1000 / decorrido, soluco = maiorIntervalo > SOLUCO_MS;
    fpsMedido = Math.round(fps); quadros = 0; janelaInicio = agora; maiorIntervalo = 0;
    mostrarDebug();
    if (soluco) { lisoDesde = 0; return; }
    if (modo !== "auto" || agora - ultimaTroca < ESPERA_APOS_TROCA_MS) return;
    if (fps < FPS_RUIM) {
      if (nivel > 0) { nivelRuim = nivel; aplicar(nivel - 1, agora); }
      lisoDesde = 0;
    } else if (fps >= alvo() * 0.9) {
      if (!lisoDesde) lisoDesde = agora;
      else if (agora - lisoDesde >= LISO_PARA_SUBIR_MS && nivel + 1 < nivelRuim) aplicar(nivel + 1, agora);
    } else lisoDesde = 0;
  }

  // Opções: "auto" ou um índice de NIVEIS_QUALIDADE
  function definirModo(m) {
    modo = m;
    try { localStorage.setItem(CHAVE_MODO, String(m)); } catch (e) {}
    if (m === "auto") { nivelRuim = MAX + 1; aplicar(nivel, performance.now()); }
    else aplicar(m, performance.now());
  }
  function proximoModo() { definirModo(modo === "auto" ? MAX : modo === 0 ? "auto" : modo - 1); }   // auto → Alta → … → Mínima → auto
  function descricao() {
    const nome = NIVEIS_QUALIDADE[nivel].nome;
    return modo === "auto" ? `Gráficos: automático (${nome})` : `Gráficos: ${nome}`;
  }

  aplicar(modo === "auto" ? nivel : modo, 0);
  return { pulso, quadro, definirModo, proximoModo, descricao, nivelAtual: () => nivel, modoAtual: () => modo, fps: () => fpsMedido };
})();
