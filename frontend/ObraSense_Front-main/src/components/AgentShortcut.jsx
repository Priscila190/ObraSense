import { useEffect, useRef, useState } from 'react';
import { api } from '../Api';
import { carregarObrasSalvas } from '../data/obras';
import './AgentShortcut.css';

const PERGUNTAS_PRI = [
  'Faça um resumo das minhas obras e do status de cada uma.',
  'Quais obras estão atrasadas e qual o progresso delas?',
  'Como está o progresso geral das minhas obras?',
];

export default function AgentShortcut() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [entrada, setEntrada] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const mensagensRef = useRef(null);
  const entradaRef = useRef(null);

  useEffect(() => {
    if (aberto) entradaRef.current?.focus();
  }, [aberto]);

  useEffect(() => {
    mensagensRef.current?.scrollTo({
      top: mensagensRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [mensagens, carregando]);

  useEffect(() => {
    if (!aberto) return undefined;

    function fecharComEscape(evento) {
      if (evento.key === 'Escape' && !carregando) setAberto(false);
    }

    window.addEventListener('keydown', fecharComEscape);
    return () => window.removeEventListener('keydown', fecharComEscape);
  }, [aberto, carregando]);

  async function enviarMensagem(texto = entrada) {
    const pergunta = texto.trim();
    if (!pergunta || carregando) return;

    const historico = mensagens.map(({ role, texto: conteudo }) => ({ role, texto: conteudo }));
    setMensagens((atuais) => [...atuais, { role: 'user', texto: pergunta }]);
    setEntrada('');
    setErro('');
    setCarregando(true);

    try {
      const dados = await api('/api/agente/chat', {
        method: 'POST',
        body: JSON.stringify({
          pergunta,
          mensagens: historico,
          obras: carregarObrasSalvas().map(({ nome, status, progresso, alerta }) => ({
            nome,
            status,
            progresso,
            alerta,
          })),
        }),
      });

      setMensagens((atuais) => [...atuais, { role: 'model', texto: dados.resposta }]);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
      entradaRef.current?.focus();
    }
  }

  function iniciarNovaConversa() {
    setMensagens([]);
    setErro('');
    setEntrada('');
  }

  return (
    <>
      <button
        type="button"
        className="agent-shortcut"
        aria-label="Conversar com a Pri, assistente do ObraSense"
        title="Conversar com a Pri"
        onClick={() => setAberto(true)}
      >
        <span className="material-symbols-outlined" aria-hidden="true">smart_toy</span>
      </button>

      {aberto && (
        <div
          className="pri-chat-overlay"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !carregando) setAberto(false);
          }}
        >
          <section
            className="pri-chat-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pri-chat-titulo"
          >
            <header className="pri-chat-header">
              <div className="pri-avatar" aria-hidden="true">
                <span className="material-symbols-outlined">smart_toy</span>
                <span className="pri-status-dot" />
              </div>
              <div className="pri-chat-heading">
                <h2 id="pri-chat-titulo">Pri</h2>
                <p>Assistente de obras ObraSense</p>
              </div>
              <div className="pri-chat-actions">
                {mensagens.length > 0 && (
                  <button
                    type="button"
                    className="pri-icon-button"
                    aria-label="Iniciar nova conversa"
                    title="Nova conversa"
                    onClick={iniciarNovaConversa}
                    disabled={carregando}
                  >
                    <span className="material-symbols-outlined">edit_square</span>
                  </button>
                )}
                <button
                  type="button"
                  className="pri-icon-button"
                  aria-label="Fechar conversa"
                  title="Fechar"
                  onClick={() => setAberto(false)}
                  disabled={carregando}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </header>

            <div className="pri-chat-messages" ref={mensagensRef} aria-live="polite">
              {mensagens.length === 0 && (
                <div className="pri-welcome">
                  <span className="material-symbols-outlined">waving_hand</span>
                  <h3>Oi! Eu sou a Pri.</h3>
                  <p>Posso consultar as obras cadastradas e ajudar a entender o andamento.</p>
                  <div className="pri-suggestions">
                    {PERGUNTAS_PRI.map((pergunta) => (
                      <button
                        type="button"
                        key={pergunta}
                        onClick={() => enviarMensagem(pergunta)}
                        disabled={carregando}
                      >
                        {pergunta}
                        <span className="material-symbols-outlined" aria-hidden="true">arrow_upward</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mensagens.map((mensagem, indice) => (
                <article className={`pri-message ${mensagem.role}`} key={`${mensagem.role}-${indice}`}>
                  {mensagem.role === 'model' && <span className="pri-message-name">Pri</span>}
                  <p>{mensagem.texto}</p>
                </article>
              ))}

              {carregando && (
                <div className="pri-typing" role="status" aria-label="Pri está respondendo">
                  <span />
                  <span />
                  <span />
                </div>
              )}
              {erro && <p className="pri-chat-error" role="alert">{erro}</p>}
            </div>

            <form
              className="pri-chat-form"
              onSubmit={(evento) => {
                evento.preventDefault();
                enviarMensagem();
              }}
            >
              <textarea
                ref={entradaRef}
                value={entrada}
                onChange={(evento) => setEntrada(evento.target.value)}
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter' && !evento.shiftKey) {
                    evento.preventDefault();
                    enviarMensagem();
                  }
                }}
                placeholder="Pergunte sobre suas obras..."
                aria-label="Mensagem para a Pri"
                maxLength={1000}
                rows={1}
                disabled={carregando}
              />
              <button
                type="submit"
                aria-label="Enviar mensagem"
                disabled={!entrada.trim() || carregando}
              >
                <span className="material-symbols-outlined">arrow_upward</span>
              </button>
            </form>
            <p className="pri-chat-disclaimer">
              A Pri usa IA para responder com base nas obras cadastradas. Confira dados importantes.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
