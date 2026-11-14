// =====================================================================
// BOLSAS
// =====================================================================
const geoBolsa = new THREE.BoxGeometry(0.85, 0.2, 1.0);
const matBolsa = new THREE.MeshPhysicalMaterial({ color: 0xb3122a, roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.25 });
const geoPorta = new THREE.CylinderGeometry(0.05, 0.05, 0.16, 8);
const matPorta = mat(0xf2f2f2, { roughness: 0.4 });
const geoAba = new THREE.BoxGeometry(0.5, 0.06, 0.12);
const geoRotulo = new THREE.PlaneGeometry(0.78, 0.78);
const cacheRotulo = {};
const ORIGENS = {
  captacao: { texto: "CAPTAÇÃO", cor: "#a8770c", faixa: 0xd9a520, brilho: 0x3a2800 },
  rede: { texto: "REDE", cor: "#1f6fc0", faixa: 0x2f7fd0, brilho: 0x0a2440 }
};
function matRotulo(t, origem) {
  const chave = t + "|" + (origem || "");
  if (cacheRotulo[chave]) return cacheRotulo[chave];
  // Nitidez: a etiqueta ocupa só uns 60 px na tela. Uma textura enorme é reduzida pelo "mipmap" e borra;
  // por isso ela é desenhada perto do tamanho em que aparece (2x) e reduzida direto, sem mipmap.
  const L = 256, k = 1;
  const c = document.createElement("canvas"); c.width = c.height = L;
  const g = c.getContext("2d");
  g.scale(k, k);
  g.fillStyle = "#ffffff";
  g.beginPath(); g.moveTo(24, 0); g.arcTo(256, 0, 256, 256, 24); g.arcTo(256, 256, 0, 256, 24); g.arcTo(0, 256, 0, 0, 24); g.arcTo(0, 0, 256, 0, 24); g.fill();
  g.fillStyle = "#0b1a2a"; g.textAlign = "center"; g.textBaseline = "middle";
  const txt = nome(t);
  // tipo o maior possível cabendo na etiqueta (AB+ e O− ficam com a mesma altura de letra quando cabe)
  let tam = 168;
  g.font = `900 ${tam}px system-ui, sans-serif`;
  while (g.measureText(txt).width > 242 && tam > 60) { tam -= 4; g.font = `900 ${tam}px system-ui, sans-serif`; }
  g.fillText(txt, 128, 106);
  g.font = "900 44px system-ui, sans-serif"; g.fillStyle = origem ? ORIGENS[origem].cor : "#b3122a";
  g.fillText(origem ? ORIGENS[origem].texto : "HEMÁCIAS", 128, 218);
  const tex = texturaNitida(c, 0.78, true);
  return (cacheRotulo[chave] = new THREE.MeshBasicMaterial({ map: tex, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
}
const geoFaixa = new THREE.BoxGeometry(0.88, 0.05, 0.11);
const matFaixa = {};
Object.entries(ORIGENS).forEach(([k, o]) => { matFaixa[k] = mat(o.faixa, { metalness: 0.55, roughness: 0.3, emissive: o.brilho }); });
function criarBolsa(t, origem) {
  const g = new THREE.Group();
  const corpo = new THREE.Mesh(geoBolsa, matBolsa); corpo.castShadow = true;
  const rot = new THREE.Mesh(geoRotulo, matRotulo(t, origem));
  rot.rotation.x = -Math.PI / 2; rot.position.y = 0.112;
  g.add(corpo, rot);
  // aba de pendurar e os dois tubinhos de acesso, como numa bolsa de verdade
  const aba = new THREE.Mesh(geoAba, matPorta); aba.position.set(0, 0, -0.55); g.add(aba);
  [-0.18, 0.18].forEach(x => { const pt = new THREE.Mesh(geoPorta, matPorta); pt.rotation.x = Math.PI / 2; pt.position.set(x, 0.02, 0.56); g.add(pt); });
  if (origem) {
    // faixa dourada (Captação!) ou azul (Rede Hemominas)
    [-0.43, 0.43].forEach(z => { const f = new THREE.Mesh(geoFaixa, matFaixa[origem]); f.position.set(0, 0.09, z); g.add(f); });
  }
  return g;
}

// Vagas do estoque: 2 colunas desencontradas, 10 linhas
const vagas = [];
for (let i = 0; i < 10; i++) {
  vagas.push({ x: -8.05, z: -5.2 + i * 1.15, eixo: "z", bolsa: null }); // bancada da esquerda
  vagas.push({ x: -5.6 + i * 1.1, z: -7.35, eixo: "x", bolsa: null });   // bancada do fundo
}
CONFIG.estoqueCapacidade = Math.min(CONFIG.estoqueCapacidade, vagas.length);
