let dadosCasos = [];
let chartRosca = null;

const paletaGradiente = [
  '#40516c', '#4a5d7c', '#53698c', '#5d759c',
  '#6b82a7', '#7b90b1', '#8b9dba'
];

function filtrarPorData(casos) {
  const inicio = document.getElementById('dataInicio').value;
  const fim = document.getElementById('dataFim').value;

  return casos.filter(caso => {
    if (!caso.data) return false;
    const data = new Date(caso.data);
    const dataInicio = inicio ? new Date(inicio) : null;
    const dataFim = fim ? new Date(fim) : null;

    return (!dataInicio || data >= dataInicio) &&
           (!dataFim || data <= dataFim);
  });
}

function contarOcorrencias(casos, chave) {
  const contagem = {};
  casos.forEach(caso => {
    const valor = caso[chave];
    if (valor) {
      contagem[valor] = (contagem[valor] || 0) + 1;
    }
  });
  return contagem;
}

function atualizarGraficoRosca(variavel) {
  const dadosFiltrados = filtrarPorData(dadosCasos);
  const contagem = contarOcorrencias(dadosFiltrados, variavel);

  const labels = Object.keys(contagem);
  const valores = Object.values(contagem);
  const cores = labels.map((_, i) => paletaGradiente[i % paletaGradiente.length]);

  if (chartRosca) chartRosca.destroy();

  const ctx = document.getElementById("graficoRosca").getContext("2d");
  chartRosca = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: cores
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}

function atualizarGraficos() {
  const variavelRosca = document.getElementById("variavelRosca").value;
  atualizarGraficoRosca(variavelRosca);
}

document.getElementById("variavelRosca").addEventListener("change", atualizarGraficos);
document.getElementById("dataInicio").addEventListener("change", atualizarGraficos);
document.getElementById("dataFim").addEventListener("change", atualizarGraficos);

async function carregarDados() {
  const resposta = await fetch('http://127.0.0.1:5000/api/casos');
  dadosCasos = await resposta.json();
  atualizarGraficos();
}

window.onload = carregarDados;
