let graficoRosca = null;
let graficoRegiao = null;
let graficoImportancia = null;
let opcoesDisponiveis = {};

const cores = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
    '#1abc9c', '#d35400', '#34495e', '#7f8c8d', '#27ae60'
];

async function carregarOpcoes() {
    try {
        const res = await fetch('http://localhost:5000/api/opcoes');
        opcoesDisponiveis = await res.json();
        
        preencherSelect('filtroLocal', opcoesDisponiveis.locais);
        preencherSelect('filtroTipo', opcoesDisponiveis.tipos);
        preencherSelect('cadLocal', opcoesDisponiveis.locais);
        preencherSelect('cadTipo', opcoesDisponiveis.tipos);
        preencherSelect('predLocal', opcoesDisponiveis.locais);
        
    } catch (error) {
        console.error('Erro ao carregar opções:', error);
    }
}

function preencherSelect(id, valores) {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">Todos</option>';
    valores.forEach(valor => {
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = valor;
        select.appendChild(option);
    });
}

async function carregarDados() {
    try {
        const params = new URLSearchParams();
        
        const dataInicio = document.getElementById('dataInicio').value;
        const dataFim = document.getElementById('dataFim').value;
        const filtroLocal = document.getElementById('filtroLocal').value;
        const filtroTipo = document.getElementById('filtroTipo').value;
        
        if (dataInicio) params.append('data_inicio', dataInicio);
        if (dataFim) params.append('data_fim', dataFim);
        if (filtroLocal) params.append('cidade', filtroLocal);
        if (filtroTipo) params.append('tipo', filtroTipo);
        
        const url = params.toString() ? 
            `http://localhost:5000/api/casos?${params}` : 
            'http://localhost:5000/api/casos';
        
        const res = await fetch(url);
        const casos = await res.json();
        
        const resStats = await fetch('http://localhost:5000/api/estatisticas');
        const estatisticas = await resStats.json();
        
        atualizarGraficoRosca(estatisticas.tipos);
        atualizarGraficoRegiao(estatisticas.regioes);
        atualizarGraficoImportancia(estatisticas.importancia);
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados');
    }
}

function atualizarGraficoRosca(dados) {
    const ctx = document.getElementById('graficoRosca').getContext('2d');
    
    if (graficoRosca) graficoRosca.destroy();
    
    const labels = Object.keys(dados);
    const valores = Object.values(dados);
    
    graficoRosca = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: cores.slice(0, labels.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function atualizarGraficoRegiao(dados) {
    const ctx = document.getElementById('graficoRegiao').getContext('2d');
    
    if (graficoRegiao) graficoRegiao.destroy();
    
    const labels = Object.keys(dados);
    const valores = Object.values(dados);
    
    graficoRegiao = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ocorrências',
                data: valores,
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Quantidade'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Região'
                    }
                }
            }
        }
    });
}

function atualizarGraficoImportancia(dados) {
    const ctx = document.getElementById('graficoImportancia').getContext('2d');
    
    if (graficoImportancia) graficoImportancia.destroy();
    
    graficoImportancia = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dados.nomes,
            datasets: [{
                label: 'Importância',
                data: dados.valores,
                backgroundColor: '#2ecc71',
                borderColor: '#27ae60',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Importância'
                    }
                }
            }
        }
    });
}

async function cadastrarOcorrencia() {
    try {
        const dados = {
            data: document.getElementById('cadData').value,
            horario: document.getElementById('cadHorario').value,
            local: document.getElementById('cadLocal').value,
            tipo: document.getElementById('cadTipo').value
        };
        
        if (!dados.data || !dados.horario || !dados.local || !dados.tipo) {
            alert('Preencha todos os campos!');
            return;
        }
        
        const res = await fetch('http://localhost:5000/api/casos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        const resultado = await res.json();
        
        if (res.ok) {
            alert('✅ Ocorrência cadastrada com sucesso!');
            document.getElementById('cadData').value = '';
            document.getElementById('cadHorario').value = '';
            carregarDados();
        } else {
            alert(`Erro: ${resultado.erro}`);
        }
        
    } catch (error) {
        console.error('Erro ao cadastrar:', error);
        alert('Erro ao cadastrar ocorrência');
    }
}

async function fazerPrevisao() {
    try {
        const dados = {
            local: document.getElementById('predLocal').value,
            horario: document.getElementById('predHorario').value
        };
        
        if (!dados.local || !dados.horario) {
            alert('Informe local e horário!');
            return;
        }
        
        const res = await fetch('http://localhost:5000/api/predizer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        const resultado = await res.json();
        
        if (res.ok) {
            document.getElementById('textoPrevisao').textContent = 
                `Tipo previsto: ${resultado.previsao}`;
            document.getElementById('resultadoPrevisao').style.display = 'block';
        } else {
            alert(`Erro: ${resultado.erro}`);
        }
        
    } catch (error) {
        console.error('Erro na previsão:', error);
        alert('Erro ao fazer previsão');
    }
}

window.onload = async function() {
    await carregarOpcoes();
    await carregarDados();
    
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('cadData').value = hoje;
    document.getElementById('dataInicio').value = hoje;
    document.getElementById('dataFim').value = hoje;
};