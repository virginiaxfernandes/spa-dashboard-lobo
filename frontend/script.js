let dadosCasos = [];
let chartRosca = null;
let chartIdade = null;
let chartModelo = null;  // novo gráfico modelo

const paletaGradiente = [
  '#40516c', '#4a5d7c', '#53698c', '#5d759c',
  '#6b82a7', '#7b90b1', '#8b9dba'
];

// Função para aplicar filtro por data
function filtrarPorData(casos) {
  const inicio = document.getElementById('dataInicio').value;
  const fim = document.getElementById('dataFim').value;

  return casos.filter(caso => {
    if (!caso.data_do_caso) return false;
    const data = new Date(caso.data_do_caso);
    const dataInicio = inicio ? new Date(inicio) : null;
    const dataFim = fim ? new Date(fim) : null;

    return (!dataInicio || data >= dataInicio) &&
           (!dataFim || data <= dataFim);
  });
}

// Contar ocorrências para variável categórica (tipo do caso, localização, etc.)
function contarOcorrencias(casos, chave) {
  const contagem = {};
  casos.forEach(caso => {
    const valor = chave.includes('.') ? chave.split('.').reduce((o, k) => o?.[k], caso) : caso[chave];
    if (valor !== undefined && valor !== null) {
      contagem[valor] = (contagem[valor] || 0) + 1;
    }
  });
  return contagem;
}

// Atualiza gráfico de rosca
function atualizarGraficoRosca(variavel) {
  const dadosFiltrados = filtrarPorData(dadosCasos);
  const contagem = contarOcorrencias(dadosFiltrados, variavel);
  const labels = Object.keys(contagem);
  const valores = Object.values(contagem);

  const cores = labels.map((_, i) => paletaGradiente[i % paletaGradiente.length]);

  if(chartRosca) chartRosca.destroy();

  const ctx = document.getElementById("graficoRosca").getContext("2d");
  chartRosca = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: valores,
        backgroundColor: cores
      }]
    },
    options: {
      responsive: true,
      devicePixelRatio: window.devicePixelRatio || 1,
      plugins: {
        legend: {
          position: 'right'
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { display: false } }
      }
    }
  });
}

// Atualiza gráfico de distribuição de idade por faixas (1–10, 11–20, etc.)
function atualizarGraficoDistribuicao() {
  const dadosFiltrados = filtrarPorData(dadosCasos);
  const idades = dadosFiltrados
    .map(caso => caso.vitima?.idade)
    .filter(idade => typeof idade === "number" && idade >= 0);

  // Agrupamento por faixa de 10 anos
  const faixas = {};
  idades.forEach(idade => {
    const faixaInicio = Math.floor((idade - 1) / 10) * 10 + 1;
    const faixaLabel = `${faixaInicio}-${faixaInicio + 9}`;
    faixas[faixaLabel] = (faixas[faixaLabel] || 0) + 1;
  });

  const labels = Object.keys(faixas).sort((a, b) => {
    const numA = parseInt(a.split('-')[0]);
    const numB = parseInt(b.split('-')[0]);
    return numA - numB;
  });
  const valores = labels.map(label => faixas[label]);

  if(chartIdade) chartIdade.destroy();

  const ctx = document.getElementById("graficoDistribuicao").getContext("2d");
  chartIdade = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Número de Vítimas",
        data: valores,
        backgroundColor: paletaGradiente[5] // tom azul-esverdeado
      }]
    },
    options: {
      responsive: true,
      devicePixelRatio: window.devicePixelRatio || 1,
      scales: {
        x: {
          title: { display: true, text: 'Faixa Etária' },
          grid: { display: false }
        },
        y: {
          title: { display: true, text: 'Quantidade' },
          beginAtZero: true,
          grid: { display: false }
        }
      }
    }
  });
}

// Atualiza gráfico de dispersão do modelo regressão (idade x tipo_do_caso)
function atualizarGraficoModeloScatter() {
  const dadosFiltrados = filtrarPorData(dadosCasos);
  if (!dadosFiltrados.length) return;

  // Mapeia as classes para valores numéricos para o eixo Y
  const classes = [...new Set(dadosFiltrados.map(c => c.tipo_do_caso))];
  const classeToY = {};
  classes.forEach((c, i) => classeToY[c] = i + 1); // valores 1, 2, 3,...

  // Cria datasets separados para cada classe
  const datasets = classes.map((classe, idx) => {
    const pontos = dadosFiltrados
      .filter(c => c.tipo_do_caso === classe)
      .map(c => ({
        x: c.vitima?.idade || 0,
        y: classeToY[classe]
      }))
      .filter(p => p.x > 0); // filtra idades inválidas

    return {
      label: classe,
      data: pontos,
      backgroundColor: '#5d759c', // COR ALTERADA PARA ÚNICA (mesma do gráfico de barras)
      pointRadius: 5,
      grid: { display: false }
    };
  });

  const ctx = document.getElementById("graficoModelo").getContext("2d");
  if(chartModelo) chartModelo.destroy();

  // Adiciona título antes de criar o gráfico
  const container = document.getElementById("containerGraficoModelo");
  container.innerHTML = `
    <h3>Fatores Determinantes nos Tipos de Caso</h3> <!-- TÍTULO ALTERADO -->
    <canvas id="graficoModelo"></canvas>
  `;

  chartModelo = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: datasets
    },
    options: {
      responsive: true,
      devicePixelRatio: window.devicePixelRatio || 1,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Idade da Vítima'
          },
          beginAtZero: true,
          min: 0,
          max: 100
        },
        y: {
          title: {
            display: true,
            text: 'Tipo do Caso'
          },
          ticks: {
            stepSize: 1,
            callback: function(value) {
              return classes[value - 1] || value;
            }
          },
          min: 0,
          max: classes.length + 1
        }
      },
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Tipo: ${context.dataset.label}, Idade: ${context.parsed.x}`;
            }
          }
        }
      }
    }
  });
}

// Atualiza os três gráficos com base nos filtros
function atualizarGraficos() {
  const variavelRosca = document.getElementById("variavelRosca").value;
  atualizarGraficoRosca(variavelRosca);
  atualizarGraficoDistribuicao();
  atualizarGraficoModeloScatter();
}

// Eventos
document.getElementById("variavelRosca").addEventListener("change", atualizarGraficos);
document.getElementById("dataInicio").addEventListener("change", atualizarGraficos);
document.getElementById("dataFim").addEventListener("change", atualizarGraficos);

// Carrega dados da API e inicia gráficos
async function carregarDados() {
  const resposta = await fetch('http://127.0.0.1:5000/api/casos');
  dadosCasos = await resposta.json();
  atualizarGraficos();
}

<<<<<<< HEAD
window.onload = function() {
  carregarDados();

    // Carrega opções do backend e monta os radios
  fetch('http://127.0.0.1:5000/api/opcoes')
    .then(res => res.json())
    .then(data => {
      // Etnia radios
      const etniaDiv = document.getElementById('etniaRadios');
      data.etnias.forEach((etnia, i) => {
        const id = `etnia_${i}`;
        etniaDiv.innerHTML += `
          <input type="radio" id="${id}" name="etnia" value="${etnia}" ${i===0?'checked':''}>
          <label for="${id}">${etnia}</label>
        `;
      });

      // Localização radios
      const localDiv = document.getElementById('localizacaoRadios');
      data.locais.forEach((local, i) => {
        const id = `local_${i}`;
        localDiv.innerHTML += `
          <input type="radio" id="${id}" name="localizacao" value="${local}" ${i===0?'checked':''}>
          <label for="${id}">${local}</label>
        `;
      });
    });

  // Envia dados para o backend e mostra resultado
  document.getElementById('form-predizer').onsubmit = function(e) {
    e.preventDefault();
    const dados = {
      etnia: document.querySelector('input[name="etnia"]:checked').value,
      localizacao: document.querySelector('input[name="localizacao"]:checked').value,
      idade: parseInt(document.getElementById('idade').value)
    };
    fetch('http://127.0.0.1:5000/api/predizer', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(dados)
    })
    .then(res => res.json())
    .then(data => {
      document.getElementById('resultado').innerText = 
        data.classe_predita 
          ? `Tipo de caso previsto: ${data.classe_predita}`
          : `Erro: ${JSON.stringify(data)}`;
    });
  };
};
=======
window.onload = carregarDados;
>>>>>>> 05500c667be8304b614e3b749fed8cff693c75ea