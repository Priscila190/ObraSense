import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Dashboard.css';
import './Cronogramas.css';

const CRONOGRAMAS_STORAGE_KEY = 'cronogramas';
const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function lerStorage(chave, valorInicial) {
  try {
    const valorSalvo = localStorage.getItem(chave);
    return valorSalvo ? JSON.parse(valorSalvo) : valorInicial;
  } catch (erro) {
    console.error(`Não foi possível carregar ${chave}.`, erro);
    return valorInicial;
  }
}

function dataLocalISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export default function Cronogramas() {
  const navigate = useNavigate();
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [obras] = useState(() => lerStorage('obras', []));
  const [marcos, setMarcos] = useState(() => lerStorage(CRONOGRAMAS_STORAGE_KEY, []));
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  });
  const [hojeISO] = useState(() => dataLocalISO(new Date()));
  const [formAberto, setFormAberto] = useState(false);
  const [novoMarco, setNovoMarco] = useState({
    obraId: '',
    etapa: '',
    data: hojeISO,
    progresso: '',
  });

  useEffect(() => {
    try {
      localStorage.setItem(CRONOGRAMAS_STORAGE_KEY, JSON.stringify(marcos));
    } catch (erro) {
      console.error('Não foi possível salvar os marcos do cronograma.', erro);
    }
  }, [marcos]);

  const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
  const quantidadeDias = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
  const deslocamentoInicial = (primeiroDia.getDay() + 6) % 7;
  const celulasCalendario = [
    ...Array(deslocamentoInicial).fill(null),
    ...Array.from({ length: quantidadeDias }, (_, indice) => indice + 1),
  ];
  while (celulasCalendario.length % 7 !== 0) celulasCalendario.push(null);

  function alterarCampo(evento) {
    const { name, value } = evento.target;
    setNovoMarco((anterior) => ({ ...anterior, [name]: value }));
  }

  function salvarMarco(evento) {
    evento.preventDefault();
    const obra = obras.find((item) => String(item.id) === novoMarco.obraId);
    const marco = {
      ...novoMarco,
      id: Date.now(),
      obraNome: obra.nome,
      progresso: Number(novoMarco.progresso),
    };
    setMarcos((anteriores) => [...anteriores, marco]);
    setNovoMarco({ obraId: '', etapa: '', data: hojeISO, progresso: '' });
    setFormAberto(false);
  }

  function alterarMes(delta) {
    setMesAtual((anterior) => new Date(anterior.getFullYear(), anterior.getMonth() + delta, 1));
  }

  const nomeMes = mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

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
          <Link to="/orcamentos" title="Orçamentos">
            <span className="material-symbols-outlined">payments</span>
            {sidebarAberta && <span>Orçamentos</span>}
          </Link>
          <Link to="/cronogramas" className="active" title="Cronogramas">
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
          <div className="header-data cronogramas-header">
            <div>
              <h1>Cronogramas</h1>
              <p>Acompanhe o planejamento e o andamento das suas obras.</p>
            </div>
            <button type="button" className="cronograma-adicionar" onClick={() => setFormAberto(!formAberto)}>
              <span className="material-symbols-outlined">add</span>
              Registrar progresso
            </button>
          </div>

          {formAberto && (
            <form className="cronograma-form" onSubmit={salvarMarco}>
              <h2>Registrar progresso da obra</h2>
              <label htmlFor="marco-obra">Obra</label>
              <select
                id="marco-obra"
                name="obraId"
                value={novoMarco.obraId}
                onChange={alterarCampo}
                required
                disabled={obras.length === 0}
              >
                <option value="">
                  {obras.length === 0 ? 'Cadastre uma obra primeiro' : 'Selecione uma obra'}
                </option>
                {obras.map((obra) => (
                  <option key={obra.id} value={obra.id}>{obra.nome}</option>
                ))}
              </select>
              <label htmlFor="marco-etapa">Etapa / atividade</label>
              <input
                id="marco-etapa"
                name="etapa"
                value={novoMarco.etapa}
                onChange={alterarCampo}
                placeholder="Ex.: Conclusão da fundação"
                required
                minLength={2}
              />
              <label htmlFor="marco-data">Data</label>
              <input
                id="marco-data"
                name="data"
                type="date"
                value={novoMarco.data}
                onChange={alterarCampo}
                required
              />
              <label htmlFor="marco-progresso">Progresso da obra (%)</label>
              <input
                id="marco-progresso"
                name="progresso"
                type="number"
                min="0"
                max="100"
                value={novoMarco.progresso}
                onChange={alterarCampo}
                placeholder="Ex.: 35"
                required
              />
              {obras.length === 0 && (
                <p className="cronograma-aviso">Cadastre uma obra antes de registrar seu progresso.</p>
              )}
              <div className="cronograma-acoes">
                <button type="button" className="cronograma-cancelar" onClick={() => setFormAberto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="cronograma-adicionar" disabled={obras.length === 0}>
                  Salvar progresso
                </button>
              </div>
            </form>
          )}

          <section className="calendario-progresso" aria-label="Calendário de progresso das obras">
            <div className="calendario-header">
              <h2>{nomeMes}</h2>
              <div className="calendario-navegacao">
                <button type="button" onClick={() => alterarMes(-1)} aria-label="Mês anterior">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button type="button" onClick={() => setMesAtual(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
                  Hoje
                </button>
                <button type="button" onClick={() => alterarMes(1)} aria-label="Próximo mês">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
            <div className="calendario-grade">
              {DIAS_SEMANA.map((dia) => (
                <div className="calendario-dia-semana" key={dia}>{dia}</div>
              ))}
              {celulasCalendario.map((dia, indice) => {
                if (!dia) {
                  return <div className="calendario-celula calendario-vazia" key={`vazio-${indice}`} aria-hidden="true" />;
                }

                const dataCelula = dataLocalISO(new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia));
                const marcosDoDia = marcos.filter((marco) => marco.data === dataCelula);
                return (
                  <div
                    className={`calendario-celula${dataCelula === hojeISO ? ' calendario-hoje' : ''}`}
                    key={dataCelula}
                  >
                    <span className="calendario-numero">{dia}</span>
                    <div className="calendario-marcos">
                      {marcosDoDia.map((marco) => (
                        <div className="calendario-marco" key={marco.id} title={`${marco.obraNome}: ${marco.progresso}%`}>
                          <strong>{marco.obraNome}</strong>
                          <span>{marco.etapa}</span>
                          <span className="marco-progresso">{marco.progresso}% concluído</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {marcos.length === 0 && (
              <p className="calendario-ajuda">Nenhum progresso registrado neste calendário. Use “Registrar progresso” para adicionar uma etapa.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
