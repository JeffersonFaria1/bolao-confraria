import { exibicao, escapeHtml } from './ui.js';

// Tabela consolidada: linhas = jogos, colunas = participantes; célula = palpite.
export function renderTodos(el, estado) {
  const { participantes, palpites, resultados } = estado.dados;
  const jogos = estado.jogos;

  const titulo = document.createElement('h2');
  titulo.style.color = 'var(--destaque)';
  titulo.textContent = 'Todos os palpites';
  el.appendChild(titulo);

  const wrap = document.createElement('div');
  wrap.className = 'tabela-rolante';
  const tabela = document.createElement('table');
  tabela.className = 'tabela-palpites';

  const cabecalho = participantes.map((p) => `<th>${escapeHtml(exibicao(p))}</th>`).join('');
  tabela.innerHTML = `<thead><tr><th>Jogo</th><th>Oficial</th>${cabecalho}</tr></thead><tbody></tbody>`;
  const tbody = tabela.querySelector('tbody');

  for (const jogo of jogos) {
    const oficial = resultados[jogo.id];
    const oficialTxt = oficial ? `${oficial.mandante}×${oficial.visitante}` : '—';
    const celulas = participantes.map((p) => {
      const pal = palpites[p.nome]?.[jogo.id];
      return `<td>${pal ? `${pal.mandante}×${pal.visitante}` : '—'}</td>`;
    }).join('');
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${jogo.mandante}×${jogo.visitante}</td><td><strong>${oficialTxt}</strong></td>${celulas}`;
    tbody.appendChild(tr);
  }

  wrap.appendChild(tabela);
  el.appendChild(wrap);
}
