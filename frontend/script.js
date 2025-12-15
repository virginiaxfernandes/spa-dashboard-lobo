let graficoRosca, graficoRegiao, graficoImportancia;

const API_BASE = "https://effective-potato-694g4rx4pqgwh57qx-5000.app.github.dev";

const cores = [
    '#3498db', '#2ecc71', '#e74c3c',
    '#f39c12', '#9b59b6', '#1abc9c'
];

async function carregarOpcoes() {
    const res = await fetch(`${API_BASE}/api/opcoes`);
    const dados = await res.json();

    preencherSelect('filtroLocal', dados.locais, true);
    preencherSelect('filtroTipo', dados.tipos, true);
    preencherSelect('cadLocal', dados.locais);
    preencherSelect('cadTipo', dados.tipos);
    preencherSelect('predLocal', dados.locais);
}

function preencherSelect(id, valores, todos = false) {
    const select = document.getElementById(id);
    select.innerHTML = `<option value="">${todos ? 'Todos' : 'Selecione'}</option>`;
    valores.forEach(v => {
        select.innerHTML += `<option value="${v}">${v}</option>`;
    });
}

async function carregarDados() {
    const params = new URLSearchParams();

    if (dataInicio.value) params.append('data_inicio', dataInicio.value);
    if (dataFim.value) params.append('data_fim', dataFim.value);
    if (filtroLocal.value) params.append('cidade', filtroLocal.value);
    if (filtroTipo.value) params.append('tipo', filtroTipo.value);

    const url = params.toString()
        ? `${API_BASE}/api/casos?${params}`
        : `${API_BASE}/api/casos`;

    await fetch(url);

    const res = await fetch(`${API_BASE}/api/estatisticas`);
    const stats = await res.json();

    grafico('graficoRosca', stats.tipos, 'doughnut');
    grafico('graficoRegiao', stats.regioes, 'bar');
    graficoImportanciaFn(stats.importancia);
}

function grafico(id, dados, tipo) {
    const ctx = document.getElementById(id);
    if (Chart.getChart(ctx)) Chart.getChart(ctx).destroy();

    new Chart(ctx, {
        type: tipo,
        data: {
            labels: Object.keys(dados),
            datasets: [{
                data: Object.values(dados),
                backgroundColor: cores
            }]
        }
    });
}

function graficoImportanciaFn(dados) {
    const ctx = document.getElementById('graficoImportancia');
    if (Chart.getChart(ctx)) Chart.getChart(ctx).destroy();

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dados.nomes,
            datasets: [{
                label: 'Importância',
                data: dados.valores,
                backgroundColor: '#2ecc71'
            }]
        },
        options: {
            indexAxis: 'y'
        }
    });
}

async function cadastrarOcorrencia() {
    const dados = {
        data: cadData.value,
        horario: cadHorario.value,
        local: cadLocal.value,
        tipo: cadTipo.value
    };

    const res = await fetch(`${API_BASE}/api/casos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (res.ok) {
        alert('Ocorrência cadastrada com sucesso!');
        carregarDados();
    } else {
        alert('Erro ao cadastrar ocorrência');
    }
}

async function fazerPrevisao() {
    const res = await fetch(`${API_BASE}/api/predizer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            local: predLocal.value,
            horario: predHorario.value
        })
    });

    const r = await res.json();
    textoPrevisao.innerText = `Tipo previsto: ${r.previsao}`;
    resultadoPrevisao.style.display = 'block';
}

window.onload = async () => {
    await carregarOpcoes();
    await carregarDados();
};
