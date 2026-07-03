import { exibicao, escapeHtml } from './ui.js';
import { selecao } from './selecoes.js';
import { pontosBonus } from './pontuacao.js';

const ROTULO_FASE_BR = { grupos: 'Fase de grupos', oitavas: 'Oitavas', quartas: 'Quartas', semifinal: 'Semifinal', final: 'Final', campeao: 'Campeão' };

function selecaoHTML(cod) {
  if (!cod) return '—';
  const { nome, bandeira } = selecao(cod);
  const flag = bandeira ? `<img class="bandeira-inline" src="${bandeira}" alt="" onerror="this.style.visibility='hidden'" />` : '';
  return `${flag}${escapeHtml(nome)}`;
}

function fmtBonus(b) {
  const v = b || {};
  return {
    campeao: selecaoHTML(v.campeao),
    vice: selecaoHTML(v.vice),
    artilheiro: v.artilheiro ? escapeHtml(v.artilheiro) : '—',
    desempenho: v.desempenhoBrasil ? ROTULO_FASE_BR[v.desempenhoBrasil] : '—',
    neymar: v.neymarMarca === true ? 'Sim' : v.neymarMarca === false ? 'Não' : '—',
  };
}

const CAMPOS_BONUS = [
  { k: 'campeao', rot: '🏆 Campeão', f: 'campeao' },
  { k: 'vice', rot: '🥈 Vice', f: 'vice' },
  { k: 'artilheiro', rot: '⚽ Artilheiro', f: 'artilheiro' },
  { k: 'desempenhoBrasil', rot: 'Desemp. Brasil', f: 'desempenho' },
  { k: 'neymarMarca', rot: '🧤 Neymar', f: 'neymar' },
];

// Um campo de bônus está correto quando o oficial já existe e bate com o palpite.
function acertoBonus(campo, palpite, oficial) {
  return oficial && oficial[campo] != null && palpite && palpite[campo] === oficial[campo];
}

export function renderBonus(el, estado) {
  const { participantes, palpitesBonus, resultadosBonus } = estado.dados;

  const titulo = document.createElement('h2');
  titulo.style.color = 'var(--destaque)';
  titulo.textContent = 'Bônus';
  el.appendChild(titulo);

  const of = fmtBonus(resultadosBonus);
  const temGabarito = CAMPOS_BONUS.some((c) => resultadosBonus && resultadosBonus[c.k] != null);

  // Linhas de participante ordenadas por pontos de bônus (desc) — mini-ranking.
  const linhas = participantes
    .map((p) => ({ p, b: palpitesBonus[p.nome], pts: pontosBonus(palpitesBonus[p.nome], resultadosBonus) }))
    .sort((a, b) => b.pts - a.pts);

  // --- Desktop: tabela repaginada ---
  const wrap = document.createElement('div');
  wrap.className = 'tabela-rolante';
  const tabela = document.createElement('table');
  tabela.className = 'tabela-palpites';
  tabela.innerHTML = `<thead><tr>
    <th>Participante</th>${CAMPOS_BONUS.map((c) => `<th>${c.rot}</th>`).join('')}<th>Pontos</th>
  </tr></thead><tbody></tbody>`;
  const tbody = tabela.querySelector('tbody');

  const trOf = document.createElement('tr');
  trOf.className = 'linha-gabarito';
  trOf.innerHTML = `<td><strong>Gabarito</strong></td>${CAMPOS_BONUS.map((c) => `<td>${of[c.f]}</td>`).join('')}<td>—</td>`;
  tbody.appendChild(trOf);

  linhas.forEach(({ p, b, pts }, i) => {
    const f = fmtBonus(b);
    const cels = CAMPOS_BONUS.map((c) => {
      const ok = acertoBonus(c.k, b, resultadosBonus);
      return `<td class="${ok ? 'cravou' : ''}">${ok ? '<span class="mk">✓</span> ' : ''}${f[c.f]}</td>`;
    }).join('');
    const selo = `<span class="selo${i === 0 && pts > 0 ? ' lider' : ''}">${pts}</span>`;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(exibicao(p))}</td>${cels}<td>${selo}</td>`;
    tbody.appendChild(tr);
  });
  wrap.appendChild(tabela);
  el.appendChild(wrap);

  // --- Mobile: cartões (a media query 720px alterna com a tabela) ---
  const cartoes = document.createElement('div');
  cartoes.className = 'cartoes-palpites';

  const cardG = document.createElement('div');
  cardG.className = 'cartao-bonus gabarito';
  const chipsG = temGabarito
    ? `<div class="cartao-chips">${CAMPOS_BONUS.map((c) =>
        `<div class="chip-bonus"><span class="chip-rotulo">${c.rot}</span><span class="chip-valor">${of[c.f]}</span></div>`).join('')}</div>`
    : '<p style="color:var(--texto-fraco);margin:.2rem 0 0">Ainda não definido</p>';
  cardG.innerHTML = `<div class="cartao-cab"><span class="cartao-confronto">Gabarito</span></div>${chipsG}`;
  cartoes.appendChild(cardG);

  linhas.forEach(({ p, b, pts }, i) => {
    const f = fmtBonus(b);
    const chips = CAMPOS_BONUS.map((c) => {
      const ok = acertoBonus(c.k, b, resultadosBonus);
      return `<div class="chip-bonus${ok ? ' cravou' : ''}">
        <span class="chip-rotulo">${c.rot}</span>
        <span class="chip-valor">${ok ? '<span class="mk">✓</span> ' : ''}${f[c.f]}</span></div>`;
    }).join('');
    const card = document.createElement('div');
    card.className = 'cartao-bonus';
    card.innerHTML = `
      <div class="cartao-cab">
        <span class="cartao-confronto">${escapeHtml(exibicao(p))}</span>
        <span class="selo${i === 0 && pts > 0 ? ' lider' : ''}">${pts} pts</span>
      </div>
      <div class="cartao-chips">${chips}</div>`;
    cartoes.appendChild(card);
  });
  el.appendChild(cartoes);
}
