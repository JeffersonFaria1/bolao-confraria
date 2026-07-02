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

// Paleta das linhas destacadas — tons legíveis nos dois temas (evita amarelo claro).
const CORES = ['#10b981', '#38bdf8', '#f472b6', '#a78bfa', '#f97316', '#22d3ee', '#e879f9', '#4ade80'];

// Valores arredondados 0..max para a grade do eixo Y (n+1 marcas).
function ticksY(max, n = 4) {
  const t = [];
  for (let i = 0; i <= n; i++) t.push(Math.round((max * i) / n));
  return t;
}

// "Corrida pela liderança": destaca os N líderes (cor + nome no fim da linha) e
// mantém os demais esmaecidos como contexto. Eixos rotulados (pontos × rodadas).
export function graficoLinha(dados, opts = {}) {
  const { largura = 680, altura = 320, destaque = 4 } = opts;
  const padL = 32, padR = 108, padT = 14, padB = 30;
  const series = dados.series || [];
  const checkpoints = dados.checkpoints || [];
  const nC = checkpoints.length;
  const max = Math.max(1, ...series.flatMap((s) => s.pontos));
  const x = (i) => (nC <= 1 ? (padL + largura - padR) / 2 : escalaLinear(i, 0, nC - 1, padL, largura - padR));
  const y = (v) => escalaLinear(v, 0, max, altura - padB, padT);
  const caminho = (pontos) => pontos.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

  const svg = el('svg', { viewBox: `0 0 ${largura} ${altura}`, class: 'grafico grafico-linha' });

  // grade + rótulos do eixo Y (pontos)
  for (const t of ticksY(max, 4)) {
    const yy = y(t);
    svg.appendChild(el('line', { x1: padL, y1: yy.toFixed(1), x2: largura - padR, y2: yy.toFixed(1), class: 'grade' }));
    const tx = el('text', { x: padL - 6, y: (yy + 3).toFixed(1), 'text-anchor': 'end', class: 'eixo-num' });
    tx.textContent = String(t);
    svg.appendChild(tx);
  }
  // rótulos do eixo X (rodadas)
  checkpoints.forEach((c, i) => {
    const tx = el('text', { x: x(i).toFixed(1), y: (altura - padB + 16).toFixed(1), 'text-anchor': 'middle', class: 'eixo-num' });
    tx.textContent = c.rotulo;
    svg.appendChild(tx);
  });

  // ordena por pontuação final; primeiros = destaque, resto = contexto esmaecido
  const ord = series
    .map((s) => ({ s, fim: s.pontos[s.pontos.length - 1] ?? 0 }))
    .sort((a, b) => b.fim - a.fim);

  for (const { s } of ord.slice(destaque)) {
    svg.appendChild(el('path', { d: caminho(s.pontos), fill: 'none', 'stroke-width': 1.25, class: 'serie-mute' }));
  }
  ord.slice(0, destaque).forEach(({ s }, k) => {
    const cor = CORES[k % CORES.length];
    const p = el('path', { d: caminho(s.pontos), fill: 'none', stroke: cor, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', class: 'linha-serie' });
    svg.appendChild(p);
    s.pontos.forEach((v, i) => svg.appendChild(el('circle', { cx: x(i).toFixed(1), cy: y(v).toFixed(1), r: 2.6, fill: cor })));
    const li = s.pontos.length - 1;
    const t = el('text', { x: (x(li) + 6).toFixed(1), y: (y(s.pontos[li]) + 3).toFixed(1), class: 'nome-fim' });
    t.setAttribute('fill', cor);
    t.textContent = s.exibicao;
    svg.appendChild(t);
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
