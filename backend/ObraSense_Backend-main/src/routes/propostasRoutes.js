// Rotas para enviar propostas a solicitações e aceitar uma proposta como cliente.
import { Router } from 'express';
import { prisma } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

// Cria o roteador das propostas.
const router = Router();

// Cria uma proposta para uma solicitação ainda aberta.
router.post('/', requireAuth, requireRole('PROFISSIONAL', 'EMPRESA'), async (req, res, next) => {
 
  try {
    
    // Lê os dados recebidos e converte os valores numéricos para validação.
    const { solicitacaoId, valor, descricao } = req.body ?? {};
    
    const id = Number(solicitacaoId), preco = Number(valor);
    
    if (!Number.isInteger(id) || id < 1 || !Number.isFinite(preco) || preco <= 0 || typeof descricao !== 'string' || !descricao.trim()) return res.status(400).json({ erro: 'Informe solicitação, valor e descrição válidos.' });
    
    const [prestador, solicitacao] = await Promise.all([prisma.prestador.findUnique({ where: { usuarioId: req.usuario.id } }), prisma.solicitacao.findUnique({ where: { id } })]);
    
    // Confirma que o usuário possui perfil de prestador e que a solicitação aceita propostas.
    if (!prestador) return res.status(403).json({ erro: 'Perfil de prestador não encontrado.' });
    
    if (!solicitacao || solicitacao.status !== 'ABERTA') return res.status(409).json({ erro: 'Solicitação indisponível.' });
   
    const proposta = await prisma.proposta.create({ data: { solicitacaoId: id, prestadorId: prestador.id, valor: preco, descricao: descricao.trim() } });
   
    res.status(201).json(proposta);
  
  } catch (erro) {
    
    // Converte a violação de unicidade (proposta repetida) em resposta HTTP 409.
    if (erro.code === 'P2002') return res.status(409).json({ erro: 'Você já enviou uma proposta para esta solicitação.' });
    
    next(erro);
  
  }

});

// Permite que o cliente dono da solicitação aceite uma proposta.
router.post('/:id/aceitar', requireAuth, requireRole('CLIENTE'), async (req, res, next) => {
  
  try {
    
    const id = Number(req.params.id);
    
    if (!Number.isInteger(id)) return res.status(400).json({ erro: 'ID inválido.' });
    
    // Executa as alterações relacionadas juntas para evitar contratação parcial.
    const resultado = await prisma.$transaction(async (tx) => {
      
      const proposta = await tx.proposta.findUnique({ where: { id }, include: { solicitacao: true } });
      
      // Impede aceitar proposta de solicitação pertencente a outro cliente.
      if (!proposta || proposta.solicitacao.clienteId !== req.usuario.id) return { erro: 'Proposta não encontrada.', status: 404 };
      
      // Só uma proposta pode contratar uma solicitação aberta.
      const alterada = await tx.solicitacao.updateMany({ where: { id: proposta.solicitacaoId, status: 'ABERTA' }, data: { status: 'CONTRATADA' } });
      
      if (alterada.count === 0) return { erro: 'Solicitação já encerrada.', status: 409 };
     
      await tx.proposta.update({ where: { id }, data: { status: 'ACEITA' } });
      
      // Recusa as demais propostas e gera a obra correspondente à contratação.
      await tx.proposta.updateMany({ where: { solicitacaoId: proposta.solicitacaoId, id: { not: id } }, data: { status: 'RECUSADA' } });
      const obra = await tx.obra.create({ data: { nome: proposta.solicitacao.titulo, orcamento: proposta.valor, clienteId: req.usuario.id, prestadorId: proposta.prestadorId, solicitacaoId: proposta.solicitacaoId } });
      return { obra };
    });
    if (resultado.erro) return res.status(resultado.status).json({ erro: resultado.erro });
    res.json(resultado);
  } catch (erro) { next(erro); }
});

// Disponibiliza o roteador para montagem no servidor.
export default router;
