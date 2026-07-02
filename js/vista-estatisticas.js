// public/js/vista-estatisticas.js — aba Estatísticas (compartilhada).
import { aproveitamento, raioXCompeticao, corridaPorRodada, confronto } from './estatisticas.js';
import { graficoLinha, graficoBarras, graficoDistribuicao } from './graficos.js';
import { SELECOES } from './selecoes.js';

const nomeSel = (cod) => (SELECOES[cod]?.nome || SELECOES[cod]?.pais || cod || '—');

function bloco(titulo) {
  const w = document.createElement('div');
  w.className = 'grafico-wrap';
  if (titulo) {
    const t = document.createElement('div');
    t.style.cssText = 'font-weight:700;margin-bottom:.5rem';
    t.textContent = titulo;
    w.appendChild(t);
  }
  return w;
}

function abaCorrida(estado) {
  const el = document.createElement('div');
  const corrida = corridaPorRodada(estado.dados, estado.jogos);
  if (corrida.checkpoints.length < 2) { el.textContent = 'Sem rodadas suficientes ainda.'; return el; }
  const w = bloco('Corrida pela liderança');
  w.appendChild(graficoLinha(corrida, { altura: 320 }));
  const cap = document.createElement('div');
  cap.className = 'grafico-legenda';
  cap.textContent = 'Linhas coloridas: os líderes (nome no fim da linha); demais em cinza. Eixo Y = pontos acumulados, eixo X = rodadas.';
  w.appendChild(cap);
  el.appendChild(w);
  return el;
}

function abaAproveitamento(estado) {
  const el = document.createElement('div');
  const apr = aproveitamento(estado.dados, estado.jogos);
  const itens = [...apr.porParticipante]
    .sort((a, b) => b.aproveitamentoPct - a.aproveitamentoPct)
    .map((p) => ({ rotulo: p.exibicao, valor: Math.round(p.aproveitamentoPct * 100) }));
  const w = bloco('Aproveitamento (%)');
  w.appendChild(graficoBarras(itens, { altura: 260 }));
  el.appendChild(w);

  const grid = document.createElement('div');
  grid.className = 'painel-destaques';
  const tile = (r, v) => { const d = document.createElement('div'); d.className = 'stat-tile'; d.innerHTML = `<div class="rotulo">${r}</div><div class="valor"></div>`; d.querySelector('.valor').textContent = v; return d; };
  grid.append(
    tile('🎯 Melhor cravador', apr.melhorCravador ? `${apr.melhorCravador.exibicao} (${apr.melhorCravador.cravou})` : '—'),
    tile('🐢 Maior azarão', apr.maiorAzarao ? apr.maiorAzarao.exibicao : '—'),
    tile('🔥 Mais arrisca', apr.maisArrisca ? `${apr.maisArrisca.exibicao} (${apr.maisArrisca.mediaGolsPalpite.toFixed(1)} gols/palpite)` : '—'),
  );
  el.appendChild(grid);
  return el;
}

function abaRaioX(estado) {
  const el = document.createElement('div');
  const r = raioXCompeticao(estado.dados, estado.jogos);
  const grid = document.createElement('div');
  grid.className = 'painel-destaques';
  const tile = (rot, v) => { const d = document.createElement('div'); d.className = 'stat-tile'; d.innerHTML = `<div class="rotulo">${rot}</div><div class="valor"></div>`; d.querySelector('.valor').textContent = v; return d; };
  const jogoTxt = (j) => j ? `${nomeSel(j.mandante)} × ${nomeSel(j.visitante)} (${Math.round(j.taxaAcerto * 100)}%)` : '—';
  grid.append(
    tile('🤯 Jogo que mais dividiu', jogoTxt(r.jogoMaisDividiu)),
    tile('✅ Mais previsível', jogoTxt(r.jogoMaisFacil)),
    tile('🏆 Campeão mais palpitado', r.campeaoMaisPalpitado ? `${nomeSel(r.campeaoMaisPalpitado.codigo)} (${r.campeaoMaisPalpitado.votos})` : '—'),
    tile('⚽ Gols/jogo (oficial × palpite)', `${r.mediaGolsOficial.toFixed(1)} × ${r.mediaGolsPalpite.toFixed(1)}`),
    tile('🎯 Seleção mais acertada', r.selecaoMaisAcertada ? nomeSel(r.selecaoMaisAcertada.codigo) : '—'),
    tile('🎲 Seleção menos acertada', r.selecaoMenosAcertada ? nomeSel(r.selecaoMenosAcertada.codigo) : '—'),
  );
  el.appendChild(grid);
  return el;
}

function abaPerfil(estado) {
  const el = document.createElement('div');
  const nomes = (estado.dados.participantes || []).map((p) => p.nome);
  const barra = document.createElement('div');
  barra.style.cssText = 'display:flex;gap:.6rem;flex-wrap:wrap;align-items:center;margin-bottom:1rem';
  const selA = document.createElement('select'); selA.className = 'seletor';
  const selB = document.createElement('select'); selB.className = 'seletor';
  for (const n of nomes) {
    selA.appendChild(new Option(n, n));
    selB.appendChild(new Option(n, n));
  }
  selB.selectedIndex = Math.min(1, nomes.length - 1);
  barra.append('Comparar: ', selA, ' × ', selB);
  el.appendChild(barra);

  const alvo = document.createElement('div');
  el.appendChild(alvo);

  function card(p) {
    const c = document.createElement('div');
    c.className = 'card-glass';
    c.style.flex = '1';
    c.innerHTML = `<h3 style="margin:.1rem 0 .6rem;color:var(--destaque)"></h3>
      <div>Posição: <b>${p.posicao ?? '—'}</b></div>
      <div>Pontos: <b>${p.pontos}</b></div>
      <div>Cravadas: <b>${p.cravadas}</b></div>
      <div>Aproveitamento: <b>${Math.round(p.aproveitamentoPct * 100)}%</b></div>
      <div style="margin-top:.5rem;font-size:.8rem;color:var(--texto-fraco)">Cravou ${p.cravou} · Cenário ${p.cenario} · Erro ${p.erro}</div>`;
    c.querySelector('h3').textContent = p.exibicao;
    c.appendChild(graficoDistribuicao(p, {}));
    return c;
  }

  function desenhar() {
    const { a, b } = confronto(estado.dados, estado.jogos, selA.value, selB.value);
    alvo.innerHTML = '';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:1rem;flex-wrap:wrap';
    row.append(card(a), card(b));
    alvo.appendChild(row);
  }
  selA.addEventListener('change', desenhar);
  selB.addEventListener('change', desenhar);
  desenhar();
  return el;
}

const SUBABAS = [
  { key: 'corrida', label: 'Corrida', render: abaCorrida },
  { key: 'aproveitamento', label: 'Aproveitamento', render: abaAproveitamento },
  { key: 'raiox', label: 'Raio-X', render: abaRaioX },
  { key: 'perfil', label: 'Perfil & confronto', render: abaPerfil },
];

export function renderEstatisticas(el, estado) {
  const h = document.createElement('h2');
  h.style.cssText = 'margin:.2rem 0 1rem;color:var(--destaque)';
  h.textContent = 'Estatísticas';
  el.appendChild(h);

  const pills = document.createElement('div');
  pills.className = 'subabas';
  el.appendChild(pills);
  const alvo = document.createElement('div');
  el.appendChild(alvo);

  let ativo = 'corrida';
  function desenhar() {
    pills.innerHTML = '';
    for (const s of SUBABAS) {
      const b = document.createElement('button');
      b.className = 'subaba' + (s.key === ativo ? ' ativa' : '');
      b.textContent = s.label;
      b.addEventListener('click', () => { ativo = s.key; desenhar(); });
      pills.appendChild(b);
    }
    alvo.innerHTML = '';
    alvo.appendChild(SUBABAS.find((s) => s.key === ativo).render(estado));
  }
  desenhar();
}
