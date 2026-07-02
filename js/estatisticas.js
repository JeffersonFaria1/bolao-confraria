// public/js/estatisticas.js
// Estatísticas derivadas (funções puras, sem DOM) a partir de (dados, jogos).
import { pontosJogo, cravou, pontosBonus, calcularRanking } from './pontuacao.js';
import { resolverMataMata } from './resolver-mata-mata.js';

export const ORDEM_SEGMENTOS = ['grupos-1','grupos-2','grupos-3','16avos','oitavas','quartas','semifinal','final'];
export const ROTULO_SEGMENTO = {
  'grupos-1': '1ª rod.', 'grupos-2': '2ª rod.', 'grupos-3': '3ª rod.',
  '16avos': '16-avos', 'oitavas': 'Oitavas', 'quartas': 'Quartas',
  'semifinal': 'Semis', 'final': 'Final',
};

export function temResultado(r) {
  return r && r.mandante != null && r.visitante != null;
}

function ordemCronologica(a, b) {
  return (a.data + a.horario).localeCompare(b.data + b.horario);
}

// Rodada (1/2/3) de um jogo de grupos: ordena os 6 do grupo e agrupa em pares.
function rodadaGrupo(jogo, jogos) {
  const doGrupo = jogos
    .filter((g) => g.fase === 'grupos' && g.grupo === jogo.grupo)
    .sort(ordemCronologica);
  const idx = doGrupo.findIndex((g) => g.id === jogo.id);
  return Math.floor(idx / 2) + 1;
}

export function segmentoDoJogo(jogo, jogos) {
  if (jogo.fase === 'grupos') return `grupos-${rodadaGrupo(jogo, jogos)}`;
  if (jogo.fase === 'terceiro' || jogo.fase === 'final') return 'final';
  return jogo.fase; // 16avos, oitavas, quartas, semifinal
}

export function corridaPorRodada(dados, jogos) {
  const participantes = dados.participantes || [];
  const resultados = dados.resultados || {};
  const resultadosBonus = dados.resultadosBonus || null;

  // pontos por (participante, segmento), só jogos com resultado
  const porSeg = {}; // nome -> { segmento -> pontos }
  for (const p of participantes) porSeg[p.nome] = {};
  for (const jogo of jogos) {
    const res = resultados[jogo.id];
    if (!temResultado(res)) continue;
    const seg = segmentoDoJogo(jogo, jogos);
    for (const p of participantes) {
      const pal = (dados.palpites?.[p.nome] || {})[jogo.id];
      porSeg[p.nome][seg] = (porSeg[p.nome][seg] || 0) + pontosJogo(pal, res);
    }
  }

  // checkpoints presentes (na ordem canônica) = segmentos com >=1 jogo com resultado
  const presentes = new Set();
  for (const nome of Object.keys(porSeg)) {
    for (const seg of Object.keys(porSeg[nome])) presentes.add(seg);
  }
  const checkpoints = ORDEM_SEGMENTOS
    .filter((s) => presentes.has(s))
    .map((key) => ({ key, rotulo: ROTULO_SEGMENTO[key] }));

  const ultimo = checkpoints.length - 1;
  const series = participantes.map((p) => {
    let acc = 0;
    const pontos = checkpoints.map((c, i) => {
      acc += porSeg[p.nome][c.key] || 0;
      if (i === ultimo && resultadosBonus) {
        acc += pontosBonus(dados.palpitesBonus?.[p.nome] || null, resultadosBonus);
      }
      return acc;
    });
    return { nome: p.nome, exibicao: p.apelido || p.nome, pontos };
  });

  return { checkpoints, series };
}

export function raioXCompeticao(dados, jogos) {
  const participantes = dados.participantes || [];
  const resultados = dados.resultados || {};
  const lados = resolverMataMata(jogos, resultados); // resolve mandante/visitante do mata-mata
  const encerrados = jogos.filter((j) => temResultado(resultados[j.id]));

  // taxa de acerto por jogo (fração de palpites que pontuaram >= cenário)
  const porJogo = encerrados.map((jogo) => {
    let palpitou = 0, acertou = 0;
    for (const p of participantes) {
      const pal = dados.palpites?.[p.nome]?.[jogo.id];
      if (!pal) continue;
      palpitou += 1;
      if (pontosJogo(pal, resultados[jogo.id]) > 0) acertou += 1;
    }
    const lado = lados[jogo.id] || {};
    return {
      jogoId: jogo.id,
      mandante: lado.mandante ?? jogo.mandante,
      visitante: lado.visitante ?? jogo.visitante,
      taxaAcerto: palpitou ? acertou / palpitou : 0,
      palpitou,
    };
  }).filter((j) => j.palpitou > 0);

  const minJ = porJogo.length ? porJogo.reduce((a, b) => (b.taxaAcerto < a.taxaAcerto ? b : a)) : null;
  const maxJ = porJogo.length ? porJogo.reduce((a, b) => (b.taxaAcerto > a.taxaAcerto ? b : a)) : null;

  // taxa por seleção (só lados que são código real, 3 letras)
  const ehCodigo = (x) => typeof x === 'string' && /^[A-Z]{3}$/.test(x);
  const sel = {}; // codigo -> { soma, n }
  for (const j of porJogo) {
    for (const cod of [j.mandante, j.visitante]) {
      if (!ehCodigo(cod)) continue;
      (sel[cod] ||= { soma: 0, n: 0 });
      sel[cod].soma += j.taxaAcerto;
      sel[cod].n += 1;
    }
  }
  const selArr = Object.entries(sel).map(([codigo, v]) => ({ codigo, taxa: v.soma / v.n }));
  const selMax = selArr.length ? selArr.reduce((a, b) => (b.taxa > a.taxa ? b : a)) : null;
  const selMin = selArr.length ? selArr.reduce((a, b) => (b.taxa < a.taxa ? b : a)) : null;

  // campeão mais palpitado
  const votos = {};
  for (const p of participantes) {
    const c = dados.palpitesBonus?.[p.nome]?.campeao;
    if (c) votos[c] = (votos[c] || 0) + 1;
  }
  const campeaoMaisPalpitado = Object.keys(votos).length
    ? Object.entries(votos).map(([codigo, n]) => ({ codigo, votos: n })).reduce((a, b) => (b.votos > a.votos ? b : a))
    : null;

  // médias de gols
  let golsOficial = 0, golsPalpite = 0, nPalpite = 0;
  for (const jogo of encerrados) {
    const res = resultados[jogo.id];
    golsOficial += res.mandante + res.visitante;
    for (const p of participantes) {
      const pal = dados.palpites?.[p.nome]?.[jogo.id];
      if (!pal) continue;
      golsPalpite += (pal.mandante || 0) + (pal.visitante || 0);
      nPalpite += 1;
    }
  }

  return {
    jogoMaisDividiu: minJ,
    jogoMaisFacil: maxJ,
    selecaoMaisAcertada: selMax,
    selecaoMenosAcertada: selMin,
    campeaoMaisPalpitado,
    mediaGolsOficial: encerrados.length ? golsOficial / encerrados.length : 0,
    mediaGolsPalpite: nPalpite ? golsPalpite / nPalpite : 0,
  };
}

export function perfil(dados, jogos, nome) {
  const ranking = calcularRanking(dados, jogos);
  const linha = ranking.find((l) => l.nome === nome) || { pontos: 0, cravadas: 0, posicao: null, exibicao: nome };
  const apr = aproveitamento(dados, jogos).porParticipante.find((p) => p.nome === nome)
    || { aproveitamentoPct: 0, cravou: 0, cenario: 0, erro: 0 };
  const corrida = corridaPorRodada(dados, jogos);
  const serieP = corrida.series.find((s) => s.nome === nome);
  return {
    nome,
    exibicao: linha.exibicao,
    posicao: linha.posicao,
    pontos: linha.pontos,
    cravadas: linha.cravadas,
    aproveitamentoPct: apr.aproveitamentoPct,
    cravou: apr.cravou, cenario: apr.cenario, erro: apr.erro,
    checkpoints: corrida.checkpoints,
    serie: serieP ? serieP.pontos : [],
  };
}

export function confronto(dados, jogos, nomeA, nomeB) {
  return { a: perfil(dados, jogos, nomeA), b: perfil(dados, jogos, nomeB) };
}

export function aproveitamento(dados, jogos) {
  const participantes = dados.participantes || [];
  const resultados = dados.resultados || {};
  const encerrados = jogos.filter((j) => temResultado(resultados[j.id]));

  const porParticipante = participantes.map((p) => {
    const pals = dados.palpites?.[p.nome] || {};
    let cravouN = 0, cenario = 0, erro = 0, pontos = 0, jogosPalpitados = 0, somaGols = 0;
    for (const jogo of encerrados) {
      const pal = pals[jogo.id];
      if (!pal) continue;
      jogosPalpitados += 1;
      somaGols += (pal.mandante || 0) + (pal.visitante || 0);
      const pts = pontosJogo(pal, resultados[jogo.id]);
      pontos += pts;
      if (cravou(pal, resultados[jogo.id])) cravouN += 1;
      else if (pts === 5) cenario += 1;
      else erro += 1;
    }
    return {
      nome: p.nome, exibicao: p.apelido || p.nome,
      cravou: cravouN, cenario, erro, jogosPalpitados, pontos,
      aproveitamentoPct: jogosPalpitados ? pontos / (jogosPalpitados * 10) : 0,
      mediaGolsPalpite: jogosPalpitados ? somaGols / jogosPalpitados : 0,
    };
  });

  const comPalpite = porParticipante.filter((p) => p.jogosPalpitados > 0);
  const maxPor = (arr, sel) => arr.length ? arr.reduce((a, b) => (sel(b) > sel(a) ? b : a)) : null;
  const minPor = (arr, sel) => arr.length ? arr.reduce((a, b) => (sel(b) < sel(a) ? b : a)) : null;

  return {
    porParticipante,
    melhorCravador: maxPor(porParticipante, (p) => p.cravou),
    maiorAzarao: minPor(comPalpite, (p) => p.aproveitamentoPct),
    maisArrisca: maxPor(comPalpite, (p) => p.mediaGolsPalpite),
  };
}
