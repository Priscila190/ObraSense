import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { inicializarBanco, fecharBanco } from './db/database.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import obrasRoutes from './routes/obrasRoutes.js';
import solicitacoesRoutes from './routes/solicitacoesRoutes.js';
import propostasRoutes from './routes/propostasRoutes.js';
import agenteRoutes from './routes/agenteRoutes.js';
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
app.use(express.json());
app.get('/', (_req, res) => res.json({ mensagem: 'API ObraSense com Prisma + SQLite funcionando!' }));
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/obras', obrasRoutes);
app.use('/api/solicitacoes', solicitacoesRoutes);
app.use('/api/propostas', propostasRoutes);
app.use('/api/agente', agenteRoutes);
app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use((erro, _req, res, _next) => { console.error(erro); res.status(500).json({ erro: 'Erro interno do servidor.' }); });
try {
  await inicializarBanco();
  const server = app.listen(PORT, () => console.log(`Servidor em http://localhost:${PORT}`));
  process.on('SIGTERM', () => server.close(() => fecharBanco()));
} catch (erro) {
  console.error('Falha ao conectar SQLite. Execute npm run db:push na pasta backend.', erro);
  await fecharBanco();
  process.exitCode = 1;
}
