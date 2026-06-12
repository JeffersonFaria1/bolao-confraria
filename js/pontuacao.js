// lib/pontuacao.js
const PONTOS = { exato: 10, vencedor: 5, erro: 0 };
const PONTOS_BONUS = { campeao: 50, vice: 25, artilheiro: 15, desempenhoBrasil: 25, neymarMarca: 10 };

// Retorna o "sinal" do confronto: 1 = mandante ganhou, -1 = visitante ganhou, 0 = empate
function resultado1x2(placar) {
  if (placar.mandante > placar.visitante) return 1;
  if (placar.mandante < placar.visitante) return -1;
  return 0;
}

export function pontosJogo(palpite, resultado) {
  if (!palpite || !resultado) return PONTOS.erro;
  if (palpite.mandante === resultado.mandante && palpite.visitante === resultado.visitante) {
    return PONTOS.exato;
  }
  if (resultado1x2(palpite) === resultado1x2(resultado)) {
    return PONTOS.vencedor;
  }
  return PONTOS.erro;
}

export function cravou(palpite, resultado) {
  if (!palpite || !resultado) return false;
  return palpite.mandante === resultado.mandante && palpite.visitante === resultado.visitante;
}

const CAMPOS_BONUS = ['campeao', 'vice', 'artilheiro', 'desempenhoBrasil', 'neymarMarca'];

export function pontosBonus(palpite, oficial) {
  if (!palpite || !oficial) return 0;
  let total = 0;
  for (const campo of CAMPOS_BONUS) {
    const valorOficial = oficial[campo];
    // Campo oficial ainda não definido (null/undefined) não pontua.
    if (valorOficial === null || valorOficial === undefined) continue;
    if (palpite[campo] === valorOficial) {
      total += PONTOS_BONUS[campo];
    }
  }
  return total;
}

export function calcularRanking(dados, jogos) {
  const resultados = dados.resultados || {};
  const resultadosBonus = dados.resultadosBonus || null;
  const campeaoOficial = resultadosBonus ? resultadosBonus.campeao : null;

  const linhas = dados.participantes.map((p) => {
    const palpitesDoP = (dados.palpites && dados.palpites[p.nome]) || {};
    let pontos = 0;
    let pontosGrupos = 0;
    let cravadas = 0;

    for (const jogo of jogos) {
      const palpite = palpitesDoP[jogo.id];
      const resultado = resultados[jogo.id];
      const pts = pontosJogo(palpite, resultado);
      pontos += pts;
      if (jogo.fase === 'grupos') pontosGrupos += pts;
      if (cravou(palpite, resultado)) cravadas += 1;
    }

    const palpiteBonusDoP = (dados.palpitesBonus && dados.palpitesBonus[p.nome]) || null;
    pontos += pontosBonus(palpiteBonusDoP, resultadosBonus);

    const acertouCampeao =
      campeaoOficial != null &&
      palpiteBonusDoP != null &&
      palpiteBonusDoP.campeao === campeaoOficial;

    return {
      nome: p.nome,
      apelido: p.apelido ?? null,
      exibicao: p.apelido || p.nome,
      pontos,
      cravadas,
      pontosGrupos,
      acertouCampeao,
    };
  });

  // Ordena aplicando os critérios de desempate em ordem.
  linhas.sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.cravadas !== a.cravadas) return b.cravadas - a.cravadas;
    if (a.acertouCampeao !== b.acertouCampeao) return Number(b.acertouCampeao) - Number(a.acertouCampeao);
    return b.pontosGrupos - a.pontosGrupos;
  });

  // Atribui posição; empate TOTAL (todos os critérios iguais) compartilha posição.
  function mesmoCriterio(a, b) {
    return a.pontos === b.pontos && a.cravadas === b.cravadas &&
      a.acertouCampeao === b.acertouCampeao && a.pontosGrupos === b.pontosGrupos;
  }
  linhas.forEach((linha, i) => {
    if (i > 0 && mesmoCriterio(linha, linhas[i - 1])) {
      linha.posicao = linhas[i - 1].posicao;
    } else {
      linha.posicao = i + 1;
    }
  });

  return linhas;
}
