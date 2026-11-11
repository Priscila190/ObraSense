// Reúne as rotas HTTP responsáveis por consultar e criar solicitações.
import { Router } from 'express';
import { prisma } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

// Cria o roteador que será conectado à aplicação principal.
const router = Router();

// Lista as solicitações; clientes veem apenas as próprias, enquanto outros
// usuários autenticados podem consultar todas. Inclui os dados relacionados
// necessários para exibir clientes, propostas, prestadores e obras.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    // Clientes consultam somente as próprias solicitações; os demais perfis
    // autenticados recebem uma lista sem filtro por cliente.
    const filtro = req.usuario.tipo === 'CLIENTE' ? { clienteId: req.usuario.id } : {};

    // Busca as solicitações mais recentes primeiro e inclui os dados relacionados
    // usados pela aplicação, selecionando apenas os campos necessários do cliente
    // e do prestador.
    const solicitacoes = await prisma.solicitacao.findMany({ where: filtro, include: 
      { cliente: { select: { id: true, nome: true } }, propostas: 
      { include: { prestador: { select: { nomeExibicao: true } } } }, obra: true }, 
      orderBy: { criadoEm: 'desc' } });

    // Retorna a lista encontrada como JSON.
    res.json(solicitacoes);
  // Passa erros inesperados para o middleware central do Express.
  } catch (erro) { next(erro); }
});

// Permite que somente clientes autenticados registrem uma nova solicitação.
router.post('/', requireAuth, requireRole('CLIENTE'), async (req, res, next) => {
  try {
    // Lê os campos enviados no corpo; o valor alternativo evita erro caso
    // a requisição não tenha corpo.
    const { titulo, descricao, categoria, cidade } = req.body ?? {};

    // Exige que cada campo seja texto e contenha algo além de espaços.
    if ([titulo, descricao, categoria, cidade].some(v => typeof v !== 'string' || !v.trim())) 
      return res.status(400).json({ erro: 'Preencha todos os campos.' });

    // Remove espaços no início e no fim dos textos e registra o ID do cliente
    // autenticado como dono da solicitação.
    const solicitacao = await prisma.solicitacao.create({ data: { titulo: titulo.trim(), descricao:
       descricao.trim(), categoria: categoria.trim(), cidade: cidade.trim(), clienteId: req.usuario.id } 
      });

    // Responde com o registro criado e o status HTTP 201 (Created).
    res.status(201).json(solicitacao);
  // Passa erros inesperados para o middleware central do Express.
  } catch (erro) { next(erro); }
});

// Exporta o roteador para ser montado na aplicação principal.
export default router;
