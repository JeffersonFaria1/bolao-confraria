import { exibicao, escapeHtml } from './ui.js';

const SIMBOLO = { cravou: '✓', cenario: '~', erro: '✗' };

function sinal(p) {
  if (p.mandante > p.visitante) return 1;
  if (p.mandante < p.visitante) return -1;
  return 0;
}

// Espelha lib/pontuacao.js: placar exato = cravou, mesmo 1x2 = cenário, senão erro.
function classificarPalpite(pal, oficial) {
  if (!pal || !oficial) return null;
  if (pal.mandante === oficial.mandante && pal.visitante === oficial.visitante) return 'cravou';
  if (sinal(pal) === sinal(oficial)) return 'cenario';
  return 'erro';
}

// Tabela consolidada: linhas = jogos, colunas = participantes; célula = palpite.
export function renderTodos(el, estado) {
  const { participantes, palpites, resultados } = estado.dados;
  const jogos = estado.jogos;

  const titulo = document.createElement('h2');
  titulo.style.color = 'var(--destaque)';
  titulo.style.textAlign = 'center';
  titulo.textContent = 'Todos os palpites';
  el.appendChild(titulo);

  const legenda = document.createElement('div');
  legenda.className = 'legenda-todos';
  legenda.innerHTML = `
    <span><span class="legenda-cor" style="background:var(--acerto-exato)"></span>✓ Cravou (placar exato)</span>
    <span><span class="legenda-cor" style="background:var(--acerto-cenario)"></span>~ Acertou cenário</span>
    <span><span class="legenda-cor" style="background:var(--acerto-erro)"></span>✗ Errou</span>
    <span><span class="legenda-cor" style="background:var(--linha-hoje)"></span>Jogo de hoje</span>
  `;
  el.appendChild(legenda);

  const wrap = document.createElement('div');
  wrap.className = 'tabela-rolante';
  const tabela = document.createElement('table');
  tabela.className = 'tabela-palpites';

  const cabecalho = participantes.map((p) => `<th>${escapeHtml(exibicao(p))}</th>`).join('');
  tabela.innerHTML = `<thead><tr><th>Jogo</th><th>Oficial</th>${cabecalho}</tr></thead><tbody></tbody>`;
  const tbody = tabela.querySelector('tbody');

  // Data de hoje no formato AAAA-MM-DD (horário local = Brasília).
  const agora = new Date();
  const z = (n) => String(n).padStart(2, '0');
  const hoje = `${agora.getFullYear()}-${z(agora.getMonth() + 1)}-${z(agora.getDate())}`;

  for (const jogo of jogos) {
    const oficial = resultados[jogo.id];
    const oficialTxt = oficial ? `${oficial.mandante}×${oficial.visitante}` : '—';
    const celulas = participantes.map((p) => {
      const pal = palpites[p.nome]?.[jogo.id];
      const txt = pal ? `${pal.mandante}×${pal.visitante}` : '—';
      const cls = classificarPalpite(pal, oficial);
      if (cls) return `<td class="${cls}"><span class="mk">${SIMBOLO[cls]}</span> ${txt}</td>`;
      return `<td>${txt}</td>`;
    }).join('');
    const tr = document.createElement('tr');
    // Jogo encerrado: cada célula já mostra o acerto; só destacamos os de hoje sem resultado.
    if (!oficial && jogo.data === hoje) tr.classList.add('linha-hoje');
    tr.innerHTML = `<td>${jogo.mandante}×${jogo.visitante}</td><td><strong>${oficialTxt}</strong></td>${celulas}`;
    tbody.appendChild(tr);
  }

  wrap.appendChild(tabela);
  el.appendChild(wrap);
}
