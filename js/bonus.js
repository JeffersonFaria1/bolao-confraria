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

export function renderBonus(el, estado) {
  const { participantes, palpitesBonus, resultadosBonus } = estado.dados;

  const titulo = document.createElement('h2');
  titulo.style.color = 'var(--destaque)';
  titulo.textContent = 'Bônus';
  el.appendChild(titulo);

  const wrap = document.createElement('div');
  wrap.className = 'tabela-rolante';
  const tabela = document.createElement('table');
  tabela.className = 'tabela-palpites';
  tabela.innerHTML = `<thead><tr>
    <th>Participante</th><th>🏆 Campeão</th><th>🥈 Vice</th><th>⚽ Artilheiro</th><th>Desemp. Brasil</th><th>🧤 Neymar</th><th>Pontos</th>
  </tr></thead><tbody></tbody>`;
  const tbody = tabela.querySelector('tbody');

  const of = fmtBonus(resultadosBonus);
  const trOf = document.createElement('tr');
  trOf.classList.add('pos-1');
  trOf.innerHTML = `<td><strong>Oficial</strong></td><td>${of.campeao}</td><td>${of.vice}</td><td>${of.artilheiro}</td><td>${of.desempenho}</td><td>${of.neymar}</td><td>—</td>`;
  tbody.appendChild(trOf);

  for (const p of participantes) {
    const b = palpitesBonus[p.nome];
    const f = fmtBonus(b);
    const pts = pontosBonus(b, resultadosBonus);
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(exibicao(p))}</td><td>${f.campeao}</td><td>${f.vice}</td><td>${f.artilheiro}</td><td>${f.desempenho}</td><td>${f.neymar}</td><td><strong>${pts}</strong></td>`;
    tbody.appendChild(tr);
  }

  wrap.appendChild(tabela);
  el.appendChild(wrap);
}
