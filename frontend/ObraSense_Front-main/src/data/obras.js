export const OBRAS_STORAGE_KEY = 'obras';

function dataComDeslocamento(dias) {
  const data = new Date();
  data.setHours(12, 0, 0, 0);
  data.setDate(data.getDate() + dias);
  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, '0'),
    String(data.getDate()).padStart(2, '0'),
  ].join('-');
}

export const obrasIniciais = [
  { id: 1, nome: 'Residencial Alpha', responsavel: 'Eng. Carlos', cidade: 'São Paulo', status: 'Em andamento', progresso: 65, alerta: false, orcamento: 850000, dataInicio: dataComDeslocamento(-2), dataPrevista: dataComDeslocamento(5), dataConclusao: '', materiais: [], fotos: [] },
  { id: 2, nome: 'Edifício Corporate', responsavel: 'Eng. Mariana', cidade: 'Campinas', status: 'Atrasada', progresso: 32, alerta: true, orcamento: 1200000, dataInicio: dataComDeslocamento(-10), dataPrevista: dataComDeslocamento(20), dataConclusao: '', materiais: [], fotos: [] },
  { id: 3, nome: 'Ponte Sul', responsavel: 'Eng. Roberto', cidade: 'Santos', status: 'Iniciando', progresso: 10, alerta: false, orcamento: 560000, dataInicio: dataComDeslocamento(3), dataPrevista: dataComDeslocamento(3 + 14 + Math.floor(Math.random() * 22)), dataConclusao: '', materiais: [], fotos: [] },
  { id: 4, nome: 'Hospital Central', responsavel: 'Eng. Mariana', cidade: 'Curitiba', status: 'Em andamento', progresso: 88, alerta: false, orcamento: 2400000, dataInicio: dataComDeslocamento(-20), dataPrevista: dataComDeslocamento(10), dataConclusao: '', materiais: [], fotos: [] },
];

export function normalizarObra(obra) {
  const obraDemonstracao = obrasIniciais.find((item) => item.id === obra.id && item.nome === obra.nome);
  return {
    ...obra,
    cidade: typeof obra.cidade === 'string' ? obra.cidade : obraDemonstracao?.cidade || '',
    orcamento: Number.isFinite(Number(obra.orcamento)) ? Number(obra.orcamento) : 0,
    dataInicio: typeof obra.dataInicio === 'string' && obra.dataInicio
      ? obra.dataInicio
      : obraDemonstracao?.dataInicio || '',
    dataPrevista: typeof obra.dataPrevista === 'string' && obra.dataPrevista
      ? obra.dataPrevista
      : obraDemonstracao?.dataPrevista || '',
    dataConclusao: typeof obra.dataConclusao === 'string' ? obra.dataConclusao : '',
    materiais: Array.isArray(obra.materiais) ? obra.materiais : [],
    fotos: Array.isArray(obra.fotos) ? obra.fotos : [],
  };
}

export function carregarObrasSalvas() {
  try {
    const obrasSalvas = localStorage.getItem(OBRAS_STORAGE_KEY);
    if (!obrasSalvas) return obrasIniciais;

    const obras = JSON.parse(obrasSalvas);
    if (!Array.isArray(obras)) {
      throw new Error('Os dados salvos de obras não estão em uma lista válida.');
    }

    return obras.map(normalizarObra);
  } catch (erro) {
    console.error('Não foi possível carregar as obras salvas.', erro);
    return obrasIniciais;
  }
}

export function salvarObras(obras) {
  localStorage.setItem(OBRAS_STORAGE_KEY, JSON.stringify(obras));
}

export function calcularGastoMateriais(materiais = []) {
  return materiais.reduce(
    (total, material) => total + Number(material.quantidade) * Number(material.valorUnitario),
    0,
  );
}

export function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(data) {
  if (!data) return 'Não informada';
  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');
}
