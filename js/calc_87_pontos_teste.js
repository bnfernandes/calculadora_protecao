// calc_87_pontos_teste.js - Sugestão de Ponto de Teste (comissionamento) para a Função 87
// Em vez de varrer a curva com N pontos por trecho, o usuário informa um único
// Ifren e um fator sobre a curva característica; o site devolve o Idif que toca
// a fronteira disparo/não-disparo para esse fator, com botões de avanço/recuo em
// Ifren (passo informado pelo usuário). As correntes de injeção só são calculadas
// para relé de 2 enrolamentos, mesma limitação da planilha original.

// Ângulo (graus, sem normalizar) da corrente de teste para um enrolamento/fase,
// assumindo injeção trifásica equilibrada (Preencher_Ang_Trif do VBA)
function anguloTesteBase(dev, faseIdx, mp1, mp2, msf, codigoRaw2) {
    const baseFase = [0, 240, 120][faseIdx];
    const msfAdd = baseFase * msf;
    if (dev === 0) return baseFase + mp1 * 180 + msfAdd;
    return baseFase + 180 + mp2 * 180 + msfAdd - codigoRaw2 * 30;
}

function normalizarAngulo(ang) {
    return ((ang % 360) + 360) % 360;
}

// Um valor de corrente pode sair negativo da fórmula da planilha; convertido aqui
// para magnitude positiva + 180° no ângulo, mais fácil de configurar numa caixa de teste
function normalizarMagAng(valor, anguloBase) {
    return valor < 0
        ? { mag: -valor, ang: normalizarAngulo(anguloBase + 180) }
        : { mag: valor, ang: normalizarAngulo(anguloBase) };
}

// Correntes a injetar nos enrolamentos 1 e 2 para atingir o ponto (Ifren, Idif alvo)
// (trecho "Calcular Correntes a Serem Aplicadas" do VBA, só para 2 enrolamentos)
function correntesInjecao(idifAlvo, ifrenPt, taps, enrolamentos, config) {
    const tap1 = taps[0];
    const tap2 = taps[1];
    const i1 = tap1 * (idifAlvo / 2 + ifrenPt);
    const i2 = config.modeloRele === 1 // TD
        ? tap2 * (-idifAlvo / 2 + ifrenPt)
        : (enrolamentos[0].rtc / enrolamentos[1].rtc) * tap1 * (-idifAlvo / 2 + ifrenPt); // LD
    return { i1, i2 };
}

// Calcula o ponto de teste (Ifren informado, Idif = curva × fator) e exibe
// tabela de correntes de injeção + gráfico da região de operação com o ponto
function gerarPontoTeste() {
    const { config, enrolamentos } = lerFormulario87();
    const taps = calcularTaps(enrolamentos, config);

    const campoIfren = document.getElementById('ifrenTeste');
    let ifren = parseFloat(campoIfren.value) || 0;
    if (ifren < 0) {
        ifren = 0;
        campoIfren.value = 0;
    }

    const fator = parseFloat(document.getElementById('fatorTeste').value) || 0;

    const idifCurva = curvaOperacaoY(ifren, config);
    let idifAlvo = idifCurva * fator;
    const avisoNegativo = idifAlvo < 0;
    if (avisoNegativo) idifAlvo = 0;

    const atua = idifAlvo >= idifCurva;

    const suportaInjecao = config.numEnrolamentos === 2;
    let injecao = null;
    if (suportaInjecao) {
        const codigoRaw2 = parseInt(document.getElementById('codHor2').value) || 0;
        const mp1 = enrolamentos[0].polaridade === 'Saliente' ? 1 : 0;
        const mp2 = enrolamentos[1].polaridade === 'Saliente' ? 1 : 0;
        const msf = config.seqFases === 'ACB' ? 1 : 0;
        const { i1, i2 } = correntesInjecao(idifAlvo, ifren, taps, enrolamentos, config);
        injecao = ['A', 'B', 'C'].map((letra, faseIdx) => ({
            fase: letra,
            i1: normalizarMagAng(i1, anguloTesteBase(0, faseIdx, mp1, mp2, msf, codigoRaw2)),
            i2: normalizarMagAng(i2, anguloTesteBase(1, faseIdx, mp1, mp2, msf, codigoRaw2))
        }));
    }

    exibirPontoTeste({ fator, ifren, idifCurva, idifAlvo, avisoNegativo, atua, suportaInjecao, injecao });
    criarGraficoPontoTeste(ifren, idifAlvo, atua, config);
}

// Avança/recua o campo Ifren pelo passo informado e recalcula o ponto de teste.
// Nunca deixa Ifren ficar negativo (recuo é travado em 0).
function ajustarIfrenTeste(sentido) {
    const passo = parseFloat(document.getElementById('passoIfren').value) || 0;
    const campoIfren = document.getElementById('ifrenTeste');
    const atual = parseFloat(campoIfren.value) || 0;
    const novo = Math.max(0, atual + sentido * passo);
    campoIfren.value = novo;
    gerarPontoTeste();
}

function exibirPontoTeste({ fator, ifren, idifCurva, idifAlvo, avisoNegativo, atua, suportaInjecao, injecao }) {
    const regiao = fator > 1 ? 'região de disparo' : (fator < 1 ? 'região de restrição' : 'exatamente sobre a fronteira de disparo');
    let html = '<div class="resultados-87">';

    html += '<div class="resumo-idif-ifren">' +
        `<span><strong>I<sub>fren</sub>:</strong> ${ifren.toFixed(3)} xTAP</span>` +
        `<span><strong>I<sub>dif</sub> na curva:</strong> ${idifCurva.toFixed(3)} xTAP</span>` +
        `<span><strong>I<sub>dif</sub> alvo:</strong> ${idifAlvo.toFixed(3)} xTAP</span>` +
        `<span class="badge-atuacao ${atua ? 'badge-atua' : 'badge-nao-atua'}">${atua ? 'ATUA' : 'NÃO ATUA'}</span>` +
        '</div>';

    html += `<p><strong>Fator aplicado:</strong> ${fator.toFixed(3)} — ponto na <strong>${regiao}</strong>.</p>`;

    if (avisoNegativo) {
        html += '<p class="formula-nota" style="color: #cc0000;">Fator negativo levaria I<sub>dif</sub> alvo abaixo de zero — valor ajustado para 0.</p>';
    }

    if (!suportaInjecao) {
        html += '<p class="text-muted">Sugestão de correntes de injeção disponível apenas para relé de 2 enrolamentos (mesma limitação da planilha original).</p>';
    } else {
        html += '<div class="table-responsive"><table class="tabela-pontos-teste">';
        html += '<thead><tr><th>Fase</th><th>Enrolamento 1</th><th>Enrolamento 2</th></tr></thead><tbody>';
        injecao.forEach(inj => {
            html += `<tr><td>${inj.fase}</td>` +
                `<td>I<sub>1</sub> = ${inj.i1.mag.toFixed(3)}∠${inj.i1.ang.toFixed(1)}° A</td>` +
                `<td>I<sub>2</sub> = ${inj.i2.mag.toFixed(3)}∠${inj.i2.ang.toFixed(1)}° A</td></tr>`;
        });
        html += '</tbody></table></div>';
    }

    html += '</div>';
    document.getElementById('pontosTesteResultado').innerHTML = html;
}

// Gráfico da região de operação (curva característica + área acima dela) com um
// único marcador no ponto de teste — mesma lógica visual de criarGraficoDiferencial
// (calc_87_grafico.js), mas reduzida a um ponto em vez das 3 fases do cálculo principal
let _chartPontoTeste = null;

function criarGraficoPontoTeste(ifren, idifAlvo, atua, config) {
    const container = document.getElementById('grafico-ponto-teste');
    if (!container) return;

    if (!_chartPontoTeste) {
        _chartPontoTeste = echarts.init(container);
    }

    const maxIfren = Math.max(ifren * 1.3, config.pontoInflexao2 * 1.5, 10);
    const maxIdif = Math.max(idifAlvo * 1.3, config.sensibilidade * 2, 5);

    const pickupMin = config.sensibilidade;
    const pontoInflexao1 = config.pontoInflexao1;
    const pontoInflexao2 = config.pontoInflexao2;
    const ifren_final = maxIfren * 1.2;

    const curvaCaracteristica = [0, pontoInflexao1, pontoInflexao2, ifren_final]
        .map(i => [i, curvaOperacaoY(i, config)]);
    const idif_inflexao2 = curvaCaracteristica[2][1];
    const idif_final = curvaCaracteristica[3][1];

    const areaOperacao = [
        [0, pickupMin],
        [pontoInflexao1, pickupMin],
        [pontoInflexao2, idif_inflexao2],
        [ifren_final, idif_final],
        [ifren_final, maxIdif * 1.5],
        [0, maxIdif * 1.5],
        [0, pickupMin]
    ];

    const option = {
        title: {
            text: 'Ponto de Teste na Curva Característica',
            left: 'center',
            top: 10,
            textStyle: { fontSize: 16, fontWeight: 'bold' }
        },
        tooltip: {
            trigger: 'item',
            formatter: params => params.seriesName === 'Ponto de Teste'
                ? `Ponto de Teste — ${atua ? 'ATUA' : 'NÃO ATUA'}<br/>I<sub>fren</sub>: ${ifren.toFixed(3)} xTAP<br/>I<sub>dif</sub>: ${idifAlvo.toFixed(3)} xTAP`
                : params.seriesName
        },
        legend: {
            data: ['Curva Característica', 'Região de Operação', 'Ponto de Teste'],
            bottom: 10,
            textStyle: { fontSize: 11 }
        },
        grid: { left: '10%', right: '5%', bottom: '15%', top: '15%', containLabel: true },
        xAxis: {
            type: 'value',
            name: 'Corrente de Frenagem (xTAP)',
            nameLocation: 'middle',
            nameGap: 35,
            nameTextStyle: { fontSize: 13, fontWeight: 'bold' },
            min: 0,
            max: maxIfren * 1.2,
            splitLine: { show: true, lineStyle: { type: 'dashed', color: '#e0e0e0' } }
        },
        yAxis: {
            type: 'value',
            name: 'Corrente Diferencial (xTAP)',
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: { fontSize: 13, fontWeight: 'bold' },
            min: 0,
            max: Math.max(maxIdif * 1.3, idif_final * 1.1),
            splitLine: { show: true, lineStyle: { type: 'dashed', color: '#e0e0e0' } }
        },
        series: [
            {
                name: 'Região de Operação',
                type: 'line',
                data: areaOperacao,
                lineStyle: { width: 0 },
                areaStyle: { color: 'rgba(255, 0, 0, 0.1)' },
                symbol: 'none',
                smooth: false,
                z: 1
            },
            {
                name: 'Curva Característica',
                type: 'line',
                data: curvaCaracteristica,
                lineStyle: { color: '#333', width: 3, type: 'solid' },
                symbol: 'none',
                smooth: false,
                z: 2
            },
            {
                name: 'Ponto de Teste',
                type: 'scatter',
                data: [[ifren, idifAlvo]],
                symbol: atua ? 'triangle' : 'circle',
                symbolSize: atua ? 16 : 12,
                itemStyle: {
                    color: atua ? '#cc0000' : '#0066cc',
                    borderColor: atua ? '#7a0000' : '#0066cc',
                    borderWidth: atua ? 2 : 0
                },
                z: 3
            }
        ]
    };

    _chartPontoTeste.setOption(option, true);
}

window.addEventListener('resize', function() {
    if (_chartPontoTeste) _chartPontoTeste.resize();
});

document.getElementById('btnGerarPontoTeste').addEventListener('click', gerarPontoTeste);
document.getElementById('btnAvancarIfren').addEventListener('click', () => ajustarIfrenTeste(1));
document.getElementById('btnRecuarIfren').addEventListener('click', () => ajustarIfrenTeste(-1));
