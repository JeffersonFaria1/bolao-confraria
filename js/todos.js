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

// Segmentos de filtro: rodadas de grupos (derivadas da data) + fases do mata-mata.
const SEGMENTOS = [
  { key: 'grupos-1', grupo: 'Grupos', label: '1ª rodada' },
  { key: 'grupos-2', grupo: 'Grupos', label: '2ª rodada' },
  { key: 'grupos-3', grupo: 'Grupos', label: '3ª rodada' },
  { key: '16avos', grupo: 'Mata-mata', label: '16-avos' },
  { key: 'oitavas', grupo: 'Mata-mata', label: 'Oitavas' },
  { key: 'quartas', grupo: 'Mata-mata', label: 'Quartas' },
  { key: 'semifinal', grupo: 'Mata-mata', label: 'Semifinais' },
  { key: 'final', grupo: 'Mata-mata', label: 'Final' },
];

// Rodada (1/2/3) de um jogo de grupos: ordena os 6 jogos do grupo no tempo e
// agrupa em pares — cada par é uma rodada (uma matchday pode cair em 2 dias).
function rodadaGrupo(jogo, jogos) {
  const doGrupo = jogos
    .filter((g) => g.fase === 'grupos' && g.grupo === jogo.grupo)
    .sort(ordemCronologica);
  const idx = doGrupo.findIndex((g) => g.id === jogo.id);
  return Math.floor(idx / 2) + 1;
}

// Segmento de filtro a que o jogo pertence ('terceiro' entra junto da final).
function segmentoDoJogo(jogo, jogos) {
  if (jogo.fase === 'grupos') return `grupos-${rodadaGrupo(jogo, jogos)}`;
  if (jogo.fase === 'terceiro' || jogo.fase === 'final') return 'final';
  return jogo.fase; // 16avos, oitavas, quartas, semifinal
}

function ordemCronologica(a, b) {
  return (a.data + a.horario).localeCompare(b.data + b.horario);
}

// Segmento "atual": o do próximo jogo sem resultado; se já acabou tudo, o último.
function segmentoAtual(jogos, resultados) {
  const ordenados = [...jogos].sort(ordemCronologica);
  const ref = ordenados.find((g) => !resultados[g.id]) || ordenados[ordenados.length - 1];
  return ref ? segmentoDoJogo(ref, jogos) : SEGMENTOS[0].key;
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

  let segAtivo = segmentoAtual(jogos, resultados);

  const filtro = document.createElement('div');
  filtro.className = 'filtro-fases';
  el.appendChild(filtro);

  const wrap = document.createElement('div');
  wrap.className = 'tabela-rolante';
  el.appendChild(wrap);

  // Data de hoje no formato AAAA-MM-DD (horário local = Brasília).
  const agora = new Date();
  const z = (n) => String(n).padStart(2, '0');
  const hoje = `${agora.getFullYear()}-${z(agora.getMonth() + 1)}-${z(agora.getDate())}`;

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
          desenharTabela();
        });
        linha.appendChild(b);
      }
      filtro.appendChild(linha);
    }
  }

  function desenharTabela() {
    wrap.innerHTML = '';
    const tabela = document.createElement('table');
    tabela.className = 'tabela-palpites';

    const cabecalho = participantes.map((p) => `<th>${escapeHtml(exibicao(p))}</th>`).join('');
    tabela.innerHTML = `<thead><tr><th>Jogo</th><th>Oficial</th>${cabecalho}</tr></thead><tbody></tbody>`;
    const tbody = tabela.querySelector('tbody');

    const jogosSeg = jogos
      .filter((j) => segmentoDoJogo(j, jogos) === segAtivo)
      .sort(ordemCronologica);

    for (const jogo of jogosSeg) {
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
  }

  desenharFiltro();
  desenharTabela();
}
