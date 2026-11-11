import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importado o Link aqui
import AgentShortcut from '../components/AgentShortcut';
import { carregarObrasSalvas } from '../data/obras';
import './Dashboard.css';

const STATUS_OBRAS = [
  { nome: 'Em andamento', classe: 'andamento', cor: '#2563eb' },
  { nome: 'Iniciando', classe: 'iniciando', cor: '#f59e0b' },
  { nome: 'Atrasada', classe: 'atrasada', cor: '#ef4444' },
  { nome: 'Concluída', classe: 'concluida', cor: '#10b981' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  // Estado para controlar se a sidebar está aberta ou recolhida
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [obras] = useState(carregarObrasSalvas);
  const [statusSelecionado, setStatusSelecionado] = useState(null);
  const totalObras = obras.length;
  const contagemPorStatus = STATUS_OBRAS.map((status) => ({
    ...status,
    quantidade: obras.filter((obra) => obra.status === status.nome).length,
  }));
  let percentualAcumulado = 0;
  const faixasGrafico = contagemPorStatus.map((status) => {
    const inicio = totalObras ? (percentualAcumulado / totalObras) * 100 : 0;
    percentualAcumulado += status.quantidade;
    const fim = totalObras ? (percentualAcumulado / totalObras) * 100 : 0;
    return `${status.cor} ${inicio}% ${fim}%`;
  });
  const obrasFiltradas = statusSelecionado
    ? obras.filter((obra) => obra.status === statusSelecionado)
    : obras;

  function selecionarStatus(status) {
    setStatusSelecionado((atual) => atual === status ? null : status);
  }

  return (
    <div className={`dashboard-container ${sidebarAberta ? '' : 'sidebar-fechada'}`}>
      
      {/* 1. BARRA LATERAL (SIDEBAR) */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="ObraSense" className="sidebar-logo" />
          {sidebarAberta && <h2>ObraSense</h2>}
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="active" title="Visão Geral">
            <span className="material-symbols-outlined">dashboard</span>
            {sidebarAberta && <span>Visão Geral</span>}
          </Link>

          <Link to="/obras" title="Minhas Obras">
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

      {/* 2. ÁREA PRINCIPAL À DIREITA */}
      <main className="main-content">
        
        {/* TOPBAR COM BOTÃO DE TOGGLE DA SIDEBAR */}
        <header className="topbar">
          <div className="topbar-left">
            {/* BOTÃO PARA ABRIR / FECHAR A SIDEBAR */}
            <button 
              className="btn-toggle-sidebar" 
              onClick={() => setSidebarAberta(!sidebarAberta)}
              title={sidebarAberta ? "Recolher Menu" : "Expandir Menu"}
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
            {/* BACKEND: Status do agente de IA (Ex: data.agenteStatus = 'Ativo' | 'Inativo') */}
            <span className="ia-status">🟢 Agente Ativo</span>

            {/* BACKEND: Iniciais / Foto do Usuário Logado (Ex: user.initials / user.avatarUrl) */}
            <div className="user-avatar" title="Iago Soares">IS</div>
          </div>
        </header>

        {/* 3. VISÃO GERAL DAS OBRAS */}
        <div className="dashboard-data">
          
          <div className="header-data">
            <h1>Visão Geral das Obras</h1>
            <p>Resumo atualizado com as obras cadastradas na plataforma.</p>
          </div>

          <div className="scorecards-grid">
            <button
              type="button"
              className={`scorecard scorecard-total ${statusSelecionado === null ? 'selected' : ''}`}
              onClick={() => setStatusSelecionado(null)}
              aria-pressed={statusSelecionado === null}
            >
              <span className="scorecard-icon material-symbols-outlined">domain</span>
              <span className="scorecard-title">Todas as obras</span>
              <span className="score-value">{totalObras}</span>
              <span className="score-trend neutral">Cadastradas</span>
            </button>
            {contagemPorStatus.map((status) => (
              <button
                type="button"
                key={status.nome}
                className={`scorecard status-${status.classe} ${statusSelecionado === status.nome ? 'selected' : ''}`}
                onClick={() => selecionarStatus(status.nome)}
                aria-pressed={statusSelecionado === status.nome}
              >
                <span className="scorecard-icon material-symbols-outlined">
                  {status.classe === 'andamento'
                    ? 'engineering'
                    : status.classe === 'iniciando'
                      ? 'foundation'
                      : status.classe === 'concluida'
                        ? 'task_alt'
                        : 'warning'}
                </span>
                <span className="scorecard-title">{status.nome}</span>
                <span className="score-value">{status.quantidade}</span>
                <span className={`score-trend ${status.classe === 'atrasada' ? 'negative' : 'neutral'}`}>
                  {totalObras ? `${Math.round((status.quantidade / totalObras) * 100)}% das obras` : 'Sem obras cadastradas'}
                </span>
              </button>
            ))}
          </div>

          <section className="charts-area" aria-labelledby="status-obras-titulo">
            <div className="chart-header">
              <div>
                <h2 id="status-obras-titulo">Status das obras</h2>
                <p>Distribuição atual por etapa. Selecione um status para filtrar.</p>
              </div>
              <Link to="/obras" className="chart-link">
                Gerenciar obras
                <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
              </Link>
            </div>

            <div className="chart-content">
              <div
                className={`chart-donut ${totalObras ? '' : 'empty'}`}
                style={totalObras ? { background: `conic-gradient(${faixasGrafico.join(', ')})` } : undefined}
                role="img"
                aria-label={`Distribuição de ${totalObras} obras por status`}
              >
                <div className="chart-donut-center">
                  <strong>{totalObras}</strong>
                  <span>{totalObras === 1 ? 'obra' : 'obras'}</span>
                </div>
              </div>

              <div className="chart-details">
                <div className="chart-legend">
                  {contagemPorStatus.map((status) => (
                    <button
                      type="button"
                      key={status.nome}
                      className={`chart-legend-item ${statusSelecionado === status.nome ? 'selected' : ''}`}
                      onClick={() => selecionarStatus(status.nome)}
                      aria-pressed={statusSelecionado === status.nome}
                    >
                      <span className={`chart-legend-dot ${status.classe}`} />
                      <span className="chart-legend-name">{status.nome}</span>
                      <strong>{status.quantidade}</strong>
                    </button>
                  ))}
                </div>

                <div className="chart-obras">
                  <div className="chart-obras-header">
                    <h3>{statusSelecionado || 'Todas as obras'}</h3>
                    <span>{obrasFiltradas.length} {obrasFiltradas.length === 1 ? 'obra' : 'obras'}</span>
                  </div>
                  {obrasFiltradas.length ? (
                    <ul>
                      {obrasFiltradas.slice(0, 4).map((obra) => (
                        <li key={obra.id}>
                          <span className="chart-obra-nome">{obra.nome}</span>
                          <span className="chart-obra-progresso">{Number(obra.progresso) || 0}%</span>
                        </li>
                      ))}
                      {obrasFiltradas.length > 4 && (
                        <li className="chart-mais-obras">+ {obrasFiltradas.length - 4} outras obras</li>
                      )}
                    </ul>
                  ) : (
                    <p className="chart-empty-message">
                      {totalObras ? 'Nenhuma obra neste status.' : 'Cadastre sua primeira obra para ver a distribuição.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
      <AgentShortcut />
    </div>
  );
}