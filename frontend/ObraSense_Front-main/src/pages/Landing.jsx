import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const [slideAtual, setSlideAtual] = useState(0);
  const navigate = useNavigate(); // A função que troca de página

  const slides = [
    {
      id: 1,
      imagem: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1920&q=80",
      titulo: "Gestão de Obras Inteligente",
      texto: "Transforme o canteiro de obras em dados precisos e evite desperdícios."
    },
    {
      id: 2,
      imagem: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1920&q=80",
      titulo: "Tecnologia a favor da Engenharia",
      texto: "Acompanhe cronogramas, custos e produtividade em tempo real."
    },
    {
      id: 3,
      imagem: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1920&q=80",
      titulo: "Tudo em um só lugar",
      texto: "A plataforma definitiva para conectar engenheiros, arquitetos e gestores."
    }
  ];

  const proximoSlide = () => {
    setSlideAtual((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const slideAnterior = () => {
    setSlideAtual((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  return (
    <div className="landing-page">
      <header className="header">
        <div className="logo">
          <img src="/logo.png" alt="Logótipo ObraSense" className="logo-img" />
          <span className="logo-texto">ObraSense</span>
        </div>
        <nav className="header-nav">
          <a href="#funcionalidades">Funcionalidades</a>
          <a href="#sobre">Soluções</a>
          {/* O onClick aqui aciona a navegação para o login */}
          <button className="btn-acessar" onClick={() => navigate('/login')}>
            Acessar Plataforma
          </button>
        </nav>
      </header>

      <main className="hero-carousel">
        {slides.map((slide, index) => {
          if (index !== slideAtual) return null;
          return (
            <div key={slide.id} className="carousel-slide ativo" style={{ backgroundImage: `url(${slide.imagem})` }}>
              <div className="carousel-overlay">
                <div className="carousel-content">
                  <h1>{slide.titulo}</h1>
                  <p>{slide.texto}</p>
                  <button className="btn-destaque" onClick={() => navigate('/cadastro')}>
                  Comece Agora
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        <button className="carousel-btn prev" onClick={slideAnterior}>&#10094;</button>
        <button className="carousel-btn next" onClick={proximoSlide}>&#10095;</button>
        <div className="carousel-indicators">
          {slides.map((_, index) => (
            <span key={index} className={`dot ${index === slideAtual ? 'ativo' : ''}`} onClick={() => setSlideAtual(index)}></span>
          ))}
        </div>
      </main> 

      <section className="about-section" id="sobre">
        <div className="about-container">
          <div className="about-text">
            <h2>Nossa Missão</h2>
            <p>O <strong>ObraSense</strong> nasceu da necessidade de modernizar e dar previsibilidade ao canteiro de obras. Nosso intuito é eliminar o caos das planilhas manuais e os gargalos de comunicação entre engenheiros, arquitetos e gestores.</p>
            <p>Para isso, desenvolvemos um software proprietário robusto integrado a um <strong>Agente de Inteligência Artificial especializado</strong>. O agente atua nos bastidores, cruzando dados de cronogramas, orçamentos e produtividade para prever atrasos, auditar demandas e gerar alertas automáticos. A tecnologia faz o trabalho pesado para que você foque em construir.</p>
          </div>
          <div className="about-features">
            <div className="feature-card">
              <h3>Agente de IA Integrado</h3>
              <p>Monitoramento ativo, auditoria de dados e alertas preditivos para evitar estouros de orçamento.</p>
            </div>
            <div className="feature-card">
              <h3>Software Proprietário</h3>
              <p>Ecossistema próprio desenvolvido de ponta a ponta para a realidade da construção civil.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>&copy; 2026 ObraSense. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}