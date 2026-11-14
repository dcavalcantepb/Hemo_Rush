// =====================================================================
// REGRAS DE COMPATIBILIDADE (concentrado de hemácias, ABO/Rh)
// Arquivo puro: não toca em DOM nem em Three.js, por isso é testado direto no Node (tests/unit/regras.test.js).
// =====================================================================
const TIPOS = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"];
const ANTIGENOS = { O: [], A: ["A"], B: ["B"], AB: ["A", "B"] };
const abo = t => t.replace(/[+-]/, "");
const rhPositivo = t => t.endsWith("+");
const nome = t => t.replace("-", "−");
function compativel(doador, receptor) {
  const ok = ANTIGENOS[abo(doador)].every(a => ANTIGENOS[abo(receptor)].includes(a));
  if (!ok) return false;
  if (rhPositivo(doador) && !rhPositivo(receptor)) return false;
  return true;
}
const isogrupo = (d, r) => d === r;

// Por que a bolsa não serve: anticorpo do paciente contra o antígeno da bolsa, ou Rh
function motivoIncompativel(d, r) {
  const falta = ANTIGENOS[abo(d)].filter(a => !ANTIGENOS[abo(r)].includes(a));
  const partes = [];
  if (falta.length) partes.push(`tem anti-${falta.join(" e anti-")}`);
  if (rhPositivo(d) && !rhPositivo(r)) partes.push("é Rh−");
  return `Paciente ${nome(r)} ${partes.join(" e ")}: não recebe ${nome(d)}`;
}

function sortear(pesos) {
  const total = Object.values(pesos).reduce((a, b) => a + b, 0);
  let x = Math.random() * total;
  for (const [k, p] of Object.entries(pesos)) { x -= p; if (x <= 0) return k; }
  return Object.keys(pesos)[0];
}
