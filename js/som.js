// =====================================================================
// SONS — gerados na hora com Web Audio, sem arquivos. M liga e desliga.
// =====================================================================
const Som = (() => {
  let ctx = null, saida = null, mudo = false;
  try { mudo = localStorage.getItem("hemorush-mudo") === "1"; } catch (e) {}
  function garantir() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC(); saida = ctx.createGain(); saida.gain.value = 0.45;
      // limitador na saída: quando música e efeitos somam alto, ele segura o volume em vez de estourar (estalo)
      const limite = ctx.createDynamicsCompressor();
      limite.threshold.value = -3; limite.knee.value = 10; limite.ratio.value = 6; limite.attack.value = 0.01; limite.release.value = 0.3;
      saida.connect(limite); limite.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }
  function tom(freq, ini, dur, o = {}) {
    const { tipo = "sine", vol = 0.2, ate = null, ataque = 0.01 } = o;
    const t0 = ctx.currentTime + ini, osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = tipo; osc.frequency.setValueAtTime(freq, t0);
    if (ate) osc.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
    g.gain.value = 0.0001;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(saida); osc.start(t0); osc.stop(t0 + dur + 0.05);
  }
  function ruido(ini, dur, vol, corte) {
    const t0 = ctx.currentTime + ini, buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; f.type = "lowpass"; f.frequency.value = corte;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(saida); src.start(t0);
  }
  const SONS = {
    pegar: () => { tom(520, 0, 0.08, { tipo: "triangle" }); tom(780, 0.05, 0.09, { tipo: "triangle", vol: 0.17 }); },
    soltar: () => { tom(620, 0, 0.08, { tipo: "triangle", vol: 0.17 }); tom(420, 0.05, 0.1, { tipo: "triangle", vol: 0.15 }); },
    iso: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tom(f, i * 0.07, 0.24, { tipo: "triangle", vol: 0.2 })),
    hetero: () => { tom(523.25, 0, 0.16, { tipo: "triangle" }); tom(659.25, 0.08, 0.22, { tipo: "triangle" }); },
    erro: () => { tom(190, 0, 0.38, { tipo: "sawtooth", vol: 0.16, ate: 105 }); tom(196, 0, 0.38, { tipo: "square", vol: 0.07, ate: 110 }); },
    perdido: () => [440, 370, 311].forEach((f, i) => tom(f, i * 0.13, 0.22, { tipo: "square", vol: 0.08 })),
    pedido: () => { tom(880, 0, 0.12, { vol: 0.1 }); tom(1320, 0.07, 0.2, { vol: 0.08 }); },
    alerta: () => { tom(1180, 0, 0.06, { tipo: "square", vol: 0.05 }); tom(1180, 0.13, 0.06, { tipo: "square", vol: 0.05 }); },
    telefone: () => { for (let i = 0; i < 8; i++) tom(i % 2 ? 1250 : 1000, i * 0.055, 0.05, { tipo: "square", vol: 0.06 }); },
    chegada: () => tom(650, 0, 0.12, { vol: 0.1, ate: 980 }),
    cafe: () => { ruido(0, 0.4, 0.1, 800); [300, 360, 430].forEach((f, i) => tom(f, 0.06 + i * 0.09, 0.1, { vol: 0.07, ate: f * 1.6 })); },
    descarte: () => { ruido(0, 0.2, 0.22, 380); tom(130, 0, 0.22, { vol: 0.22, ate: 60 }); },
    pressao: () => [392, 523.25, 659.25].forEach((f, i) => tom(f, i * 0.09, 0.17, { tipo: "sawtooth", vol: 0.06 })),
    fim: () => [523.25, 466.16, 392, 261.63].forEach((f, i) => tom(f, i * 0.22, 0.34, { tipo: "triangle", vol: 0.18 })),
    recorde: () => [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tom(f, i * 0.09, 0.28, { tipo: "triangle", vol: 0.18 })),
    abrir: () => tom(660, 0, 0.07, { tipo: "triangle", vol: 0.1 }),
    mover: () => tom(880, 0, 0.04, { tipo: "triangle", vol: 0.05 }),
    confirmar: () => { tom(660, 0, 0.06, { tipo: "triangle", vol: 0.1 }); tom(990, 0.05, 0.08, { tipo: "triangle", vol: 0.1 }); }
  };
  // ---------------- MÚSICA DE FUNDO ----------------
  // Duas trilhas geradas na hora, em semicolcheias:
  //  • "jogo": groove animado em Dó maior (C – Am – F – G), que acelera um pouco com a pressão;
  //  • "menu": tema calmo e suave (Fmaj7 – Em7 – Dm7 – Cmaj7), com pad e melodia de sininho.
  // A melodia toca em 4 compassos e descansa nos 4 seguintes, para não cansar o ouvido.
  const N = { C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98, A2: 110, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196,
              A3: 220, B3: 246.94, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88,
              C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880 };
  const TRILHAS = {
    jogo: {
      bpm: p => Math.min(150, 112 + 4 * (p || 0)),
      passo(p, t0, d) {
        const BAIXO = [N.C3, N.A2, N.F2, N.G2];
        const ACORDES = [[N.C4, N.E4, N.G4], [N.A3, N.C4, N.E4], [N.F3, N.A3, N.C4], [N.G3, N.B3, N.D4]];
        const MELODIA = [
          { 0: N.E5, 3: N.G5, 6: N.E5, 8: N.D5, 10: N.C5 },
          { 0: N.C5, 3: N.E5, 6: N.A5, 10: N.G5, 12: N.E5 },
          { 0: N.A5, 3: N.G5, 6: N.E5, 8: N.C5, 10: N.D5 },
          { 0: N.D5, 2: N.E5, 4: N.G5, 8: N.B4, 12: N.D5 }
        ];
        const c = Math.floor(p / 16) % 4, s = p % 16, comMelodia = Math.floor(p / 64) % 2 === 0;
        if (s === 0 || s === 6 || s === 8 || s === 14) nota(BAIXO[c], t0, d * 1.7, "triangle", 0.17);
        if (s === 4 || s === 12) ACORDES[c].forEach(f => nota(f, t0, d * 1.6, "triangle", 0.035));
        if (s % 2 === 0) chimbal(t0, s % 4 === 2 ? 0.035 : 0.018);
        const m = MELODIA[c][s];
        if (comMelodia && m) nota(m, t0, d * 1.9, "square", 0.028);
      }
    },
    // Hemozen: a mesma harmonia do plantão (C – Am – F – G), mais lenta, sem bateria,
    // com acordes longos e uma melodia de marimba que aparece de vez em quando.
    zen: {
      bpm: () => 84,
      passo(p, t0, d) {
        const BAIXO = [N.C3, N.A2, N.F2, N.G2];
        const ACORDES = [[N.C4, N.E4, N.G4], [N.A3, N.C4, N.E4], [N.F3, N.A3, N.C4], [N.G3, N.B3, N.D4]];
        const MELODIA = [
          { 0: N.E5, 4: N.G5, 8: N.E5, 12: N.D5 },
          { 0: N.C5, 6: N.E5, 8: N.A4, 12: N.G4 },
          { 0: N.A4, 4: N.C5, 8: N.F4, 12: N.A4 },
          { 0: N.B4, 4: N.D5, 8: N.G4, 14: N.B4 }
        ];
        const c = Math.floor(p / 16) % 4, s = p % 16, comMelodia = Math.floor(p / 64) % 2 === 1;
        if (s === 0) nota(BAIXO[c], t0, d * 10, "sine", 0.2, 0.03);
        if (s === 8) nota(BAIXO[c] * 1.5, t0, d * 6, "sine", 0.1, 0.03);
        if (s === 0) ACORDES[c].forEach(f => nota(f, t0, d * 15, "triangle", 0.03, 0.25));
        if (s % 4 === 2) chimbal(t0, 0.007);
        const m = MELODIA[c][s];
        if (comMelodia && m) { nota(m, t0, d * 3, "sine", 0.05, 0.008); nota(m * 2, t0, d * 1.2, "sine", 0.012, 0.008); }
        else if (!comMelodia && (s === 6 || s === 14)) nota(ACORDES[c][(s / 8 | 0) + 1] * 2, t0, d * 3, "sine", 0.018, 0.01);
      }
    },
    // Menu: marchinha de parque de diversões, original, no clima festivo de "cassino/parque" dos RPGs dos anos 90.
    // Baixo "um-pá" (tônica e quinta), acordes curtinhos no contratempo, caixa, bloco de madeira
    // e uma melodia saltitante; na segunda volta entra um glockenspiel dobrando a melodia uma oitava acima.
    menu: {
      bpm: () => 150,
      passos: 256,
      passo(p, t0, d) {
        const G = { D2: 73.42, E2: 82.41, G2: 98, A2: 110, B2: 123.47, C3: 130.81, D3: 146.83, E3: 164.81, Fs3: 185, G3: 196, A3: 220, B3: 246.94,
                    C4: 261.63, Cs4: 277.18, D4: 293.66, E4: 329.63, Fs4: 369.99, G4: 392, A4: 440, B4: 493.88, C5: 523.25, Cs5: 554.37,
                    D5: 587.33, E5: 659.25, Fs5: 739.99, G5: 783.99, A5: 880 };
        // G – C – D7 – G – Em – A7 – D7 – G
        const BAIXO = [[G.G2, G.D3], [G.C3, G.G2], [G.D2, G.A2], [G.G2, G.D3], [G.E2, G.B2], [G.A2, G.E2], [G.D2, G.A2], [G.G2, G.D3]];
        const ACORDES = [[G.G3, G.B3, G.D4], [G.C4, G.E4, G.G4], [G.Fs3, G.C4, G.D4], [G.G3, G.B3, G.D4],
                         [G.E3, G.G3, G.B3], [G.A3, G.Cs4, G.G4], [G.Fs3, G.C4, G.D4], [G.G3, G.B3, G.D4]];
        const MELODIA = [
          { 0: G.B4, 2: G.D5, 4: G.G5, 6: G.D5, 8: G.B4, 10: G.D5, 12: G.G5, 14: G.A5 },
          { 0: G.G5, 3: G.E5, 4: G.C5, 6: G.E5, 8: G.G5, 11: G.E5, 12: G.G5 },
          { 0: G.Fs5, 2: G.E5, 4: G.D5, 6: G.C5, 8: G.A4, 10: G.C5, 12: G.D5 },
          { 0: G.B4, 4: G.G4, 8: G.G5, 10: G.Fs5, 12: G.G5 },
          { 0: G.G5, 2: G.E5, 4: G.B4, 6: G.E5, 8: G.G5, 10: G.A5, 12: G.G5 },
          { 0: G.E5, 2: G.Cs5, 4: G.A4, 6: G.Cs5, 8: G.E5, 10: G.G5, 12: G.E5, 14: G.Cs5 },
          { 0: G.D5, 2: G.Fs5, 4: G.A5, 6: G.Fs5, 8: G.D5, 10: G.C5, 12: G.A4 },
          { 0: G.G5, 3: G.D5, 4: G.B4, 8: G.G4, 12: G.G5 }
        ];
        const c = Math.floor(p / 16) % 8, s = p % 16, segundaVolta = p >= 128;
        if (s === 0) nota(BAIXO[c][0], t0, d * 2.4, "triangle", 0.17);          // um
        if (s === 8) nota(BAIXO[c][1], t0, d * 2.4, "triangle", 0.15);          // um
        if (s === 4 || s === 12) {                                              // pá
          ACORDES[c].forEach(f => nota(f, t0, d * 1.1, "triangle", 0.03));
          caixa(t0, 0.05);
        }
        if (s % 4 === 2) chimbal(t0, 0.016);                                   // chocalho só no contratempo das colcheias
        if (s === 14 && c % 2 === 1) nota(1400, t0, 0.06, "sine", 0.05, 0.002); // bloco de madeira
        const m = MELODIA[c][s];
        if (m) {
          // apito de calíope: triângulo + seno uma oitava acima (a onda quadrada soava como "zap" de cerca elétrica)
          nota(m, t0, d * 1.7, "triangle", 0.04, 0.012);
          nota(m * 2, t0, d * 1.2, "sine", 0.012, 0.012);
          if (segundaVolta) nota(m * 2, t0, d * 2.5, "sine", 0.018, 0.002);      // glockenspiel
        }
      }
    }
  };
  // Para não estalar em computadores mais modestos, cada trilha é GRAVADA uma vez (OfflineAudioContext)
  // e depois toca em loop como um único som, em vez de criar dezenas de notas por segundo ao vivo.
  const musica = { trilha: null, chave: null, fonte: null, g: null, pressao: 0, inicio: 0, dur: 0 };
  const gravadas = {}, gravando = {};
  let alvo = null; // contexto em que as notas estão sendo gravadas
  function nota(freq, t0, dur, tipo, vol, ataque = 0.012) {
    ataque = Math.max(ataque, 0.008); // ataque muito curto gera clique
    const c = alvo.c, o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.setValueAtTime(freq, t0);
    g.gain.value = 0.0001;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(alvo.g); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  // Percussão suave: entrada em rampa (sem degrau) e filtro passa-faixa, que soa como chocalho.
  function ruidoSuave(t0, vol, dur, tipo, freq, q) {
    const c = alvo.c, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = alvo.ruido; f.type = tipo; f.frequency.value = freq; f.Q.value = q;
    g.gain.value = 0;              // o ganho nasce em 1; sem isto, a 1ª amostra da batida saía no volume máximo (o estalo)
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(alvo.g);
    src.start(t0, Math.random() * 0.1); src.stop(t0 + dur + 0.02);
  }
  function chimbal(t0, vol) { ruidoSuave(t0, vol * 0.8, 0.06, "bandpass", 6500, 1.2); }
  function caixa(t0, vol) { ruidoSuave(t0, vol * 0.8, 0.12, "bandpass", 1600, 0.9); }
  const chaveDe = (trilha, pressao) => trilha + "@" + TRILHAS[trilha].bpm(pressao);
  // fila: grava uma trilha por vez (em paralelo elas disputam o processador e todas demoram mais)
  const filaGravacao = [];
  let gravandoAgora = false;
  function gravar(trilha, pressao) {
    const chave = chaveDe(trilha, pressao);
    if (gravadas[chave] || gravando[chave] || filaGravacao.some(f => f.chave === chave)) return;
    filaGravacao.push({ trilha, pressao, chave });
    proximaGravacao();
  }
  function proximaGravacao() {
    if (gravandoAgora || !filaGravacao.length) return;
    const { trilha, pressao } = filaGravacao.shift();
    gravandoAgora = true;
    gravarAgora(trilha, pressao).finally(() => { gravandoAgora = false; proximaGravacao(); });
  }
  function gravarAgora(trilha, pressao) {
    const bpm = TRILHAS[trilha].bpm(pressao), chave = trilha + "@" + bpm;
    if (gravadas[chave] || gravando[chave]) return Promise.resolve();
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return Promise.resolve();
    const T = TRILHAS[trilha], passos = T.passos || 128, d = 60 / bpm / 4, sr = 44100;
    const n = Math.round(passos * d * sr), pre = 16, inicio = Math.round(pre * d * sr);
    let off;
    try { off = new OAC(1, inicio + n, sr); } catch (e) { return Promise.resolve(); }
    const ruido = off.createBuffer(1, Math.ceil(sr * 0.3), sr);
    const r = ruido.getChannelData(0); for (let i = 0; i < r.length; i++) r[i] = Math.random() * 2 - 1;
    alvo = { c: off, g: off.destination, ruido };
    // grava o último compasso antes da volta (só para o final das notas dele soar no começo) e guarda
    // a volta inteira depois dele: o loop fica sem emenda e a gravação custa quase metade do que antes
    for (let p = 0; p < passos + pre; p++) T.passo((p - pre + passos) % passos, p * d, d);
    alvo = null;
    gravando[chave] = true;
    return off.startRendering().then(buf => {
      const laco = off.createBuffer(1, n, sr), dados = laco.getChannelData(0);
      dados.set(buf.getChannelData(0).subarray(inicio, inicio + n));
      // normaliza: o pico da música fica sempre no mesmo nível, bem abaixo do limitador,
      // para ele nunca precisar agir sobre a música (cada vez que age pode dar um estalinho)
      let pico = 0; for (let i = 0; i < dados.length; i++) { const v = Math.abs(dados[i]); if (v > pico) pico = v; }
      if (pico > 0) { const k = 0.42 / pico; for (let i = 0; i < dados.length; i++) dados[i] *= k; }
      gravadas[chave] = { buf: laco, dur: n / sr };
      delete gravando[chave];
    }).catch(() => { delete gravando[chave]; });
  }
  function soltarMusica() {
    if (!musica.fonte) return;
    const { fonte, g } = musica;
    try {
      g.gain.cancelScheduledValues(ctx.currentTime);
      g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      fonte.stop(ctx.currentTime + 0.45);
    } catch (e) {}
    setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 600);
    musica.fonte = null; musica.g = null; musica.chave = null; musica.trilha = null;
  }
  function atualizarMusica(trilha) {
    if (!trilha || mudo || !ctx) { soltarMusica(); return; }
    const chave = chaveDe(trilha, musica.pressao);
    if (musica.chave === chave) { if (trilha === "jogo") gravar("jogo", musica.pressao + 1); return; }
    if (!gravadas[chave]) {
      gravar(trilha, musica.pressao);
      if (musica.trilha !== trilha) soltarMusica(); // outra trilha: silêncio até a gravação ficar pronta
      return;                                       // mesma trilha: segue no andamento antigo enquanto grava
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const G = gravadas[chave];
    let desloc = 0, emenda = false;
    if (musica.trilha === trilha && musica.fonte) {  // mesmo tema mais rápido: continua do ponto equivalente
      desloc = (((ctx.currentTime - musica.inicio) % musica.dur) / musica.dur) * G.dur;
      emenda = true;
    }
    soltarMusica();
    const fonte = ctx.createBufferSource(), g = ctx.createGain();
    fonte.buffer = G.buf; fonte.loop = true;
    // começo de música: entra quase na hora, junto com o plantão; troca de andamento: transição suave
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(1, ctx.currentTime + (emenda ? 0.6 : 0.04));
    fonte.connect(g); g.connect(saida);
    const t = ctx.currentTime + 0.02;
    fonte.start(t, desloc);
    Object.assign(musica, { fonte, g, chave, trilha, inicio: t - desloc, dur: G.dur });
  }
  // grava as trilhas logo ao abrir, em segundo plano e uma de cada vez: a do menu (a primeira a tocar),
  // depois a do plantão e a versão da pressão 1
  setTimeout(() => { gravar("menu", 0); gravar("jogo", 0); gravar("jogo", 1); gravar("zen", 0); }, 0);

  return {
    tocar(nome) { if (mudo || !garantir()) return; try { SONS[nome] && SONS[nome](); } catch (e) {} },
    get mudo() { return mudo; },
    alternar() {
      mudo = !mudo;
      try { localStorage.setItem("hemorush-mudo", mudo ? "1" : "0"); } catch (e) {}
      if (mudo) soltarMusica(); else this.tocar("confirmar");
      return mudo;
    },
    // novo plantão: a música do jogo recomeça do início (antes, "Reiniciar" na pausa seguia do meio)
    recomecar() { soltarMusica(); },
    // a música já foi gravada? (sem suporte a gravação, responde "sim" para não travar o jogo)
    pronta(trilha, pressao) {
      if (!(window.OfflineAudioContext || window.webkitOfflineAudioContext)) return true;
      return !!gravadas[chaveDe(trilha, pressao || 0)];
    },
    // chamada a cada quadro: escolhe a trilha da tela atual ("jogo", "menu" ou nenhuma)
    musica(trilha, pressao) {
      musica.pressao = trilha === "jogo" ? (pressao || 0) : 0;
      atualizarMusica(trilha);
    }
  };
})();
