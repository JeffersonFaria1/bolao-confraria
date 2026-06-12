// Helpers de exibição da página pública (só-leitura).
export function exibicao(p) { return p.apelido || p.nome; }

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const DIAS_ABREV = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MESES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

export function formatarDataCabecalho(dataISO) {
  if (!dataISO) return 'DATA A DEFINIR';
  const [ano, mes, dia] = dataISO.split('-').map(Number);
  const d = new Date(ano, mes - 1, dia);
  return `${DIAS_ABREV[d.getDay()]}, ${dia} DE ${MESES[mes - 1]}`;
}

export function rotuloFase(jogo) {
  if (jogo.fase === 'grupos') return `Grupo ${jogo.grupo}`;
  const mapa = { '16avos': '16-avos', oitavas: 'Oitavas', quartas: 'Quartas', semifinal: 'Semifinal', terceiro: '3º lugar', final: 'Final' };
  return mapa[jogo.fase] || jogo.fase;
}

// Renderiza jogos agrupados por data (cabeçalho por dia). criarCard(jogo) -> elemento.
export function renderJogosPorData(container, jogos, criarCard) {
  const ordenados = [...jogos].sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`));
  let dataAtual = null;
  for (const jogo of ordenados) {
    if (jogo.data !== dataAtual) {
      dataAtual = jogo.data;
      const cab = document.createElement('div');
      cab.className = 'data-cabecalho';
      cab.textContent = formatarDataCabecalho(jogo.data);
      container.appendChild(cab);
    }
    container.appendChild(criarCard(jogo));
  }
}
