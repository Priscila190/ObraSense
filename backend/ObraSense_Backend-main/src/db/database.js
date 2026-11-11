// Configuração e ciclo de vida da conexão com o banco de dados.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Instância compartilhada do cliente Prisma usada pelas rotas e serviços.
export const prisma = new PrismaClient();

// Abre a conexão com o banco quando o servidor inicia.
export async function inicializarBanco() {
  await prisma.$connect();
  console.log('Prisma conectado ao banco SQLite.');
}

// Fecha a conexão de forma limpa quando o servidor é encerrado.
export async function fecharBanco() {
  await prisma.$disconnect();
}
