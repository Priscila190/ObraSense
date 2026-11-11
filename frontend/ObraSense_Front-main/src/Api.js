const API_URL = 'http://localhost:3000';

export async function api(rota, opcoes = {}) {
  const token = localStorage.getItem('token');

  const resposta = await fetch(`${API_URL}${rota}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes.headers,
    },
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || 'Erro na comunicação com a API');
  }

  return dados;
}
