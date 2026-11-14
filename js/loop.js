// =====================================================================
// LOOP
// =====================================================================
function redimensionar() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // em telas estreitas, afasta a câmera para caber a sala inteira
  camera.fov = w / h < 1.5 ? 38 * Math.min(1.9, 1.5 / (w / h)) : 38;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", redimensionar);
redimensionar();

const relogio = new THREE.Clock();
function atualizar(dt) {
  // movimento da Ada
  atualizarPoderes(dt);
  const parada = !!poderes.painel; // a Ada fica no telefone enquanto escolhe
  let mx = parada ? 0 : (entrada.right ? 1 : 0) - (entrada.left ? 1 : 0);
  let mz = parada ? 0 : (entrada.down ? 1 : 0) - (entrada.up ? 1 : 0);
  if (manche.ativo && !parada) { mx = manche.x; mz = manche.z; }
  if (mx || mz) {
    const l = Math.hypot(mx, mz), forca = Math.min(1, l); mx /= l; mz /= l;
    const vel = CONFIG.velocidadeAda * forca * (poderes.cafe.ativo > 0 ? CONFIG.cafeMultiplicador : 1);
    ada.position.x = Math.max(-6.75, Math.min(6.4, ada.position.x + mx * vel * dt));
    ada.position.z = Math.max(-6.05, Math.min(6.55, ada.position.z + mz * vel * dt));
    const alvoRot = Math.atan2(mx, mz);
    let diff = alvoRot - ada.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    ada.rotation.y += diff * Math.min(1, dt * 14);
    jogo.passo += dt * (poderes.cafe.ativo > 0 ? 18 : 12) * Math.max(0.5, forca);
    ada.position.y = Math.abs(Math.sin(jogo.passo)) * 0.08;
    animarPassos(ada, jogo.passo, Math.max(0.4, forca));
  } else { ada.position.y = 0; animarPassos(ada, 0, 0); }
  // braços: à frente segurando a bolsa, ou balançando ao andar
  const andando = !!(mx || mz), br = ada.userData.bracos;
  const alvoBraco = carregando.tipo ? -1.2 : (andando ? Math.sin(jogo.passo) * 0.5 : 0);
  br[0].rotation.x += (alvoBraco - br[0].rotation.x) * Math.min(1, dt * 12);
  br[1].rotation.x += ((carregando.tipo ? -1.2 : -alvoBraco) - br[1].rotation.x) * Math.min(1, dt * 12);
  // pulinho de comemoração
  if (jogo.pulo > 0) { jogo.pulo = Math.max(0, jogo.pulo - dt); ada.position.y += Math.sin((1 - jogo.pulo / 0.35) * Math.PI) * 0.35; }
  atualizarEfeitos(dt);

  // virada de dificuldade dentro do nível (ex.: Hemobaby depois de 5.000 pontos)
  const virada = NIVEIS[nivelAtual].virada;
  if (virada && !jogo.virou && jogo.pontos >= virada.pontos) {
    jogo.virou = true;
    Object.assign(CONFIG, virada.ajustes);
    flutuar(virada.aviso, "#c81e3a", 0, 2.5, -1);
    Som.tocar("pressao");
  }

  // reposição do estoque
  jogo.tReposicao += dt;
  if (jogo.tReposicao >= intervaloReposicao()) {
    jogo.tReposicao = 0;
    reporBolsa();
  }

  // chegada de transportadores
  const ativos = transportadores.filter(t => t.estado !== "saindo").length;
  jogo.tChegada -= dt;
  if (jogo.tChegada <= 0 && ativos < maxTransportadores()) {
    chegarTransportador();
    jogo.tChegada = intervaloChegada();
  }

  // transportadores
  for (let i = transportadores.length - 1; i >= 0; i--) {
    const t = transportadores[i], m = t.mesh;
    if (t.estado === "chegando") {
      // anda da porta até o seu lugar no balcão, virado para onde está indo
      const zAlvo = POS_TRANSP[t.vaga], dx = XT - m.position.x, dz = zAlvo - m.position.z, dist = Math.hypot(dx, dz);
      const passo = 5 * dt;
      t.fase = (t.fase || 0) + dt * 11;
      if (dist > passo) {
        m.position.x += dx / dist * passo; m.position.z += dz / dist * passo;
        m.rotation.y = Math.atan2(dx, dz);
        m.position.y = Math.abs(Math.sin(t.fase)) * 0.06;
        animarPassos(m, t.fase, 1);
      } else {
        m.position.set(XT, 0, zAlvo); m.rotation.y = -Math.PI / 2;
        animarPassos(m, 0, 0);
        t.estado = "esperando"; t.total = t.tempo = tempoContador();
        t.balao = criarBalao(t.tipo);
        Som.tocar("pedido");
      }
    } else if (t.estado === "esperando") {
      t.tempo -= dt;
      // respirando e, com o tempo acabando, batendo o pé de impaciência
      const f = t.tempo / t.total;
      m.position.y = Math.sin(performance.now() / 400 + t.vaga) * 0.012 + (f < 0.25 ? Math.abs(Math.sin(performance.now() / 90)) * 0.05 : 0);
      if (t.tempo <= 0) {
        jogo.perdidos++;
        if (CONFIG.zen) {   // Hemozen: o transportador só sai para voltar depois, sem perder crachá
          flutuar(`Volto já! (${nome(t.tipo)})`, "#5b6b7a", m.position.x - 1.5, 2.6, m.position.z);
          sair(t);
          continue;
        }
        flutuar(`Tempo esgotado (${nome(t.tipo)}) −1 crachá`, "#c81e3a", m.position.x - 1.5, 2.6, m.position.z);
        Som.tocar("perdido");
        sair(t);
        perderCracha();
        if (estado !== "jogando") return;
      }
    } else if (t.estado === "saindo") {
      // volta pela porta
      const dx = XPORTA + 1 - m.position.x, dz = 0 - m.position.z, dist = Math.hypot(dx, dz);
      t.fase = (t.fase || 0) + dt * 13;
      m.position.x += dx / dist * 6 * dt; m.position.z += dz / dist * 6 * dt;
      m.rotation.y = Math.atan2(dx, dz);
      m.position.y = Math.abs(Math.sin(t.fase)) * 0.06;
      animarPassos(m, t.fase, 1);
      if (m.position.x >= XPORTA) { scene.remove(m); transportadores.splice(i, 1); }
    }
  }

  // alvo e dica
  const alvo = alvoAtual();
  if (alvo) {
    anel.visible = true;
    if (alvo.tipo === "vaga") { anel.position.set(alvo.v.x, 0.86, alvo.v.z); anel.scale.setScalar(0.8); }
    else if (alvo.tipo === "cafe") { anel.position.set(CAFE.x, 0.03, CAFE.z); anel.scale.setScalar(1.05); }
    else if (alvo.tipo === "telefone") { anel.position.set(TELEFONES[alvo.qual].x, 0.03, TELEFONES[alvo.qual].z); anel.scale.setScalar(1.05); }
    else if (alvo.tipo === "descarte") { anel.position.set(DESCARTE.x, 0.03, DESCARTE.z); anel.scale.setScalar(1.1); }
    else { anel.position.set(alvo.t.mesh.position.x, 0.03, alvo.t.mesh.position.z); anel.scale.setScalar(1.35); }
    anel.material.opacity = 0.65 + Math.sin(performance.now() / 160) * 0.25;
  } else anel.visible = false;
  atualizarDica(alvo);
  atualizarHud();
}

function posicionarBaloes() {
  atualizarTelefones();
  transportadores.forEach(t => {
    if (!t.balao) return;
    const p = naTela(t.mesh.position.x, 2.4, t.mesh.position.z);
    t.balao.style.left = p.x + "px"; t.balao.style.top = p.y + "px";
    const f = Math.max(0, t.tempo / t.total);
    const a = t.balao.querySelector(".anel");
    a.style.stroke = corTempo(f);
    a.style.strokeDasharray = `${CIRC * f} ${CIRC}`;
    t.balao.classList.toggle("urgente", f <= 0.25);
    const naMao = CONFIG.dicaCompatibilidade && estado === "jogando" ? carregando.tipo : null;
    t.balao.classList.toggle("compativel", !!naMao && compativel(naMao, t.tipo));
    t.balao.classList.toggle("iso", !!naMao && isogrupo(naMao, t.tipo));
    if (f <= 0.25 && !t.alertou && estado === "jogando") { t.alertou = true; Som.tocar("alerta"); }
  });
}

// trilha de cada tela: a do plantão continua na pausa; os menus têm a sua; fim e saída ficam em silêncio
const TELAS_MENU = ["inicio", "sobre", "sobreTipos", "sobreAda", "menu", "recordes", "opcoes"];
function trilhaDaTela() {
  if (document.hidden) return null;
  const plantao = CONFIG.zen ? "zen" : "jogo";
  if (estado === "jogando" || estado === "pausado") return plantao;
  if (estado === "tutorial") return tutorialOrigem === "pausa" ? plantao : "menu";
  if (TELAS_MENU.includes(estado)) return "menu";
  return null;
}
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, relogio.getDelta());
  if (estado === "jogando") atualizar(dt);
  Som.musica(trilhaDaTela(), estado === "jogando" || estado === "pausado" ? nivel() : 0);
  posicionarBaloes();
  animarLab(performance.now() / 1000);
  // fora do plantão a cena fica parada atrás dos menus: desenha em meio ritmo e sobra fôlego para o som
  quadro++;
  if (TELAS_PROPRIAS.includes(estado)) return;   // tela própria cobre a sala: não precisa desenhar
  if (estado === "jogando" || quadro % 2 === 0) renderer.render(scene, camera);
}
let quadro = 0;

// Cena de fundo do menu: estoque cheio para mostrar a sala
aplicarNivel(nivelAtual);
novoJogo();
// Os navegadores só deixam tocar som depois de um clique ou tecla. Então, quando tudo fica pronto,
// a tela de abertura pede um "Entrar": esse toque libera o som e a música do menu já começa junto.
function telaDeEntrada() {
  if (estado !== "carregando") return;   // só a partir da abertura
  estado = "entrada";
  $("textoCarregando").textContent = "";
  $("btnEntrar").hidden = false; $("dicaEntrar").hidden = false;
  focar($("btnEntrar"));
}
function entrar() {
  if (estado !== "entrada") return;
  $("btnEntrar").hidden = true; $("dicaEntrar").hidden = true;
  Som.tocar("confirmar");   // cria o áudio dentro do gesto do jogador
  travarHorizontal();       // celular: tela cheia e deitado (quando o navegador deixa)
  abrirInicio();
}
$("btnEntrar").addEventListener("click", entrar);
window.addEventListener("keydown", e => { if (estado === "entrada") { e.preventDefault(); e.stopImmediatePropagation(); entrar(); } }, true);
window.addEventListener("pointerdown", e => { if (estado === "entrada" && e.target.id !== "btnEntrar") entrar(); });
const inicioAbertura = performance.now();
aguardar("Preparando o plantão…", () => Som.pronta("menu", 0) && Som.pronta("jogo", 0) && performance.now() - inicioAbertura > 3000, 12000, telaDeEntrada);
loop();
