// public/js/vista-inicio.js — Painel (dashboard) compartilhado pelos dois front-ends.
import { calcularRanking } from './pontuacao.js';
import { aproveitamento, corridaPorRodada } from './estatisticas.js';
import { graficoLinha } from './graficos.js';

function tile(rotulo, valor) {
  const d = document.createElement('div');
  d.className = 'stat-tile';
  const r = document.createElement('div'); r.className = 'rotulo'; r.textContent = rotulo;
  const v = document.createElement('div'); v.className = 'valor'; v.textContent = valor;
  d.append(r, v);
  return d;
}

export function renderInicio(el, estado) {
  const ranking = calcularRanking(estado.dados, estado.jogos);
  const apr = aproveitamento(estado.dados, estado.jogos);

  const h = document.createElement('h2');
  h.style.cssText = 'margin:.2rem 0 1rem;color:var(--destaque)';
  h.textContent = 'Painel';
  el.appendChild(h);

  // Pódio (top 3)
  const podio = document.createElement('div');
  podio.className = 'podio';
  const medalhas = ['🥇', '🥈', '🥉'];
  const ordem = [1, 0, 2]; // 2º, 1º, 3º para o 1º ficar no centro
  ordem.forEach((idx) => {
    const l = ranking[idx];
    if (!l) return;
    const c = document.createElement('div');
    c.className = 'podio-lugar' + (idx === 0 ? ' p1' : '');
    c.innerHTML = `<div class="medalha">${medalhas[idx]}</div><div class="nome"></div><div class="pts"></div>`;
    c.querySelector('.nome').textContent = l.exibicao;
    c.querySelector('.pts').textContent = `${l.pontos} pts`;
    podio.appendChild(c);
  });
  el.appendChild(podio);

  // Cartões de destaque
  const destaques = document.createElement('div');
  destaques.className = 'painel-destaques';
  destaques.append(
    tile('👑 Líder', ranking[0]?.exibicao ?? '—'),
    tile('🎯 Mais cravadas', apr.melhorCravador ? `${apr.melhorCravador.exibicao} (${apr.melhorCravador.cravou})` : '—'),
    tile('📈 Melhor aproveitamento', apr.porParticipante.length
      ? `${[...apr.porParticipante].sort((a, b) => b.aproveitamentoPct - a.aproveitamentoPct)[0].exibicao}` : '—'),
    tile('🔥 Mais arrisca', apr.maisArrisca ? apr.maisArrisca.exibicao : '—'),
  );
  el.appendChild(destaques);

  // Mini-gráfico da corrida
  const corrida = corridaPorRodada(estado.dados, estado.jogos);
  if (corrida.checkpoints.length >= 2) {
    const wrap = document.createElement('div');
    wrap.className = 'grafico-wrap';
    const t = document.createElement('div');
    t.style.cssText = 'font-weight:700;margin-bottom:.4rem';
    t.textContent = 'Corrida pela liderança';
    wrap.append(t, graficoLinha(corrida, { altura: 200 }));
    el.appendChild(wrap);
  }

  // Tabela completa (reaproveita estilo de tabela)
  const tabela = document.createElement('table');
  tabela.innerHTML = '<thead><tr><th>#</th><th>Participante</th><th>Pontos</th><th>Cravados</th><th>Aprov.</th></tr></thead><tbody></tbody>';
  const tb = tabela.querySelector('tbody');
  const aprPorNome = Object.fromEntries(apr.porParticipante.map((p) => [p.nome, p.aproveitamentoPct]));
  for (const l of ranking) {
    const tr = document.createElement('tr');
    if (l.posicao === 1) tr.classList.add('pos-1');
    const pct = aprPorNome[l.nome] != null ? `${Math.round(aprPorNome[l.nome] * 100)}%` : '—';
    tr.innerHTML = `<td>${l.posicao}</td><td></td><td>${l.pontos}</td><td>${l.cravadas}</td><td>${pct}</td>`;
    tr.children[1].textContent = l.exibicao;
    tb.appendChild(tr);
  }
  el.appendChild(tabela);
}
