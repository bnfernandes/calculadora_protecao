// calc_87_pontos_teste.js - Sugestão de Ponto(s) de Teste (comissionamento) para a Função 87
// Dois modos, alternados pelo checkbox "Gerar lista de pontos":
// - Ponto único (padrão): o usuário informa um Ifren e um fator sobre a curva
//   característica; o site devolve o Idif que toca a fronteira disparo/não-disparo
//   para esse fator, com botões de avanço/recuo em Ifren e gráfico interativo.
// - Lista de pontos: varre a curva em N pontos por trecho (equivalente às células
//   W4/W5/W6/W9 e à tabela Define_Pontos da planilha/VBA original), pensada para
//   uma versão impressa/PDF a ser usada no comissionamento em campo.
// As correntes de injeção só são calculadas para relé de 2 enrolamentos, em ambos
// os modos (mesma limitação da planilha original).

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

// Gera os pontos (Ifren, Idif) ao longo da curva: extremos B/C/D dos 3 trechos
// mais os pontos interiores pedidos em cada trecho (Qtd_Trecho_01/02/03 do VBA).
// O extremo A (Ifren=0) não é gerado: abaixo da frenagem mínima fisicamente
// possível pro Idif ali visado (frenagemMinima, calc_87.js), não existe
// corrente de injeção que alcance esse ponto — o Trecho 1 passa a começar
// nesse piso em vez de 0.
function gerarPontosCurva(config, qtd1, qtd2, qtd3, ifrenD, fator) {
    const p1 = config.pontoInflexao1;
    const p2 = config.pontoInflexao2;
    const pontos = [];

    function ponto(ifren, marco) {
        let idif = curvaOperacaoY(ifren, config);
        // Rede de segurança: mesmo pontos de trechos mais altos podem, em
        // curvas com inclinações extremas, cair abaixo do próprio piso —
        // corrige e recalcula o Idif nesse Ifren ajustado
        const minimo = frenagemMinima(idif * fator);
        if (ifren < minimo) {
            ifren = minimo;
            idif = curvaOperacaoY(ifren, config);
        }
        pontos.push({ ifren, idif, marco });
    }
    function interiores(de, ate, qtd) {
        if (qtd <= 0) return;
        const passo = (ate - de) / (qtd + 1);
        for (let i = 1; i <= qtd; i++) ponto(de + passo * i, '');
    }

    // Patamar (Ifren <= p1) tem Idif constante = sensibilidade x fator, então
    // o piso é o mesmo em todo o Trecho 1 — dá pra calcular uma vez só
    const ifrenMinimoTrecho1 = Math.min(frenagemMinima(curvaOperacaoY(0, config) * fator), p1);
    interiores(ifrenMinimoTrecho1, p1, qtd1);
    ponto(p1, 'B');
    interiores(p1, p2, qtd2);
    ponto(p2, 'C');
    interiores(p2, ifrenD, qtd3);
    ponto(ifrenD, 'D');

    return pontos;
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

    let idifCurva = curvaOperacaoY(ifren, config);
    let idifAlvo = idifCurva * fator;
    const avisoNegativo = idifAlvo < 0;
    if (avisoNegativo) idifAlvo = 0;

    // Abaixo da frenagem mínima fisicamente possível pro Idif alvo (ver
    // frenagemMinima em calc_87.js), a injeção não alcança esse Ifren —
    // corrige pro mínimo e recalcula a curva nesse ponto ajustado
    const ifrenMinimo = frenagemMinima(idifAlvo);
    const ifrenAjustado = ifren < ifrenMinimo;
    if (ifrenAjustado) {
        ifren = ifrenMinimo;
        campoIfren.value = ifren.toFixed(3);
        idifCurva = curvaOperacaoY(ifren, config);
        idifAlvo = idifCurva * fator;
    }

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

    exibirPontoTeste({ fator, ifren, idifCurva, idifAlvo, avisoNegativo, ifrenAjustado, atua, suportaInjecao, injecao });
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

function exibirPontoTeste({ fator, ifren, idifCurva, idifAlvo, avisoNegativo, ifrenAjustado, atua, suportaInjecao, injecao }) {
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

    if (ifrenAjustado) {
        html += '<p class="formula-nota" style="color: #cc0000;">I<sub>fren</sub> informado ficava abaixo do mínimo fisicamente possível pra esse I<sub>dif</sub> alvo ' +
            '(I<sub>fren</sub> &lt; I<sub>dif</sub>/2 nunca é alcançável — a injeção resultante teria esse I<sub>dif</sub>, mas com I<sub>fren</sub> preso em I<sub>dif</sub>/2) — ajustado para o mínimo.</p>';
    }

    if (!suportaInjecao) {
        html += '<p class="text-muted">Sugestão de correntes de injeção disponível apenas para relé de 2 enrolamentos. ' +
            'Para 3 enrolamentos, uma alternativa é injetar corrente em apenas 2 deles por vez, deixando o terceiro em zero, ' +
            'e repetir o teste trocando o par escolhido.</p>';
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

    const limites = calcularLimitesCurva87(config, [[ifren, idifAlvo]]);

    const pickupMin = config.sensibilidade;
    const pontoInflexao1 = config.pontoInflexao1;
    const pontoInflexao2 = config.pontoInflexao2;
    const ifren_final = limites.ifrenFinal;

    const curvaCaracteristica = [0, pontoInflexao1, pontoInflexao2, ifren_final]
        .map(i => [i, curvaOperacaoY(i, config)]);
    const idif_inflexao2 = curvaCaracteristica[2][1];
    const idif_final = curvaCaracteristica[3][1];

    const areaOperacao = [
        [0, pickupMin],
        [pontoInflexao1, pickupMin],
        [pontoInflexao2, idif_inflexao2],
        [ifren_final, idif_final],
        [ifren_final, limites.yMax],
        [0, limites.yMax],
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
            data: [
                { name: 'Curva Característica', icon: 'path://M-10,-1.5L10,-1.5L10,1.5L-10,1.5Z', itemStyle: { color: '#333' } },
                { name: 'Região de Operação', icon: 'rect', itemStyle: { color: 'rgba(255, 0, 0, 0.1)', borderWidth: 0 } },
                'Ponto de Teste'
            ],
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
            max: limites.xMax,
            splitLine: { show: true, lineStyle: { type: 'dashed', color: '#e0e0e0' } }
        },
        yAxis: {
            type: 'value',
            name: 'Corrente Diferencial (xTAP)',
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: { fontSize: 13, fontWeight: 'bold' },
            min: 0,
            max: limites.yMax,
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
                symbol: atua ? 'path://M -8 -8 L 8 8 M -8 8 L 8 -8' : 'circle',
                symbolSize: atua ? 16 : 12,
                itemStyle: {
                    color: atua ? 'transparent' : '#0066cc',
                    borderColor: atua ? '#cc0000' : '#0066cc',
                    borderWidth: atua ? 3 : 0,
                    borderCap: 'round'
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

// Gera a lista de pontos ao longo dos 3 trechos da curva (modo "lista de pontos"),
// reaproveitando o mesmo campo Fator de Idif do modo de ponto único
function gerarListaPontosTeste() {
    const { config, enrolamentos } = lerFormulario87();
    const taps = calcularTaps(enrolamentos, config);

    const qtd1 = parseInt(document.getElementById('qtdTrecho1').value) || 0;
    const qtd2 = parseInt(document.getElementById('qtdTrecho2').value) || 0;
    const qtd3 = parseInt(document.getElementById('qtdTrecho3').value) || 0;
    const fator = parseFloat(document.getElementById('fatorTeste').value) || 1;

    const campoIfrenD = document.getElementById('ifrenFinalD');
    const ifrenDInput = campoIfrenD.value;
    let ifrenD = ifrenDInput !== '' ? parseFloat(ifrenDInput) : config.pontoInflexao2 * 2;

    // Ifren Final (Ponto D) não pode ficar antes do 2º joelho, senão o Trecho 3
    // (definido como "depois do 2º joelho") vira um intervalo invertido/vazio
    const ifrenDMinimo = config.pontoInflexao2;
    const ifrenDAjustado = ifrenD < ifrenDMinimo;
    if (ifrenDAjustado) {
        ifrenD = ifrenDMinimo;
        campoIfrenD.value = ifrenD;
    }

    const suportaInjecao = config.numEnrolamentos === 2;
    const codigoRaw2 = parseInt(document.getElementById('codHor2').value) || 0;
    const mp1 = enrolamentos[0].polaridade === 'Saliente' ? 1 : 0;
    const mp2 = enrolamentos[1].polaridade === 'Saliente' ? 1 : 0;
    const msf = config.seqFases === 'ACB' ? 1 : 0;

    const linhas = gerarPontosCurva(config, qtd1, qtd2, qtd3, ifrenD, fator).map((p, idx) => {
        const idifAlvo = p.idif * fator;
        const linha = { ...p, idifAlvo, ponto: idx + 1 };

        if (suportaInjecao) {
            const { i1, i2 } = correntesInjecao(idifAlvo, p.ifren, taps, enrolamentos, config);
            linha.injecao = ['A', 'B', 'C'].map((letra, faseIdx) => ({
                fase: letra,
                i1: normalizarMagAng(i1, anguloTesteBase(0, faseIdx, mp1, mp2, msf, codigoRaw2)),
                i2: normalizarMagAng(i2, anguloTesteBase(1, faseIdx, mp1, mp2, msf, codigoRaw2))
            }));
        }
        return linha;
    });

    exibirListaPontosTeste(fator, ifrenD, ifrenDAjustado, qtd3, suportaInjecao, linhas);
    criarGraficoListaPontos(linhas, fator >= 1, config);
}

function exibirListaPontosTeste(fator, ifrenD, ifrenDAjustado, qtd3, suportaInjecao, linhas) {
    const regiao = fator > 1 ? 'região de disparo' : (fator < 1 ? 'região de restrição' : 'exatamente sobre a curva');
    let html = '<div class="resultados-87">';

    html += `<p><strong>Fator aplicado:</strong> ${fator.toFixed(3)} — pontos deslocados para a <strong>${regiao}</strong>.</p>`;
    html += `<p><strong>Ponto D (Ifren final):</strong> ${ifrenD.toFixed(3)} xTAP</p>`;

    if (ifrenDAjustado) {
        html += '<p class="formula-nota" style="color: #cc0000;">I<sub>fren</sub> Final (Ponto D) informado ficava antes do ' +
            '2º joelho (Ponto de Inflexão 2) — ajustado para o mínimo possível, exatamente sobre o 2º joelho.' +
            (qtd3 > 0 ? ' Como o Trecho 3 ficou com comprimento zero, os pontos pedidos nele coincidem com o próprio ' +
                'marco D — talvez faça sentido zerar "Pontos no Trecho 3" nesse caso.' : '') + '</p>';
    }

    if (!suportaInjecao) {
        html += '<p class="text-muted">Sugestão de correntes de injeção disponível apenas para relé de 2 enrolamentos. ' +
            'Para 3 enrolamentos, uma alternativa é injetar corrente em apenas 2 deles por vez, deixando o terceiro em zero, ' +
            'e repetir o teste trocando o par escolhido. Abaixo, somente os pontos da curva.</p>';
    }

    if (!suportaInjecao) {
        html += '<div class="table-responsive"><table class="tabela-pontos-teste">';
        html += '<thead><tr>' +
            '<th>Ponto</th><th>Marco</th><th>I<sub>fren</sub> (xTAP)</th>' +
            '<th>I<sub>dif</sub> curva (xTAP)</th><th>Fator × I<sub>dif</sub> (xTAP)</th>' +
            '</tr></thead><tbody>';
        linhas.forEach(l => {
            html += `<tr><td>${l.ponto}</td><td>${l.marco || '—'}</td>` +
                `<td>${l.ifren.toFixed(3)}</td><td>${l.idif.toFixed(3)}</td><td>${l.idifAlvo.toFixed(3)}</td></tr>`;
        });
        html += '</tbody></table></div>';
    } else {
        // Uma única tabela: Ponto/Marco/Ifren/Idif ocupam 1 célula mesclada
        // (rowspan) por ponto, com Ia/Ib/Ic empilhadas em linhas dentro dele.
        // Cada ponto vira seu próprio <tbody> — várias tbody num mesmo table
        // são válidas em HTML, e isso permite proteger o grupo de 3 linhas
        // inteiro de quebra de página na impressão (break-inside em tbody,
        // ver styles.css), coisa que não dá pra fazer em <tr> soltos quando
        // colunas vizinhas dependem de rowspan.
        html += '<div class="table-responsive"><table class="tabela-pontos-teste">';
        html += '<thead><tr>' +
            '<th>Ponto</th><th>Marco</th><th>I<sub>fren</sub> (xTAP)</th>' +
            '<th>I<sub>dif</sub> curva (xTAP)</th><th>Fator × I<sub>dif</sub> (xTAP)</th>' +
            '<th>Enrolamento 1</th><th>Enrolamento 2</th>' +
            '</tr></thead>';
        linhas.forEach(l => {
            html += '<tbody>';
            l.injecao.forEach((inj, faseIdx) => {
                html += `<tr class="${faseIdx === 0 ? 'linha-novo-ponto' : ''}">`;
                if (faseIdx === 0) {
                    html += `<td rowspan="3">${l.ponto}</td><td rowspan="3">${l.marco || '—'}</td>` +
                        `<td rowspan="3">${l.ifren.toFixed(3)}</td><td rowspan="3">${l.idif.toFixed(3)}</td>` +
                        `<td rowspan="3">${l.idifAlvo.toFixed(3)}</td>`;
                }
                html += `<td>I<sub>${inj.fase}1</sub> = ${inj.i1.mag.toFixed(3)}∠${inj.i1.ang.toFixed(1)}° A</td>` +
                    `<td>I<sub>${inj.fase}2</sub> = ${inj.i2.mag.toFixed(3)}∠${inj.i2.ang.toFixed(1)}° A</td></tr>`;
            });
            html += '</tbody>';
        });
        html += '</table></div>';
    }

    html += '</div>';

    document.getElementById('pontosTesteResultado').innerHTML = html;
}

// Gráfico da região de operação com todos os pontos da lista marcados e
// numerados (1, 2, 3...) na mesma ordem da tabela — mesma lógica visual de
// criarGraficoPontoTeste, mas com N marcadores em vez de um único
let _chartListaPontos = null;

function criarGraficoListaPontos(linhas, atua, config) {
    const container = document.getElementById('grafico-lista-pontos');
    if (!container) return;

    if (!_chartListaPontos) {
        _chartListaPontos = echarts.init(container);
    }

    const limites = calcularLimitesCurva87(config, linhas.map(l => [l.ifren, l.idifAlvo]));

    const pickupMin = config.sensibilidade;
    const pontoInflexao1 = config.pontoInflexao1;
    const pontoInflexao2 = config.pontoInflexao2;
    const ifren_final = limites.ifrenFinal;

    const curvaCaracteristica = [0, pontoInflexao1, pontoInflexao2, ifren_final]
        .map(i => [i, curvaOperacaoY(i, config)]);
    const idif_inflexao2 = curvaCaracteristica[2][1];
    const idif_final = curvaCaracteristica[3][1];

    const areaOperacao = [
        [0, pickupMin],
        [pontoInflexao1, pickupMin],
        [pontoInflexao2, idif_inflexao2],
        [ifren_final, idif_final],
        [ifren_final, limites.yMax],
        [0, limites.yMax],
        [0, pickupMin]
    ];

    const option = {
        title: {
            text: 'Pontos de Teste na Curva Característica',
            left: 'center',
            top: 10,
            textStyle: { fontSize: 16, fontWeight: 'bold' }
        },
        tooltip: {
            trigger: 'item',
            formatter: params => {
                if (params.seriesName !== 'Pontos de Teste') return params.seriesName;
                const l = linhas[params.dataIndex];
                return `Ponto ${l.ponto}${l.marco ? ' (' + l.marco + ')' : ''} — ${atua ? 'ATUA' : 'NÃO ATUA'}` +
                    `<br/>I<sub>fren</sub>: ${l.ifren.toFixed(3)} xTAP<br/>I<sub>dif</sub>: ${l.idifAlvo.toFixed(3)} xTAP`;
            }
        },
        legend: {
            data: [
                { name: 'Curva Característica', icon: 'path://M-10,-1.5L10,-1.5L10,1.5L-10,1.5Z', itemStyle: { color: '#333' } },
                { name: 'Região de Operação', icon: 'rect', itemStyle: { color: 'rgba(255, 0, 0, 0.1)', borderWidth: 0 } },
                'Pontos de Teste'
            ],
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
            max: limites.xMax,
            splitLine: { show: true, lineStyle: { type: 'dashed', color: '#e0e0e0' } }
        },
        yAxis: {
            type: 'value',
            name: 'Corrente Diferencial (xTAP)',
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: { fontSize: 13, fontWeight: 'bold' },
            min: 0,
            max: limites.yMax,
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
                name: 'Pontos de Teste',
                type: 'scatter',
                data: linhas.map(l => [l.ifren, l.idifAlvo]),
                symbol: atua ? 'path://M -8 -8 L 8 8 M -8 8 L 8 -8' : 'circle',
                symbolSize: atua ? 16 : 12,
                itemStyle: {
                    color: atua ? 'transparent' : '#0066cc',
                    borderColor: atua ? '#cc0000' : '#0066cc',
                    borderWidth: atua ? 3 : 0,
                    borderCap: 'round'
                },
                label: {
                    show: true,
                    formatter: params => linhas[params.dataIndex].ponto,
                    position: 'top',
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: atua ? '#cc0000' : '#0066cc'
                },
                z: 3
            }
        ]
    };

    _chartListaPontos.setOption(option, true);
}

window.addEventListener('resize', function() {
    if (_chartListaPontos) _chartListaPontos.resize();
});

document.getElementById('btnGerarPontoTeste').addEventListener('click', gerarPontoTeste);
document.getElementById('btnAvancarIfren').addEventListener('click', () => ajustarIfrenTeste(1));
document.getElementById('btnRecuarIfren').addEventListener('click', () => ajustarIfrenTeste(-1));
document.getElementById('btnGerarLista').addEventListener('click', gerarListaPontosTeste);
