// Cálculo da classificação de um grupo a partir dos resultados reais.
// Função pura (sem DOM): recebe os jogos do grupo e o mapa de resultados,
// devolve as linhas já ordenadas pelo critério de desempate.

function linhaVazia(codigo) {
  return { codigo, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 };
}

// jogos: array de { id, mandante, visitante, ... } do grupo.
// resultados: mapa jogoId -> { mandante, visitante } (gols). Pendente = ausente.
export function calcularTabelaGrupo(jogos, resultados = {}) {
  const tabela = new Map();
  const linha = (codigo) => {
    if (!tabela.has(codigo)) tabela.set(codigo, linhaVazia(codigo));
    return tabela.get(codigo);
  };

  for (const jogo of jogos) {
    // garante presença na tabela mesmo sem jogo disputado
    linha(jogo.mandante);
    linha(jogo.visitante);

    const r = resultados[jogo.id];
    if (!r || r.mandante == null || r.visitante == null) continue;

    const m = linha(jogo.mandante);
    const vis = linha(jogo.visitante);
    const gm = Number(r.mandante);
    const gv = Number(r.visitante);

    m.j += 1; vis.j += 1;
    m.gp += gm; m.gc += gv;
    vis.gp += gv; vis.gc += gm;

    if (gm > gv) { m.v += 1; m.pts += 3; vis.d += 1; }
    else if (gm < gv) { vis.v += 1; vis.pts += 3; m.d += 1; }
    else { m.e += 1; vis.e += 1; m.pts += 1; vis.pts += 1; }
  }

  const linhas = [...tabela.values()];
  for (const l of linhas) l.sg = l.gp - l.gc;

  // Desempate: pontos -> saldo -> gols pró -> nome (código, alfabético).
  linhas.sort((a, b) =>
    b.pts - a.pts ||
    b.sg - a.sg ||
    b.gp - a.gp ||
    a.codigo.localeCompare(b.codigo)
  );
  return linhas;
}
