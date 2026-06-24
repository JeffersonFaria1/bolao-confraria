import { selecao } from './selecoes.js';
import { escapeHtml, rotuloFase, renderJogosPorData } from './ui.js';
import { calcularTabelaGrupo } from './tabela-grupos.js';

// Filtro de fases (espelha a aba "Todos os palpites"): grupos num único
// segmento + as fases do mata-mata. A rodada dos grupos é navegada dentro
// do card de cada grupo (setas), não pelo filtro.
const SEGMENTOS = [
  { key: 'grupos', grupo: 'Grupos', label: 'Grupos' },
  { key: '16avos', grupo: 'Mata-mata', label: '16-avos' },
  { key: 'oitavas', grupo: 'Mata-mata', label: 'Oitavas' },
  { key: 'quartas', grupo: 'Mata-mata', label: 'Quartas' },
  { key: 'semifinal', grupo: 'Mata-mata', label: 'Semifinais' },
  { key: 'final', grupo: 'Mata-mata', label: 'Final' },
];

function ordemCronologica(a, b) {
  return (a.data + a.horario).localeCompare(b.data + b.horario);
}

function temResultado(r) {
  return r && r.mandante != null && r.visitante != null;
}

// Segmento de filtro a que o jogo pertence ('terceiro' entra junto da final).
function segmentoDoJogo(jogo) {
  if (jogo.fase === 'grupos') return 'grupos';
  if (jogo.fase === 'terceiro' || jogo.fase === 'final') return 'final';
  return jogo.fase; // 16avos, oitavas, quartas, semifinal
}

// Segmento "atual": o do próximo jogo sem resultado; se acabou tudo, o último.
function segmentoAtual(jogos, resultados) {
  const ordenados = [...jogos].sort(ordemCronologica);
  const ref = ordenados.find((g) => !temResultado(resultados[g.id])) || ordenados[ordenados.length - 1];
  return ref ? segmentoDoJogo(ref) : SEGMENTOS[0].key;
}

function flagMini(bandeira) {
  return bandeira
    ? `<img class="bandeira-mini" src="${bandeira}" alt="" onerror="this.style.visibility='hidden'" />`
    : '<span class="bandeira-mini bandeira-vazia"></span>';
}

function fmtSaldo(sg) {
  return sg > 0 ? `+${sg}` : String(sg);
}

// --- Fase de grupos: tabela de classificação ---------------------------------

function tabelaGrupo(jogosGrupo, resultados) {
  const linhas = calcularTabelaGrupo(jogosGrupo, resultados);
  const tabela = document.createElement('table');
  tabela.className = 'tabela-grupo';
  tabela.innerHTML = `
    <thead>
      <tr>
        <th class="col-pos">#</th>
        <th class="col-time">Time</th>
        <th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = tabela.querySelector('tbody');
  linhas.forEach((l, i) => {
    const { nome, bandeira } = selecao(l.codigo);
    const tr = document.createElement('tr');
    if (i < 2) tr.classList.add('classifica'); // 2 primeiros avançam
    tr.innerHTML = `
      <td class="col-pos">${i + 1}</td>
      <td class="col-time">${flagMini(bandeira)}<span class="time-nome">${escapeHtml(nome)}</span></td>
      <td class="col-pts">${l.pts}</td>
      <td>${l.j}</td><td>${l.v}</td><td>${l.e}</td><td>${l.d}</td>
      <td>${fmtSaldo(l.sg)}</td>
    `;
    tbody.appendChild(tr);
  });
  return tabela;
}

// --- Fase de grupos: confrontos com navegação por rodada ---------------------

function confronto(jogo, resultado) {
  const [, mes, dia] = (jogo.data || '--').split('-');
  const dataCurta = dia && mes ? `${dia}/${mes}` : '';
  const m = selecao(jogo.mandante);
  const v = selecao(jogo.visitante);
  const placar = temResultado(resultado)
    ? `<span class="confronto-placar">${resultado.mandante} <span class="x">×</span> ${resultado.visitante}</span>`
    : '<span class="confronto-placar pendente">×</span>';

  const div = document.createElement('div');
  div.className = 'confronto';
  div.innerHTML = `
    <div class="confronto-data">${dataCurta}${jogo.horario ? ` · ${jogo.horario}` : ''}</div>
    <div class="confronto-linha">
      <span class="confronto-time mandante">${escapeHtml(m.nome)} ${flagMini(m.bandeira)}</span>
      ${placar}
      <span class="confronto-time visitante">${flagMini(v.bandeira)} ${escapeHtml(v.nome)}</span>
    </div>
  `;
  return div;
}

// Divide os jogos do grupo em rodadas (2 por rodada, em ordem cronológica).
function dividirEmRodadas(jogosGrupo) {
  const ord = [...jogosGrupo].sort(ordemCronologica);
  const rodadas = [];
  for (let i = 0; i < ord.length; i += 2) rodadas.push(ord.slice(i, i + 2));
  return rodadas;
}

// Rodada a mostrar de início: a primeira em andamento (com jogo ainda pendente).
// Se todas já foram jogadas, mostra a última.
function rodadaInicial(rodadas, resultados) {
  const idx = rodadas.findIndex((r) => r.some((j) => !temResultado(resultados[j.id])));
  return idx === -1 ? rodadas.length - 1 : idx;
}

function confrontosGrupo(jogosGrupo, resultados) {
  const rodadas = dividirEmRodadas(jogosGrupo);
  let idx = rodadaInicial(rodadas, resultados);

  const wrap = document.createElement('div');
  wrap.className = 'grupo-confrontos';

  function render() {
    wrap.innerHTML = '';
    const nav = document.createElement('div');
    nav.className = 'rodada-nav';

    const ant = document.createElement('button');
    ant.className = 'rodada-seta';
    ant.textContent = '‹';
    ant.disabled = idx === 0;
    ant.setAttribute('aria-label', 'Rodada anterior');
    ant.addEventListener('click', () => { if (idx > 0) { idx -= 1; render(); } });

    const titulo = document.createElement('span');
    titulo.className = 'rodada-titulo';
    titulo.textContent = `${idx + 1}ª RODADA`;

    const prox = document.createElement('button');
    prox.className = 'rodada-seta';
    prox.textContent = '›';
    prox.disabled = idx === rodadas.length - 1;
    prox.setAttribute('aria-label', 'Próxima rodada');
    prox.addEventListener('click', () => { if (idx < rodadas.length - 1) { idx += 1; render(); } });

    nav.append(ant, titulo, prox);
    wrap.appendChild(nav);

    const lista = document.createElement('div');
    lista.className = 'rodada-jogos';
    for (const jogo of rodadas[idx]) lista.appendChild(confronto(jogo, resultados[jogo.id]));
    wrap.appendChild(lista);
  }

  render();
  return wrap;
}

function blocoGrupo(letra, jogosGrupo, resultados) {
  const bloco = document.createElement('section');
  bloco.className = 'grupo-bloco';
  const titulo = document.createElement('h3');
  titulo.className = 'grupo-titulo';
  titulo.textContent = `Grupo ${letra}`;
  bloco.appendChild(titulo);

  const grid = document.createElement('div');
  grid.className = 'grupo-grid';
  grid.appendChild(tabelaGrupo(jogosGrupo, resultados));
  grid.appendChild(confrontosGrupo(jogosGrupo, resultados));
  bloco.appendChild(grid);
  return bloco;
}

// --- Mata-mata: cards por data (formato anterior) ----------------------------

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

function cardMata(jogo, resultado) {
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

// --- Entrada ------------------------------------------------------------------

export function renderResultados(el, estado) {
  const { resultados } = estado.dados;
  const jogos = estado.jogos;

  const titulo = document.createElement('h2');
  titulo.style.color = 'var(--destaque)';
  titulo.textContent = 'Resultados';
  el.appendChild(titulo);

  let segAtivo = segmentoAtual(jogos, resultados);

  const filtro = document.createElement('div');
  filtro.className = 'filtro-fases';
  el.appendChild(filtro);

  const wrap = document.createElement('div');
  el.appendChild(wrap);

  function desenharFiltro() {
    filtro.innerHTML = '';
    for (const grupoNome of ['Grupos', 'Mata-mata']) {
      const linha = document.createElement('div');
      linha.className = 'filtro-linha';
      const rotulo = document.createElement('span');
      rotulo.className = 'filtro-rotulo';
      rotulo.textContent = `${grupoNome}:`;
      linha.appendChild(rotulo);
      for (const seg of SEGMENTOS.filter((s) => s.grupo === grupoNome)) {
        const b = document.createElement('button');
        b.className = 'subaba' + (seg.key === segAtivo ? ' ativa' : '');
        b.textContent = seg.label;
        b.addEventListener('click', () => {
          segAtivo = seg.key;
          desenharFiltro();
          desenharConteudo();
        });
        linha.appendChild(b);
      }
      filtro.appendChild(linha);
    }
  }

  function desenharConteudo() {
    wrap.innerHTML = '';
    if (segAtivo === 'grupos') {
      const grupos = jogos.filter((j) => j.fase === 'grupos');
      const letras = [...new Set(grupos.map((j) => j.grupo))].sort();
      for (const letra of letras) {
        const jogosGrupo = grupos.filter((j) => j.grupo === letra);
        wrap.appendChild(blocoGrupo(letra, jogosGrupo, resultados));
      }
    } else {
      const jogosSeg = jogos
        .filter((j) => segmentoDoJogo(j) === segAtivo)
        .sort(ordemCronologica);
      if (!jogosSeg.length) {
        const vazio = document.createElement('p');
        vazio.style.color = 'var(--texto-fraco)';
        vazio.textContent = 'Nenhum jogo nesta fase.';
        wrap.appendChild(vazio);
        return;
      }
      renderJogosPorData(wrap, jogosSeg, (jogo) => cardMata(jogo, resultados[jogo.id]));
    }
  }

  desenharFiltro();
  desenharConteudo();
}
