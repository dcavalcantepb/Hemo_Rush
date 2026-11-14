// =====================================================================
// ENTRADA (teclado agora, toque pronto para o celular)
// =====================================================================
const entrada = { up: false, down: false, left: false, right: false };
const manche = { ativo: false, x: 0, z: 0 }; // joystick do celular (analógico)
const MAPA = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
window.addEventListener("keydown", e => {
  // digitando o nome: as teclas são do campo (Enter salva, Esc sai do campo)
  if (e.target && e.target.id === "nomeRanking") {
    if (e.key === "Enter") { e.preventDefault(); confirmarNome(); }
    else if (e.key === "Escape") { e.preventDefault(); focar($("btnDeNovo")); }
    return;
  }
  if (e.code === "KeyM" && !e.repeat) { Som.alternar(); desenharSom(); return; }
  if (estado !== "jogando") {
    if (e.code === "Escape" || e.code === "KeyP") {
      if (estado === "pausado") { e.preventDefault(); pausar(false); return; }
      if (estado === "tutorial") { e.preventDefault(); if (tutorialOrigem === "pausa") fimTutorial(); else if (modoEvento) abrirTela("inicio", "btnIniciar"); else abrirMenu(); return; }
      const VOLTA = { opcoes: ["inicio", "btnOpcoes"], recordes: ["inicio", "btnRecordes"], menu: ["inicio", "btnIniciar"], sobre: ["inicio", "btnSobre"], sobreTipos: ["sobre", "btnSobreTipos"], sobreAda: ["sobre", "btnSobreAda"], saida: ["inicio", "btnIniciar"] };
      if (VOLTA[estado]) { e.preventDefault(); abrirTela(...VOLTA[estado]); return; }
    }
    navegarTela(e);
    return;
  }
  if (poderes.painel) {
    if (MAPA[e.code]) { e.preventDefault(); if (!e.repeat) moverSelecao(MAPA[e.code]); }
    else if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); if (!e.repeat) confirmarPainel(); }
    else if (e.code === "Escape") fecharPainel();
    else if (e.code === "KeyP") pausar(true);
    return;
  }
  if (MAPA[e.code]) { entrada[MAPA[e.code]] = true; e.preventDefault(); }
  else if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    if (e.repeat) return;
    agir();
  }
  else if (e.code === "KeyP" || e.code === "Escape") { e.preventDefault(); pausar(true); }
});
window.addEventListener("keyup", e => { if (MAPA[e.code]) entrada[MAPA[e.code]] = false; });
window.addEventListener("blur", () => { for (const k in entrada) entrada[k] = false; pausar(true); });
// celular: trocar de app ou aba nem sempre dispara "blur"; sem isso o plantão seguiria rodando em segundo plano
document.addEventListener("visibilitychange", () => { if (document.hidden) { for (const k in entrada) entrada[k] = false; pausar(true); } });

if (window.matchMedia && matchMedia("(pointer: coarse)").matches) {
  $("toque").hidden = false;
  // Joystick flutuante e analógico: tocar em qualquer ponto da metade esquerda da tela coloca o centro
  // do joystick embaixo do dedo; dali você arrasta para qualquer direção até soltar. A direção vem do
  // ângulo e a velocidade da distância (perto do centro a Ada anda devagar; perto da borda, no máximo).
  const app = $("app"), dpad = $("dpad"), mancheEl = $("manche");
  const zona = document.createElement("div");
  zona.className = "zona-joystick";
  $("toque").after(zona, dpad);           // a área de toque e o joystick passam a ser filhos do jogo
  dpad.classList.add("flutuante");
  let dedo = null, centro = null;
  function paraLocal(e) {                 // coordenadas do toque no sistema do jogo
    const r = app.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function posicionarBase(x, y) { dpad.style.left = x + "px"; dpad.style.top = y + "px"; }
  function repouso() {                    // lugar do joystick quando ninguém está tocando
    const R = dpad.offsetWidth / 2 || 70;
    // com as colunas laterais, o joystick descansa no meio da coluna da esquerda
    const col = canvas.getBoundingClientRect().left - app.getBoundingClientRect().left;
    const x = col >= 2 * R + 8 ? col - 6 - R : 16 + R;
    posicionarBase(x, app.clientHeight - 10 - R);
  }
  function lerDirecional(p) {
    const dx = p.x - centro.x, dy = p.y - centro.y;
    const raio = dpad.offsetWidth / 2, curso = raio - mancheEl.offsetWidth / 2;
    const dist = Math.hypot(dx, dy);
    const k = dist > curso ? curso / dist : 1;
    mancheEl.style.transform = `translate(calc(-50% + ${dx * k}px), calc(-50% + ${dy * k}px))`;
    const morto = raio * 0.15, cheio = raio * 0.7;
    const forca = Math.max(0, Math.min(1, (dist - morto) / (cheio - morto)));
    manche.ativo = true;
    manche.x = dist ? dx / dist * forca : 0;
    manche.z = dist ? dy / dist * forca : 0;
  }
  function soltarDirecional() {
    dedo = null; centro = null; manche.ativo = false; manche.x = manche.z = 0;
    dpad.classList.remove("ativo"); mancheEl.style.transform = "";
    repouso();
  }
  zona.addEventListener("pointerdown", e => {
    if (dedo !== null) return;
    e.preventDefault(); dedo = e.pointerId;
    try { zona.setPointerCapture(e.pointerId); } catch (err) {}
    const p = paraLocal(e), R = dpad.offsetWidth / 2;
    centro = { x: Math.max(R + 4, Math.min(app.clientWidth - R - 4, p.x)), y: Math.max(R + 4, Math.min(app.clientHeight - R - 4, p.y)) };
    posicionarBase(centro.x, centro.y);
    dpad.classList.add("ativo");
    lerDirecional(p);
  });
  zona.addEventListener("pointermove", e => { if (e.pointerId === dedo) lerDirecional(paraLocal(e)); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => zona.addEventListener(ev, e => { if (e.pointerId === dedo) soltarDirecional(); }));
  window.addEventListener("resize", () => { if (dedo === null) repouso(); });
  requestAnimationFrame(repouso);
  $("btnAcao").addEventListener("pointerdown", e => { e.preventDefault(); agir(); });
}
