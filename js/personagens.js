// =====================================================================
// PERSONAGENS
// =====================================================================
function criarPessoa(corRoupa, corPele, corCabelo) {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 1.15, 20), mat(corRoupa));
  corpo.position.y = 0.6; corpo.castShadow = true;
  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), mat(corPele));
  cabeca.position.y = 1.45; cabeca.castShadow = true;
  const cabelo = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(corCabelo));
  cabelo.position.y = 1.5; cabelo.rotation.x = -0.35;
  const nariz = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mat(corPele));
  nariz.position.set(0, 1.42, 0.33);
  g.add(corpo, cabeca, cabelo, nariz);
  return g;
}

// Ada: jaleco branco e crachá azul
// Ada: baseada na arte de referência (estilo chibi, cabelo cacheado preso, jaleco branco, crachá vermelho)
function criarAda() {
  const PELE = 0xd9915e, CABELO = 0x2b1d17, BRANCO = 0xf7f7fa, CALCA = 0xe4e4ec, VERMELHO = 0xa3162b;
  const g = new THREE.Group();
  const m = (geo, cor, x, y, z, sombra = true) => { const o = new THREE.Mesh(geo, mat(cor)); o.position.set(x, y, z); o.castShadow = sombra; g.add(o); return o; };
  // pernas e sapatos, presos num pivô no quadril para poderem balançar ao andar
  g.userData.pernas = [-0.17, 0.17].map(x => {
    const piv = new THREE.Group(); piv.position.set(x, 0.42, 0); g.add(piv);
    const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.36, 12), mat(CALCA)); perna.position.y = -0.18; perna.castShadow = true;
    const sap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.34), mat(0xffffff)); sap.position.set(0, -0.36, 0.05); sap.castShadow = true;
    piv.add(perna, sap);
    return piv;
  });
  // jaleco (tronco + aba)
  m(new THREE.CylinderGeometry(0.38, 0.5, 0.62, 20), BRANCO, 0, 0.72, 0);
  // braços curtos com mangas e mãos, presos num pivô no ombro (balançam ao andar e vão à frente ao carregar)
  g.userData.bracos = [-1, 1].map(lado => {
    const piv = new THREE.Group(); piv.position.set(lado * 0.4, 0.96, 0.02); piv.rotation.z = lado * 0.35; g.add(piv);
    const manga = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.42, 12), mat(BRANCO)); manga.position.y = -0.2; manga.castShadow = true;
    const mao = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), mat(PELE)); mao.position.y = -0.43;
    piv.add(manga, mao);
    return piv;
  });
  // cordão e crachá
  [-1, 1].forEach(lado => {
    const fita = m(new THREE.BoxGeometry(0.035, 0.32, 0.03), VERMELHO, lado * 0.09, 0.9, 0.36, false);
    fita.rotation.z = -lado * 0.35; fita.rotation.x = -0.25;
  });
  m(new THREE.BoxGeometry(0.2, 0.17, 0.04), 0xffffff, 0, 0.72, 0.45);
  m(new THREE.SphereGeometry(0.035, 8, 8), VERMELHO, 0, 0.74, 0.475, false);
  // cabeça grande
  m(new THREE.SphereGeometry(0.46, 24, 18), PELE, 0, 1.38, 0.02);
  // olhos e brincos de pérola
  [-0.15, 0.15].forEach(x => m(new THREE.SphereGeometry(0.055, 10, 8), 0x23160f, x, 1.38, 0.43, false));
  [-0.45, 0.45].forEach(x => m(new THREE.SphereGeometry(0.05, 10, 8), 0xffffff, x, 1.24, 0.02, false));
  // cabelo: calota puxada para trás + faixa lilás + rabo cacheado
  const calota = m(new THREE.SphereGeometry(0.49, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), CABELO, 0, 1.42, -0.04);
  calota.rotation.x = -0.45;
  const faixa = m(new THREE.TorusGeometry(0.13, 0.035, 8, 20), 0xc9b3d6, 0, 1.68, -0.4, false);
  faixa.rotation.x = 0.9;
  [[0, 1.68, -0.56, 0.2], [-0.13, 1.55, -0.66, 0.17], [0.13, 1.55, -0.66, 0.17], [0, 1.42, -0.72, 0.18], [-0.1, 1.28, -0.7, 0.15], [0.1, 1.28, -0.7, 0.15], [0, 1.15, -0.66, 0.13]]
    .forEach(([x, y, z, r]) => m(new THREE.SphereGeometry(r, 12, 10), CABELO, x, y, z));
  return g;
}
const ada = criarAda();
scene.add(ada);
const carregando = { tipo: null, mesh: null, origem: null };

// Anel de alvo
const anel = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.78, 40), new THREE.MeshBasicMaterial({ color: 0xffc533, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
anel.rotation.x = -Math.PI / 2; anel.visible = false;
scene.add(anel);

// Transportadores
const POS_TRANSP = [-4.8, -2.4, 0, 2.4, 4.8];
const XT = 8.4, XPORTA = 14;
const transportadores = [];
// Transportador no mesmo estilo da Ada: cabeça grande, uniforme azul com faixa refletiva, boné
// e a caixa térmica nas mãos, à frente do corpo (virada para o balcão).
const matCaixaTampa = (function () {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#1f5f99"; g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#ffffff";
  g.beginPath(); g.moveTo(64, 22); g.bezierCurveTo(90, 56, 92, 66, 92, 76); g.arc(64, 76, 28, 0, Math.PI); g.bezierCurveTo(36, 66, 38, 56, 64, 22); g.fill();
  g.fillStyle = "#b3122a"; g.fillRect(58, 58, 12, 34); g.fillRect(47, 69, 34, 12);
  return new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(c), roughness: 0.6 });
})();
// Transportadores são clonados de moldes (um por tom de pele), feitos uma vez na carga. O clone compartilha
// geometria e material: chegar não cria nada novo na placa de vídeo e sair não deixa nada para trás.
// (Antes, cada transportador construía ~22 geometrias e ~20 materiais que nunca eram descartados: pico de
// quadro a cada chegada e memória de vídeo crescendo a sessão inteira.) Os pivôs animados são achados pelo
// nome depois de clonar, porque o clone copia userData por JSON e perderia as referências.
const PELES_TRANSPORTADOR = [0x8d5a3b, 0xd9a47c, 0x5b3a26, 0xe6b98f, 0xb47a52];
const MAT_TRANSP = {
  unif: mat(0x24507e), calca: mat(0x1d2b3a), bota: mat(0x1a1a1a), refletiva: mat(0xd9f24a, { emissive: 0x2a3300 }),
  caixa: mat(0xf4f6f8, { roughness: 0.5 }), azul: mat(0x1f5f99), escuro: mat(0x13263a), olho: mat(0x1a120c)
};
// geometrias únicas, compartilhadas por todos os moldes (só o material de pele muda entre eles)
const GEO_TRANSP = {
  perna: new THREE.CylinderGeometry(0.14, 0.15, 0.36, 10), bota: new THREE.BoxGeometry(0.25, 0.13, 0.34),
  tronco: new THREE.CylinderGeometry(0.38, 0.47, 0.62, 18), refletiva: new THREE.CylinderGeometry(0.405, 0.43, 0.08, 18),
  manga: new THREE.CylinderGeometry(0.11, 0.13, 0.42, 10), mao: new THREE.SphereGeometry(0.1, 10, 8),
  corpoCx: new THREE.BoxGeometry(0.3, 0.36, 0.56), tampaCx: new THREE.BoxGeometry(0.33, 0.07, 0.59), faixaCx: new THREE.BoxGeometry(0.31, 0.06, 0.57),
  fecho: new THREE.BoxGeometry(0.04, 0.07, 0.04), alca: new THREE.BoxGeometry(0.05, 0.04, 0.3),
  cabeca: new THREE.SphereGeometry(0.44, 20, 16), olho: new THREE.SphereGeometry(0.05, 8, 6),
  bone: new THREE.SphereGeometry(0.46, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.42), aba: new THREE.BoxGeometry(0.5, 0.05, 0.32)
};
function construirMoldeTransportador(pele) {
  const matPele = mat(pele), G = GEO_TRANSP;
  const g = new THREE.Group();
  const m = (geo, material, x, y, z, sombra = true) => { const o = new THREE.Mesh(geo, material); o.position.set(x, y, z); o.castShadow = sombra; g.add(o); return o; };
  [-0.17, 0.17].forEach((x, i) => {
    const piv = new THREE.Group(); piv.name = "perna" + i; piv.position.set(x, 0.42, 0); g.add(piv);
    const perna = new THREE.Mesh(G.perna, MAT_TRANSP.calca); perna.position.y = -0.18; perna.castShadow = true;
    const bota = new THREE.Mesh(G.bota, MAT_TRANSP.bota); bota.position.set(0, -0.36, 0.05); bota.castShadow = true;
    piv.add(perna, bota);
  });
  m(G.tronco, MAT_TRANSP.unif, 0, 0.72, 0);
  m(G.refletiva, MAT_TRANSP.refletiva, 0, 0.66, 0, false);   // faixa refletiva
  // caixa térmica carregada como maleta: braço direito (lado da câmera) para baixo segurando a alça;
  // o braço esquerdo fica solto ao lado do corpo. Os dois balançam ao andar.
  const braco = (nome, lado, abertura) => {
    const piv = new THREE.Group(); piv.name = nome; piv.position.set(lado * 0.38, 0.95, 0.02); g.add(piv);
    const arm = new THREE.Group(); arm.rotation.z = lado * abertura; piv.add(arm);
    const manga = new THREE.Mesh(G.manga, MAT_TRANSP.unif); manga.position.y = -0.2; manga.castShadow = true;
    const mao = new THREE.Mesh(G.mao, matPele); mao.position.y = -0.42;
    arm.add(manga, mao);
    return piv;
  };
  braco("bracoLivre", -1, 0.18);
  const bracoMaleta = braco("bracoMaleta", 1, 0.48);
  // a maleta pendurada na mão: alça no alto, ao lado da perna
  const maleta = new THREE.Group(); maleta.position.set(0.24, -0.37, 0); bracoMaleta.add(maleta);
  const corpoCx = new THREE.Mesh(G.corpoCx, MAT_TRANSP.caixa); corpoCx.position.y = -0.28; corpoCx.castShadow = true;
  const tampaCx = new THREE.Mesh(G.tampaCx, matCaixaTampa); tampaCx.position.y = -0.08; tampaCx.castShadow = true;
  const faixaCx = new THREE.Mesh(G.faixaCx, MAT_TRANSP.azul); faixaCx.position.y = -0.3;
  maleta.add(corpoCx, tampaCx, faixaCx);
  [-0.12, 0.12].forEach(zz => { const p = new THREE.Mesh(G.fecho, MAT_TRANSP.escuro); p.position.set(0, -0.02, zz); maleta.add(p); });
  const alca = new THREE.Mesh(G.alca, MAT_TRANSP.escuro); alca.position.y = 0.02; maleta.add(alca);
  // cabeça, olhos e boné com aba
  m(G.cabeca, matPele, 0, 1.38, 0.02);
  [-0.14, 0.14].forEach(x => m(G.olho, MAT_TRANSP.olho, x, 1.38, 0.42, false));
  const bone = m(G.bone, MAT_TRANSP.azul, 0, 1.45, 0);
  bone.rotation.x = -0.12;
  m(G.aba, MAT_TRANSP.azul, 0, 1.62, 0.42);                                          // aba do boné
  g.rotation.y = -Math.PI / 2; // olhando para a Ada
  return g;
}
const moldesTransportador = PELES_TRANSPORTADOR.map(construirMoldeTransportador);   // na carga, atrás da tela de abertura
function criarTransportador() {
  const g = moldesTransportador[Math.floor(Math.random() * moldesTransportador.length)].clone();
  g.userData.pernas = [g.getObjectByName("perna0"), g.getObjectByName("perna1")];
  g.userData.bracosT = [g.getObjectByName("bracoLivre"), g.getObjectByName("bracoMaleta")];
  return g;
}

// passadas: pernas (e braços, quando há pivô de braço) balançam conforme a fase
function animarPassos(obj, fase, intensidade) {
  const p = obj.userData.pernas;
  if (p) { p[0].rotation.x = Math.sin(fase) * 0.55 * intensidade; p[1].rotation.x = -Math.sin(fase) * 0.55 * intensidade; }
  const bt = obj.userData.bracosT;   // transportador: braço solto e maleta balançam ao contrário das pernas
  if (bt) { bt[0].rotation.x = -Math.sin(fase) * 0.4 * intensidade; bt[1].rotation.x = Math.sin(fase) * 0.22 * intensidade; }
}

// faíscas de comemoração (ou de erro) que sobem e somem
const efeitos = [];
const geoFaisca = new THREE.BoxGeometry(0.12, 0.12, 0.12);
function soltarFaiscas(x, z, cor, qtd) {
  for (let i = 0; i < qtd; i++) {
    const f = new THREE.Mesh(geoFaisca, new THREE.MeshBasicMaterial({ color: cor, transparent: true }));
    f.position.set(x, 1.6, z);
    const ang = Math.random() * Math.PI * 2, vel = 1.2 + Math.random() * 1.6;
    f.userData = { vx: Math.cos(ang) * vel, vz: Math.sin(ang) * vel, vy: 2.5 + Math.random() * 1.5, vida: 0.8 };
    scene.add(f); efeitos.push(f);
  }
}
function atualizarEfeitos(dt) {
  for (let i = efeitos.length - 1; i >= 0; i--) {
    const f = efeitos[i], u = f.userData;
    u.vida -= dt; u.vy -= 6 * dt;
    f.position.x += u.vx * dt; f.position.y += u.vy * dt; f.position.z += u.vz * dt;
    f.rotation.x += dt * 6; f.rotation.y += dt * 4;
    f.material.opacity = Math.max(0, u.vida / 0.8);
    if (u.vida <= 0) { scene.remove(f); f.material.dispose(); efeitos.splice(i, 1); }
  }
}
