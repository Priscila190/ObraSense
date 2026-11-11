import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AgentShortcut from '../components/AgentShortcut';
import { carregarObrasSalvas, formatarData } from '../data/obras';
import './Dashboard.css';
import './Cronogramas.css';

const DIAS_STORAGE_KEY = 'cronograma-dias';
const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const TIPOS_DIA = [
  { valor: 'programado', nome: 'Dia de trabalho', icone: 'construction' },
  { valor: 'trabalhado', nome: 'Trabalhado', icone: 'task_alt' },
  { valor: 'pausa', nome: 'Pausa', icone: 'free_breakfast' },
  { valor: 'intervalo', nome: 'Intervalo', icone: 'event_busy' },
  { valor: 'nao-trabalhado', nome: 'Não trabalhado', icone: 'block' },
  { valor: 'descanso', nome: 'Descanso semanal', icone: 'weekend' },
];

function dataLocalISO(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function lerDiasSalvos() {
  try {
    const valor = localStorage.getItem(DIAS_STORAGE_KEY);
    if (!valor) return {};
    const dias = JSON.parse(valor);
    return dias && typeof dias === 'object' && !Array.isArray(dias) ? dias : {};
  } catch (erro) {
    console.error('Não foi possível carregar as anotações do calendário.', erro);
    return {};
  }
}

function deslocarDataISO(dataISO, quantidade) {
  const data = new Date(`${dataISO}T12:00:00`);
  data.setDate(data.getDate() + quantidade);
  return dataLocalISO(data);
}

function contarDiasProgramados(inicio, fim) {
  if (!inicio || !fim || fim < inicio) return 0;
  const primeiro = new Date(`${inicio}T12:00:00`);
  const ultimo = new Date(`${fim}T12:00:00`);
  const quantidade = Math.round((ultimo - primeiro) / 86400000) + 1;
  const semanas = Math.floor(quantidade / 7);
  let total = semanas * 6;
  for (let indice = 0; indice < quantidade % 7; indice += 1) {
    const diaSemana = (primeiro.getDay() + indice) % 7;
    if (diaSemana !== 0) total += 1;
  }
  return total;
}

function estaNoIntervalo(data, obra) {
  return Boolean(obra?.dataInicio && obra?.dataPrevista && data >= obra.dataInicio && data <= obra.dataPrevista);
}

function ehDiaDeTrabalho(data) {
  return new Date(`${data}T12:00:00`).getDay() !== 0;
}

function chaveDia(obraId, data) {
  return `${obraId}:${data}`;
}

function descreverClima(codigo) {
  if (codigo === 0) return { texto: 'Céu limpo', icone: '☀️' };
  if ([1, 2].includes(codigo)) return { texto: 'Parcialmente nublado', icone: '🌤️' };
  if (codigo === 3) return { texto: 'Nublado', icone: '☁️' };
  if ([45, 48].includes(codigo)) return { texto: 'Nevoeiro', icone: '🌫️' };
  if ([51, 53, 55, 56, 57].includes(codigo)) return { texto: 'Garoa', icone: '🌦️' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(codigo)) return { texto: 'Chuva', icone: '🌧️' };
  if ([71, 73, 75, 77, 85, 86].includes(codigo)) return { texto: 'Neve', icone: '🌨️' };
  if ([95, 96, 99].includes(codigo)) return { texto: 'Tempestade', icone: '⛈️' };
  return { texto: 'Condição variável', icone: '🌥️' };
}

async function buscarJSON(url, sinal) {
  const resposta = await fetch(url, { signal: sinal });
  if (!resposta.ok) throw new Error(`O serviço de previsão respondeu com erro (${resposta.status}).`);
  return resposta.json();
}

export default function Cronogramas() {
  const navigate = useNavigate();
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [obras] = useState(carregarObrasSalvas);
  const [diasSalvos, setDiasSalvos] = useState(lerDiasSalvos);
  const [obraSelecionadaId, setObraSelecionadaId] = useState(() => {
    const primeiraObra = carregarObrasSalvas()[0];
    return primeiraObra ? String(primeiraObra.id) : '';
  });
  const [hojeISO] = useState(() => dataLocalISO(new Date()));
  const obraSelecionada = obras.find((obra) => String(obra.id) === obraSelecionadaId);
  const [mesAtual, setMesAtual] = useState(() => {
    const inicio = obraSelecionada?.dataInicio;
    const dataInicial = inicio ? new Date(`${inicio}T12:00:00`) : new Date();
    return new Date(dataInicial.getFullYear(), dataInicial.getMonth(), 1);
  });
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [tipoDia, setTipoDia] = useState('programado');
  const [notaDia, setNotaDia] = useState('');
  const [erro, setErro] = useState('');
  const [clima, setClima] = useState({});
  const [climaCarregando, setClimaCarregando] = useState(false);
  const [climaErro, setClimaErro] = useState('');

  const periodoValido = Boolean(
    obraSelecionada?.dataInicio
    && obraSelecionada?.dataPrevista
    && obraSelecionada.dataPrevista >= obraSelecionada.dataInicio,
  );
  const diasProgramados = periodoValido
    ? contarDiasProgramados(obraSelecionada.dataInicio, obraSelecionada.dataPrevista)
    : 0;
  const diasTrabalhados = Object.entries(diasSalvos).filter(([chave, registro]) => {
    if (!chave.startsWith(`${obraSelecionadaId}:`) || registro?.tipo !== 'trabalhado') return false;
    const data = chave.slice(obraSelecionadaId.length + 1);
    return periodoValido && estaNoIntervalo(data, obraSelecionada);
  }).length;
  const limiteClima = deslocarDataISO(hojeISO, 15);
  const climaAviso = !obraSelecionada?.cidade
    ? 'Adicione a cidade da obra para consultar o clima.'
    : periodoValido && (obraSelecionada.dataPrevista < hojeISO || obraSelecionada.dataInicio > limiteClima)
      ? 'A previsão do tempo fica disponível até 16 dias a partir de hoje.'
      : periodoValido && obraSelecionada.dataPrevista > limiteClima
        ? 'A previsão exibida cobre até 16 dias; as datas posteriores ainda não têm previsão disponível.'
        : '';

  useEffect(() => {
    if (!obraSelecionada?.cidade || !periodoValido) return undefined;

    const controlador = new AbortController();
    const inicioPrevisao = obraSelecionada.dataInicio < hojeISO ? hojeISO : obraSelecionada.dataInicio;
    const fimPrevisao = obraSelecionada.dataPrevista > limiteClima ? limiteClima : obraSelecionada.dataPrevista;

    if (inicioPrevisao > fimPrevisao) return () => controlador.abort();

    async function carregarClima() {
      setClimaCarregando(true);
      setClimaErro('');
      setClima({});
      try {
        const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
        geocodeUrl.search = new URLSearchParams({
          name: obraSelecionada.cidade,
          count: '1',
          language: 'pt',
          format: 'json',
        });
        const localizacao = await buscarJSON(geocodeUrl, controlador.signal);
        const coordenadas = localizacao.results?.[0];
        if (!coordenadas) throw new Error(`Não encontrei a cidade "${obraSelecionada.cidade}". Confira a localização cadastrada na obra.`);

        const climaUrl = new URL('https://api.open-meteo.com/v1/forecast');
        climaUrl.search = new URLSearchParams({
          latitude: String(coordenadas.latitude),
          longitude: String(coordenadas.longitude),
          daily: 'weather_code,temperature_2m_max,precipitation_probability_max',
          timezone: 'auto',
          start_date: inicioPrevisao,
          end_date: fimPrevisao,
        });
        const previsao = await buscarJSON(climaUrl, controlador.signal);
        const mapaClima = {};
        previsao.daily.time.forEach((data, indice) => {
          mapaClima[data] = {
            ...descreverClima(previsao.daily.weather_code[indice]),
            maxima: previsao.daily.temperature_2m_max[indice],
            chuva: previsao.daily.precipitation_probability_max[indice],
          };
        });
        setClima(mapaClima);
      } catch (falha) {
        if (falha.name !== 'AbortError') {
          console.error('Não foi possível carregar a previsão do tempo.', falha);
          setClimaErro(falha.message || 'Não foi possível consultar a previsão do tempo.');
        }
      } finally {
        if (!controlador.signal.aborted) setClimaCarregando(false);
      }
    }

    carregarClima();
    return () => controlador.abort();
  }, [obraSelecionada?.id, obraSelecionada?.cidade, obraSelecionada?.dataInicio, obraSelecionada?.dataPrevista, periodoValido, hojeISO, limiteClima]);

  function selecionarObra(evento) {
    const id = evento.target.value;
    const obra = obras.find((item) => String(item.id) === id);
    setObraSelecionadaId(id);
    setDataSelecionada('');
    setClima({});
    setClimaErro('');
    setClimaCarregando(false);
    if (obra?.dataInicio) {
      const inicio = new Date(`${obra.dataInicio}T12:00:00`);
      setMesAtual(new Date(inicio.getFullYear(), inicio.getMonth(), 1));
    }
  }

  function selecionarDia(data) {
    setDataSelecionada(data);
    const registro = diasSalvos[chaveDia(obraSelecionadaId, data)];
    setTipoDia(registro?.tipo || (ehDiaDeTrabalho(data) ? 'programado' : 'descanso'));
    setNotaDia(registro?.nota || '');
    setErro('');
  }

  function salvarDia(evento) {
    evento.preventDefault();
    if (!obraSelecionada || !estaNoIntervalo(dataSelecionada, obraSelecionada)) return;
    const chave = chaveDia(obraSelecionadaId, dataSelecionada);
    const anotacoes = { ...diasSalvos };

    if (tipoDia === 'programado' && !notaDia.trim()) {
      delete anotacoes[chave];
    } else {
      anotacoes[chave] = {
        tipo: tipoDia,
        nota: notaDia.trim(),
        atualizadoEm: dataLocalISO(new Date()),
      };
    }

    try {
      localStorage.setItem(DIAS_STORAGE_KEY, JSON.stringify(anotacoes));
      setDiasSalvos(anotacoes);
      setDataSelecionada('');
      setErro('');
    } catch (falha) {
      console.error('Não foi possível salvar a marcação do dia.', falha);
      setErro('Não foi possível salvar a marcação no navegador.');
    }
  }

  function alterarMes(delta) {
    setMesAtual((anterior) => new Date(anterior.getFullYear(), anterior.getMonth() + delta, 1));
  }

  const primeiroDia = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
  const quantidadeDias = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
  const deslocamentoInicial = (primeiroDia.getDay() + 6) % 7;
  const celulasCalendario = [
    ...Array(deslocamentoInicial).fill(null),
    ...Array.from({ length: quantidadeDias }, (_, indice) => indice + 1),
  ];
  while (celulasCalendario.length % 7 !== 0) celulasCalendario.push(null);

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

        <div className="dashboard-data">
          <div className="header-data cronogramas-header">
            <div>
              <h1>Acompanhamento da obra</h1>
              <p>Planeje os dias de trabalho e registre pausas e imprevistos.</p>
            </div>
            <label className="cronograma-seletor">
              <span>Obra</span>
              <select value={obraSelecionadaId} onChange={selecionarObra} disabled={obras.length === 0}>
                {obras.length === 0 && <option value="">Nenhuma obra cadastrada</option>}
                {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nome}</option>)}
              </select>
            </label>
          </div>

          {erro && <p className="cronograma-erro" role="alert">{erro}</p>}

          {!obraSelecionada ? (
            <section className="cronogramas-vazio">
              <span className="material-symbols-outlined">construction</span>
              <h2>Cadastre uma obra para começar</h2>
              <p>Depois de cadastrar a obra, informe as datas e a cidade para montar o acompanhamento.</p>
              <Link to="/obras" className="cronograma-link">Ir para Minhas Obras</Link>
            </section>
          ) : !periodoValido ? (
            <section className="cronogramas-vazio">
              <span className="material-symbols-outlined">event</span>
              <h2>{obraSelecionada.dataInicio && obraSelecionada.dataPrevista ? 'Revise o período da obra' : 'Defina o período da obra'}</h2>
              <p>
                {obraSelecionada.dataInicio && obraSelecionada.dataPrevista
                  ? 'A previsão de conclusão precisa ser igual ou posterior à data de início.'
                  : 'Adicione uma data de início e uma previsão de conclusão para gerar o calendário.'}
              </p>
              <Link to={`/obras/${obraSelecionada.id}`} className="cronograma-link">Configurar obra</Link>
            </section>
          ) : (
            <>
              <section className="cronograma-resumo">
                <div>
                  <span className="material-symbols-outlined">calendar_month</span>
                  <p>Período planejado</p>
                  <strong>{formatarData(obraSelecionada.dataInicio)} – {formatarData(obraSelecionada.dataPrevista)}</strong>
                </div>
                <div>
                  <span className="material-symbols-outlined">work_history</span>
                  <p>Dias programados</p>
                  <strong>{diasProgramados}</strong>
                </div>
                <div>
                  <span className="material-symbols-outlined">task_alt</span>
                  <p>Dias trabalhados</p>
                  <strong>{diasTrabalhados}</strong>
                </div>
                <div>
                  <span className="material-symbols-outlined">location_on</span>
                  <p>Local da obra</p>
                  <strong>{obraSelecionada.cidade || 'Não informada'}</strong>
                </div>
              </section>

              <section className="calendario-progresso" aria-label={`Calendário da obra ${obraSelecionada.nome}`}>
                <div className="calendario-header">
                  <div>
                    <h2>{nomeMes}</h2>
                    <p>{obraSelecionada.nome}</p>
                  </div>
                  <div className="calendario-navegacao">
                    <button type="button" onClick={() => alterarMes(-1)} aria-label="Mês anterior">
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMesAtual(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                    >
                      Hoje
                    </button>
                    <button type="button" onClick={() => alterarMes(1)} aria-label="Próximo mês">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="cronograma-legenda">
                  <span><i className="legenda-trabalho" />Dia planejado</span>
                  {TIPOS_DIA.slice(1).map((tipo) => (
                    <span key={tipo.valor}><i className={`legenda-${tipo.valor}`} />{tipo.nome}</span>
                  ))}
                  <span><i className="legenda-clima" />Previsão disponível</span>
                </div>

                {climaCarregando && <p className="cronograma-clima-aviso">Consultando previsão do tempo…</p>}
                {climaAviso && (
                  <p className="cronograma-clima-aviso">
                    {climaAviso}
                    {!obraSelecionada.cidade && (
                      <> <Link to={`/obras/${obraSelecionada.id}`}>Adicionar cidade da obra</Link>.</>
                    )}
                  </p>
                )}
                {climaErro && <p className="cronograma-clima-erro" role="alert">{climaErro}</p>}

                <div className="calendario-grade">
                  {DIAS_SEMANA.map((dia) => <div className="calendario-dia-semana" key={dia}>{dia}</div>)}
                  {celulasCalendario.map((dia, indice) => {
                    if (!dia) {
                      return <div className="calendario-celula calendario-vazia" key={`vazio-${indice}`} aria-hidden="true" />;
                    }

                    const dataCelula = dataLocalISO(new Date(mesAtual.getFullYear(), mesAtual.getMonth(), dia));
                    const noPeriodo = estaNoIntervalo(dataCelula, obraSelecionada);
                    const registro = diasSalvos[chaveDia(obraSelecionada.id, dataCelula)];
                    const tipo = registro?.tipo || (noPeriodo && ehDiaDeTrabalho(dataCelula) ? 'programado' : 'descanso');
                    const previsao = clima[dataCelula];
                    const classes = [
                      'calendario-celula',
                      dataCelula === hojeISO ? 'calendario-hoje' : '',
                      noPeriodo ? 'calendario-no-periodo' : '',
                      `dia-${tipo}`,
                      dataSelecionada === dataCelula ? 'dia-selecionado' : '',
                    ].filter(Boolean).join(' ');
                    const detalheTipo = TIPOS_DIA.find((item) => item.valor === tipo);

                    return (
                      <button
                        type="button"
                        className={classes}
                        key={dataCelula}
                        disabled={!noPeriodo}
                        onClick={() => selecionarDia(dataCelula)}
                        aria-pressed={dataSelecionada === dataCelula}
                        aria-label={`${formatarData(dataCelula)}${noPeriodo ? `, ${detalheTipo?.nome || 'descanso'}` : ', fora do período da obra'}`}
                      >
                        <span className="calendario-numero">{dia}</span>
                        {noPeriodo && (
                          <span className="calendario-dia-status">
                            <span className="material-symbols-outlined">{detalheTipo?.icone || 'weekend'}</span>
                            {detalheTipo?.nome || 'Descanso'}
                          </span>
                        )}
                        {registro?.nota && <span className="calendario-nota">{registro.nota}</span>}
                        {previsao && (
                          <span className="calendario-clima" title={`${previsao.texto}; máxima de ${previsao.maxima}°C; chuva ${previsao.chuva ?? 'indisponível'}%`}>
                            <span>{previsao.icone}</span>
                            <span>{Math.round(previsao.maxima)}°</span>
                            {previsao.chuva !== null && previsao.chuva !== undefined && <small>{previsao.chuva}% chuva</small>}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="cronograma-fonte-clima">
                  Previsão do tempo por <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>.
                </p>

                {dataSelecionada && (
                  <form className="cronograma-dia-form" onSubmit={salvarDia}>
                    <div className="cronograma-dia-form-titulo">
                      <div>
                        <span>Atualizar acompanhamento</span>
                        <strong>{formatarData(dataSelecionada)}</strong>
                      </div>
                      <button type="button" onClick={() => setDataSelecionada('')} aria-label="Fechar edição do dia">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                    <label>
                      Situação do dia
                      <select value={tipoDia} onChange={(evento) => setTipoDia(evento.target.value)}>
                        {TIPOS_DIA.map((tipo) => <option key={tipo.valor} value={tipo.valor}>{tipo.nome}</option>)}
                      </select>
                    </label>
                    <label>
                      Observação (opcional)
                      <input
                        value={notaDia}
                        onChange={(evento) => setNotaDia(evento.target.value)}
                        placeholder="Ex.: Chuva forte, aguardando material..."
                        maxLength={140}
                      />
                    </label>
                    <div className="cronograma-dia-acoes">
                      <button type="button" className="cronograma-cancelar" onClick={() => setDataSelecionada('')}>
                        Cancelar
                      </button>
                      <button type="submit" className="cronograma-adicionar">Salvar dia</button>
                    </div>
                  </form>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <AgentShortcut />
    </div>
  );
}
