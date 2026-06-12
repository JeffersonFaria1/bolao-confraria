import { calcularRanking } from './pontuacao.js';
import { renderClassificacao } from './classificacao.js';
import { renderResultados } from './resultados.js';
import { renderTodos } from './todos.js';
import { renderBonus } from './bonus.js';

const conteudo = document.getElementById('conteudo');
const estado = { dados: null, jogos: null, ranking: null };

const RENDER = {
  classificacao: renderClassificacao,
  resultados: renderResultados,
  todos: renderTodos,
  bonus: renderBonus,
};

function mostrarAba(nome) {
  document.querySelectorAll('.aba').forEach((b) => b.classList.toggle('ativa', b.dataset.aba === nome));
  conteudo.innerHTML = '';
  RENDER[nome](conteudo, estado);
}

document.querySelectorAll('.aba').forEach((btn) => {
  btn.addEventListener('click', () => mostrarAba(btn.dataset.aba));
});

// Alternância de tema (igual ao app, persistida no navegador do viewer).
const btnTema = document.getElementById('btn-tema');
btnTema.addEventListener('click', () => {
  const novo = document.body.dataset.tema === 'escuro' ? 'claro' : 'escuro';
  document.body.dataset.tema = novo;
  btnTema.textContent = novo === 'escuro' ? '🌙' : '☀️';
  localStorage.setItem('tema', novo);
});
const temaSalvo = localStorage.getItem('tema');
if (temaSalvo) {
  document.body.dataset.tema = temaSalvo;
  btnTema.textContent = temaSalvo === 'escuro' ? '🌙' : '☀️';
}

async function carregar(arquivo) {
  const r = await fetch(arquivo);
  if (!r.ok) throw new Error(`falha ao carregar ${arquivo}`);
  return r.json();
}

(async () => {
  try {
    estado.dados = await carregar('dados.json');
    estado.jogos = await carregar('jogos.json');
    estado.ranking = calcularRanking(estado.dados, estado.jogos);
    const snap = await carregar('snapshot.json').catch(() => null);
    if (snap && snap.atualizadoEmTexto) {
      document.getElementById('snapshot').textContent = `atualizado em ${snap.atualizadoEmTexto}`;
    }
    mostrarAba('classificacao');
  } catch (e) {
    conteudo.innerHTML = `<p style="color:#e07a5f">Erro ao carregar os dados: ${e.message}</p>`;
  }
})();
