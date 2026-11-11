// Rotas para consultar obras e registrar atualizações de progresso.
import { Router } from 'express';
import { prisma } from '../db/database.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

// Cria o roteador das obras.
const router = Router();

// Define relações carregadas junto com as obras para atender à tela de detalhes.
const incluir = {
  atualizacoes: { orderBy: { criadoEm: 'desc' } },
  produtos: { orderBy: { id: 'asc' } },
  etapas: { orderBy: { dataInicio: 'asc' } },
  cliente: { select: { nome: true } },
  prestador: { select: { nomeExibicao: true, usuarioId: true } }
};

const statusEtapa = ['PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'];

// Converte o código de status para um texto legível e acrescenta campos de exibição
// esperados pela interface, mantendo os demais dados originais da obra.
function formatarObra(obra) {
  const statusPorCodigo = {
    EM_ANDAMENTO: 'Em andamento',
    ATRASADA: 'Atrasada',
    INICIANDO: 'Iniciando',
    CONCLUIDA: 'Concluída',
    PAUSADA: 'Pausada',
    CANCELADA: 'Cancelada'
  };
  const statusTexto = statusPorCodigo[obra.status] || obra.status;
  return {
    ...obra,
    statusCodigo: obra.status,
    status: statusTexto,
    responsavel: obra.prestador?.nomeExibicao || 'Não informado',
    alerta: obra.status === 'ATRASADA',
  };
}

async function buscarObraDoPrestador(id, usuarioId) {
  return prisma.obra.findFirst({ where: { id, prestador: { usuarioId } } });
}

function lerData(valor) {
  if (typeof valor !== 'string' || !valor.trim()) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function obraEncerrada(status) {
  return ['CANCELADA', 'CONCLUIDA'].includes(status);
}

// Lista as obras pertencentes ao usuário autenticado, da mais recente para a mais antiga.
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const where = req.usuario.tipo === 'CLIENTE'
      ? { clienteId: req.usuario.id }
      : { prestador: { usuarioId: req.usuario.id } };
    const obras = await prisma.obra.findMany({ where, include: incluir, orderBy: { id: 'desc' } });
    res.json(obras.map(formatarObra));
  } catch (erro) { next(erro); }
});

// Lista as etapas planejadas em ordem cronológica para o calendário da obra.
router.get('/:id/etapas', requireAuth, async (req, res, next) => {
  try {
    const obraId = Number(req.params.id);
    if (!Number.isSafeInteger(obraId) || obraId < 1) return res.status(400).json({ erro: 'ID inválido.' });

    const obra = await prisma.obra.findFirst({
      where: { id: obraId, OR: [{ clienteId: req.usuario.id }, { prestador: { usuarioId: req.usuario.id } }] },
      select: { id: true }
    });
    if (!obra) return res.status(404).json({ erro: 'Obra não encontrada.' });

    const etapas = await prisma.etapaCronograma.findMany({
      where: { obraId },
      orderBy: [{ dataInicio: 'asc' }, { id: 'asc' }]
    });
    res.json(etapas);
  } catch (erro) { next(erro); }
});

// Cria uma etapa planejada no cronograma; somente o prestador responsável pode editar.
router.post('/:id/etapas', requireAuth, requireRole('PROFISSIONAL', 'EMPRESA'), async (req, res, next) => {
  try {
    const obraId = Number(req.params.id);
    const { titulo, descricao = '', dataInicio: inicioInformado, dataFim: fimInformado } = req.body ?? {};
    const dataInicio = lerData(inicioInformado);
    const dataFim = lerData(fimInformado);

    if (!Number.isSafeInteger(obraId) || obraId < 1 || typeof titulo !== 'string' || !titulo.trim() ||
      typeof descricao !== 'string' || !dataInicio || !dataFim || dataFim < dataInicio) {
      return res.status(400).json({ erro: 'Informe título, descrição válida e datas válidas, com término igual ou posterior ao início.' });
    }

    const obra = await buscarObraDoPrestador(obraId, req.usuario.id);
    if (!obra) return res.status(404).json({ erro: 'Obra não encontrada.' });
    if (obraEncerrada(obra.status)) return res.status(409).json({ erro: 'Não é possível alterar o cronograma de uma obra encerrada.' });

    const etapa = await prisma.etapaCronograma.create({
      data: { obraId, titulo: titulo.trim(), descricao: descricao.trim(), dataInicio, dataFim }
    });
    res.status(201).json(etapa);
  } catch (erro) { next(erro); }
});

// Atualiza os dados ou o status de uma etapa do cronograma da obra.
router.patch('/:id/etapas/:etapaId', requireAuth, requireRole('PROFISSIONAL', 'EMPRESA'), async (req, res, next) => {
  try {
    const obraId = Number(req.params.id);
    const etapaId = Number(req.params.etapaId);
    if (!Number.isSafeInteger(obraId) || obraId < 1 || !Number.isSafeInteger(etapaId) || etapaId < 1) {
      return res.status(400).json({ erro: 'ID inválido.' });
    }

    const obra = await buscarObraDoPrestador(obraId, req.usuario.id);
    if (!obra) return res.status(404).json({ erro: 'Obra não encontrada.' });
    if (obraEncerrada(obra.status)) return res.status(409).json({ erro: 'Não é possível alterar o cronograma de uma obra encerrada.' });

    const etapa = await prisma.etapaCronograma.findFirst({ where: { id: etapaId, obraId } });
    if (!etapa) return res.status(404).json({ erro: 'Etapa não encontrada.' });

    const body = req.body ?? {};
    const data = {};
    if (Object.hasOwn(body, 'titulo')) {
      if (typeof body.titulo !== 'string' || !body.titulo.trim()) return res.status(400).json({ erro: 'Informe um título válido.' });
      data.titulo = body.titulo.trim();
    }
    if (Object.hasOwn(body, 'descricao')) {
      if (typeof body.descricao !== 'string') return res.status(400).json({ erro: 'Informe uma descrição válida.' });
      data.descricao = body.descricao.trim();
    }
    if (Object.hasOwn(body, 'dataInicio')) {
      data.dataInicio = lerData(body.dataInicio);
      if (!data.dataInicio) return res.status(400).json({ erro: 'Informe uma data de início válida.' });
    }
    if (Object.hasOwn(body, 'dataFim')) {
      data.dataFim = lerData(body.dataFim);
      if (!data.dataFim) return res.status(400).json({ erro: 'Informe uma data de término válida.' });
    }
    if (Object.hasOwn(body, 'status')) {
      if (!statusEtapa.includes(body.status)) return res.status(400).json({ erro: 'Status de etapa inválido.' });
      if (obraEncerrada(etapa.status) && body.status !== etapa.status) {
        return res.status(409).json({ erro: 'Não é possível reabrir uma etapa encerrada.' });
      }
      data.status = body.status;
    }
    if (!Object.keys(data).length) return res.status(400).json({ erro: 'Informe ao menos um campo para atualizar.' });
    if (obraEncerrada(etapa.status) && Object.keys(data).some(campo => campo !== 'status')) {
      return res.status(409).json({ erro: 'Não é possível editar uma etapa encerrada.' });
    }

    const dataInicio = data.dataInicio ?? etapa.dataInicio;
    const dataFim = data.dataFim ?? etapa.dataFim;
    if (dataFim < dataInicio) return res.status(400).json({ erro: 'A data de término deve ser igual ou posterior à data de início.' });

    const atualizada = await prisma.etapaCronograma.update({ where: { id: etapaId }, data });
    res.json(atualizada);
  } catch (erro) { next(erro); }
});

// Remove uma etapa vinculada à obra do prestador autenticado.
router.delete('/:id/etapas/:etapaId', requireAuth, requireRole('PROFISSIONAL', 'EMPRESA'), async (req, res, next) => {
  try {
    const obraId = Number(req.params.id);
    const etapaId = Number(req.params.etapaId);
    if (!Number.isSafeInteger(obraId) || obraId < 1 || !Number.isSafeInteger(etapaId) || etapaId < 1) {
      return res.status(400).json({ erro: 'ID inválido.' });
    }

    const obra = await buscarObraDoPrestador(obraId, req.usuario.id);
    if (!obra) return res.status(404).json({ erro: 'Obra não encontrada.' });
    if (obraEncerrada(obra.status)) return res.status(409).json({ erro: 'Não é possível alterar o cronograma de uma obra encerrada.' });

    const etapa = await prisma.etapaCronograma.findFirst({ where: { id: etapaId, obraId } });
    if (!etapa) return res.status(404).json({ erro: 'Etapa não encontrada.' });

    await prisma.etapaCronograma.delete({ where: { id: etapaId } });
    res.status(204).end();
  } catch (erro) { next(erro); }
});

// Busca uma obra pelo identificador depois de validar o ID e conferir a permissão
// do usuário: ele precisa ser o cliente ou o prestador associado à obra.
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ erro: 'ID inválido.' });
    const obra = await prisma.obra.findUnique({ where: { id }, include: incluir });
    if (!obra || (obra.clienteId !== req.usuario.id && obra.prestador.usuarioId !== req.usuario.id)) {
      return res.status(404).json({ erro: 'Obra não encontrada.' });
    }
    res.json(formatarObra(obra));
  } catch (erro) { next(erro); }
});

// A empresa ou o profissional responsável pode atualizar o progresso da obra.
router.post('/:id/atualizacoes', requireAuth, requireRole('PROFISSIONAL', 'EMPRESA'), async (req, res, next) => {
  try {
    // Converte e valida o ID, o progresso e a descrição enviados pelo cliente HTTP.
    const id = Number(req.params.id);
    const progresso = Number(req.body?.progresso);
    const descricao = req.body?.descricao;
    if (!Number.isSafeInteger(id) || id < 1 || !Number.isInteger(progresso) || progresso < 0 || progresso > 100 || typeof descricao !== 'string' || !descricao.trim()) {
      return res.status(400).json({ erro: 'Informe descrição e progresso entre 0 e 100.' });
    }
    const obra = await buscarObraDoPrestador(id, req.usuario.id);
    if (!obra) return res.status(404).json({ erro: 'Obra não encontrada.' });
    if (['CANCELADA', 'CONCLUIDA'].includes(obra.status)) {
      return res.status(409).json({ erro: 'Não é possível atualizar uma obra encerrada.' });
    }

    // Salva o histórico e atualiza o progresso/status da obra na mesma transação,
    // evitando que apenas uma das duas alterações seja persistida.
    const atualizacao = await prisma.$transaction(async (tx) => {
      const criada = await tx.atualizacao.create({ data: { obraId: id, descricao: descricao.trim(), progresso } });
      await tx.obra.update({ where: { id }, data: { progresso, status: progresso === 100 ? 'CONCLUIDA' : 'EM_ANDAMENTO' } });
      return criada;
    });
    res.status(201).json(atualizacao);
  } catch (erro) { next(erro); }
});

// Permite que o prestador responsável atualize o orçamento da obra.
router.patch('/:id/orcamento', requireAuth, requireRole('PROFISSIONAL', 'EMPRESA'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const orcamento = Number(req.body?.orcamento);
    if (!Number.isSafeInteger(id) || id < 1 || !Number.isFinite(orcamento) || orcamento <= 0) {
      return res.status(400).json({ erro: 'Informe um orçamento válido.' });
    }

    const obra = await buscarObraDoPrestador(id, req.usuario.id);
    if (!obra) return res.status(404).json({ erro: 'Obra não encontrada.' });
    if (['CANCELADA', 'CONCLUIDA'].includes(obra.status)) {
      return res.status(409).json({ erro: 'Não é possível alterar o orçamento de uma obra encerrada.' });
    }

    const atualizada = await prisma.obra.update({ where: { id }, data: { orcamento }, include: incluir });
    res.json(formatarObra(atualizada));
  } catch (erro) { next(erro); }
});

// Permite que o prestador responsável adicione produtos à obra.
router.post('/:id/produtos', requireAuth, requireRole('PROFISSIONAL', 'EMPRESA'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { nome, quantidade, valorUnitario } = req.body ?? {};
    const valor = Number(valorUnitario);
    if (!Number.isSafeInteger(id) || id < 1 || typeof nome !== 'string' || !nome.trim() ||
      !Number.isSafeInteger(quantidade) || quantidade < 1 || !Number.isFinite(valor) || valor < 0) {
      return res.status(400).json({ erro: 'Informe nome, quantidade e valor unitário válidos.' });
    }

    const obra = await buscarObraDoPrestador(id, req.usuario.id);
    if (!obra) return res.status(404).json({ erro: 'Obra não encontrada.' });
    if (['CANCELADA', 'CONCLUIDA'].includes(obra.status)) {
      return res.status(409).json({ erro: 'Não é possível adicionar produtos a uma obra encerrada.' });
    }

    const produto = await prisma.produto.create({
      data: { obraId: id, nome: nome.trim(), quantidade, valorUnitario: valor }
    });
    res.status(201).json(produto);
  } catch (erro) { next(erro); }
});

// Somente a empresa responsável pode cancelar a obra.
router.post('/:id/cancelar', requireAuth, requireRole('EMPRESA'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ erro: 'ID inválido.' });

    const obra = await buscarObraDoPrestador(id, req.usuario.id);
    if (!obra) return res.status(404).json({ erro: 'Obra não encontrada.' });
    if (['CANCELADA', 'CONCLUIDA'].includes(obra.status)) {
      return res.status(409).json({ erro: 'A obra já está encerrada.' });
    }

    const cancelada = await prisma.obra.update({
      where: { id },
      data: { status: 'CANCELADA' },
      include: incluir
    });
    res.json(formatarObra(cancelada));
  } catch (erro) { next(erro); }
});

// Disponibiliza o roteador para montagem no servidor.
export default router;
