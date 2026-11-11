import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Dashboard.css'; // Reutiliza a base do layout
import './MinhasObras.css'; // Estilos da tabela

const OBRAS_STORAGE_KEY = 'obras';

const obrasIniciais = [
  { id: 1, nome: 'Residencial Alpha', responsavel: 'Eng. Carlos', status: 'Em andamento', progresso: 65, alerta: false },
  { id: 2, nome: 'Edifício Corporate', responsavel: 'Eng. Mariana', status: 'Atrasada', progresso: 32, alerta: true },
  { id: 3, nome: 'Ponte Sul', responsavel: 'Eng. Roberto', status: 'Iniciando', progresso: 10, alerta: false },
  { id: 4, nome: 'Hospital Central', responsavel: 'Eng. Mariana', status: 'Em andamento', progresso: 88, alerta: false },
];

export default function MinhasObras() {
  const navigate = useNavigate();
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [obras, setObras] = useState(() => {
    try {
      const obrasSalvas = localStorage.getItem(OBRAS_STORAGE_KEY);
      return obrasSalvas ? JSON.parse(obrasSalvas) : obrasIniciais;
    } catch (erro) {
      console.error('Não foi possível carregar as obras salvas.', erro);
      return obrasIniciais;
    }
  });
  const [modalAberto, setModalAberto] = useState(false);
  const [obraEmEdicao, setObraEmEdicao] = useState(null);
  const [novaObra, setNovaObra] = useState({ nome: '', responsavel: '', status: 'Iniciando', progresso: 0 });

  useEffect(() => {
    try {
      localStorage.setItem(OBRAS_STORAGE_KEY, JSON.stringify(obras));
    } catch (erro) {
      console.error('Não foi possível salvar as obras no navegador.', erro);
    }
  }, [obras]);

  function alterarCampo(evento) {
    const { name, value } = evento.target;
    setNovaObra((anterior) => ({ ...anterior, [name]: value }));
  }

  function abrirEdicao(obra) {
    setObraEmEdicao(obra.id);
    setNovaObra({
      nome: obra.nome,
      responsavel: obra.responsavel,
      status: obra.status,
      progresso: obra.progresso,
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setObraEmEdicao(null);
    setNovaObra({ nome: '', responsavel: '', status: 'Iniciando', progresso: 0 });
  }

  function salvarObra(evento) {
    evento.preventDefault();

    if (obraEmEdicao !== null) {
      setObras((anteriores) => anteriores.map((obra) => (
        obra.id === obraEmEdicao
          ? { ...obra, ...novaObra, progresso: Number(novaObra.progresso) }
          : obra
      )));
      fecharModal();
      return;
    }

    const obraCriada = {
      ...novaObra,
      id: Date.now(),
      progresso: Number(novaObra.progresso),
      alerta: false,
    };

    setObras((anteriores) => [obraCriada, ...anteriores]);
    fecharModal();
  }

  return (
    <div className={`dashboard-container ${sidebarAberta ? '' : 'sidebar-fechada'}`}>
      
      {/* 1. BARRA LATERAL */}
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
          <Link to="/obras" className="active" title="Minhas Obras">
            <span className="material-symbols-outlined">construction</span>
            {sidebarAberta && <span>Minhas Obras</span>}
          </Link>
          <Link to="/orcamentos" title="Orçamentos">
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

      {/* 2. ÁREA PRINCIPAL */}
      <main className="main-content">
        
        {/* TOPBAR */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn-toggle-sidebar" onClick={() => setSidebarAberta(!sidebarAberta)}>
              <span className="material-symbols-outlined">{sidebarAberta ? 'menu_open' : 'menu'}</span>
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

        {/* 3. CONTEÚDO: LISTA DE OBRAS */}
        <div className="dashboard-data">
          
          <div className="header-data" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>Gestão de Obras</h1>
              <p>Controle de todos os canteiros ativos no sistema.</p>
            </div>
            <button className="btn-nova-obra" onClick={() => setModalAberto(true)}>
              <span className="material-symbols-outlined">add</span>
              Nova Obra
            </button>
          </div>

          {/* TABELA DE DADOS */}
          <div className="table-container">
            <table className="obras-table">
              <thead>
                <tr>
                  <th>Nome do Projeto</th>
                  <th>Responsável</th>
                  <th>Status</th>
                  <th>Progresso</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {obras.map((obra) => (
                  <tr key={obra.id} className={obra.alerta ? 'linha-alerta' : ''}>
                    <td className="obra-nome">
                      {obra.alerta && <span className="material-symbols-outlined icone-alerta">warning</span>}
                      {obra.nome}
                    </td>
                    <td>{obra.responsavel}</td>
                    <td>
                      <span className={`status-badge ${obra.status.toLowerCase().replace(' ', '-')}`}>
                        {obra.status}
                      </span>
                    </td>
                    <td>
                      <div className="progresso-container">
                        <div className="progresso-barra" style={{ width: `${obra.progresso}%` }}></div>
                        <span className="progresso-texto">{obra.progresso}%</span>
                      </div>
                    </td>
                    <td>
                      <button className="btn-acao" type="button" title={`Editar ${obra.nome}`} onClick={() => abrirEdicao(obra)}>
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </main>

      {modalAberto && (
        <div className="nova-obra-overlay">
          <section className="nova-obra-modal" role="dialog" aria-modal="true" aria-labelledby="nova-obra-titulo">
            <div className="nova-obra-modal-header">
              <h2 id="nova-obra-titulo">{obraEmEdicao !== null ? 'Editar obra' : 'Criar nova obra'}</h2>
              <button
                type="button"
                className="nova-obra-fechar"
                onClick={fecharModal}
                aria-label="Fechar formulário"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form className="nova-obra-form" onSubmit={salvarObra}>
              <label htmlFor="obra-nome">Nome do projeto</label>
              <input
                id="obra-nome"
                name="nome"
                value={novaObra.nome}
                onChange={alterarCampo}
                placeholder="Ex.: Residencial Jardim"
                required
                minLength={2}
                autoFocus
              />

              <label htmlFor="obra-responsavel">Responsável</label>
              <input
                id="obra-responsavel"
                name="responsavel"
                value={novaObra.responsavel}
                onChange={alterarCampo}
                placeholder="Nome do responsável"
                required
                minLength={2}
              />

              <label htmlFor="obra-status">Status inicial</label>
              <select id="obra-status" name="status" value={novaObra.status} onChange={alterarCampo}>
                <option>Iniciando</option>
                <option>Em andamento</option>
                <option>Atrasada</option>
              </select>

              <label htmlFor="obra-progresso">Progresso (%)</label>
              <input
                id="obra-progresso"
                name="progresso"
                type="number"
                min="0"
                max="100"
                value={novaObra.progresso}
                onChange={alterarCampo}
                required
              />

              <div className="nova-obra-acoes">
                <button type="button" className="nova-obra-cancelar" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="submit" className="nova-obra-salvar">
                  {obraEmEdicao !== null ? 'Salvar alterações' : 'Criar obra'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}