// Utilitários para armazenar e conferir senhas sem guardar o texto original.
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

// Adapta a função de callback do Node para uso com async/await.
const scrypt = promisify(scryptCallback);

// Gera um salt aleatório e deriva um hash criptográfico a partir da senha.
export async function criarHashSenha(senha) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(senha, salt, 64)).toString('hex');
  return { salt, hash };
}

// Calcula novamente o hash informado e compara os bytes sem comparação insegura
// dependente do tempo de execução.
export async function conferirSenha(senha, salt, hash) {
  const calculado = await scrypt(senha, salt, 64);
  const original = Buffer.from(hash, 'hex');
  return original.length === calculado.length && timingSafeEqual(calculado, original);
}
