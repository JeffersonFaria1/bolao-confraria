// public/js/graficos.js — gráficos em SVG puro (sem dependências).
const NS = 'http://www.w3.org/2000/svg';

export function escalaLinear(valor, dMin, dMax, rMin, rMax) {
  if (dMax === dMin) return (rMin + rMax) / 2;
  return rMin + ((valor - dMin) / (dMax - dMin)) * (rMax - rMin);
}

// Devolve o atributo `d` de uma polilinha para os valores dados.
export function pathDaSerie(valores, opts) {
  const { largura, altura, min, max, pad = 0 } = opts;
  const n = valores.length;
  if (!n) return '';
  const x = (i) => (n === 1 ? largura / 2 : escalaLinear(i, 0, n - 1, pad, largura - pad));
  const y = (v) => escalaLinear(v, min, max, altura - pad, pad); // valor alto -> topo
  return valores.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
}

function el(nome, attrs = {}) {
  const e = document.createElementNS(NS, nome);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

// Paleta rotativa p/ múltiplas séries (usa currentColor/vars via style depois).
const CORES = ['#10b981', '#fbbf24', '#38bdf8', '#f472b6', '#a78bfa', '#f97316', '#34d399', '#e879f9'];

export function graficoLinha(dados, opts = {}) {
  const { largura = 640, altura = 260, pad = 28 } = opts;
  const svg = el('svg', { viewBox: `0 0 ${largura} ${altura}`, class: 'grafico grafico-linha', preserveAspectRatio: 'none' });
  const todos = dados.series.flatMap((s) => s.pontos);
  const max = Math.max(1, ...todos);
  dados.series.forEach((s, i) => {
    const d = pathDaSerie(s.pontos, { largura, altura, min: 0, max, pad });
    const p = el('path', { d, fill: 'none', stroke: CORES[i % CORES.length], 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    p.classList.add('linha-serie');
    svg.appendChild(p);
  });
  return svg;
}

export function graficoBarras(itens, opts = {}) {
  const { largura = 640, altura = 260, pad = 24 } = opts;
  const svg = el('svg', { viewBox: `0 0 ${largura} ${altura}`, class: 'grafico grafico-barras', preserveAspectRatio: 'none' });
  const max = Math.max(1, ...itens.map((i) => i.valor));
  const larguraBarra = (largura - pad * 2) / Math.max(1, itens.length);
  itens.forEach((it, i) => {
    const h = escalaLinear(it.valor, 0, max, 0, altura - pad * 2);
    svg.appendChild(el('rect', {
      x: pad + i * larguraBarra + larguraBarra * 0.15,
      y: altura - pad - h,
      width: larguraBarra * 0.7,
      height: Math.max(0, h),
      rx: 4,
      fill: it.cor || '#10b981',
      class: 'barra',
    }));
  });
  return svg;
}

export function graficoDistribuicao({ cravou = 0, cenario = 0, erro = 0 }, opts = {}) {
  const { largura = 320, altura = 18 } = opts;
  const total = cravou + cenario + erro || 1;
  const svg = el('svg', { viewBox: `0 0 ${largura} ${altura}`, class: 'grafico grafico-dist', preserveAspectRatio: 'none' });
  let x = 0;
  for (const [valor, cor] of [[cravou, '#10b981'], [cenario, '#fbbf24'], [erro, '#ef4444']]) {
    const w = (valor / total) * largura;
    if (w > 0) svg.appendChild(el('rect', { x, y: 0, width: w, height: altura, fill: cor }));
    x += w;
  }
  return svg;
}
