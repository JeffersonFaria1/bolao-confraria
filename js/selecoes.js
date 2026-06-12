// Mapa das 48 seleções da Copa 2026: código FIFA -> { nome (pt-BR), iso (flagcdn) }.
// O arquivo de bandeira fica em flags/<codigoFIFA-minusculo>.svg (caminho relativo)
export const SELECOES = {
  MEX: { nome: 'México', iso: 'mx' },
  RSA: { nome: 'África do Sul', iso: 'za' },
  KOR: { nome: 'Coreia do Sul', iso: 'kr' },
  CZE: { nome: 'Tchéquia', iso: 'cz' },
  CAN: { nome: 'Canadá', iso: 'ca' },
  BIH: { nome: 'Bósnia e Herzegovina', iso: 'ba' },
  QAT: { nome: 'Catar', iso: 'qa' },
  SUI: { nome: 'Suíça', iso: 'ch' },
  BRA: { nome: 'Brasil', iso: 'br' },
  MAR: { nome: 'Marrocos', iso: 'ma' },
  HAI: { nome: 'Haiti', iso: 'ht' },
  SCO: { nome: 'Escócia', iso: 'gb-sct' },
  USA: { nome: 'Estados Unidos', iso: 'us' },
  PAR: { nome: 'Paraguai', iso: 'py' },
  AUS: { nome: 'Austrália', iso: 'au' },
  TUR: { nome: 'Turquia', iso: 'tr' },
  GER: { nome: 'Alemanha', iso: 'de' },
  CUW: { nome: 'Curaçao', iso: 'cw' },
  CIV: { nome: 'Costa do Marfim', iso: 'ci' },
  ECU: { nome: 'Equador', iso: 'ec' },
  NED: { nome: 'Holanda', iso: 'nl' },
  JPN: { nome: 'Japão', iso: 'jp' },
  SWE: { nome: 'Suécia', iso: 'se' },
  TUN: { nome: 'Tunísia', iso: 'tn' },
  BEL: { nome: 'Bélgica', iso: 'be' },
  EGY: { nome: 'Egito', iso: 'eg' },
  IRN: { nome: 'Irã', iso: 'ir' },
  NZL: { nome: 'Nova Zelândia', iso: 'nz' },
  ESP: { nome: 'Espanha', iso: 'es' },
  CPV: { nome: 'Cabo Verde', iso: 'cv' },
  KSA: { nome: 'Arábia Saudita', iso: 'sa' },
  URU: { nome: 'Uruguai', iso: 'uy' },
  FRA: { nome: 'França', iso: 'fr' },
  SEN: { nome: 'Senegal', iso: 'sn' },
  IRQ: { nome: 'Iraque', iso: 'iq' },
  NOR: { nome: 'Noruega', iso: 'no' },
  ARG: { nome: 'Argentina', iso: 'ar' },
  ALG: { nome: 'Argélia', iso: 'dz' },
  AUT: { nome: 'Áustria', iso: 'at' },
  JOR: { nome: 'Jordânia', iso: 'jo' },
  POR: { nome: 'Portugal', iso: 'pt' },
  COD: { nome: 'R.D. Congo', iso: 'cd' },
  UZB: { nome: 'Uzbequistão', iso: 'uz' },
  COL: { nome: 'Colômbia', iso: 'co' },
  ENG: { nome: 'Inglaterra', iso: 'gb-eng' },
  CRO: { nome: 'Croácia', iso: 'hr' },
  GHA: { nome: 'Gana', iso: 'gh' },
  PAN: { nome: 'Panamá', iso: 'pa' },
};

// Retorna { nome, bandeira } para um código de jogo.
// Para seleções conhecidas: nome por extenso + caminho da bandeira local.
// Para vagas do mata-mata (ex.: "1C", "V73", "3ABCDF"): nome amigável e sem bandeira.
export function selecao(codigo) {
  const sel = SELECOES[codigo];
  if (sel) {
    return { nome: sel.nome, bandeira: `flags/${codigo.toLowerCase()}.svg` };
  }
  return { nome: rotuloVaga(codigo), bandeira: null };
}

// Deixa os rótulos de vaga do mata-mata mais legíveis.
function rotuloVaga(codigo) {
  if (!codigo) return '—';
  let m;
  if ((m = codigo.match(/^([12])([A-L])$/))) return `${m[1]}º do Grupo ${m[2]}`;
  if ((m = codigo.match(/^V(\d+)$/))) return `Vencedor do jogo ${m[1]}`;
  if ((m = codigo.match(/^P(\d+)$/))) return `Perdedor do jogo ${m[1]}`;
  if ((m = codigo.match(/^3([A-L]+)$/))) return `3º (${m[1].split('').join('/')})`;
  return codigo;
}
