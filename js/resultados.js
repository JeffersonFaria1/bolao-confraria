import { selecao } from './selecoes.js';
import { escapeHtml, rotuloFase, renderJogosPorData } from './ui.js';

function ladoComPlacar(codigo, gols) {
  const { nome, bandeira } = selecao(codigo);
  const flag = bandeira
    ? `<img class="bandeira" src="${bandeira}" alt="" onerror="this.style.visibility='hidden'" />`
    : '<span class="bandeira bandeira-vazia"></span>';
  const placar = gols === null || gols === undefined ? '—' : gols;
  return `
    <div class="jogo-time">
      ${flag}
      <span class="time-nome">${escapeHtml(nome)}</span>
      <span style="min-width:1.6rem;text-align:right;font-weight:700;font-size:1.1rem">${placar}</span>
    </div>`;
}

function cardResultado(jogo, resultado) {
  const [, mes, dia] = (jogo.data || '--').split('-');
  const dataCurta = dia && mes ? `${dia}/${mes}` : '';
  const golM = resultado ? resultado.mandante : null;
  const golV = resultado ? resultado.visitante : null;
  const card = document.createElement('div');
  card.className = 'card jogo-card';
  card.innerHTML = `
    <div class="jogo-topo">
      <span class="jogo-chip">${rotuloFase(jogo)}</span>
      <span class="jogo-data">${dataCurta}${jogo.horario ? ` · ${jogo.horario}` : ''}</span>
    </div>
    ${ladoComPlacar(jogo.mandante, golM)}
    ${ladoComPlacar(jogo.visitante, golV)}
    ${resultado ? '' : '<div class="jogo-rodape"><span class="msg" style="color:var(--texto-fraco)">pendente</span></div>'}
  `;
  return card;
}

export function renderResultados(el, estado) {
  const { resultados } = estado.dados;
  const titulo = document.createElement('h2');
  titulo.style.color = 'var(--destaque)';
  titulo.textContent = 'Resultados';
  el.appendChild(titulo);

  renderJogosPorData(el, estado.jogos, (jogo) => cardResultado(jogo, resultados[jogo.id]));
}
