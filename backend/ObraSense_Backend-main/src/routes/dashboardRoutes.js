// Rotas que fornecem os indicadores resumidos exibidos no painel.
import { Router } from 'express';
import { prisma } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

// Cria o roteador do painel.
const router = Router();

// Retorna indicadores calculados a partir das obras visíveis ao usuário autenticado.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    // Restringe a consulta às obras do cliente ou do prestador atual.
    const where = req.usuario.tipo === 'CLIENTE'
      ? { clienteId: req.usuario.id }
      : { prestador: { usuarioId: req.usuario.id } };
    const obras = await prisma.obra.findMany({ where });

    // Calcula quantidades e totais usados nos cards do painel.
    const ativas = obras.filter(o => o.status !== 'CONCLUIDA');
    const atrasadas = obras.filter(o => o.status === 'ATRASADA');
    const total = obras.reduce((v, o) => v + o.orcamento, 0);
    const gasto = obras.reduce((v, o) => v + o.valorGasto, 0);
    const consumido = total ? Math.round(gasto / total * 100) : 0;

    // Envia métricas e mensagens de estado em um único objeto JSON.
    res.json({
      obrasAtivas: ativas.length,
      obrasTrend: `${obras.length} obra(s) no total`,
      orcamentoConsumido: consumido,
      orcamentoStatus: total ? (gasto > total ? 'Acima do orçamento' : 'Dentro do previsto') : 'Sem orçamento cadastrado',
      alertasCount: atrasadas.length,
      ultimoAlertaMsg: atrasadas.length ? `Atraso: ${atrasadas[0].nome}` : 'Nenhum atraso registrado',
      equipePresente: 0,
      presencaStatus: 'Controle de presença não implementado',
      agenteStatus: 'Demonstrativo'
    });
  // Encaminha falhas de consulta ao middleware de erros do Express.
  } catch (erro) { next(erro); }
});

// Disponibiliza o roteador para montagem no servidor.
export default router;
