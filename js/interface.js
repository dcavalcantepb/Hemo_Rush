// =====================================================================
// INTERFACE
// =====================================================================
const $ = id => document.getElementById(id);
const camadaBaloes = $("baloes");
function criarBalao(tipo) {
  const el = document.createElement("div");
  el.className = "balao";
  el.innerHTML = `<svg viewBox="0 0 64 64"><circle class="fundo" cx="32" cy="32" r="27"/><circle class="anel" cx="32" cy="32" r="27"/></svg><span>${nome(tipo)}</span>`;
  camadaBaloes.appendChild(el);
  return el;
}
const CIRC = 2 * Math.PI * 27;
function corTempo(f) { return f > 0.5 ? "#1d8a4e" : f > 0.25 ? "#e3a008" : "#c81e3a"; }

const tmpV = new THREE.Vector3();
function naTela(x, y, z) {
  tmpV.set(x, y, z).project(camera);
  return { x: (tmpV.x + 1) / 2 * canvas.clientWidth, y: (1 - tmpV.y) / 2 * canvas.clientHeight };
}
function flutuar(texto, cor, x, y, z, longo) {
  const p = naTela(x, y, z);
  const el = document.createElement("div");
  el.className = "flutua" + (longo ? " longo" : ""); el.textContent = texto; el.style.color = cor;
  el.style.left = p.x + "px"; el.style.top = p.y + "px";
  camadaBaloes.appendChild(el);
  if (longo) {
    // texto comprido: não deixa sair pelas bordas da tela
    const w = el.offsetWidth, W = canvas.clientWidth, m = 8;
    el.style.left = Math.min(Math.max(p.x, w / 2 + m), W - w / 2 - m) + "px";
  }
  setTimeout(() => el.remove(), longo ? 3500 : 1400);
}

let recorde = 0;
function lerRecorde(n) {
  try {
    const v = localStorage.getItem("hemominas-recorde-" + n);
    if (v === null && n === "hemopleno") return Number(localStorage.getItem("hemominas-recorde")) || 0; // recorde antigo
    return Number(v) || 0;
  } catch (e) { return 0; }
}
function salvarRecorde(n, v) { try { localStorage.setItem("hemominas-recorde-" + n, String(v)); } catch (e) {} }
let nivelAtual = "hemopleno";
try { const n = localStorage.getItem("hemominas-nivel"); if (NIVEIS[n]) nivelAtual = n; } catch (e) {}
function aplicarNivel(n) {
  nivelAtual = n;
  Object.assign(CONFIG, JSON.parse(JSON.stringify(CONFIG_BASE)), NIVEIS[n]);
  recorde = lerRecorde(n);
  try { localStorage.setItem("hemominas-nivel", n); } catch (e) {}
}
const fmt = n => n.toLocaleString("pt-BR");

// Tabela de compatibilidade da tela Sobre, gerada pelas próprias regras (regra e tela nunca divergem)
(function () {
  const tb = document.querySelector("#tabelaCompat tbody");
  ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].forEach(r => {
    const doadores = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].filter(d => compativel(d, r)).map(nome);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${nome(r)}</td><td>${doadores.join(", ")}</td>`;
    tb.appendChild(tr);
  });
})();
