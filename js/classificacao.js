import { escapeHtml } from './ui.js';

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

export function renderClassificacao(el, estado) {
  const ranking = estado.ranking;

  const barra = document.createElement('div');
  barra.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem';
  barra.innerHTML = '<h2 style="margin:0;color:var(--destaque)">Classificação</h2>';
  const btnRegras = document.createElement('button');
  btnRegras.className = 'btn-sec';
  btnRegras.textContent = 'Regras';
  btnRegras.addEventListener('click', () => abrirRegras());
  barra.appendChild(btnRegras);
  el.appendChild(barra);

  const tabela = document.createElement('table');
  tabela.innerHTML = `
    <thead><tr><th>#</th><th>Participante</th><th>Pontos</th><th>Cravados</th></tr></thead>
    <tbody></tbody>
  `;
  const tbody = tabela.querySelector('tbody');
  // Líder (menor posição) e lanterninha (maior posição). Só destaca se houver diferença
  // de posições (no início, com todos empatados, não faz sentido pintar nada).
  const posicoes = ranking.map((l) => l.posicao);
  const primeira = Math.min(...posicoes);
  const ultima = Math.max(...posicoes);
  const temRanking = ultima > primeira;
  for (const linha of ranking) {
    const tr = document.createElement('tr');
    if (linha.posicao === 1) tr.classList.add('pos-1');
    if (temRanking && linha.posicao === primeira) tr.classList.add('linha-lider');
    else if (temRanking && linha.posicao === ultima) tr.classList.add('linha-lanterna');
    tr.innerHTML = `<td>${linha.posicao}</td><td>${escapeHtml(linha.exibicao)}</td><td>${linha.pontos}</td><td>${linha.cravadas}</td>`;
    tbody.appendChild(tr);
  }
  el.appendChild(tabela);
}

function abrirRegras() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:10';
  const cx = document.createElement('div');
  cx.className = 'card';
  cx.style.maxWidth = '420px';
  cx.innerHTML = REGRAS_HTML + '<button class="btn" style="margin-top:1rem">Fechar</button>';
  cx.querySelector('button').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.appendChild(cx);
  document.body.appendChild(overlay);
}
