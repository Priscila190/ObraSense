
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../Api';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar(evento) {
    evento.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const dados = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          senha
        })
      });

      // Salva o token e os dados do usuário.
      localStorage.setItem('token', dados.token);
      localStorage.setItem('usuario', JSON.stringify(dados.usuario));

      // Direciona para o dashboard.
      navigate('/dashboard');

    } catch (erro) {
      setErro(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-container">
        <img className="login-logo" src="/logo.png" alt="Logo do ObraSense" />
        <h1>Bem-vindo ao ObraSense</h1>
        <p>Entre na sua conta para continuar</p>

        <form onSubmit={entrar}>

          <label>E-mail</label>
          <input
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Senha</label>
          <input
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          {erro && (
            <p className="login-erro">{erro}</p>
          )}

          <button type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

        </form>

        <p className="login-cadastro">
          Ainda não tem uma conta?{' '}
          <Link to="/cadastro">Cadastre-se</Link>
        </p>

        <Link to="/" className="login-voltar">
          Voltar para o início
        </Link>

      </div>
    </main>
  );
}
