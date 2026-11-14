// =====================================================================
// CENA 3D
// =====================================================================
const canvas = document.getElementById("cena");
const EH_CELULAR = !!(window.matchMedia && matchMedia("(pointer: coarse)").matches);
// com tela de 2x (a maioria dos celulares) o antialias é redundante e custa caro: só liga em telas de 1x
const renderer = new THREE.WebGLRenderer({ canvas, antialias: (window.devicePixelRatio || 1) < 2, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // até 2x também no celular: texto das bolsas nítido
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = EH_CELULAR ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.setClearColor(0xdfe7ee);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xdfe7ee, 30, 55);
// near/far apertados em volta da sala (a câmera fica a ~22–32 de tudo): mais precisão de profundidade,
// sem "briga" entre a etiqueta e a bolsa (piscava em alguns celulares)
const camera = new THREE.PerspectiveCamera(38, 1, 8, 60);
// Câmera no teto com leve inclinação
camera.position.set(0, 25, 9.5);
camera.lookAt(0, 0, 0.6);

scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c6d3, 0.75));
const sol = new THREE.DirectionalLight(0xffffff, 0.7);
sol.position.set(-6, 18, 8);
sol.castShadow = true;
sol.shadow.mapSize.set(EH_CELULAR ? 1024 : 2048, EH_CELULAR ? 1024 : 2048);
Object.assign(sol.shadow.camera, { left: -15, right: 15, top: 12, bottom: -12, near: 1, far: 50 });
sol.shadow.bias = -0.0006; sol.shadow.normalBias = 0.02; // evita sombra "chiando" em cima das bolsas
scene.add(sol);

// Texto nítido nos modelinhos 3D: o canvas é reduzido (com suavização de alta qualidade) para perto do tamanho
// em que aparece na tela, em vez de deixar a placa de vídeo encolher uma imagem enorme (o que borra).
//  • deitada (vista quase de frente pela câmera): sem mipmap, fica bem nítida;
//  • inclinada/em pé (vista de lado): mantém mipmap + filtro anisotrópico, que lidam bem com a inclinação.
function pxPorUnidade() {
  // altura útil da tela: a do aparelho (a janela pode crescer depois, em tela cheia), nunca menor que a da janela
  const H = Math.max(window.innerHeight || 0, Math.min(screen.width || 0, screen.height || 0)) || 720;
  return 0.0577 * H * Math.min(window.devicePixelRatio || 1, 2);
}
function texturaNitida(c, larguraMundo, deitada) {
  const alvo = Math.max(32, Math.ceil(larguraMundo * pxPorUnidade() * 1.5));
  let fonte = c;
  if (alvo < c.width) {
    let w = c.width, h = c.height;
    while (w / 2 >= alvo) {   // reduz pela metade em passos: o resultado fica mais limpo
      const n = document.createElement("canvas"); n.width = Math.round(w / 2); n.height = Math.max(1, Math.round(h / 2));
      const g = n.getContext("2d"); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(fonte, 0, 0, n.width, n.height);
      fonte = n; w = n.width; h = n.height;
    }
    if (w > alvo) {
      const n = document.createElement("canvas"); n.width = alvo; n.height = Math.max(1, Math.round(h * alvo / w));
      const g = n.getContext("2d"); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(fonte, 0, 0, n.width, n.height);
      fonte = n;
    }
  }
  const tex = new THREE.CanvasTexture(fonte);
  if (deitada) { tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; }
  else tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}
function mat(cor, extra) { return new THREE.MeshStandardMaterial(Object.assign({ color: cor, roughness: 0.75 }, extra || {})); }
function caixa(w, h, d, cor, x, y, z, sombra) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(cor));
  m.position.set(x, y, z);
  m.castShadow = !!sombra; m.receiveShadow = true;
  scene.add(m);
  return m;
}

// Piso de ladrilhos
(function () {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  // ladrilho em xadrez bem suave (2 x 2 placas por repetição) com rejunte
  g.fillStyle = "#eef2f5"; g.fillRect(0, 0, 128, 128);
  g.fillStyle = "#e6ecf1"; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64);
  g.strokeStyle = "#d2dce5"; g.lineWidth = 2;
  g.strokeRect(1, 1, 126, 126); g.beginPath(); g.moveTo(64, 0); g.lineTo(64, 128); g.moveTo(0, 64); g.lineTo(128, 64); g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(6, 4);
  tex.anisotropy = 4;
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(26, 17), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true;
  scene.add(piso);
})();

// Paredes
caixa(26, 2.4, 0.4, 0xc9d5e0, 0, 1.2, -8.3);
caixa(0.4, 2.4, 17, 0xc9d5e0, -13, 1.2, 0);
caixa(0.4, 2.4, 6, 0xc9d5e0, 13, 1.2, -5.5);
caixa(0.4, 2.4, 6, 0xc9d5e0, 13, 1.2, 5.5);
// faixa azul institucional na parede do fundo
caixa(26, 0.25, 0.42, 0x1f5f99, 0, 1.9, -8.3);
// rodapés
caixa(26, 0.18, 0.06, 0x8fa3b6, 0, 0.09, -8.07);
caixa(0.06, 0.18, 17, 0x8fa3b6, -12.77, 0.09, 0);
// porta dos transportadores (vão na parede da direita) com batentes e capacho
caixa(0.5, 2.5, 0.22, 0x1f5f99, 13, 1.25, -2.5, true);
caixa(0.5, 2.5, 0.22, 0x1f5f99, 13, 1.25, 2.5, true);
caixa(1.3, 0.03, 2.8, 0x5d6b78, 12.1, 0.015, 0);
// área dos transportadores com piso diferente (azulado), do balcão até a porta
(function () {
  const area = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 13.6), new THREE.MeshStandardMaterial({ color: 0xd3deea, roughness: 0.95 }));
  area.rotation.x = -Math.PI / 2; area.position.set(10.35, 0.005, 0); area.receiveShadow = true;
  scene.add(area);
})();
// relógio e cartaz na parede do fundo (vistos de cima, de leve)
(function () {
  const rel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 28), mat(0xffffff));
  rel.rotation.x = Math.PI / 2; rel.position.set(-3, 1.75, -8.05); scene.add(rel); // o canto da esquerda ficou com os freezers
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 28), mat(0x13263a));
  aro.position.set(-3, 1.75, -8.0); scene.add(aro);
  const c = document.createElement("canvas"); c.width = 256; c.height = 160;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 160);
  g.fillStyle = "#b3122a"; g.fillRect(0, 0, 256, 18);
  g.beginPath(); g.moveTo(48, 40); g.bezierCurveTo(80, 82, 82, 96, 82, 108); g.arc(48, 108, 34, 0, Math.PI); g.bezierCurveTo(14, 96, 16, 82, 48, 40); g.fill();
  g.fillStyle = "#13263a"; g.font = "800 30px system-ui, sans-serif"; g.fillText("DOE", 100, 84); g.fillText("SANGUE", 100, 118);
  const cartaz = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ map: texturaNitida(c, 1.6, false) }));
  cartaz.position.set(8.2, 1.55, -8.08); scene.add(cartaz);
})();

// =====================================================================
// Corredor do laboratório (faixa da esquerda, entre a parede e a câmara de conservação) — só enfeite:
// freezers de plasma e crio enfileirados, agitador de plaquetas, bancadas com equipamentos e banquetas,
// geladeira de reagentes. As peças ficam encostadas na parede, com a frente virada para o corredor.
// =====================================================================
const LAB = { giram: [], bandeja: null };
(function () {
  const XP = -12.3;                       // centro das peças (encostadas na parede da esquerda)
  const Y_TAMPO = 0.86;
  // cria uma peça no "espaço local": largura no eixo x, frente em +z; depois vira a frente para o corredor
  function peca(z, montar) {
    const g = new THREE.Group(); g.position.set(XP, 0, z); g.rotation.y = Math.PI / 2; scene.add(g);
    const add = (geo, material, x, y, zz, sombra) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, zz); m.castShadow = !!sombra; m.receiveShadow = true; g.add(m); return m; };
    const box = (w, h, d, cor, x, y, zz, sombra, extra) => add(new THREE.BoxGeometry(w, h, d), mat(cor, extra), x, y, zz, sombra);
    const cil = (r1, r2, h, cor, x, y, zz, sombra, extra) => add(new THREE.CylinderGeometry(r1, r2, h, 18), mat(cor, extra), x, y, zz, sombra);
    montar({ g, add, box, cil });
    return g;
  }
  // etiqueta no tampo, colada direto na cena para o texto ficar de pé para a câmera
  function etiqueta(largX, profZ, x, y, z, desenhar) {
    const px = 256, c = document.createElement("canvas"); c.width = px; c.height = Math.round(px * profZ / largX);
    desenhar(c.getContext("2d"), c.width, c.height);
    const tex = texturaNitida(c, largX, true);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(largX, profZ), new THREE.MeshBasicMaterial({ map: tex }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); scene.add(m); return m;
  }
  function placa(z, y, titulo, temp, cor, corTexto, corTemp) {
    etiqueta(0.78, 0.92, XP, y + 0.006, z, (g, W, H) => {
      g.fillStyle = "#f3f6f9"; g.fillRect(0, 0, W, H);
      g.fillStyle = cor; g.fillRect(14, 40, W - 28, 100);
      g.fillStyle = corTexto; g.textAlign = "center"; g.textBaseline = "middle";
      let px = 56; g.font = `900 ${px}px system-ui, sans-serif`;
      while (g.measureText(titulo).width > W - 44 && px > 24) { px -= 2; g.font = `900 ${px}px system-ui, sans-serif`; }
      g.fillText(titulo, W / 2, 92);
      g.fillStyle = "#13263a"; g.fillRect(40, 180, W - 80, 70);
      g.fillStyle = corTemp; g.font = "800 44px system-ui, sans-serif"; g.fillText(temp, W / 2, 216);
    });
  }
  function freezer(z, titulo, cor, corTexto, alt) {
    peca(z, ({ box }) => {
      box(1.1, alt, 0.9, 0xf3f6f9, 0, alt / 2, 0, true, { roughness: 0.45 });
      const n = 4;
      for (let i = 0; i < n; i++) {
        const y = 0.22 + i * (alt - 0.3) / n;
        box(1.0, (alt - 0.3) / n - 0.05, 0.02, 0xe3e9f0, 0, y + 0.12, 0.46, false, { roughness: 0.4 });
        box(0.46, 0.04, 0.05, 0x8a97a6, 0, y + 0.2, 0.49, false, { metalness: 0.5, roughness: 0.3 });
      }
      box(1.1, 0.06, 0.92, cor, 0, alt - 0.03, 0);  // faixa colorida no alto
    });
    placa(z, alt, titulo, "−30 °C", cor, corTexto, "#7cc4ff");
  }
  function banqueta(x, z) {
    const m = (geo, cor, y) => { const o = new THREE.Mesh(geo, mat(cor, { roughness: 0.5 })); o.position.set(x, y, z); o.castShadow = true; scene.add(o); return o; };
    m(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 16), 0x5d6b78, 0.02);
    m(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 8), 0x8a97a6, 0.3);
    m(new THREE.CylinderGeometry(0.21, 0.19, 0.08, 18), 0x1f5f99, 0.6);
  }
  function centrifuga(cx, cy, r, ctx, corTampa) {
    ctx.cil(r, r * 1.05, 0.26, 0xe9eef3, cx, cy + 0.13, 0, true, { roughness: 0.4 });
    const tampa = new THREE.Group(); tampa.position.set(cx, cy + 0.28, 0); ctx.g.add(tampa);
    const d = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.92, 0.04, 22), mat(corTampa, { roughness: 0.35 })); tampa.add(d);
    const mk = new THREE.Mesh(new THREE.BoxGeometry(r * 0.8, 0.02, 0.05), mat(0xffffff)); mk.position.set(r * 0.35, 0.03, 0); tampa.add(mk);
    ctx.box(0.14, 0.05, 0.02, 0x3ad16f, cx, cy + 0.12, r + 0.02, false, { emissive: 0x1a6b38 });
    LAB.giram.push({ obj: tampa, fase: Math.random() * 9 });
  }

  // ---------- freezers enfileirados (do fundo para a frente) ----------
  freezer(-7.15, "PLASMA", "#f2c14e", "#5a3a00", 1.7);
  freezer(-6.0, "PLASMA", "#f2c14e", "#5a3a00", 1.7);
  freezer(-4.85, "CRIO", "#9ad0ec", "#0f3a57", 1.7);

  // ---------- agitador de plaquetas: bandeja vai e volta sob a tampa de vidro, a 22 °C ----------
  peca(-3.65, ({ g, add, box }) => {
    box(1.05, 0.72, 0.9, 0xf3f6f9, 0, 0.36, 0, true, { roughness: 0.45 });
    box(0.36, 0.12, 0.02, 0x13263a, -0.25, 0.55, 0.46, false, { emissive: 0x0b2a14 });
    [-0.43, 0.43].forEach(zz => box(1.05, 0.26, 0.04, 0xd5dde5, 0, 0.85, zz));
    [-0.505, 0.505].forEach(x => box(0.04, 0.26, 0.9, 0xd5dde5, x, 0.85, 0));
    const bandeja = new THREE.Group(); bandeja.position.set(0, 0.75, 0); g.add(bandeja);
    bandeja.add(new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.03, 0.74), mat(0xb8c4d0, { metalness: 0.4, roughness: 0.35 })));
    const matPlaq = new THREE.MeshPhysicalMaterial({ color: 0xf2c94c, roughness: 0.3, clearcoat: 0.6 });
    [[-0.25, -0.15], [0.05, -0.15], [-0.1, 0.18], [0.22, 0.12]].forEach(([x, zz]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.28), matPlaq); b.position.set(x, 0.04, zz); bandeja.add(b);
    });
    LAB.bandeja = bandeja;
    const vidro = add(new THREE.BoxGeometry(1.0, 0.02, 0.84), new THREE.MeshStandardMaterial({ color: 0xcfeaf7, transparent: true, opacity: 0.25, roughness: 0.1 }), 0, 0.98, 0);
    vidro.receiveShadow = false;
  });
  etiqueta(0.24, 0.9, XP + 0.52, 1.0, -3.65, (g, W, H) => {   // faixa "PLAQUETAS 22 °C" na borda do vidro
    g.fillStyle = "#f2c94c"; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2, H / 2); g.rotate(-Math.PI / 2);
    g.fillStyle = "#5a3a00"; g.font = "900 44px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("PLAQUETAS · 22 °C", 0, 2); g.restore();
  });

  // ---------- bancada 1: prova cruzada (centrífuga de tubos, microscópio, estante, pipeta) ----------
  peca(-1.35, ctx => {
    const { box, cil } = ctx;
    box(2.6, 0.82, 0.9, 0xffffff, 0, 0.41, 0, true);
    box(2.62, 0.05, 0.92, 0x9fb4c7, 0, 0.845, 0);
    centrifuga(-0.85, Y_TAMPO, 0.3, ctx, 0x1f5f99);
    // microscópio
    box(0.34, 0.05, 0.4, 0x2b3a4a, -0.05, Y_TAMPO + 0.03, 0.02, true);
    box(0.08, 0.42, 0.1, 0x2b3a4a, -0.05, Y_TAMPO + 0.25, -0.14, true);
    box(0.24, 0.03, 0.22, 0x5d6b78, -0.05, Y_TAMPO + 0.2, 0.04);
    const tubo = cil(0.05, 0.06, 0.32, 0xf4f4f6, -0.05, Y_TAMPO + 0.43, -0.04, true, { roughness: 0.35 }); tubo.rotation.x = -0.45;
    cil(0.035, 0.035, 0.08, 0x13263a, -0.05, Y_TAMPO + 0.6, 0.04);
    // estante de tubos com tampinhas coloridas
    box(0.5, 0.08, 0.22, 0xffffff, 0.6, Y_TAMPO + 0.04, -0.1);
    [0xd62839, 0x7b3fa0, 0xffc533, 0x2f7fd0, 0x2bb673, 0x8a97a6, 0xd62839, 0x2f7fd0].forEach((cor, i) => {
      const x = 0.45 + (i % 4) * 0.1, zz = -0.15 + Math.floor(i / 4) * 0.1;
      cil(0.03, 0.03, 0.2, 0xdfe9f2, x, Y_TAMPO + 0.14, zz, false, { roughness: 0.2, transparent: true, opacity: 0.85 });
      cil(0.035, 0.035, 0.04, cor, x, Y_TAMPO + 0.26, zz);
    });
    const pip = cil(0.03, 0.02, 0.42, 0xf4f4f6, 0.6, Y_TAMPO + 0.04, 0.25, false); pip.rotation.z = Math.PI / 2; pip.rotation.y = 0.3;
    // frascos de reagente
    [[1.05, 0xd62839], [1.15, 0x2f7fd0], [1.1, 0xffc533]].forEach(([x, cor], i) => {
      cil(0.045, 0.05, 0.14, 0xffffff, x, Y_TAMPO + 0.07, 0.15 - i * 0.12, true, { roughness: 0.3 });
      cil(0.03, 0.03, 0.04, cor, x, Y_TAMPO + 0.16, 0.15 - i * 0.12);
    });
  });
  banqueta(-11.45, -1.95); banqueta(-11.45, -0.75);

  // ---------- bancada 2: imuno-hematologia (incubadora e centrífuga de cartões gel, banho-maria, computador) ----------
  peca(1.75, ctx => {
    const { box, add } = ctx;
    box(2.6, 0.82, 0.9, 0xffffff, 0, 0.41, 0, true);
    box(2.62, 0.05, 0.92, 0x9fb4c7, 0, 0.845, 0);
    // computador
    box(0.6, 0.38, 0.04, 0x1b2733, -0.85, Y_TAMPO + 0.36, -0.2, true);
    add(new THREE.PlaneGeometry(0.54, 0.32), new THREE.MeshBasicMaterial({ color: 0x5aa9e6 }), -0.85, Y_TAMPO + 0.36, -0.177);
    box(0.06, 0.16, 0.06, 0x5d6b78, -0.85, Y_TAMPO + 0.1, -0.22);
    box(0.5, 0.02, 0.18, 0xe3e9f0, -0.85, Y_TAMPO + 0.01, 0.15);
    // incubadora de cartões (janelinha com luz laranja)
    box(0.45, 0.24, 0.36, 0xd5dde5, -0.15, Y_TAMPO + 0.12, -0.05, true);
    box(0.25, 0.08, 0.02, 0xff9f43, -0.15, Y_TAMPO + 0.14, 0.135, false, { emissive: 0x7a3d00 });
    // centrífuga de cartões gel
    centrifuga(0.45, Y_TAMPO, 0.22, ctx, 0xb3122a);
    // cartões gel em pé
    for (let i = 0; i < 6; i++) box(0.02, 0.12, 0.09, i % 2 ? 0xf3f6f9 : 0xe8f3ff, 0.82 + i * 0.035, Y_TAMPO + 0.06, 0.18);
    // banho-maria com água azulzinha
    box(0.36, 0.16, 0.3, 0xc9d5e0, 1.0, Y_TAMPO + 0.08, -0.18, true);
    add(new THREE.PlaneGeometry(0.3, 0.24), new THREE.MeshStandardMaterial({ color: 0x7cc4ff, roughness: 0.1, metalness: 0.2 }), 1.0, Y_TAMPO + 0.165, -0.18).rotation.x = -Math.PI / 2;
  });
  banqueta(-11.45, 1.15); banqueta(-11.45, 2.35);

  // ---------- geladeira de reagentes (porta de vidro, 4 °C) ----------
  peca(4.0, ({ box, add }) => {
    box(1.1, 1.5, 0.9, 0xf3f6f9, 0, 0.75, 0, true, { roughness: 0.45 });
    add(new THREE.BoxGeometry(0.96, 1.2, 0.02), new THREE.MeshStandardMaterial({ color: 0xbfe3f5, transparent: true, opacity: 0.55, roughness: 0.1, emissive: 0x15394d, emissiveIntensity: 0.3 }), 0, 0.72, 0.46);
    [0.35, 0.7, 1.05].forEach(y => {
      box(0.9, 0.02, 0.7, 0xd5dde5, 0, y, 0.05);
      [-0.3, -0.1, 0.12, 0.3].forEach((x, i) => box(0.12, 0.14, 0.12, [0xd62839, 0x2f7fd0, 0xffc533, 0x2bb673][(i + y * 10 | 0) % 4], x, y + 0.08, 0.15));
    });
    box(0.04, 0.5, 0.05, 0x8a97a6, 0.42, 0.75, 0.5, false, { metalness: 0.5 });
  });
  placa(4.0, 1.5, "REAGENTES", "4 °C", "#2bb673", "#ffffff", "#3ad16f");

  // ---------- planta e lixeira no fim do corredor ----------
  (function () {
    const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.45, 16), mat(0xc8a882)); vaso.position.set(-12.3, 0.22, 5.55); vaso.castShadow = true; scene.add(vaso);
    [[0, 0.75, 0, 0.38], [0.18, 0.62, 0.12, 0.26], [-0.16, 0.66, -0.1, 0.28]].forEach(([dx, y, dz, r]) => {
      const f = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat(0x2bb673, { roughness: 0.8 })); f.position.set(-12.3 + dx, y, 5.55 + dz); f.castShadow = true; scene.add(f);
    });
    const lixo = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.5, 16), mat(0x8a97a6, { roughness: 0.5 })); lixo.position.set(-12.35, 0.25, 6.5); lixo.castShadow = true; scene.add(lixo);
  })();
})();
// animação boba do laboratório (roda sempre, custa quase nada)
function animarLab(t) {
  if (LAB.bandeja) LAB.bandeja.position.x = Math.sin(t * 5) * 0.06;                     // agitador: vai e volta
  LAB.giram.forEach(c => {                                                              // centrífugas: giram 5 s, descansam 4 s
    const ciclo = (t + c.fase) % 9, giro = ciclo < 5 ? Math.min(1, ciclo, 5 - ciclo) : 0;
    c.obj.rotation.y += giro * 0.45;
  });
}

// Estoque: câmara de conservação + bancada
// Em L: bancada da esquerda (10 vagas) + bancada do fundo (10 vagas), uma fileira cada
caixa(0.7, 2.2, 15, 0xf7f9fb, -9.6, 1.1, -0.6, true);
caixa(0.72, 0.18, 15.02, 0x1f5f99, -9.6, 2.0, -0.6);
// portas de vidro da câmara de conservação, com puxadores e o mostrador de temperatura
(function () {
  const vidro = new THREE.MeshStandardMaterial({ color: 0xbfe3f5, roughness: 0.15, metalness: 0.1, emissive: 0x15394d, emissiveIntensity: 0.35 });
  for (let i = 0; i < 5; i++) {
    const z = -6.6 + i * 2.95;
    const porta = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.5, 2.7), vidro);
    porta.position.set(-9.23, 1.05, z); scene.add(porta);
    const puxador = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), mat(0x8a97a6));
    puxador.position.set(-9.18, 1.05, z + 1.15); scene.add(puxador);
  }
  const c = document.createElement("canvas"); c.width = 128; c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#0b1622"; g.fillRect(0, 0, 128, 64);
  g.fillStyle = "#3ad16f"; g.font = "800 40px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("4°C", 64, 34);
  const visor = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: texturaNitida(c, 0.5, false) }));
  visor.rotation.y = Math.PI / 2; visor.position.set(-9.22, 1.95, -0.6); scene.add(visor);
})();
caixa(1.5, 0.8, 12.2, 0xffffff, -8.05, 0.4, 0.3, true);
caixa(1.52, 0.06, 12.22, 0x9fb4c7, -8.05, 0.82, 0.3);
caixa(11.6, 0.8, 1.5, 0xffffff, -0.4, 0.4, -7.35, true);
caixa(11.62, 0.06, 1.52, 0x9fb4c7, -0.4, 0.82, -7.35);

// Descarte: coletor de resíduo infectante (Grupo A), no canto de baixo à direita,
// longe do estoque e do balcão, para ninguém descartar sem querer
const DESCARTE = { x: 4.7, z: 7.35, alcance: 1.5 };
function desenharBiohazard(g, cx, cy, R, cor) {
  // símbolo de risco biológico desenhado num canvas próprio e depois copiado
  const c = document.createElement("canvas"); c.width = c.height = Math.ceil(R * 2.4);
  const h = c.getContext("2d"), o = c.width / 2;
  const dirs = [-90, 30, 150].map(d => d * Math.PI / 180);
  h.fillStyle = cor; h.strokeStyle = cor;
  dirs.forEach(a => { h.beginPath(); h.arc(o + Math.cos(a) * 0.5 * R, o + Math.sin(a) * 0.5 * R, 0.58 * R, 0, Math.PI * 2); h.fill(); });
  h.lineWidth = 0.1 * R; h.beginPath(); h.arc(o, o, 0.62 * R, 0, Math.PI * 2); h.stroke();
  h.globalCompositeOperation = "destination-out";
  dirs.forEach(a => { h.beginPath(); h.arc(o + Math.cos(a) * 0.7 * R, o + Math.sin(a) * 0.7 * R, 0.42 * R, 0, Math.PI * 2); h.fill(); });
  h.beginPath(); h.arc(o, o, 0.17 * R, 0, Math.PI * 2); h.fill();
  h.lineWidth = 0.07 * R;
  dirs.forEach(a => { h.beginPath(); h.moveTo(o, o); h.lineTo(o + Math.cos(a) * 0.32 * R, o + Math.sin(a) * 0.32 * R); h.stroke(); });
  h.globalCompositeOperation = "source-over";
  g.drawImage(c, cx - o, cy - o);
}
function texturaInfectante(comTexto) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 256);
  // losango de alerta
  g.fillStyle = "#ffffff"; g.strokeStyle = "#13263a"; g.lineWidth = 8;
  g.beginPath(); g.moveTo(128, 14); g.lineTo(234, 120); g.lineTo(128, 226); g.lineTo(22, 120); g.closePath(); g.stroke();
  desenharBiohazard(g, 128, comTexto ? 112 : 120, comTexto ? 52 : 60, "#13263a");
  if (comTexto) {
    g.fillStyle = "#13263a"; g.font = "800 20px system-ui, sans-serif"; g.textAlign = "center";
    g.fillText("INFECTANTE", 128, 182);
  }
  return new THREE.CanvasTexture(c);
}
(function () {
  const X = DESCARTE.x, Z = DESCARTE.z;
  const add = (geo, material, x, y, z, sombra) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = !!sombra; m.receiveShadow = true; scene.add(m); return m; };
  add(new THREE.BoxGeometry(0.9, 0.95, 0.7), mat(0xf6f7f9, { roughness: 0.45 }), X, 0.475, Z, true);      // corpo
  add(new THREE.BoxGeometry(0.98, 0.1, 0.78), mat(0xffffff, { roughness: 0.35 }), X, 1.0, Z, true);        // tampa
  add(new THREE.CylinderGeometry(0.045, 0.045, 0.98, 10), mat(0xffffff), X, 1.02, Z - 0.39, false).rotation.z = Math.PI / 2;
  add(new THREE.BoxGeometry(0.4, 0.06, 0.2), mat(0x8a97a6), X, 0.06, Z + 0.46, true);                      // pedal
  // adesivos: na tampa (o que a câmera vê de cima) e na frente, colados nas faces
  const topo = add(new THREE.PlaneGeometry(0.64, 0.64), new THREE.MeshBasicMaterial({ map: texturaInfectante(false) }), X, 1.053, Z);
  topo.rotation.x = -Math.PI / 2;
  add(new THREE.PlaneGeometry(0.56, 0.56), new THREE.MeshBasicMaterial({ map: texturaInfectante(true) }), X, 0.5, Z + 0.353);
  // plaquinha em pé ao lado do coletor, virada para a câmera
  const c = document.createElement("canvas"); c.width = 512; c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, 512, 128);
  g.fillStyle = "#c81e3a"; g.fillRect(0, 0, 512, 12); g.fillRect(0, 116, 512, 12);
  desenharBiohazard(g, 64, 64, 34, "#13263a");
  g.fillStyle = "#13263a"; g.textAlign = "left"; g.textBaseline = "middle";
  g.font = "800 40px system-ui, sans-serif"; g.fillText("DESCARTE", 122, 50);
  g.font = "600 25px system-ui, sans-serif"; g.fillText("Resíduo infectante", 124, 90);
  const placa = add(new THREE.PlaneGeometry(1.5, 0.375), new THREE.MeshBasicMaterial({ map: texturaNitida(c, 1.5, false) }), X + 1.35, 1.12, Z - 0.05);
  placa.rotation.x = -0.9;
  add(new THREE.BoxGeometry(0.06, 0.95, 0.06), mat(0x8a97a6), X + 1.35, 0.5, Z + 0.05, true);              // pezinho
})();
caixa(1.5, 0.8, 1.6, 0xffffff, -8.05, 0.4, -6.85, true);

// Faixa no piso da área dos transportadores
// Balcão de distribuição: a Ada fica de um lado, os transportadores aguardam do outro
caixa(0.8, 0.9, 12.2, 0xf2f4f7, 7.35, 0.45, 0.1, true);          // corpo
caixa(0.82, 0.18, 12.22, 0x1f5f99, 7.35, 0.62, 0.1);              // faixa azul
caixa(1.0, 0.08, 12.4, 0xd9cbb4, 7.35, 0.94, 0.1, true);          // tampo
(function () {
  const c = document.createElement("canvas"); c.width = 512; c.height = 96;
  const g = c.getContext("2d");
  g.fillStyle = "#1f5f99"; g.fillRect(0, 0, 512, 96);
  g.fillStyle = "#ffffff"; g.font = "800 46px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("DISTRIBUIÇÃO", 256, 50);
  // plaquinha em pé na ponta da frente do balcão, virada para a câmera
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.3), new THREE.MeshBasicMaterial({ map: texturaNitida(c, 1.6, false) }));
  placa.rotation.x = -0.9;
  placa.position.set(7.35, 1.12, 5.9);
  const pe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.06), mat(0x8a97a6));
  pe.position.set(7.35, 1.03, 5.95);
  scene.add(placa, pe);
})();

// Mesinha dos telefones, embaixo, no meio da sala: Captação! (vermelho) e Rede Hemominas (azul)
const MESA = { x: 0, z: 7.45 };
const TELEFONES = {
  captacao: { nome: "Captação!", x: -0.8, z: 7.3, cor: 0xd0182f, apagado: 0x8a5a62, placa: "#d0182f", texto: "Captação!", lado: "esq" },
  rede: { nome: "Rede Hemominas", x: 0.8, z: 7.3, cor: 0x1f6fc0, apagado: 0x6d7f93, placa: "#1f6fc0", texto: "Rede", lado: "dir" }
};
const ALCANCE_TELEFONE = 1.5;
caixa(3.1, 0.08, 1.05, 0xc8a882, MESA.x, 0.78, MESA.z, true);
[[-1.45, -0.44], [1.45, -0.44], [-1.45, 0.44], [1.45, 0.44]].forEach(([dx, dz]) => caixa(0.08, 0.74, 0.08, 0x8a6a4a, MESA.x + dx, 0.37, MESA.z + dz, true));
// Mesinha do café, ao lado dos telefones
const CAFE = { x: -3.35, z: 7.45, alcance: 1.4 };
const vapor = [];
(function () {
  const X = CAFE.x, Z = CAFE.z;
  caixa(1.4, 0.08, 1.05, 0xc8a882, X, 0.78, Z, true);
  [[-0.62, -0.44], [0.62, -0.44], [-0.62, 0.44], [0.62, 0.44]].forEach(([dx, dz]) => caixa(0.08, 0.74, 0.08, 0x8a6a4a, X + dx, 0.37, Z + dz, true));
  // cafeteira: base, coluna, cabeça e jarra de vidro com café
  caixa(0.62, 0.08, 0.5, 0x23262b, X - 0.15, 0.86, Z - 0.1, true);
  caixa(0.18, 0.62, 0.5, 0x2c3036, X - 0.38, 1.13, Z - 0.1, true);
  caixa(0.62, 0.16, 0.5, 0x2c3036, X - 0.15, 1.42, Z - 0.1, true);
  const jarra = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.34, 18), new THREE.MeshStandardMaterial({ color: 0xbfd6e6, transparent: true, opacity: 0.45, roughness: 0.1 }));
  jarra.position.set(X - 0.05, 1.07, Z - 0.1);
  const liquido = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.2, 18), mat(0x3b1f0e));
  liquido.position.set(X - 0.05, 1.0, Z - 0.1);
  CAFE.luz = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0x3ad16f }));
  CAFE.luz.position.set(X - 0.38, 1.0, Z + 0.16);
  scene.add(jarra, liquido, CAFE.luz);
  // xícaras
  [[0.38, 0.05], [0.5, -0.25]].forEach(([dx, dz]) => {
    const x = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.12, 14), mat(0xffffff));
    x.position.set(X + dx, 0.88, Z + dz); x.castShadow = true; scene.add(x);
  });
  // vapor saindo da jarra quando o café está pronto
  for (let i = 0; i < 3; i++) {
    const v = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    v.userData.fase = i / 3; scene.add(v); vapor.push(v);
  }
  // plaquinha
  const c = document.createElement("canvas"); c.width = 256; c.height = 96;
  const g = c.getContext("2d");
  g.fillStyle = "#7a4a26"; g.fillRect(0, 0, 256, 96);
  g.fillStyle = "#ffffff"; g.font = "800 50px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("Café", 128, 50);
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.34), new THREE.MeshBasicMaterial({ map: texturaNitida(c, 0.9, true) }));
  placa.rotation.x = -Math.PI / 2; placa.position.set(X, 0.825, Z + 0.45);
  scene.add(placa);
})();

Object.values(TELEFONES).forEach(T => {
  T.mat = mat(T.cor, { roughness: 0.35 });
  const X = T.x, Z = T.z;
  const peca = (geo, x, y, z) => { const m = new THREE.Mesh(geo, T.mat); m.position.set(x, y, z); m.castShadow = true; scene.add(m); return m; };
  peca(new THREE.BoxGeometry(0.55, 0.16, 0.42), X, 0.9, Z);
  peca(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 12), X, 1.05, Z - 0.05).rotation.z = Math.PI / 2;
  peca(new THREE.BoxGeometry(0.14, 0.1, 0.18), X - 0.27, 1.02, Z - 0.05);
  peca(new THREE.BoxGeometry(0.14, 0.1, 0.18), X + 0.27, 1.02, Z - 0.05);
  const disco = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 20), mat(0xf4f4f6)); disco.position.set(X, 0.99, Z + 0.1);
  scene.add(disco);
  const c = document.createElement("canvas"); c.width = 320; c.height = 96;
  const g = c.getContext("2d");
  g.fillStyle = T.placa; g.fillRect(0, 0, 320, 96);
  g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `800 ${T.texto.length > 10 ? 38 : 48}px system-ui, sans-serif`;
  g.fillText(T.texto, 160, 50);
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.375), new THREE.MeshBasicMaterial({ map: texturaNitida(c, 1.25, true) }));
  placa.rotation.x = -Math.PI / 2; placa.position.set(X, 0.825, Z + 0.45);
  scene.add(placa);
});
