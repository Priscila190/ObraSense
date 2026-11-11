import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Dashboard.css';
import './AgenteIA.css';

export default function AgenteIA() {
  const navigate = useNavigate();
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [input, setInput] = useState('');
  
  const [mensagens, setMensagens] = useState([
    { 
      autor: 'ia', 
      texto: 'Olá, Iago! Sou o assistente preditivo do ObraSense. Como posso ajudar na gestão dos seus canteiros hoje?' 
    }
  ]);

  // Sugestões de perguntas rápidas (Estilo Gemini)
  const sugestoes = [
    "Qual o progresso do Residencial Alpha?",
    "Resumo dos orçamentos e despesas do mês",
    "Quais obras possuem alertas críticos de atraso?",
    "Auditar entregas de insumos para esta semana"
  ];

  const handleEnviar = (textoEnviar) => {
    const mensagemTexto = textoEnviar || input;
    if (!mensagemTexto.trim()) return;

    // Adiciona mensagem do usuário
    const novaMensagemUsuario = { autor: 'usuario', texto: mensagemTexto };
    setMensagens((prev) => [...prev, novaMensagemUsuario]);
    if (!textoEnviar) setInput('');

    // BACKEND: Aqui entra a chamada para a API/Webhook do n8n/Python
    // fetch('/api/ia/chat', { method: 'POST', body: JSON.stringify({ prompt: mensagemTexto }) })
    setTimeout(() => {
      setMensagens((prev) => [
        ...prev, 
        { 
          autor: 'ia', 
          texto: `Analisando dados do canteiro para: "${mensagemTexto}"...\n\n[Integração Backend]: O Agente cruzou os cronogramas físicos e financeiros. Nenhuma anomalia grave detectada nas últimas 24h.` 
        }
      ]);
    }, 1200);
  };

  return (
    <div className={`dashboard-container ${sidebarAberta ? '' : 'sidebar-fechada'}`}>
      
      {/* BARRA LATERAL CONECTADA */}
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

          <Link to="/orcamentos" title="Orçamentos">
            <span className="material-symbols-outlined">payments</span>
            {sidebarAberta && <span>Orçamentos</span>}
          </Link>

          <Link to="/cronogramas" title="Cronogramas">
            <span className="material-symbols-outlined">calendar_month</span>
            {sidebarAberta && <span>Cronogramas</span>}
          </Link>

          <Link to="/agente" className="active" title="Agente IA">
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

      {/* ÁREA PRINCIPAL */}
      <main className="main-content">
        
        {/* TOPBAR ESTILO GPT / GEMINI */}
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="btn-toggle-sidebar" 
              onClick={() => setSidebarAberta(!sidebarAberta)}
              title={sidebarAberta ? "Recolher Menu" : "Expandir Menu"}
            >
              <span className="material-symbols-outlined">
                {sidebarAberta ? 'menu_open' : 'menu'}
              </span>
            </button>

            {/* SELETOR DE MODELO */}
            <div className="model-selector">
              <span className="material-symbols-outlined icon-sparkle">auto_awesome</span>
              <span className="model-name">ObraSense AI v2.4</span>
              <span className="model-tag">Pro</span>
            </div>
          </div>

          <div className="topbar-user">
            <span className="ia-status">🟢 Agente Conectado</span>
            <div className="user-avatar" title="Iago Soares">IS</div>
          </div>
        </header>

        {/* CHAT CONTAINER ESTILO GEMINI */}
        <div className="gemini-chat-wrapper">
          
          <div className="gemini-chat-content">
            
            {/* MENSAGENS */}
            <div className="gemini-messages">
              {mensagens.map((msg, index) => (
                <div key={index} className={`gemini-msg-row ${msg.autor}`}>
                  <div className="gemini-avatar">
                    {msg.autor === 'ia' ? (
                      <span className="material-symbols-outlined">auto_awesome</span>
                    ) : (
                      'IS'
                    )}
                  </div>
                  <div className="gemini-msg-text">
                    <span className="gemini-msg-author">
                      {msg.autor === 'ia' ? 'ObraSense Agent' : 'Você'}
                    </span>
                    <p>{msg.texto}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* SUGESTÕES RÁPIDAS (EXIBIDAS SE HOUVER POUCAS MENSAGENS) */}
            {mensagens.length <= 2 && (
              <div className="gemini-suggestions-grid">
                {sugestoes.map((sugestao, i) => (
                  <button key={i} className="suggestion-card" onClick={() => handleEnviar(sugestao)}>
                    <span>{sugestao}</span>
                    <span className="material-symbols-outlined icon-arrow">arrow_forward</span>
                  </button>
                ))}
              </div>
            )}

          </div>

          {/* CAIXA DE TEXTO FLUTUANTE INFERIOR */}
          <div className="gemini-input-container">
            <form 
              className="gemini-input-box" 
              onSubmit={(e) => { e.preventDefault(); handleEnviar(); }}
            >
              <button type="button" className="input-action-btn" title="Anexar documento ou planta">
                <span className="material-symbols-outlined">attach_file</span>
              </button>
              
              <textarea 
                placeholder="Pergunte sobre cronogramas, custos, relatórios ou alertas..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEnviar();
                  }
                }}
                rows={1}
              />
              
              <button 
                type="submit" 
                className={`btn-send-gemini ${input.trim() ? 'active' : ''}`}
                disabled={!input.trim()}
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </form>
            
            <span className="gemini-disclaimer">
              O Agente IA cruza dados do sistema ObraSense. Verifique informações críticas antes de tomadas de decisão.
            </span>
          </div>

        </div>

      </main>
    </div>
  );
}