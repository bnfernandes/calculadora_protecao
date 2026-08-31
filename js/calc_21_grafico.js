// ============================================================================
// FUNÇÃO 21 - PROTEÇÃO DE DISTÂNCIA
// Arquivo: calc_21_grafico.js
// Descrição: Geração de gráficos com ECharts (dois gráficos separados)
// ============================================================================

/**
 * Cria dois gráficos separados: um para fase-fase e outro para fase-terra
 * @param {Object} resultados - Resultados calculados
 */
function criarGraficosFaseFaseFaseTerra(resultados) {
    const areaResultados = document.getElementById('resultados');
    if (!areaResultados) return;
    
    // Remover gráficos anteriores se existirem
    const graficosAntigos = document.querySelectorAll('.grafico-protecao-21');
    graficosAntigos.forEach(g => g.remove());
    
    // Criar container para gráfico fase-fase
    const divGraficoFaseFase = document.createElement('div');
    divGraficoFaseFase.className = 'resultado-secao mt-4 grafico-protecao-21';
    divGraficoFaseFase.innerHTML = `
        <h6 class="resultado-titulo">Gráfico - Faltas Fase-Fase (Plano R-X)</h6>
        <div id="grafico-21-fase-fase" style="width: 100%; height: 600px;"></div>
    `;
    areaResultados.appendChild(divGraficoFaseFase);
    
    // Criar container para gráfico fase-terra
    const divGraficoFaseTerra = document.createElement('div');
    divGraficoFaseTerra.className = 'resultado-secao mt-4 grafico-protecao-21';
    divGraficoFaseTerra.innerHTML = `
        <h6 class="resultado-titulo">Gráfico - Faltas Fase-Terra (Plano R-X)</h6>
        <div id="grafico-21-fase-terra" style="width: 100%; height: 600px;"></div>
    `;
    areaResultados.appendChild(divGraficoFaseTerra);
    
    // Gerar gráfico fase-fase
    criarGraficoFaseFase(resultados);
    
    // Gerar gráfico fase-terra
    criarGraficoFaseTerra(resultados);
}

/**
 * Cria o gráfico para faltas fase-fase
 * @param {Object} resultados - Resultados calculados
 */
function criarGraficoFaseFase(resultados) {
    const areaGrafico = document.getElementById('grafico-21-fase-fase');
    if (!areaGrafico) return;
    
    const chart = echarts.init(areaGrafico);
    const series = [];
    const cores = ['#e30613', '#0066cc', '#00cc66', '#ff9900', '#9933cc'];
    
    resultados.zonas.forEach((zona, idx) => {
        if (zona.faseFase) {
            // Série para Frente
            if (zona.faseFase.frente && zona.faseFase.frente.vertices.length > 0) {
                const dadosFrente = zona.faseFase.frente.vertices.map(v => [v.R, v.X]);
                dadosFrente.push(dadosFrente[0]); // Fechar polígono
                
                series.push({
                    name: `Z${zona.numero} - Frente`,
                    type: 'line',
                    data: dadosFrente,
                    lineStyle: {
                        color: cores[idx % cores.length],
                        width: 2
                    },
                    itemStyle: {
                        color: cores[idx % cores.length]
                    },
                    symbol: 'circle',
                    symbolSize: 6,
                    smooth: false,
                    areaStyle: {
                        color: cores[idx % cores.length],
                        opacity: 0.1
                    }
                });
            }
            
            // Série para Reverso
            if (zona.faseFase.reverso && zona.faseFase.reverso.vertices.length > 0) {
                const dadosReverso = zona.faseFase.reverso.vertices.map(v => [v.R, v.X]);
                dadosReverso.push(dadosReverso[0]); // Fechar polígono
                
                series.push({
                    name: `Z${zona.numero} - Reverso`,
                    type: 'line',
                    data: dadosReverso,
                    lineStyle: {
                        color: cores[idx % cores.length],
                        width: 2,
                        type: 'dashed'
                    },
                    itemStyle: {
                        color: cores[idx % cores.length]
                    },
                    symbol: 'triangle',
                    symbolSize: 6,
                    smooth: false,
                    areaStyle: {
                        color: cores[idx % cores.length],
                        opacity: 0.05
                    }
                });
            }
        }
    });
    
    const option = {
        title: {
            text: 'Região de Operação - Faltas Fase-Fase',
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'bold'
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (params.data && params.data.length === 2) {
                    return `${params.seriesName}<br/>R: ${params.data[0].toFixed(4)} Ω<br/>X: ${params.data[1].toFixed(4)} Ω`;
                }
                return params.seriesName;
            }
        },
        legend: {
            data: series.map(s => s.name),
            top: 30,
            type: 'scroll'
        },
        grid: {
            left: '10%',
            right: '13%',
            bottom: '15%',
            top: '20%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: 'R (Ω) - Resistência',
            nameLocation: 'middle',
            nameGap: 30,
            nameTextStyle: {
                fontSize: 14,
                fontWeight: 'bold'
            },
            axisLine: {
                lineStyle: {
                    color: '#333'
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed',
                    color: '#ddd'
                }
            }
        },
        yAxis: {
            type: 'value',
            name: 'X (Ω) - Reatância',
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: {
                fontSize: 14,
                fontWeight: 'bold'
            },
            axisLine: {
                lineStyle: {
                    color: '#333'
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed',
                    color: '#ddd'
                }
            }
        },
        series: series,
        toolbox: {
            feature: {
                saveAsImage: {
                    title: 'Salvar como imagem',
                    pixelRatio: 2
                },
                dataZoom: {
                    title: {
                        zoom: 'Zoom',
                        back: 'Restaurar'
                    }
                },
                restore: {
                    title: 'Restaurar'
                }
            },
            right: 20,
            top: 30
        },
        dataZoom: [
            {
                type: 'inside',
                xAxisIndex: 0,
                filterMode: 'none'
            },
            {
                type: 'inside',
                yAxisIndex: 0,
                filterMode: 'none'
            },
            {
                type: 'slider',
                xAxisIndex: 0,
                filterMode: 'none',
                bottom: 10
            },
            {
                type: 'slider',
                yAxisIndex: 0,
                filterMode: 'none',
                right: 10
            }
        ]
    };
    
    chart.setOption(option);
    
    // Responsividade
    window.addEventListener('resize', function() {
        chart.resize();
    });
    
    // Armazenar instância do gráfico
    window.graficoFaseFaseInstance = chart;
}

/**
 * Cria o gráfico para faltas fase-terra
 * @param {Object} resultados - Resultados calculados
 */
function criarGraficoFaseTerra(resultados) {
    const areaGrafico = document.getElementById('grafico-21-fase-terra');
    if (!areaGrafico) return;
    
    const chart = echarts.init(areaGrafico);
    const series = [];
    const cores = ['#e30613', '#0066cc', '#00cc66', '#ff9900', '#9933cc'];
    
    resultados.zonas.forEach((zona, idx) => {
        if (zona.faseTerra) {
            // Série para Frente
            if (zona.faseTerra.frente && zona.faseTerra.frente.vertices.length > 0) {
                const dadosFrente = zona.faseTerra.frente.vertices.map(v => [v.R, v.X]);
                dadosFrente.push(dadosFrente[0]); // Fechar polígono
                
                series.push({
                    name: `Z${zona.numero} - Frente (α=${zona.faseTerra.alpha.toFixed(2)}°)`,
                    type: 'line',
                    data: dadosFrente,
                    lineStyle: {
                        color: cores[idx % cores.length],
                        width: 2
                    },
                    itemStyle: {
                        color: cores[idx % cores.length]
                    },
                    symbol: 'circle',
                    symbolSize: 6,
                    smooth: false,
                    areaStyle: {
                        color: cores[idx % cores.length],
                        opacity: 0.1
                    }
                });
            }
            
            // Série para Reverso
            if (zona.faseTerra.reverso && zona.faseTerra.reverso.vertices.length > 0) {
                const dadosReverso = zona.faseTerra.reverso.vertices.map(v => [v.R, v.X]);
                dadosReverso.push(dadosReverso[0]); // Fechar polígono
                
                series.push({
                    name: `Z${zona.numero} - Reverso (α=${zona.faseTerra.alpha.toFixed(2)}°)`,
                    type: 'line',
                    data: dadosReverso,
                    lineStyle: {
                        color: cores[idx % cores.length],
                        width: 2,
                        type: 'dashed'
                    },
                    itemStyle: {
                        color: cores[idx % cores.length]
                    },
                    symbol: 'triangle',
                    symbolSize: 6,
                    smooth: false,
                    areaStyle: {
                        color: cores[idx % cores.length],
                        opacity: 0.05
                    }
                });
            }
        }
    });
    
    const option = {
        title: {
            text: 'Região de Operação - Faltas Fase-Terra (com Compensação Homopolar)',
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'bold'
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (params.data && params.data.length === 2) {
                    return `${params.seriesName}<br/>R: ${params.data[0].toFixed(4)} Ω<br/>X: ${params.data[1].toFixed(4)} Ω`;
                }
                return params.seriesName;
            }
        },
        legend: {
            data: series.map(s => s.name),
            top: 30,
            type: 'scroll'
        },
        grid: {
            left: '10%',
            right: '13%',
            bottom: '15%',
            top: '20%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: 'R (Ω) - Resistência',
            nameLocation: 'middle',
            nameGap: 30,
            nameTextStyle: {
                fontSize: 14,
                fontWeight: 'bold'
            },
            axisLine: {
                lineStyle: {
                    color: '#333'
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed',
                    color: '#ddd'
                }
            }
        },
        yAxis: {
            type: 'value',
            name: 'X (Ω) - Reatância',
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: {
                fontSize: 14,
                fontWeight: 'bold'
            },
            axisLine: {
                lineStyle: {
                    color: '#333'
                }
            },
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed',
                    color: '#ddd'
                }
            }
        },
        series: series,
        toolbox: {
            feature: {
                saveAsImage: {
                    title: 'Salvar como imagem',
                    pixelRatio: 2
                },
                dataZoom: {
                    title: {
                        zoom: 'Zoom',
                        back: 'Restaurar'
                    }
                },
                restore: {
                    title: 'Restaurar'
                }
            },
            right: 20,
            top: 30
        },
        dataZoom: [
            {
                type: 'inside',
                xAxisIndex: 0,
                filterMode: 'none'
            },
            {
                type: 'inside',
                yAxisIndex: 0,
                filterMode: 'none'
            },
            {
                type: 'slider',
                xAxisIndex: 0,
                filterMode: 'none',
                bottom: 10
            },
            {
                type: 'slider',
                yAxisIndex: 0,
                filterMode: 'none',
                right: 10
            }
        ]
    };
    
    chart.setOption(option);
    
    // Responsividade
    window.addEventListener('resize', function() {
        chart.resize();
    });
    
    // Armazenar instância do gráfico
    window.graficoFaseTerraInstance = chart;
}

// ============================================================================
// PONTO DE TESTE (plano Z) — formulário abaixo dos gráficos onde o usuário
// informa Módulo/Ângulo ou R/X (um par calcula o outro) e vê o ponto marcado
// nos dois gráficos. Por enquanto só desenha — não avalia dentro/fora de
// nenhuma zona.
// ============================================================================

const NOME_SERIE_PONTO_TESTE_21 = 'Ponto informado';

/**
 * Cria o formulário de ponto de teste logo após os gráficos. #resultados é
 * reconstruído do zero a cada cálculo (exibirResultados21 faz innerHTML=,
 * mesmo padrão que a tabela de debug e os gráficos já seguem), então o
 * formulário não sobrevive entre cálculos — sempre recriado aqui, em branco.
 * O .remove() é só defensivo (mesmo padrão de criarGraficosFaseFaseFaseTerra
 * pros containers de gráfico), já que na prática nunca deveria sobrar um.
 */
function garantirFormularioPontoTeste21() {
    const areaResultados = document.getElementById('resultados');
    if (!areaResultados) return;

    const existente = document.getElementById('pontoTesteZ21');
    if (existente) existente.remove();

    const div = document.createElement('div');
    div.className = 'resultado-secao mt-4';
    div.id = 'pontoTesteZ21';
    div.innerHTML = `
        <h6 class="resultado-titulo">Ponto de Teste (plano Z)</h6>
        <p class="text-muted" style="font-size: 13px; margin-bottom: 15px;">
            Informe o módulo e ângulo da impedância, ou diretamente R e X — preencher um par calcula o outro.
            O ponto é desenhado nos dois gráficos acima.
        </p>
        <div class="row">
            <div class="col-3">
                <div class="form-group">
                    <label for="pontoZModulo" class="form-label">Módulo |Z| [Ω]</label>
                    <input type="number" class="form-control" id="pontoZModulo" step="0.01">
                </div>
            </div>
            <div class="col-3">
                <div class="form-group">
                    <label for="pontoZAngulo" class="form-label">Ângulo θ [º]</label>
                    <input type="number" class="form-control" id="pontoZAngulo" step="0.1">
                </div>
            </div>
            <div class="col-3">
                <div class="form-group">
                    <label for="pontoZR" class="form-label">R [Ω]</label>
                    <input type="number" class="form-control" id="pontoZR" step="0.01">
                </div>
            </div>
            <div class="col-3">
                <div class="form-group">
                    <label for="pontoZX" class="form-label">X [Ω]</label>
                    <input type="number" class="form-control" id="pontoZX" step="0.01">
                </div>
            </div>
        </div>
        <p class="text-muted" style="font-size: 13px; margin: 15px 0;">
            Informando também uma corrente I, calcula as tensões e correntes de teste que reproduzem esse Z —
            trifásico (Z=V/I) e monofásico (Z=V<sub>a</sub>/(I<sub>a</sub>·(1+k<sub>n</sub>))), esse último
            precisando do k<sub>n</sub> (mesma compensação homopolar usada nas zonas).
        </p>
        <div class="row">
            <div class="col-4">
                <div class="form-group">
                    <label for="pontoZCorrente" class="form-label">Corrente I [A]</label>
                    <input type="number" class="form-control" id="pontoZCorrente" step="0.01">
                </div>
            </div>
            <div class="col-4">
                <div class="form-group">
                    <label for="pontoZModuloKn" class="form-label">Módulo k<sub>n</sub></label>
                    <input type="number" class="form-control" id="pontoZModuloKn" step="0.01">
                </div>
            </div>
            <div class="col-4">
                <div class="form-group">
                    <label for="pontoZAnguloKn" class="form-label">Ângulo k<sub>n</sub> [º]</label>
                    <input type="number" class="form-control" id="pontoZAnguloKn" step="0.1">
                </div>
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Preencher k<sub>n</sub> pelo valor de uma zona:</label>
            <div id="pontoZBotoesKn" style="display: flex; gap: 8px; flex-wrap: wrap;"></div>
        </div>
        <div id="pontoZResultadoVI"></div>
    `;
    areaResultados.appendChild(div);

    criarBotoesPreencherKn21();

    const modulo = document.getElementById('pontoZModulo');
    const angulo = document.getElementById('pontoZAngulo');
    const rEl = document.getElementById('pontoZR');
    const xEl = document.getElementById('pontoZX');
    const correnteEl = document.getElementById('pontoZCorrente');
    const knModuloEl = document.getElementById('pontoZModuloKn');
    const knAnguloEl = document.getElementById('pontoZAnguloKn');
    let atualizando = false;

    function atualizarTudo() {
        desenharPontoTesteAtual21();
        exibirVICalculadas21();
    }

    function deModuloAngulo() {
        if (atualizando) return;
        const m = parseFloat(modulo.value);
        const a = parseFloat(angulo.value);
        if (isNaN(m) || isNaN(a)) return;
        const rad = (a * Math.PI) / 180;
        atualizando = true;
        rEl.value = (m * Math.cos(rad)).toFixed(4);
        xEl.value = (m * Math.sin(rad)).toFixed(4);
        atualizando = false;
        atualizarTudo();
    }

    function deRX() {
        if (atualizando) return;
        const r = parseFloat(rEl.value);
        const x = parseFloat(xEl.value);
        if (isNaN(r) || isNaN(x)) return;
        atualizando = true;
        modulo.value = Math.hypot(r, x).toFixed(4);
        angulo.value = ((Math.atan2(x, r) * 180) / Math.PI).toFixed(4);
        atualizando = false;
        atualizarTudo();
    }

    modulo.addEventListener('input', deModuloAngulo);
    angulo.addEventListener('input', deModuloAngulo);
    rEl.addEventListener('input', deRX);
    xEl.addEventListener('input', deRX);
    correnteEl.addEventListener('input', exibirVICalculadas21);
    knModuloEl.addEventListener('input', exibirVICalculadas21);
    knAnguloEl.addEventListener('input', exibirVICalculadas21);
}

/**
 * Cria os 5 botões "Z1".."Z5" que preenchem Módulo/Ângulo kn com o valor já
 * configurado na respectiva zona — mesmo padrão do botão "Equilibrar" (E) da
 * função 67 (preenche a partir de um valor de referência, sem travar o campo
 * pra edição manual depois). O botão fica desabilitado (cor diferente, sem
 * clique) quando a zona está indisponível pra fornecer um kn de fato: zona
 * desmarcada ou Habilitação terra inativa — as duas caem no mesmo caso, já
 * que desmarcar a zona já força Habilitação terra pra "inativo"
 * (atualizarVisibilidadeZona, calc_21.js), então checar só essa basta.
 * O estado é calculado uma vez, no momento em que essa seção é (re)criada —
 * mesmo "retrato do momento do Calcular" que o resto do painel de resultados
 * já segue, sem tentar acompanhar mudanças feitas no formulário depois.
 */
function criarBotoesPreencherKn21() {
    const container = document.getElementById('pontoZBotoesKn');
    if (!container) return;

    const knModuloEl = document.getElementById('pontoZModuloKn');
    const knAnguloEl = document.getElementById('pontoZAnguloKn');

    let html = '';
    for (let zona = 1; zona <= 5; zona++) {
        const habTerraEl = document.getElementById(`z${zona}HabilitacaoTerra`);
        const disponivel = !!habTerraEl && habTerraEl.value === 'ativo';
        html += `<button type="button" class="btn-preencher-zona" data-zona="${zona}" ${disponivel ? '' : 'disabled'} title="${disponivel ? `Preencher com o kn da Zona ${zona}` : `Zona ${zona} desativada ou sem fase-terra habilitada`}">Z${zona}</button>`;
    }
    container.innerHTML = html;

    container.querySelectorAll('.btn-preencher-zona').forEach(btn => {
        btn.addEventListener('click', () => {
            const zona = btn.dataset.zona;
            const moduloOrigem = document.getElementById(`z${zona}ModuloKn`);
            const anguloOrigem = document.getElementById(`z${zona}AnguloKn`);
            if (!moduloOrigem || !anguloOrigem) return;

            knModuloEl.value = moduloOrigem.value;
            knAnguloEl.value = anguloOrigem.value;
            exibirVICalculadas21();
        });
    });
}

/**
 * Normaliza ângulo para o intervalo [0, 360) — mesma convenção da tabela de
 * pontos de teste da função 87.
 * @param {number} anguloGraus
 * @returns {number}
 */
function normalizarAngulo21(anguloGraus) {
    return ((anguloGraus % 360) + 360) % 360;
}

/**
 * A partir de Z (R/X já preenchidos) e da Corrente I informada, calcula e
 * exibe as tensões/correntes de teste que reproduzem esse Z — inspirado na
 * tabela de correntes de injeção da função 87 (mesma notação mag∠ang°, mesma
 * classe .tabela-pontos-teste), mas sem o fluxo de botão/avançar de lá: essa
 * seção já é toda em tempo real, então só recalcula a cada tecla digitada.
 * Caso trifásico (Z=V/I): correntes equilibradas Ia∠0°/Ib∠240°/Ic∠120°
 * (mesma convenção de referência de fase da função 67), Vx = Z·Ix.
 * Caso monofásico (Z=Va/(Ia·(1+kn))): Ia∠0°, Va = Z·Ia·(1+kn) — (1+kn) é
 * calculado como número complexo a partir de Módulo/Ângulo kn, mesma
 * fórmula de calcularAlpha (calc_21.js), só que aqui preservando o módulo
 * também (lá só o ângulo importa).
 */
function exibirVICalculadas21() {
    const container = document.getElementById('pontoZResultadoVI');
    if (!container) return;

    const r = parseFloat(document.getElementById('pontoZR').value);
    const x = parseFloat(document.getElementById('pontoZX').value);
    const corrente = parseFloat(document.getElementById('pontoZCorrente').value);

    if (isNaN(r) || isNaN(x) || isNaN(corrente)) {
        container.innerHTML = '';
        return;
    }

    const moduloZ = Math.hypot(r, x);
    const anguloZ = (Math.atan2(x, r) * 180) / Math.PI;

    let html = '';

    // --- Trifásico: Z = V/I ---
    html += '<div class="resultado-secao mt-3">';
    html += '<h6 class="resultado-titulo">Falta trifásica</h6>';
    html += '<div class="table-responsive"><table class="tabela-pontos-teste">';
    html += '<thead><tr><th>Corrente</th><th>Tensão</th></tr></thead><tbody>';
    [['A', 0], ['B', 240], ['C', 120]].forEach(([fase, anguloI]) => {
        const anguloV = normalizarAngulo21(anguloZ + anguloI);
        html += '<tr>' +
            `<td>I<sub>${fase}</sub> = ${corrente.toFixed(3)}∠${anguloI.toFixed(1)}° A</td>` +
            `<td>V<sub>${fase}</sub> = ${(moduloZ * corrente).toFixed(3)}∠${anguloV.toFixed(1)}° V</td></tr>`;
    });
    html += '</tbody></table></div>';
    html += '</div>';

    // --- Monofásico: Z = Va / (Ia·(1+kn)) ---
    const moduloKn = parseFloat(document.getElementById('pontoZModuloKn').value) || 0;
    const anguloKn = parseFloat(document.getElementById('pontoZAnguloKn').value) || 0;
    const anguloKnRad = (anguloKn * Math.PI) / 180;
    const somaReal = 1 + moduloKn * Math.cos(anguloKnRad);
    const somaImag = moduloKn * Math.sin(anguloKnRad);
    const moduloSoma = Math.hypot(somaReal, somaImag);
    const anguloSoma = (Math.atan2(somaImag, somaReal) * 180) / Math.PI;

    const moduloVa = moduloZ * corrente * moduloSoma;
    const anguloVa = normalizarAngulo21(anguloZ + anguloSoma);

    html += '<div class="resultado-secao mt-3">';
    html += '<h6 class="resultado-titulo">Falta monofásica</h6>';
    html += '<div class="table-responsive"><table class="tabela-pontos-teste">';
    html += '<thead><tr><th>Corrente</th><th>Tensão</th></tr></thead><tbody>';
    html += `<tr><td>I<sub>a</sub> = ${corrente.toFixed(3)}∠0.0° A</td>` +
        `<td>V<sub>a</sub> = ${moduloVa.toFixed(3)}∠${anguloVa.toFixed(1)}° V</td></tr>`;
    html += '</tbody></table></div>';
    html += `<p class="text-muted" style="font-size: 12px; margin-top: 8px;">1+k<sub>n</sub> = ${moduloSoma.toFixed(4)}∠${anguloSoma.toFixed(2)}°</p>`;
    html += '</div>';

    container.innerHTML = html;
}

/**
 * Lê R/X do formulário de ponto de teste (se ambos preenchidos) e desenha —
 * ou remove, se algum campo estiver vazio — o marcador nos dois gráficos.
 */
function desenharPontoTesteAtual21() {
    const rEl = document.getElementById('pontoZR');
    const xEl = document.getElementById('pontoZX');
    if (!rEl || !xEl) return;

    const r = parseFloat(rEl.value);
    const x = parseFloat(xEl.value);
    const ponto = (!isNaN(r) && !isNaN(x)) ? { R: r, X: x } : null;

    desenharPontoNoGrafico(window.graficoFaseFaseInstance, ponto);
    desenharPontoNoGrafico(window.graficoFaseTerraInstance, ponto);
}

/**
 * Adiciona/atualiza/remove a série do ponto de teste num gráfico ECharts já
 * criado, preservando as demais séries (zonas). replaceMerge:'series' troca
 * o array de séries inteiro (em vez do merge por índice padrão do setOption),
 * pra nunca duplicar a série do ponto em cálculos sucessivos.
 * @param {Object} chart - Instância ECharts (graficoFaseFaseInstance ou graficoFaseTerraInstance)
 * @param {Object|null} ponto - {R, X} ou null pra remover o marcador
 */
function desenharPontoNoGrafico(chart, ponto) {
    if (!chart) return;
    const seriesAtuais = (chart.getOption().series || []).filter(s => s.name !== NOME_SERIE_PONTO_TESTE_21);
    const novasSeries = ponto
        ? [...seriesAtuais,
            {
                // Vetor da origem até o ponto informado — mesmo nome do marcador
                // (série seguinte) de propósito, pra virarem uma única entrada na
                // legenda e serem escondidos/mostrados juntos ao clicar nela.
                name: NOME_SERIE_PONTO_TESTE_21,
                type: 'line',
                data: [[0, 0], [ponto.R, ponto.X]],
                symbol: 'none',
                lineStyle: { color: '#000', width: 1.5 },
                z: 9,
                animation: false
            },
            {
                name: NOME_SERIE_PONTO_TESTE_21,
                type: 'scatter',
                data: [[ponto.R, ponto.X]],
                symbol: 'diamond',
                symbolSize: 14,
                itemStyle: { color: '#000', borderColor: '#fff', borderWidth: 1.5 },
                z: 10,
                // replaceMerge trata a série como nova a cada chamada, então sem
                // isso a animação de entrada reiniciaria (marcador "piscando" /
                // crescendo do zero) a cada tecla digitada nos campos do ponto
                animation: false
            }
        ]
        : seriesAtuais;

    chart.setOption({
        series: novasSeries,
        legend: { data: [...new Set(novasSeries.map(s => s.name))] }
    }, { replaceMerge: 'series' });
}

// Exportar funções
window.criarGraficosFaseFaseFaseTerra = criarGraficosFaseFaseFaseTerra;
window.criarGraficoFaseFase = criarGraficoFaseFase;
window.criarGraficoFaseTerra = criarGraficoFaseTerra;
window.garantirFormularioPontoTeste21 = garantirFormularioPontoTeste21;

