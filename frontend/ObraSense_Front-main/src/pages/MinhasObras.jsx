import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AgentShortcut from '../components/AgentShortcut';
import { carregarObrasSalvas, salvarObras } from '../data/obras';
import './Dashboard.css'; // Reutiliza a base do layout
import './MinhasObras.css'; // Estilos da tabela

function dataHoje() {
  const hoje = new Date();
  const ajusteFuso = hoje.getTimezoneOffset() * 60000;
  return new Date(hoje.getTime() - ajusteFuso).toISOString().slice(0, 10);
}

function novoFormularioObra() {
  return {
    nome: '',
    responsavel: '',
    cidade: '',
    status: 'Iniciando',
    progresso: 0,
    orcamento: '',
    dataInicio: dataHoje(),
    dataPrevista: '',
  };
}

export default function MinhasObras() {
  const navigate = useNavigate();
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [obras, setObras] = useState(carregarObrasSalvas);
  const [erroArmazenamento, setErroArmazenamento] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [obraEmEdicao, setObraEmEdicao] = useState(null);
  const [novaObra, setNovaObra] = useState(novoFormularioObra);

  function persistirObras(obrasAtualizadas) {
    try {
      salvarObras(obrasAtualizadas);
      setObras(obrasAtualizadas);
      setErroArmazenamento('');
      return true;
    } catch (erro) {
      console.error('Não foi possível salvar as obras no navegador.', erro);
      setErroArmazenamento('Não foi possível salvar as alterações no navegador. Libere espaço e tente novamente.');
      return false;
    }
  }

  function alterarCampo(evento) {
    const { name, value } = evento.target;
    setNovaObra((anterior) => ({ ...anterior, [name]: value }));
  }

  function abrirEdicao(obra) {
    setObraEmEdicao(obra.id);
    setNovaObra({
      nome: obra.nome,
      responsavel: obra.responsavel,
      cidade: obra.cidade || '',
      status: obra.status,
      progresso: obra.progresso,
      orcamento: obra.orcamento,
      dataInicio: obra.dataInicio || '',
      dataPrevista: obra.dataPrevista,
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setObraEmEdicao(null);
    setNovaObra(novoFormularioObra());
  }

  function salvarObra(evento) {
    evento.preventDefault();

    const camposObra = {
      ...novaObra,
      progresso: Number(novaObra.progresso),
      orcamento: Number(novaObra.orcamento) || 0,
    };

    if (novaObra.dataInicio && novaObra.dataPrevista && novaObra.dataPrevista < novaObra.dataInicio) {
      return;
    }

    if (obraEmEdicao !== null) {
      const obrasAtualizadas = obras.map((obra) => (
        obra.id === obraEmEdicao
          ? {
            ...obra,
            ...camposObra,
            progresso: novaObra.status === 'Concluída' ? 100 : camposObra.progresso,
            dataConclusao: novaObra.status === 'Concluída'
              ? obra.dataConclusao || dataHoje()
              : '',
            alerta: novaObra.status === 'Atrasada',
          }
          : obra
      ));
      if (persistirObras(obrasAtualizadas)) fecharModal();
      return;
    }

    const obraCriada = {
      ...novaObra,
      id: Date.now(),
      progresso: novaObra.status === 'Concluída' ? 100 : Number(novaObra.progresso),
      orcamento: Number(novaObra.orcamento) || 0,
      dataConclusao: novaObra.status === 'Concluída' ? dataHoje() : '',
      materiais: [],
      fotos: [],
      alerta: novaObra.status === 'Atrasada',
    };

    if (persistirObras([obraCriada, ...obras])) fecharModal();
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

          {erroArmazenamento && <p className="obras-erro" role="alert">{erroArmazenamento}</p>}

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
                      <button
                        className="btn-acessar-obra"
                        type="button"
                        onClick={() => navigate(`/obras/${obra.id}`)}
                      >
                        Acessar
                      </button>
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
      <AgentShortcut />
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

              <label htmlFor="obra-cidade">Cidade da obra (para previsão do tempo)</label>
              <input
                id="obra-cidade"
                name="cidade"
                value={novaObra.cidade}
                onChange={alterarCampo}
                placeholder="Ex.: São Paulo"
                maxLength={100}
              />

              <label htmlFor="obra-status">Status inicial</label>
              <select id="obra-status" name="status" value={novaObra.status} onChange={alterarCampo}>
                <option>Iniciando</option>
                <option>Em andamento</option>
                <option>Atrasada</option>
                <option>Concluída</option>
              </select>

              <label htmlFor="obra-orcamento">Orçamento (R$)</label>
              <input
                id="obra-orcamento"
                name="orcamento"
                type="number"
                min="0"
                step="0.01"
                value={novaObra.orcamento}
                onChange={alterarCampo}
                placeholder="Ex.: 150000"
                required
              />

              <label htmlFor="obra-data-inicio">Data de início</label>
              <input
                id="obra-data-inicio"
                name="dataInicio"
                type="date"
                value={novaObra.dataInicio}
                onChange={alterarCampo}
                required={obraEmEdicao === null}
              />

              <label htmlFor="obra-data-prevista">Previsão de conclusão</label>
              <input
                id="obra-data-prevista"
                name="dataPrevista"
                type="date"
                min={novaObra.dataInicio || undefined}
                value={novaObra.dataPrevista}
                onChange={alterarCampo}
                required
              />

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
                disabled={novaObra.status === 'Concluída'}
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