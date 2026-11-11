
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../Api';
import './Cadastro.css';

export default function Cadastro() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: 'CLIENTE',
    nomeExibicao: '',
    cidade: '',
    telefone: ''
  });

  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  function alterarCampo(evento) {
    const { name, value } = evento.target;

    setForm((anterior) => ({
      ...anterior,
      [name]: value
    }));
  }

  async function cadastrar(evento) {
    evento.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const dados = {
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        tipo: form.tipo
      };

      if (form.tipo !== 'CLIENTE') {
        dados.nomeExibicao = form.nomeExibicao || form.nome;
        dados.cidade = form.cidade;
        dados.telefone = form.telefone;
      }

      await api('/api/auth/cadastro', {
        method: 'POST',
        body: JSON.stringify(dados)
      });

      alert('Cadastro realizado com sucesso!');
      navigate('/login');

    } catch (erro) {
      setErro(erro.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="cadastro-page">
      <div className="cadastro-container">
        <img className="cadastro-logo" src="/logo.png" alt="Logo do ObraSense" />
        <h1>Crie sua conta</h1>
        <p>Faça parte do ObraSense</p>

        <form onSubmit={cadastrar}>
          <label>Tipo de conta</label>
          <select
            name="tipo"
            value={form.tipo}
            onChange={alterarCampo}
          >
            <option value="CLIENTE">Cliente</option>
            <option value="PROFISSIONAL">Prestador de serviço (profissional autônomo)</option>
            <option value="EMPRESA">Empresa</option>
          </select>

          <label>Nome completo ou responsável</label>
          <input
            type="text"
            name="nome"
            placeholder="Digite seu nome"
            value={form.nome}
            onChange={alterarCampo}
            required
            minLength={2}
          />

          <label>E-mail</label>
          <input
            type="email"
            name="email"
            placeholder="Digite seu e-mail"
            value={form.email}
            onChange={alterarCampo}
            required
          />

          <label>Senha</label>
          <input
            type="password"
            name="senha"
            placeholder="Mínimo de 8 caracteres"
            value={form.senha}
            onChange={alterarCampo}
            required
            minLength={8}
          />

          {form.tipo !== 'CLIENTE' && (
            <>
              <label>Nome profissional ou da empresa</label>
              <input
                type="text"
                name="nomeExibicao"
                placeholder="Nome que aparecerá na plataforma"
                value={form.nomeExibicao}
                onChange={alterarCampo}
              />

              <label>Cidade</label>
              <input
                type="text"
                name="cidade"
                placeholder="Sua cidade"
                value={form.cidade}
                onChange={alterarCampo}
              />

              <label>Telefone</label>
              <input
                type="tel"
                name="telefone"
                placeholder="(11) 99999-9999"
                value={form.telefone}
                onChange={alterarCampo}
              />
            </>
          )}

          {erro && <p className="cadastro-erro">{erro}</p>}

          <button type="submit" disabled={carregando}>
            {carregando ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>

        <p className="cadastro-login">
          Já tem uma conta? <Link to="/login">Entrar</Link>
        </p>

        <Link to="/" className="cadastro-voltar">
          Voltar para o início
        </Link>
      </div>
    </main>
  );
}
