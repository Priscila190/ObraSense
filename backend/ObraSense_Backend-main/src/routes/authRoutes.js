// Rotas públicas e autenticadas para cadastro, login e gerenciamento de sessão.
import { Router } from 'express';
import { prisma } from '../db/database.js';
import { criarHashSenha, conferirSenha } from '../auth/passwords.js';
import { criarSessao, encerrarSessao, requireAuth } from '../middleware/auth.js';

// Cria o roteador de autenticação e seleciona os campos de usuário que podem
// ser retornados publicamente, sem incluir dados internos como o hash da senha.
const router = Router();
const publico = { id: true, nome: true, email: true, tipo: true };

// Cadastra uma conta após validar os dados e armazenar a senha em formato seguro.
router.post('/cadastro', async (req, res, next) => {

  try {
    const { nome, email, senha, tipo = 'CLIENTE', nomeExibicao, cidade = '', telefone = '' } = req.body ?? {};

    // Rejeita dados incompletos, e-mail inválido, senha curta ou tipo de conta não permitido.
    if (typeof nome !== 'string' || nome.trim().length < 2 || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof senha !== 'string' || senha.length < 8 || !['CLIENTE', 'PROFISSIONAL', 'EMPRESA'].includes(tipo)) {
      return res.status(400).json({ erro: 'Informe nome, e-mail válido, senha de 8 caracteres e tipo de conta.' });
    }

    // Gera salt e hash; prestadores também recebem o perfil relacionado no cadastro.
    const { hash, salt } = await criarHashSenha(senha);
    const usuario = await prisma.usuario.create({
      data: { nome: nome.trim(), email: email.trim().toLowerCase(), senhaHash: hash, senhaSalt: salt, tipo,
        ...(tipo !== 'CLIENTE' ? { prestador: { create: { tipo: tipo === 'EMPRESA' ? 'EMPRESA' : 'AUTONOMO', nomeExibicao: (nomeExibicao || nome).trim(), cidade, telefone } } } : {}) },
      select: publico

    });

    // Informa conflito quando o e-mail já está cadastrado; outros erros seguem ao Express.
    res.status(201).json({ usuario });
  } catch (erro) {
    if (erro.code === 'P2002') return res.status(409).json({ erro: 'Este e-mail já existe.' });
    next(erro);
  }

});

// Valida as credenciais e cria uma sessão para o usuário.
router.post('/login', async (req, res, next) => {

  try {
    const { email, senha } = req.body ?? {};
    if (typeof email !== 'string' || typeof senha !== 'string') return res.status(400).json({ erro: 'Informe e-mail e senha.' });

    // Normaliza o e-mail e compara a senha com o hash armazenado.
    const usuario = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!usuario || !(await conferirSenha(senha, usuario.senhaSalt, usuario.senhaHash))) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

    // Retorna o token de sessão e apenas os dados públicos do usuário.
    const token = criarSessao(usuario);
    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, tipo: usuario.tipo } });
  } catch (erro) { next(erro); }

});

// Devolve os dados do usuário associados ao token autenticado.
router.get('/me', requireAuth, (req, res) => res.json({ usuario: req.usuario }));

// Invalida o token atual para encerrar a sessão autenticada.
router.post('/logout', requireAuth, (req, res) => { encerrarSessao(req.get('Authorization').slice(7)); res.json({ mensagem: 'Sessão encerrada.' }); });


// Disponibiliza o roteador para montagem no servidor.
export default router;
