// Funções compartilhadas para criar sessões e proteger rotas por autenticação/perfil.
import { randomBytes } from 'node:crypto';
import { prisma } from '../db/database.js';

// Mantém as sessões em memória do processo: token -> usuário e horário de expiração.
const sessoes = new Map();
// Define a duração de cada sessão em oito horas.
const DURACAO = 8 * 60 * 60 * 1000;

// Cria um token imprevisível e registra sua validade para o usuário.
export function criarSessao(usuario) {
  const token = randomBytes(32).toString('hex');
  sessoes.set(token, { id: usuario.id, expiraEm: Date.now() + DURACAO });
  return token;
}

// Remove o token do mapa para invalidar a sessão.
export function encerrarSessao(token) { sessoes.delete(token); }

// Middleware que valida o token, verifica sua validade e carrega o usuário na requisição.
export async function requireAuth(req, res, next) {
  try {
    const token = (req.get('Authorization') || '').replace(/^Bearer /, '');
    const sessao = sessoes.get(token);
    if (!sessao || sessao.expiraEm < Date.now()) {
      // Remove também sessões ausentes ou expiradas antes de negar o acesso.
      sessoes.delete(token);
      return res.status(401).json({ erro: 'Faça login para continuar.' });
    }

    // Busca apenas os dados necessários e os disponibiliza nos handlers seguintes.
    const usuario = await prisma.usuario.findUnique({ where: { id: sessao.id }, select: { id: true, nome: true, email: true, tipo: true } });
    if (!usuario) return res.status(401).json({ erro: 'Usuário não encontrado.' });
    req.usuario = usuario;
    next();
  } catch (erro) { next(erro); }
}

// Cria um middleware que permite acesso somente aos tipos de usuário informados.
export function requireRole(...tipos) {
  return (req, res, next) => tipos.includes(req.usuario.tipo) ? next() : res.status(403).json({ erro: 'Acesso não permitido.' });
}
