// public/js/vista-inicio.js — Painel (dashboard) compartilhado pelos dois front-ends.
import { calcularRanking } from './pontuacao.js';
import { aproveitamento } from './estatisticas.js';

const REGRAS_HTML = `
  <div class="regras">
    <h3>Regras de pontuação</h3>
    <ul>
      <li><strong>10 pts</strong> — placar exato</li>
      <li><strong>5 pts</strong> — acertou só o vencedor/empate</li>
      <li><strong>0 pts</strong> — errou</li>
    </ul>
    <h4>Bônus</h4>
    <ul class="regras-bonus">
      <li>🏆 Campeão — <strong>50</strong></li>
      <li>🥈 Vice — <strong>25</strong></li>
      <li>⚽ Artilheiro — <strong>15</strong></li>
      <li><img class="bandeira-inline" src="flags/bra.svg" alt="" /> Desempenho do Brasil — <strong>25</strong></li>
      <li>🧤 Neymar marca? — <strong>10</strong></li>
    </ul>
    <h4>Desempate (em ordem)</h4>
    <ol>
      <li>Mais placares cravados</li>
      <li>Quem acertou o campeão</li>
      <li>Maior pontuação só na fase de grupos</li>
    </ol>
  </div>
`;

// Modal (overlay) com as regras do bolão. Fecha no botão, no clique fora ou no Esc.
function abrirRegras() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:20;padding:1rem';
  const cx = document.createElement('div');
  cx.className = 'card';
  cx.style.cssText = 'max-width:420px;max-height:85vh;overflow:auto;margin:0';
  cx.innerHTML = REGRAS_HTML + '<button class="btn" style="margin-top:1rem">Fechar</button>';
  function fechar() { overlay.remove(); document.removeEventListener('keydown', aoTeclar); }
  function aoTeclar(e) { if (e.key === 'Escape') fechar(); }
  cx.querySelector('button').addEventListener('click', fechar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) fechar(); });
  document.addEventListener('keydown', aoTeclar);
  overlay.appendChild(cx);
  document.body.appendChild(overlay);
}

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

  const barra = document.createElement('div');
  barra.style.cssText = 'display:flex;justify-content:space-between;align-items:center;gap:1rem;margin:.2rem 0 1rem';
  const h = document.createElement('h2');
  h.style.cssText = 'margin:0;color:var(--destaque)';
  h.textContent = 'Painel';
  const btnRegras = document.createElement('button');
  btnRegras.className = 'btn-sec';
  btnRegras.textContent = '📖 Regras';
  btnRegras.addEventListener('click', abrirRegras);
  barra.append(h, btnRegras);
  el.appendChild(barra);

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
