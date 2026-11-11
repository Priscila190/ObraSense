import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importado o Link aqui
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  // Estado para controlar se a sidebar está aberta ou recolhida
  const [sidebarAberta, setSidebarAberta] = useState(true);

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

        {/* 3. CONTEÚDO E DADOS DORMINTES PARA O BACKEND */}
        <div className="dashboard-data">
          
          <div className="header-data">
            <h1>Visão Geral do Estaleiro</h1>
            <p>Resumo atualizado em tempo real pelo Agente de IA.</p>
          </div>

          {/* GRID DE CARTÕES DE MÉTRICAS */}
          <div className="scorecards-grid">
            
            {/* CARD 1: OBRAS ATIVAS */}
            <div className="scorecard">
              <h3>Obras Ativas</h3>
              {/* BACKEND: Injetar total de obras ativas (Ex: response.data.obrasAtivas) */}
              <p className="score-value">12</p>
              {/* BACKEND: Tendência / Comparativo mensal (Ex: response.data.obrasTrend) */}
              <span className="score-trend positive">↑ 2 novos projetos</span>
            </div>

            {/* CARD 2: ORÇAMENTO CONSUMIDO */}
            <div className="scorecard">
              <h3>Orçamento Consumido</h3>
              {/* BACKEND: Porcentagem de orçamento gasto (Ex: response.data.orcamentoConsumido) */}
              <p className="score-value">45%</p>
              {/* BACKEND: Status do orçamento (Ex: response.data.orcamentoStatus) */}
              <span className="score-trend neutral">Dentro do previsto</span>
            </div>

            {/* CARD 3: ALERTAS DA IA */}
            <div className="scorecard alert-card">
              <h3>Alertas da IA</h3>
              {/* BACKEND: Quantidade de alertas não resolvidos (Ex: response.data.alertasCount) */}
              <p className="score-value">3</p>
              {/* BACKEND: Descrição do alerta mais crítico (Ex: response.data.ultimoAlertaMsg) */}
              <span className="score-trend negative">⚠️ Atraso na fundação</span>
            </div>

            {/* CARD 4: EQUIPE EM CAMPO */}
            <div className="scorecard">
              <h3>Equipe em Campo</h3>
              {/* BACKEND: Total de operários/engenheiros com check-in hoje (Ex: response.data.equipePresente) */}
              <p className="score-value">148</p>
              {/* BACKEND: Status de presença (Ex: response.data.presencaStatus) */}
              <span className="score-trend positive">Presentes hoje</span>
            </div>

          </div>

          {/* ÁREA RESERVADA PARA O GRÁFICO (Chart.js) */}
          <div className="charts-area">
            <div className="chart-placeholder">
              {/* BACKEND: Injetar os dados do gráfico (Ex: <Line data={dataFromApi} />) */}
              <span>📈 Área reservada para o Gráfico de Evolução Financeira (Chart.js)</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}