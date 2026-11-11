// Rotas do assistente demonstrativo que responde usando dados das obras.
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db/database.js';

// Cria o roteador do assistente.
const router = Router();

// Processa a pergunta, consulta as obras do usuário e monta uma resposta programada.
async function responder(req, res, next) {
  try {
    // Aceita os dois nomes de campo usados pelos clientes da API.
    const pergunta = req.body?.pergunta ?? req.body?.prompt;
    if (typeof pergunta !== 'string' || !pergunta.trim()) return res.status(400).json({ erro: 'Digite sua pergunta.' });

    // Limita os dados consultados às obras do usuário autenticado.
    const where = req.usuario.tipo === 'CLIENTE'
      ? { clienteId: req.usuario.id }
      : { prestador: { usuarioId: req.usuario.id } };
    const obras = await prisma.obra.findMany({ where });
    const texto = pergunta.toLowerCase();
    let resposta = `Você tem ${obras.length} obra(s) vinculada(s) à sua conta.`;

    // Seleciona uma resposta local conforme o assunto identificado na pergunta.
    if (texto.includes('orçamento') || texto.includes('orcamento') || texto.includes('custo') || texto.includes('despesa')) {
      const total = obras.reduce((n, o) => n + o.orcamento, 0);
      const gasto = obras.reduce((n, o) => n + o.valorGasto, 0);
      resposta = `Orçamento das suas obras: R$ ${total.toFixed(2)}. Gastos registrados: R$ ${gasto.toFixed(2)}.`;
    } else if (texto.includes('progresso') || texto.includes('andamento')) {
      resposta = obras.length ? obras.map(o => `${o.nome}: ${o.progresso}%`).join(' | ') : 'Você ainda não possui obras cadastradas.';
    } else if (texto.includes('atraso') || texto.includes('alerta')) {
      const atrasadas = obras.filter(o => o.status === 'ATRASADA');
      resposta = atrasadas.length ? `Obras marcadas como atrasadas: ${atrasadas.map(o => o.nome).join(', ')}.` : 'Nenhuma obra está marcada como atrasada.';
    }
    // Informa explicitamente que as respostas são programadas, não geradas por IA.
    res.json({ resposta, aviso: 'Respostas programadas com dados das obras; não é IA generativa.' });
  } catch (erro) { next(erro); }
}

// Mantém os dois caminhos disponíveis para compatibilidade com clientes existentes.
router.post('/perguntar', requireAuth, responder);
router.post('/chat', requireAuth, responder); // Aceita { pergunta } ou { prompt }.

// Disponibiliza o roteador para montagem no servidor.
export default router;
