import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AgentShortcut from '../components/AgentShortcut';
import {
  calcularGastoMateriais,
  carregarObrasSalvas,
  formatarData,
  formatarMoeda,
  salvarObras,
} from '../data/obras';
import './Dashboard.css';
import './ObraDetalhes.css';

function dataHoje() {
  const hoje = new Date();
  const ajusteFuso = hoje.getTimezoneOffset() * 60000;
  return new Date(hoje.getTime() - ajusteFuso).toISOString().slice(0, 10);
}

function classesStatus(status) {
  return status.toLowerCase().replaceAll(' ', '-');
}

export default function ObraDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [obras, setObras] = useState(carregarObrasSalvas);
  const [erro, setErro] = useState('');
  const [meta, setMeta] = useState(() => {
    const obra = carregarObrasSalvas().find((item) => String(item.id) === id);
    return {
      status: obra?.status || 'Iniciando',
      progresso: obra?.progresso ?? 0,
      orcamento: obra?.orcamento ?? 0,
      cidade: obra?.cidade || '',
      dataInicio: obra?.dataInicio || '',
      dataPrevista: obra?.dataPrevista || '',
    };
  });
  const [material, setMaterial] = useState({ nome: '', quantidade: '', valorUnitario: '' });
  const [foto, setFoto] = useState({ url: '', legenda: '' });
  const obra = obras.find((item) => String(item.id) === id);
  const gastoMateriais = obra ? calcularGastoMateriais(obra.materiais) : 0;
  const usoOrcamento = obra?.orcamento > 0 ? (gastoMateriais / obra.orcamento) * 100 : null;

  function atualizarObra(atualizar) {
    const obrasAtualizadas = obras.map((item) => (
      String(item.id) === id ? atualizar(item) : item
    ));

    try {
      salvarObras(obrasAtualizadas);
      setObras(obrasAtualizadas);
      setErro('');
      return true;
    } catch (falha) {
      console.error('Não foi possível salvar as alterações da obra.', falha);
      setErro('Não foi possível salvar as alterações. Verifique o espaço disponível no navegador e tente novamente.');
      return false;
    }
  }

  function salvarResumo(evento) {
    evento.preventDefault();
    const orcamento = Number(meta.orcamento);
    const progresso = Number(meta.progresso);

    if (!Number.isFinite(orcamento) || orcamento < 0 || !Number.isFinite(progresso) || progresso < 0 || progresso > 100) {
      setErro('Confira o orçamento e o progresso informados.');
      return;
    }
    if (meta.dataInicio && meta.dataPrevista && meta.dataPrevista < meta.dataInicio) {
      setErro('A previsão de conclusão não pode ser anterior à data de início.');
      return;
    }

    atualizarObra((atual) => {
      const concluida = meta.status === 'Concluída';
      return {
        ...atual,
        status: meta.status,
        progresso: concluida ? 100 : progresso,
        orcamento,
        dataInicio: meta.dataInicio,
        dataPrevista: meta.dataPrevista,
        cidade: meta.cidade.trim(),
        dataConclusao: concluida ? atual.dataConclusao || dataHoje() : '',
        alerta: meta.status === 'Atrasada',
      };
    });
  }

  function concluirObra() {
    atualizarObra((atual) => ({
      ...atual,
      status: 'Concluída',
      progresso: 100,
      dataConclusao: atual.dataConclusao || dataHoje(),
      alerta: false,
    }));
    setMeta((atual) => ({ ...atual, status: 'Concluída', progresso: 100 }));
  }

  function adicionarMaterial(evento) {
    evento.preventDefault();
    const quantidade = Number(material.quantidade);
    const valorUnitario = Number(material.valorUnitario);
    if (!Number.isFinite(quantidade) || quantidade <= 0 || !Number.isFinite(valorUnitario) || valorUnitario < 0) {
      setErro('Informe uma quantidade e um valor unitário válidos.');
      return;
    }

    const novoMaterial = {
      id: Date.now(),
      nome: material.nome.trim(),
      quantidade,
      valorUnitario,
      adicionadoEm: dataHoje(),
    };
    if (atualizarObra((atual) => ({ ...atual, materiais: [...atual.materiais, novoMaterial] }))) {
      setMaterial({ nome: '', quantidade: '', valorUnitario: '' });
    }
  }

  function removerMaterial(materialId) {
    atualizarObra((atual) => ({
      ...atual,
      materiais: atual.materiais.filter((item) => item.id !== materialId),
    }));
  }

  function adicionarFoto(evento) {
    evento.preventDefault();
    const url = foto.url.trim();
    if (!url) return;

    let urlSegura;
    try {
      urlSegura = new URL(url);
    } catch {
      setErro('Informe um link válido para a imagem.');
      return;
    }
    if (!['http:', 'https:'].includes(urlSegura.protocol)) {
      setErro('O link da imagem precisa começar com http:// ou https://.');
      return;
    }

    if (atualizarObra((atual) => ({
      ...atual,
      fotos: [...atual.fotos, { id: Date.now(), url: urlSegura.href, legenda: foto.legenda.trim() }],
    }))) {
      setFoto({ url: '', legenda: '' });
    }
  }

  function removerFoto(fotoId) {
    atualizarObra((atual) => ({
      ...atual,
      fotos: atual.fotos.filter((item) => item.id !== fotoId),
    }));
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

        <div className="dashboard-data obra-detalhes-data">
          <Link to="/obras" className="obra-voltar">
            <span className="material-symbols-outlined">arrow_back</span>
            Voltar para Minhas Obras
          </Link>

          {!obra ? (
            <section className="obra-nao-encontrada">
              <span className="material-symbols-outlined">search_off</span>
              <h1>Obra não encontrada</h1>
              <p>Ela pode ter sido removida ou não existe neste navegador.</p>
              <Link to="/obras" className="obra-primary-link">Voltar para as obras</Link>
            </section>
          ) : (
            <>
              <div className="obra-detalhe-heading">
                <div>
                  <span className={`status-badge ${classesStatus(obra.status)}`}>{obra.status}</span>
                  <h1>{obra.nome}</h1>
                  <p>Responsável: {obra.responsavel}</p>
                  {obra.cidade && <p>Localização: {obra.cidade}</p>}
                </div>
                {obra.status !== 'Concluída' && (
                  <button type="button" className="obra-concluir-button" onClick={concluirObra}>
                    <span className="material-symbols-outlined">task_alt</span>
                    Marcar como concluída
                  </button>
                )}
              </div>

              {erro && <p className="obra-erro" role="alert">{erro}</p>}

              <div className="obra-resumo-grid">
                <article className="obra-resumo-card">
                  <span>Orçamento</span>
                  <strong>{formatarMoeda(obra.orcamento)}</strong>
                </article>
                <article className="obra-resumo-card">
                  <span>Total em materiais</span>
                  <strong>{formatarMoeda(gastoMateriais)}</strong>
                </article>
                <article className={`obra-resumo-card ${usoOrcamento !== null && usoOrcamento > 100 ? 'estourado' : ''}`}>
                  <span>Orçamento utilizado</span>
                  <strong>{usoOrcamento === null ? 'Defina um orçamento' : `${usoOrcamento.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}</strong>
                </article>
                <article className="obra-resumo-card">
                  <span>Progresso</span>
                  <strong>{obra.progresso}%</strong>
                </article>
              </div>

              <section className="obra-painel">
                <div className="obra-painel-heading">
                  <div>
                    <h2>Dados e andamento</h2>
                    <p>Atualize status, datas, progresso e o limite de gastos.</p>
                  </div>
                  {obra.orcamento > 0 && (
                    <span className={`orcamento-situacao ${gastoMateriais > obra.orcamento ? 'acima' : usoOrcamento >= 80 ? 'atencao' : 'dentro'}`}>
                      {gastoMateriais > obra.orcamento
                        ? 'Orçamento ultrapassado'
                        : usoOrcamento >= 80
                          ? 'Próximo do limite'
                          : 'Dentro do orçamento'}
                    </span>
                  )}
                </div>
                <form className="obra-meta-form" onSubmit={salvarResumo}>
                  <label>
                    Status
                    <select
                      value={meta.status}
                      onChange={(evento) => setMeta((atual) => ({ ...atual, status: evento.target.value }))}
                    >
                      <option>Iniciando</option>
                      <option>Em andamento</option>
                      <option>Atrasada</option>
                      <option>Concluída</option>
                    </select>
                  </label>
                  <label>
                    Progresso (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={meta.progresso}
                      disabled={meta.status === 'Concluída'}
                      onChange={(evento) => setMeta((atual) => ({ ...atual, progresso: evento.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Orçamento (R$)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={meta.orcamento}
                      onChange={(evento) => setMeta((atual) => ({ ...atual, orcamento: evento.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Cidade da obra
                    <input
                      type="text"
                      maxLength={100}
                      value={meta.cidade}
                      onChange={(evento) => setMeta((atual) => ({ ...atual, cidade: evento.target.value }))}
                      placeholder="Ex.: São Paulo"
                    />
                  </label>
                  <label>
                    Data de início
                    <input
                      type="date"
                      value={meta.dataInicio}
                      onChange={(evento) => setMeta((atual) => ({ ...atual, dataInicio: evento.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Previsão de conclusão
                    <input
                      type="date"
                      min={meta.dataInicio || undefined}
                      value={meta.dataPrevista}
                      onChange={(evento) => setMeta((atual) => ({ ...atual, dataPrevista: evento.target.value }))}
                    />
                  </label>
                  <div className="obra-datas-salvas">
                    <span>Início: {formatarData(obra.dataInicio)}</span>
                    <span>Previsão: {formatarData(obra.dataPrevista)}</span>
                    {obra.dataConclusao && <span>Concluída em: {formatarData(obra.dataConclusao)}</span>}
                  </div>
                  <button type="submit" className="obra-salvar-button">
                    Salvar alterações
                  </button>
                </form>
                {obra.orcamento > 0 && (
                  <div className="obra-orcamento-bar">
                    <div className="obra-orcamento-bar-label">
                      <span>{formatarMoeda(gastoMateriais)} gastos</span>
                      <span>{formatarMoeda(obra.orcamento)} de orçamento</span>
                    </div>
                    <div
                      className="obra-orcamento-track"
                      role="progressbar"
                      aria-label="Uso do orçamento em materiais"
                      aria-valuenow={Math.min(Math.round(usoOrcamento), 100)}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    >
                      <span className={gastoMateriais > obra.orcamento ? 'acima' : ''} style={{ width: `${Math.min(usoOrcamento, 100)}%` }} />
                    </div>
                  </div>
                )}
              </section>

              <section className="obra-painel">
                <div className="obra-painel-heading">
                  <div>
                    <h2>Materiais comprados</h2>
                    <p>Registre quantidade e preço por unidade para acompanhar os gastos.</p>
                  </div>
                  <strong className="obra-materiais-total">{formatarMoeda(gastoMateriais)}</strong>
                </div>
                <form className="obra-adicionar-form obra-material-form" onSubmit={adicionarMaterial}>
                  <label>
                    Material
                    <input
                      value={material.nome}
                      onChange={(evento) => setMaterial((atual) => ({ ...atual, nome: evento.target.value }))}
                      placeholder="Ex.: Cimento"
                      maxLength={100}
                      required
                    />
                  </label>
                  <label>
                    Quantidade
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={material.quantidade}
                      onChange={(evento) => setMaterial((atual) => ({ ...atual, quantidade: evento.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Valor unitário (R$)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={material.valorUnitario}
                      onChange={(evento) => setMaterial((atual) => ({ ...atual, valorUnitario: evento.target.value }))}
                      required
                    />
                  </label>
                  <button type="submit" className="obra-salvar-button">
                    Adicionar material
                  </button>
                </form>
                {obra.materiais.length > 0 ? (
                  <div className="obra-itens-lista">
                    {obra.materiais.map((item) => (
                      <article className="obra-material-item" key={item.id}>
                        <div>
                          <strong>{item.nome}</strong>
                          <span>{item.quantidade} × {formatarMoeda(item.valorUnitario)}</span>
                        </div>
                        <strong>{formatarMoeda(Number(item.quantidade) * Number(item.valorUnitario))}</strong>
                        <button type="button" onClick={() => removerMaterial(item.id)} aria-label={`Remover ${item.nome}`}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="obra-vazio">Ainda não há materiais registrados nesta obra.</p>
                )}
              </section>

              <section className="obra-painel">
                <div className="obra-painel-heading">
                  <div>
                    <h2>Fotos da obra</h2>
                    <p>Adicione imagens usando links públicos.</p>
                  </div>
                </div>
                <form className="obra-adicionar-form obra-foto-form" onSubmit={adicionarFoto}>
                  <label>
                    Link da imagem
                    <input
                      type="url"
                      value={foto.url}
                      onChange={(evento) => setFoto((atual) => ({ ...atual, url: evento.target.value }))}
                      placeholder="https://exemplo.com/foto.jpg"
                      maxLength={2048}
                      required
                    />
                  </label>
                  <label>
                    Legenda (opcional)
                    <input
                      value={foto.legenda}
                      onChange={(evento) => setFoto((atual) => ({ ...atual, legenda: evento.target.value }))}
                      placeholder="Ex.: Fundação concluída"
                      maxLength={120}
                    />
                  </label>
                  <button type="submit" className="obra-salvar-button">Adicionar foto</button>
                </form>
                {obra.fotos.length > 0 ? (
                  <div className="obra-fotos-grid">
                    {obra.fotos.map((imagem) => (
                      <figure className="obra-foto-card" key={imagem.id}>
                        <a href={imagem.url} target="_blank" rel="noreferrer">
                          <img src={imagem.url} alt={imagem.legenda || `Foto da obra ${obra.nome}`} loading="lazy" />
                        </a>
                        <figcaption>
                          <span>{imagem.legenda || 'Foto da obra'}</span>
                          <button type="button" onClick={() => removerFoto(imagem.id)} aria-label="Remover foto">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <p className="obra-vazio">Adicione um link para registrar a primeira foto.</p>
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
