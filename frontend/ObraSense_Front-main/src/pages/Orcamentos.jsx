import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Dashboard.css';
import './Orcamentos.css';

const ORCAMENTOS_STORAGE_KEY = 'orcamentos';

function lerStorage(chave, valorInicial) {
  try {
    const valorSalvo = localStorage.getItem(chave);
    return valorSalvo ? JSON.parse(valorSalvo) : valorInicial;
  } catch (erro) {
    console.error(`Não foi possível carregar ${chave}.`, erro);
    return valorInicial;
  }
}

export default function Orcamentos() {
  const navigate = useNavigate();
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [obras] = useState(() => lerStorage('obras', []));
  const [orcamentos, setOrcamentos] = useState(() => lerStorage(ORCAMENTOS_STORAGE_KEY, []));
  const [formAberto, setFormAberto] = useState(false);
  const [novoOrcamento, setNovoOrcamento] = useState(() => ({
    obraId: '',
    descricao: '',
    valor: '',
    data: new Date().toISOString().slice(0, 10),
  }));

  useEffect(() => {
    try {
      localStorage.setItem(ORCAMENTOS_STORAGE_KEY, JSON.stringify(orcamentos));
    } catch (erro) {
      console.error('Não foi possível salvar os orçamentos no navegador.', erro);
    }
  }, [orcamentos]);

  function alterarCampo(evento) {
    const { name, value } = evento.target;
    setNovoOrcamento((anterior) => ({ ...anterior, [name]: value }));
  }

  function cadastrarOrcamento(evento) {
    evento.preventDefault();
    const obra = obras.find((item) => String(item.id) === novoOrcamento.obraId);
    const orcamento = {
      ...novoOrcamento,
      id: Date.now(),
      obraNome: obra?.nome || 'Obra não especificada',
      valor: Number(novoOrcamento.valor),
    };

    setOrcamentos((anteriores) => [orcamento, ...anteriores]);
    setNovoOrcamento({
      obraId: '',
      descricao: '',
      valor: '',
      data: new Date().toISOString().slice(0, 10),
    });
    setFormAberto(false);
  }

  return (
    <div className={`dashboard-container ${sidebarAberta ? '' : 'sidebar-fechada'}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="ObraSense" className="sidebar-logo" />
          {sidebarAberta && <h2>ObraSense</h2>}
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" title="Visão Geral">
            <span className="material-symbols-outlined">dashboard</span>
            {sidebarAberta && <span>Visão Geral</span>}
          </Link>
          <Link to="/obras" title="Minhas Obras">
            <span className="material-symbols-outlined">construction</span>
            {sidebarAberta && <span>Minhas Obras</span>}
          </Link>
          <Link to="/orcamentos" className="active" title="Orçamentos">
            <span className="material-symbols-outlined">payments</span>
            {sidebarAberta && <span>Orçamentos</span>}
          </Link>
          <Link to="/cronogramas" title="Cronogramas">
            <span className="material-symbols-outlined">calendar_month</span>
            {sidebarAberta && <span>Cronogramas</span>}
          </Link>
          <Link to="/agente" title="Agente IA">
            <span className="material-symbols-outlined">smart_toy</span>
            {sidebarAberta && <span>Agente IA</span>}
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => navigate('/')} className="btn-sair" title="Sair">
            <span className="material-symbols-outlined">logout</span>
            {sidebarAberta && <span>Sair da Plataforma</span>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="btn-toggle-sidebar"
              onClick={() => setSidebarAberta(!sidebarAberta)}
              title={sidebarAberta ? 'Recolher Menu' : 'Expandir Menu'}
            >
              <span className="material-symbols-outlined">
                {sidebarAberta ? 'menu_open' : 'menu'}
              </span>
            </button>
            <div className="topbar-search">
              <span className="material-symbols-outlined">search</span>
              <input type="text" placeholder="Procurar projetos, relatórios..." />
            </div>
          </div>
          <div className="topbar-user">
            <span className="ia-status">🟢 Agente Ativo</span>
            <div className="user-avatar" title="Iago Soares">IS</div>
          </div>
        </header>

        <div className="dashboard-data">
          <div className="header-data orcamentos-header">
            <div>
              <h1>Orçamentos</h1>
              <p>Acompanhe os orçamentos das suas obras.</p>
            </div>
            <button type="button" className="orcamento-adicionar" onClick={() => setFormAberto(!formAberto)}>
              <span className="material-symbols-outlined">add</span>
              Adicionar orçamento
            </button>
          </div>

          {formAberto && (
            <form className="orcamento-form" onSubmit={cadastrarOrcamento}>
              <h2>Novo orçamento</h2>
              <label htmlFor="orcamento-descricao">Descrição</label>
              <input
                id="orcamento-descricao"
                name="descricao"
                value={novoOrcamento.descricao}
                onChange={alterarCampo}
                placeholder="Ex.: Materiais da fundação"
                required
                minLength={2}
              />
              <label htmlFor="orcamento-obra">Obra</label>
              <select
                id="orcamento-obra"
                name="obraId"
                value={novoOrcamento.obraId}
                onChange={alterarCampo}
                required={obras.length > 0}
                disabled={obras.length === 0}
              >
                <option value="">
                  {obras.length === 0 ? 'Nenhuma obra cadastrada' : 'Selecione uma obra'}
                </option>
                {obras.map((obra) => (
                  <option key={obra.id} value={obra.id}>{obra.nome}</option>
                ))}
              </select>
              <label htmlFor="orcamento-valor">Valor (R$)</label>
              <input
                id="orcamento-valor"
                name="valor"
                type="number"
                min="0.01"
                step="0.01"
                value={novoOrcamento.valor}
                onChange={alterarCampo}
                required
              />
              <label htmlFor="orcamento-data">Data</label>
              <input
                id="orcamento-data"
                name="data"
                type="date"
                value={novoOrcamento.data}
                onChange={alterarCampo}
                required
              />
              {obras.length === 0 && (
                <p className="orcamento-aviso">Cadastre uma obra antes de vinculá-la ao orçamento.</p>
              )}
              <div className="orcamento-acoes">
                <button type="button" className="orcamento-cancelar" onClick={() => setFormAberto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="orcamento-adicionar" disabled={obras.length === 0}>
                  Salvar orçamento
                </button>
              </div>
            </form>
          )}

          {orcamentos.length === 0 ? (
            <section className="orcamentos-vazio">
              <span className="material-symbols-outlined" aria-hidden="true">request_quote</span>
              <h2>Nenhum orçamento cadastrado</h2>
              <p>Use “Adicionar orçamento” para registrar um orçamento para uma obra.</p>
            </section>
          ) : (
            <div className="orcamentos-lista">
              {orcamentos.map((orcamento) => (
                <article className="orcamento-card" key={orcamento.id}>
                  <div>
                    <h2>{orcamento.descricao}</h2>
                    <p>{orcamento.obraNome}</p>
                  </div>
                  <strong>
                    {Number(orcamento.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                  <time dateTime={orcamento.data}>
                    {new Date(`${orcamento.data}T12:00:00`).toLocaleDateString('pt-BR')}
                  </time>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
