// calc_67_echarts.js - Função 67 com Apache ECharts

// Classe para operações com números complexos
class Complexo {
    constructor(real, imag) {
        this.real = real;
        this.imag = imag;
    }

    static fromPolar(magnitude, anguloDeg) {
        const anguloRad = anguloDeg * Math.PI / 180;
        return new Complexo(
            magnitude * Math.cos(anguloRad),
            magnitude * Math.sin(anguloRad)
        );
    }

    magnitude() {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }

    angulo() {
        let angulo = Math.atan2(this.imag, this.real) * 180 / Math.PI;
        if (angulo < 0) angulo += 360;
        return angulo;
    }

    subtrair(outro) {
        return new Complexo(this.real - outro.real, this.imag - outro.imag);
    }

    adicionarAngulo(anguloDeg) {
        const novoAngulo = this.angulo() + anguloDeg;
        return Complexo.fromPolar(this.magnitude(), novoAngulo);
    }

    toString() {
        return `${this.magnitude().toFixed(2)} ∠ ${this.angulo().toFixed(2)}°`;
    }
}

// Função auxiliar para normalizar ângulos no intervalo [0, 360)
function normalizarAngulo(angulo) {
    while (angulo < 0) angulo += 360;
    while (angulo >= 360) angulo -= 360;
    return angulo;
}

// Função principal de cálculo
function calcularFuncao67(parametros) {
    const { sequencia, angulo, amplitude, direcional, ia, ib, ic, va, vb, vc } = parametros;

    // Criar fasores de tensão
    const Va = Complexo.fromPolar(va.magnitude, va.angulo);
    const Vb = Complexo.fromPolar(vb.magnitude, vb.angulo);
    const Vc = Complexo.fromPolar(vc.magnitude, vc.angulo);

    // Calcular Vpol para cada fase
    let VpolIa, VpolIb, VpolIc;

    if (sequencia === 'ABC') {
        VpolIa = Vb.subtrair(Vc); // Vbc
        VpolIb = Vc.subtrair(Va); // Vca
        VpolIc = Va.subtrair(Vb); // Vab
    } else { // ACB
        VpolIa = Vc.subtrair(Vb); // Vcb
        VpolIb = Va.subtrair(Vc); // Vac
        VpolIc = Vb.subtrair(Va); // Vba
    }

    // Ajustar para direção (Frente ou Reverso)
    if (direcional === 'Reverso') {
        VpolIa = VpolIa.adicionarAngulo(180);
        VpolIb = VpolIb.adicionarAngulo(180);
        VpolIc = VpolIc.adicionarAngulo(180);
    }

    // Calcular ângulo de máximo torque
    const anguloMaxTorqueIa = normalizarAngulo(VpolIa.angulo() + 90 - angulo);
    const anguloMaxTorqueIb = normalizarAngulo(VpolIb.angulo() + 90 - angulo);
    const anguloMaxTorqueIc = normalizarAngulo(VpolIc.angulo() + 90 - angulo);

    // Calcular região de disparo
    const regiaoDisparoIa = {
        min: normalizarAngulo(anguloMaxTorqueIa - amplitude / 2),
        max: normalizarAngulo(anguloMaxTorqueIa + amplitude / 2)
    };

    const regiaoDisparoIb = {
        min: normalizarAngulo(anguloMaxTorqueIb - amplitude / 2),
        max: normalizarAngulo(anguloMaxTorqueIb + amplitude / 2)
    };

    const regiaoDisparoIc = {
        min: normalizarAngulo(anguloMaxTorqueIc - amplitude / 2),
        max: normalizarAngulo(anguloMaxTorqueIc + amplitude / 2)
    };

    return {
        VpolIa: { fasor: VpolIa, formula: sequencia === 'ABC' ? 'Vbc = Vb - Vc' : 'Vcb = Vc - Vb' },
        VpolIb: { fasor: VpolIb, formula: sequencia === 'ABC' ? 'Vca = Vc - Va' : 'Vac = Va - Vc' },
        VpolIc: { fasor: VpolIc, formula: sequencia === 'ABC' ? 'Vab = Va - Vb' : 'Vba = Vb - Va' },
        anguloMaxTorqueIa,
        anguloMaxTorqueIb,
        anguloMaxTorqueIc,
        regiaoDisparoIa,
        regiaoDisparoIb,
        regiaoDisparoIc,
        parametrosUsados: parametros
    };
}

// Utilidades ECharts
const deg2rad = (d) => (d * Math.PI) / 180;
const toXY = (angleDeg, r = 1) => [
    +(r * Math.cos(deg2rad(angleDeg))).toFixed(6),
    +(r * Math.sin(deg2rad(angleDeg))).toFixed(6)
];

// Função para construir pontos do setor (região de operação)
function buildSectorPoints(startDeg, endDeg, step = 2) {
    const pts = [];
    pts.push([0, 0]); // Começa na origem
    
    // Se a região cruza 0° (ex: 325° → 95°)
    if (endDeg < startDeg) {
        // Vai de startDeg até 360°
        for (let a = startDeg; a <= 360; a += step) {
            pts.push(toXY(a, 1));
        }
        // Continua de 0° até endDeg
        for (let a = 0; a <= endDeg; a += step) {
            pts.push(toXY(a, 1));
        }
    } else {
        // Caso normal: vai de startDeg até endDeg
        for (let a = startDeg; a <= endDeg; a += step) {
            pts.push(toXY(a, 1));
        }
    }
    
    pts.push(toXY(endDeg, 1)); // Garante ponto final exato
    pts.push([0, 0]); // Fecha voltando à origem
    return pts;
}

// Função para criar gráfico fasorial com ECharts
function criarGraficoFasorial(containerId, fase, resultados) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Destruir gráfico anterior se existir
    if (container.chartInstance) {
        container.chartInstance.dispose();
    }

    const { parametrosUsados } = resultados;

    // Obter dados da fase específica
    let Vpol, anguloMin, anguloMax, corrente;
    let corFase, corFaseBorda, corFasorCorrente, nomeFase, nomeCorrenteFase;

    if (fase === 'Ia') {
        Vpol = resultados.VpolIa.fasor;
        anguloMin = resultados.regiaoDisparoIa.min;
        anguloMax = resultados.regiaoDisparoIa.max;
        corrente = Complexo.fromPolar(parametrosUsados.ia.magnitude, parametrosUsados.ia.angulo);
        corFase = 'rgba(0, 0, 255, 0.18)'; // Azul transparente
        corFaseBorda = 'rgba(0, 0, 255, 0.6)';
        corFasorCorrente = '#1976d2'; // Azul sólido
        nomeFase = 'Ia';
        nomeCorrenteFase = `Ia: ${corrente.magnitude().toFixed(2)}∠${corrente.angulo().toFixed(0)}°`;
    } else if (fase === 'Ib') {
        Vpol = resultados.VpolIb.fasor;
        anguloMin = resultados.regiaoDisparoIb.min;
        anguloMax = resultados.regiaoDisparoIb.max;
        corrente = Complexo.fromPolar(parametrosUsados.ib.magnitude, parametrosUsados.ib.angulo);
        corFase = 'rgba(0, 0, 0, 0.18)'; // Preto transparente
        corFaseBorda = 'rgba(0, 0, 0, 0.6)';
        corFasorCorrente = '#000000'; // Preto sólido
        nomeFase = 'Ib';
        nomeCorrenteFase = `Ib: ${corrente.magnitude().toFixed(2)}∠${corrente.angulo().toFixed(0)}°`;
    } else { // Ic
        Vpol = resultados.VpolIc.fasor;
        anguloMin = resultados.regiaoDisparoIc.min;
        anguloMax = resultados.regiaoDisparoIc.max;
        corrente = Complexo.fromPolar(parametrosUsados.ic.magnitude, parametrosUsados.ic.angulo);
        corFase = 'rgba(255, 0, 0, 0.18)'; // Vermelho transparente
        corFaseBorda = 'rgba(255, 0, 0, 0.6)';
        corFasorCorrente = '#d32f2f'; // Vermelho sólido
        nomeFase = 'Ic';
        nomeCorrenteFase = `Ic: ${corrente.magnitude().toFixed(2)}∠${corrente.angulo().toFixed(0)}°`;
    }

    // Criar fasores de tensão
    const Va = Complexo.fromPolar(parametrosUsados.va.magnitude, parametrosUsados.va.angulo);
    const Vb = Complexo.fromPolar(parametrosUsados.vb.magnitude, parametrosUsados.vb.angulo);
    const Vc = Complexo.fromPolar(parametrosUsados.vc.magnitude, parametrosUsados.vc.angulo);

    // Normalizar tensões (maior tensão = 0.9)
    const maxTensao = Math.max(Va.magnitude(), Vb.magnitude(), Vc.magnitude());
    const escala = 0.9 / maxTensao;

    // Normalizar corrente para 0.7
    const escalaCorrente = 0.7 / corrente.magnitude();

    // Série custom para desenhar o setor preenchido (região de operação)
    const sectorSeries = {
        type: 'custom',
        name: `Região ${anguloMin.toFixed(0)}°–${anguloMax.toFixed(0)}°`,
        coordinateSystem: 'cartesian2d',
        silent: true,
        renderItem: function(params, api) {
            const points = buildSectorPoints(anguloMin, anguloMax, 2).map(p => api.coord(p));
            return {
                type: 'polygon',
                shape: { points },
                style: api.style({ 
                    fill: corFase, 
                    stroke: corFaseBorda, 
                    lineWidth: 1.5,
                    lineDash: [5, 5]
                })
            };
        },
        data: [0]
    };

    // Imagem de fundo removida - será adicionada via graphic

    // Função para criar fasor (seta)
    function phasor(fasor, escala, color, label, lineStyle = 'solid') {
        const magnitude = fasor.magnitude() * escala;
        const angulo = fasor.angulo();
        const [x, y] = toXY(angulo, magnitude);
        
        const style = {
            type: 'lines',
            name: label,
            coordinateSystem: 'cartesian2d',
            z: 5,
            symbol: ['none', 'arrow'],
            symbolSize: 12,
            lineStyle: { 
                width: 3, 
                opacity: 0.95, 
                color,
                type: lineStyle
            },
            effect: { show: false },
            data: [{ coords: [[0, 0], [x, y]] }]
        };
        
        return style;
    }

    // Calcular dimensões para garantir área plotável quadrada
    const containerWidth = container.offsetWidth;
    const titleHeight = 60;  // Espaço para título
    const legendHeight = 60; // Espaço para legenda
    const verticalMargin = titleHeight + legendHeight;
    
    // Área plotável deve ser quadrada
    const plotSize = Math.min(containerWidth * 0.8, containerWidth - 40);
    const totalHeight = plotSize + verticalMargin;
    
    // Ajustar altura do container
    container.style.height = totalHeight + 'px';
    
    // Criar gráfico
    const chart = echarts.init(container, null, { renderer: 'canvas' });

    const option = {
        animation: true,
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (params.seriesName.includes('Região')) {
                    return `${params.seriesName}`;
                }
                return params.seriesName;
            }
        },
        graphic: [
            {
                type: 'image',
                style: {
                    image: '../img/coordpolar.png',
                    x: (containerWidth - plotSize) / 2,
                    y: titleHeight,
                    width: plotSize,
                    height: plotSize
                },
                z: -1
            }
        ],
        grid: {
            left: (containerWidth - plotSize) / 2,
            right: (containerWidth - plotSize) / 2,
            top: titleHeight,
            bottom: legendHeight,
            width: plotSize,
            height: plotSize,
            containLabel: false
        },
        title: {
            text: `Diagrama Fasorial - Fase ${nomeFase}`,
            left: 'center',
            top: 10,
            textStyle: {
                fontSize: 16,
                fontWeight: 'bold'
            }
        },
        xAxis: {
            min: -1.1, 
            max: 1.1,
            show: false,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            splitLine: { show: false }
        },
        yAxis: {
            min: -1.1, 
            max: 1.1,
            show: false,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            splitLine: { show: false }
        },
        legend: {
            bottom: 5,
            left: 'center',
            orient: 'horizontal',
            itemWidth: 25,
            itemHeight: 12,
            itemGap: 15,
            textStyle: { fontSize: 10 },
            padding: [5, 10]
        },
        series: [
            sectorSeries,
            phasor(Va, escala, '#1976d2', `Va: ${Va.magnitude().toFixed(1)}∠${Va.angulo().toFixed(0)}°`, 'solid'),
            phasor(Vb, escala, '#000000', `Vb: ${Vb.magnitude().toFixed(1)}∠${Vb.angulo().toFixed(0)}°`, 'solid'),
            phasor(Vc, escala, '#d32f2f', `Vc: ${Vc.magnitude().toFixed(1)}∠${Vc.angulo().toFixed(0)}°`, 'solid'),
            phasor(corrente, escalaCorrente, corFasorCorrente, nomeCorrenteFase, 'dashed')
        ]
    };

    chart.setOption(option);
    container.chartInstance = chart;

    // Redimensionar responsivamente
    window.addEventListener('resize', () => chart.resize());
}

// Função para formatar resultados em HTML
function formatarResultadosHTML(resultados) {
    const { parametrosUsados } = resultados;
    let html = '<div class="resultados-67">';

    // Região de disparo Ia
    html += '<div class="fase-resultado mb-5">';
    html += '<h5 class="mb-3" style="color: #e30613; border-bottom: 2px solid #e30613; padding-bottom: 10px;">Região de Disparo Ia</h5>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Tensão de Polarização (V<sub>pol Ia</sub>):</h6>';
    html += `<p class="formula-display">V<sub>pol Ia</sub> = ${resultados.VpolIa.formula}</p>`;
    html += `<p class="resultado-destaque">${resultados.VpolIa.fasor.magnitude().toFixed(2)} ∠ ${resultados.VpolIa.fasor.angulo().toFixed(2)}°</p>`;
    html += '</div>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Ângulo de Máximo Torque:</h6>';
    html += `<p class="formula-display">θ<sub>max torque</sub> = arg(V<sub>pol Ia</sub>) + 90° - ${parametrosUsados.angulo}°</p>`;
    html += `<p class="formula-display">θ<sub>max torque</sub> = ${resultados.VpolIa.fasor.angulo().toFixed(2)}° + 90° - ${parametrosUsados.angulo}°</p>`;
    html += `<p class="resultado-destaque">${resultados.anguloMaxTorqueIa.toFixed(2)}°</p>`;
    html += '</div>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Ângulo de Disparo:</h6>';
    html += `<p class="formula-display">θ<sub>min</sub> = θ<sub>max torque</sub> - ${parametrosUsados.amplitude}°/2 = ${resultados.anguloMaxTorqueIa.toFixed(2)}° - ${(parametrosUsados.amplitude / 2).toFixed(2)}°</p>`;
    html += `<p class="formula-display">θ<sub>max</sub> = θ<sub>max torque</sub> + ${parametrosUsados.amplitude}°/2 = ${resultados.anguloMaxTorqueIa.toFixed(2)}° + ${(parametrosUsados.amplitude / 2).toFixed(2)}°</p>`;
    html += `<p class="resultado-destaque">${resultados.regiaoDisparoIa.min.toFixed(2)}° < θ<sub>a</sub> < ${resultados.regiaoDisparoIa.max.toFixed(2)}°</p>`;
    html += '</div>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Gráfico Fasorial:</h6>';
    html += '<div style="position: relative; width: 100%; max-width: 600px; margin: 0 auto;">';
    html += '<div id="grafico-ia" style="width: 100%; max-width: 600px;"></div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // Região de disparo Ib
    html += '<div class="fase-resultado mb-5">';
    html += '<h5 class="mb-3" style="color: #e30613; border-bottom: 2px solid #e30613; padding-bottom: 10px;">Região de Disparo Ib</h5>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Tensão de Polarização (V<sub>pol Ib</sub>):</h6>';
    html += `<p class="formula-display">V<sub>pol Ib</sub> = ${resultados.VpolIb.formula}</p>`;
    html += `<p class="resultado-destaque">${resultados.VpolIb.fasor.magnitude().toFixed(2)} ∠ ${resultados.VpolIb.fasor.angulo().toFixed(2)}°</p>`;
    html += '</div>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Ângulo de Máximo Torque:</h6>';
    html += `<p class="formula-display">θ<sub>max torque</sub> = arg(V<sub>pol Ib</sub>) + 90° - ${parametrosUsados.angulo}°</p>`;
    html += `<p class="formula-display">θ<sub>max torque</sub> = ${resultados.VpolIb.fasor.angulo().toFixed(2)}° + 90° - ${parametrosUsados.angulo}°</p>`;
    html += `<p class="resultado-destaque">${resultados.anguloMaxTorqueIb.toFixed(2)}°</p>`;
    html += '</div>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Ângulo de Disparo:</h6>';
    html += `<p class="formula-display">θ<sub>min</sub> = θ<sub>max torque</sub> - ${parametrosUsados.amplitude}°/2 = ${resultados.anguloMaxTorqueIb.toFixed(2)}° - ${(parametrosUsados.amplitude / 2).toFixed(2)}°</p>`;
    html += `<p class="formula-display">θ<sub>max</sub> = θ<sub>max torque</sub> + ${parametrosUsados.amplitude}°/2 = ${resultados.anguloMaxTorqueIb.toFixed(2)}° + ${(parametrosUsados.amplitude / 2).toFixed(2)}°</p>`;
    html += `<p class="resultado-destaque">${resultados.regiaoDisparoIb.min.toFixed(2)}° < θ<sub>b</sub> < ${resultados.regiaoDisparoIb.max.toFixed(2)}°</p>`;
    html += '</div>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Gráfico Fasorial:</h6>';
    html += '<div style="position: relative; width: 100%; max-width: 600px; margin: 0 auto;">';
    html += '<div id="grafico-ib" style="width: 100%; max-width: 600px;"></div>'
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // Região de disparo Ic
    html += '<div class="fase-resultado mb-5">';
    html += '<h5 class="mb-3" style="color: #e30613; border-bottom: 2px solid #e30613; padding-bottom: 10px;">Região de Disparo Ic</h5>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Tensão de Polarização (V<sub>pol Ic</sub>):</h6>';
    html += `<p class="formula-display">V<sub>pol Ic</sub> = ${resultados.VpolIc.formula}</p>`;
    html += `<p class="resultado-destaque">${resultados.VpolIc.fasor.magnitude().toFixed(2)} ∠ ${resultados.VpolIc.fasor.angulo().toFixed(2)}°</p>`;
    html += '</div>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Ângulo de Máximo Torque:</h6>';
    html += `<p class="formula-display">θ<sub>max torque</sub> = arg(V<sub>pol Ic</sub>) + 90° - ${parametrosUsados.angulo}°</p>`;
    html += `<p class="formula-display">θ<sub>max torque</sub> = ${resultados.VpolIc.fasor.angulo().toFixed(2)}° + 90° - ${parametrosUsados.angulo}°</p>`;
    html += `<p class="resultado-destaque">${resultados.anguloMaxTorqueIc.toFixed(2)}°</p>`;
    html += '</div>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Ângulo de Disparo:</h6>';
    html += `<p class="formula-display">θ<sub>min</sub> = θ<sub>max torque</sub> - ${parametrosUsados.amplitude}°/2 = ${resultados.anguloMaxTorqueIc.toFixed(2)}° - ${(parametrosUsados.amplitude / 2).toFixed(2)}°</p>`;
    html += `<p class="formula-display">θ<sub>max</sub> = θ<sub>max torque</sub> + ${parametrosUsados.amplitude}°/2 = ${resultados.anguloMaxTorqueIc.toFixed(2)}° + ${(parametrosUsados.amplitude / 2).toFixed(2)}°</p>`;
    html += `<p class="resultado-destaque">${resultados.regiaoDisparoIc.min.toFixed(2)}° < θ<sub>c</sub> < ${resultados.regiaoDisparoIc.max.toFixed(2)}°</p>`;
    html += '</div>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Gráfico Fasorial:</h6>';
    html += '<div style="position: relative; width: 100%; max-width: 600px; margin: 0 auto;">';
    html += '<div id="grafico-ic" style="width: 100%; max-width: 600px;"></div>'
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '</div>';

    return html;
}

// Event listener para o formulário
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-67');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            try {
                // Coletar dados do formulário
                const parametros = {
                    sequencia: document.getElementById('sequenciaFases').value,
                    angulo: parseFloat(document.getElementById('angulo').value),
                    amplitude: parseFloat(document.getElementById('amplitude').value),
                    direcional: document.getElementById('direcional').value,
                    ia: {
                        magnitude: parseFloat(document.getElementById('iaMagnitude').value),
                        angulo: parseFloat(document.getElementById('iaAngulo').value)
                    },
                    ib: {
                        magnitude: parseFloat(document.getElementById('ibMagnitude').value),
                        angulo: parseFloat(document.getElementById('ibAngulo').value)
                    },
                    ic: {
                        magnitude: parseFloat(document.getElementById('icMagnitude').value),
                        angulo: parseFloat(document.getElementById('icAngulo').value)
                    },
                    va: {
                        magnitude: parseFloat(document.getElementById('vaMagnitude').value),
                        angulo: parseFloat(document.getElementById('vaAngulo').value)
                    },
                    vb: {
                        magnitude: parseFloat(document.getElementById('vbMagnitude').value),
                        angulo: parseFloat(document.getElementById('vbAngulo').value)
                    },
                    vc: {
                        magnitude: parseFloat(document.getElementById('vcMagnitude').value),
                        angulo: parseFloat(document.getElementById('vcAngulo').value)
                    }
                };

                // Validar dados
                if (isNaN(parametros.angulo) || isNaN(parametros.amplitude)) {
                    throw new Error('Por favor, preencha todos os campos de parâmetros.');
                }

                // Calcular
                const resultados = calcularFuncao67(parametros);

                // Exibir resultados
                const resultadosDiv = document.getElementById('resultados');
                resultadosDiv.innerHTML = formatarResultadosHTML(resultados);

                // Criar gráficos após o DOM ser atualizado
                setTimeout(() => {
                    criarGraficoFasorial('grafico-ia', 'Ia', resultados);
                    criarGraficoFasorial('grafico-ib', 'Ib', resultados);
                    criarGraficoFasorial('grafico-ic', 'Ic', resultados);
                }, 100);

            } catch (error) {
                const resultadosDiv = document.getElementById('resultados');
                resultadosDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            }
        });

        // Botão Limpar
        const btnLimpar = document.getElementById('btn-limpar');
        if (btnLimpar) {
            btnLimpar.addEventListener('click', function() {
                form.reset();
                document.getElementById('resultados').innerHTML = '';
            });
        }
    }
});

// Exportar funções para uso global
window.calcularFuncao67 = calcularFuncao67;
window.formatarResultadosHTML = formatarResultadosHTML;
window.criarGraficoFasorial = criarGraficoFasorial;
window.Complexo = Complexo;

