// Resolve os placeholders dos jogos de mata-mata (1A, 2B, 3ABCDF, V73, P101)
// em códigos FIFA reais, a partir da classificação dos grupos e dos resultados.
// Função pura (sem DOM): consumível pelo front público, pelo admin e por testes.
import { calcularTabelaGrupo } from './tabela-grupos.js';
import { CHAVE_TERCEIROS, COLUNAS_TERCEIROS, COLUNA_JOGO } from './chave-terceiros.js';

function temResultado(r) {
  return r && r.mandante != null && r.visitante != null;
}

// Número FIFA contínuo do jogo (1..104) a partir do id. Grupos G01–G72 = 1–72;
// 16-avos D01–D16 = 73–88; oitavas O01–O08 = 89–96; quartas Q = 97–100;
// semis S = 101–102; 3º lugar T01 = 103; final F01 = 104.
const BASE_FASE = { G: 0, D: 72, O: 88, Q: 96, S: 100, T: 102, F: 103 };
export function numeroDoJogo(id) {
  const m = /^([A-Z])(\d+)$/.exec(id || '');
  if (!m || BASE_FASE[m[1]] == null) return null;
  return BASE_FASE[m[1]] + Number(m[2]);
}

// Vencedor (e perdedor) de um confronto já resolvido e com resultado.
// Em empate no tempo normal, decide pelos pênaltis (se lançados).
function desfecho(jogoId, lados, resultados) {
  const r = resultados[jogoId];
  const lado = lados[jogoId];
  if (!temResultado(r) || !lado) return null;
  const { mandante, visitante } = lado;
  // só dá para apontar vencedor se ambos os lados já são seleções concretas
  if (!mandante || !visitante) return null;
  let venc = null;
  if (r.mandante > r.visitante) venc = 'M';
  else if (r.visitante > r.mandante) venc = 'V';
  else {
    const p = r.penaltis;
    if (p && p.mandante != null && p.visitante != null) {
      if (p.mandante > p.visitante) venc = 'M';
      else if (p.visitante > p.mandante) venc = 'V';
    }
  }
  if (!venc) return null; // empate sem pênaltis decisivos
  return venc === 'M'
    ? { vencedor: mandante, perdedor: visitante }
    : { vencedor: visitante, perdedor: mandante };
}

// Resolve todos os jogos de mata-mata. Retorna { jogoId: { mandante, visitante } },
// onde cada lado é o código FIFA resolvido OU o placeholder original (quando ainda
// indeterminado). 1X/2X precisam do grupo completo; os terceiros precisam dos 12
// grupos completos; Vxx/Pxx precisam do jogo de origem decidido.
export function resolverMataMata(jogos, resultados = {}) {
  resultados = resultados || {};

  // 1. tabelas de grupo + completude
  const porGrupo = {};
  for (const j of jogos) {
    if (j.fase === 'grupos') (porGrupo[j.grupo] ||= []).push(j);
  }
  const grupos = {};
  for (const [letra, jg] of Object.entries(porGrupo)) {
    const completo = jg.length >= 6 && jg.every((j) => temResultado(resultados[j.id]));
    grupos[letra] = { tabela: calcularTabelaGrupo(jg, resultados), completo };
  }
  const todosCompletos =
    Object.keys(grupos).length === 12 && Object.values(grupos).every((g) => g.completo);

  // 2. 1X / 2X — posição num grupo completo
  function posicao(pos, letra) {
    const g = grupos[letra];
    if (!g || !g.completo) return null;
    return g.tabela[pos - 1] ? g.tabela[pos - 1].codigo : null;
  }

  // 3. melhores terceiros -> slot de cada jogo, via tabela oficial FIFA
  const terceiroDoJogo = {};
  if (todosCompletos) {
    const terceiros = Object.entries(grupos)
      .map(([letra, g]) => ({ grupo: letra, ...g.tabela[2] }))
      .sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp || a.grupo.localeCompare(b.grupo));
    const oito = terceiros.slice(0, 8);
    const chave = oito.map((t) => t.grupo).sort().join('');
    const atribuicao = CHAVE_TERCEIROS[chave];
    if (atribuicao) {
      const codigoPorGrupo = Object.fromEntries(oito.map((t) => [t.grupo, t.codigo]));
      COLUNAS_TERCEIROS.forEach((col, i) => {
        terceiroDoJogo[COLUNA_JOGO[col]] = codigoPorGrupo[atribuicao[i]];
      });
    }
  }

  // 4. índice número -> id, para resolver Vxx / Pxx
  const idPorNumero = {};
  for (const j of jogos) {
    const n = numeroDoJogo(j.id);
    if (n != null) idPorNumero[n] = j.id;
  }

  // 5. resolve cada jogo de mata-mata em ordem de número (dependências antes)
  const lados = {};
  const mata = jogos
    .filter((j) => j.fase !== 'grupos')
    .sort((a, b) => (numeroDoJogo(a.id) || 0) - (numeroDoJogo(b.id) || 0));

  function resolverLado(ph, jogoId) {
    let m;
    if ((m = /^([12])([A-L])$/.exec(ph))) return posicao(Number(m[1]), m[2]) || ph;
    if (/^3[A-L]+$/.test(ph)) return terceiroDoJogo[jogoId] || ph;
    if ((m = /^V(\d+)$/.exec(ph))) {
      const d = desfecho(idPorNumero[Number(m[1])], lados, resultados);
      return d ? d.vencedor : ph;
    }
    if ((m = /^P(\d+)$/.exec(ph))) {
      const d = desfecho(idPorNumero[Number(m[1])], lados, resultados);
      return d ? d.perdedor : ph;
    }
    return ph; // já é código real ou placeholder desconhecido
  }

  for (const j of mata) {
    lados[j.id] = {
      mandante: resolverLado(j.mandante, j.id),
      visitante: resolverLado(j.visitante, j.id),
    };
  }
  return lados;
}
