// Classe para representar números complexos (fasores)
class Complexo {
    constructor(real, imag) {
        this.real = real;
        this.imag = imag;
    }

    // Criar complexo a partir de magnitude e ângulo (em graus)
    static fromPolar(magnitude, anguloDeg) {
        const anguloRad = anguloDeg * Math.PI / 180;
        return new Complexo(
            magnitude * Math.cos(anguloRad),
            magnitude * Math.sin(anguloRad)
        );
    }

    // Obter magnitude
    magnitude() {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }

    // Obter ângulo em graus
    angulo() {
        let ang = Math.atan2(this.imag, this.real) * 180 / Math.PI;
        // Normalizar para 0-360
        while (ang < 0) ang += 360;
        while (ang >= 360) ang -= 360;
        return ang;
    }

    // Subtração de complexos
    subtrair(outro) {
        return new Complexo(this.real - outro.real, this.imag - outro.imag);
    }

    // Adicionar ângulo (rotação)
    adicionarAngulo(anguloDeg) {
        const mag = this.magnitude();
        const ang = this.angulo() + anguloDeg;
        return Complexo.fromPolar(mag, ang);
    }

    // Formatar para exibição
    toString() {
        return `${this.magnitude().toFixed(2)} ∡ ${this.angulo().toFixed(2)}°`;
    }
}

// Função para normalizar ângulo no intervalo [0, 360)
function normalizarAngulo(angulo) {
    let ang = angulo;
    while (ang < 0) ang += 360;
    while (ang >= 360) ang -= 360;
    return ang;
}

// Função principal de cálculo da função 67
function calcularFuncao67(parametros) {
    const {
        sequenciaFases,
        angulo,
        amplitude,
        direcional,
        ia, ib, ic,
        va, vb, vc
    } = parametros;

    // Criar fasores de corrente
    const Ia = Complexo.fromPolar(ia.magnitude, ia.angulo);
    const Ib = Complexo.fromPolar(ib.magnitude, ib.angulo);
    const Ic = Complexo.fromPolar(ic.magnitude, ic.angulo);

    // Criar fasores de tensão
    const Va = Complexo.fromPolar(va.magnitude, va.angulo);
    const Vb = Complexo.fromPolar(vb.magnitude, vb.angulo);
    const Vc = Complexo.fromPolar(vc.magnitude, vc.angulo);

    // Calcular Vpol para cada fase
    let VpolIa, VpolIb, VpolIc;
    let formulaVpolIa, formulaVpolIb, formulaVpolIc;

    if (sequenciaFases === 'ABC') {
        // Ia: Vbc = Vb - Vc
        VpolIa = Vb.subtrair(Vc);
        formulaVpolIa = 'V<sub>pol Ia</sub> = V<sub>bc</sub> = V<sub>b</sub> - V<sub>c</sub>';
        
        // Ib: Vca = Vc - Va
        VpolIb = Vc.subtrair(Va);
        formulaVpolIb = 'V<sub>pol Ib</sub> = V<sub>ca</sub> = V<sub>c</sub> - V<sub>a</sub>';
        
        // Ic: Vab = Va - Vb
        VpolIc = Va.subtrair(Vb);
        formulaVpolIc = 'V<sub>pol Ic</sub> = V<sub>ab</sub> = V<sub>a</sub> - V<sub>b</sub>';
    } else { // ACB
        // Ia: Vcb = Vc - Vb
        VpolIa = Vc.subtrair(Vb);
        formulaVpolIa = 'V<sub>pol Ia</sub> = V<sub>cb</sub> = V<sub>c</sub> - V<sub>b</sub>';
        
        // Ib: Vac = Va - Vc
        VpolIb = Va.subtrair(Vc);
        formulaVpolIb = 'V<sub>pol Ib</sub> = V<sub>ac</sub> = V<sub>a</sub> - V<sub>c</sub>';
        
        // Ic: Vba = Vb - Va
        VpolIc = Vb.subtrair(Va);
        formulaVpolIc = 'V<sub>pol Ic</sub> = V<sub>ba</sub> = V<sub>b</sub> - V<sub>a</sub>';
    }

    // Se reverso, adicionar 180° em Vpol
    if (direcional === 'Reverso') {
        VpolIa = VpolIa.adicionarAngulo(180);
        VpolIb = VpolIb.adicionarAngulo(180);
        VpolIc = VpolIc.adicionarAngulo(180);
        
        formulaVpolIa += ' + 180°';
        formulaVpolIb += ' + 180°';
        formulaVpolIc += ' + 180°';
    }

    // Calcular ângulo de máximo torque para cada fase
    const anguloMaxTorqueIa = normalizarAngulo(VpolIa.angulo() + 90 - angulo);
    const anguloMaxTorqueIb = normalizarAngulo(VpolIb.angulo() + 90 - angulo);
    const anguloMaxTorqueIc = normalizarAngulo(VpolIc.angulo() + 90 - angulo);

    // Calcular ângulos de disparo (região de operação)
    const anguloMinIa = normalizarAngulo(anguloMaxTorqueIa - amplitude / 2);
    const anguloMaxIa = normalizarAngulo(anguloMaxTorqueIa + amplitude / 2);

    const anguloMinIb = normalizarAngulo(anguloMaxTorqueIb - amplitude / 2);
    const anguloMaxIb = normalizarAngulo(anguloMaxTorqueIb + amplitude / 2);

    const anguloMinIc = normalizarAngulo(anguloMaxTorqueIc - amplitude / 2);
    const anguloMaxIc = normalizarAngulo(anguloMaxTorqueIc + amplitude / 2);

    return {
        // Fase Ia
        VpolIa: {
            fasor: VpolIa,
            formula: formulaVpolIa
        },
        anguloMaxTorqueIa,
        regiaoDisparoIa: {
            min: anguloMinIa,
            max: anguloMaxIa
        },
        
        // Fase Ib
        VpolIb: {
            fasor: VpolIb,
            formula: formulaVpolIb
        },
        anguloMaxTorqueIb,
        regiaoDisparoIb: {
            min: anguloMinIb,
            max: anguloMaxIb
        },
        
        // Fase Ic
        VpolIc: {
            fasor: VpolIc,
            formula: formulaVpolIc
        },
        anguloMaxTorqueIc,
        regiaoDisparoIc: {
            min: anguloMinIc,
            max: anguloMaxIc
        },

        // Parâmetros usados
        parametrosUsados: parametros
    };
}

// Função para gerar pontos da região de operação
function gerarPontosRegiaoOperacao(anguloMin, anguloMax, numPontos = 500) {
    const pontos = [];
    
    for (let i = 0; i <= numPontos; i++) {
        const progresso = i / numPontos;
        const angulo = anguloMin + (anguloMax - anguloMin) * progresso;
        const anguloRad = angulo * Math.PI / 180;
        
        // Alternar entre raio interno (0.4) e externo (3.0)
        const raio = (i % 2 === 0) ? 0.4 : 3.0;
        
        const x = raio * Math.cos(anguloRad);
        const y = raio * Math.sin(anguloRad);
        
        pontos.push({ x, y });
    }
    
    return pontos;
}

// Função para criar gráfico fasorial
function criarGraficoFasorial(canvasId, fase, resultados) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
    }
    
    const { parametrosUsados } = resultados;
    
    // Obter dados da fase específica
    let Vpol, anguloMin, anguloMax, corrente;
    let corFase, nomeFase;
    
    if (fase === 'Ia') {
        Vpol = resultados.VpolIa.fasor;
        anguloMin = resultados.regiaoDisparoIa.min;
        anguloMax = resultados.regiaoDisparoIa.max;
        corrente = Complexo.fromPolar(parametrosUsados.ia.magnitude, parametrosUsados.ia.angulo);
        corFase = 'rgba(0, 0, 255, 0.8)'; // Azul
        nomeFase = 'Ia';
    } else if (fase === 'Ib') {
        Vpol = resultados.VpolIb.fasor;
        anguloMin = resultados.regiaoDisparoIb.min;
        anguloMax = resultados.regiaoDisparoIb.max;
        corrente = Complexo.fromPolar(parametrosUsados.ib.magnitude, parametrosUsados.ib.angulo);
        corFase = 'rgba(0, 0, 0, 0.8)'; // Preto
        nomeFase = 'Ib';
    } else { // Ic
        Vpol = resultados.VpolIc.fasor;
        anguloMin = resultados.regiaoDisparoIc.min;
        anguloMax = resultados.regiaoDisparoIc.max;
        corrente = Complexo.fromPolar(parametrosUsados.ic.magnitude, parametrosUsados.ic.angulo);
        corFase = 'rgba(255, 0, 0, 0.8)'; // Vermelho
        nomeFase = 'Ic';
    }
    
    // Criar fasores de tensão
    const Va = Complexo.fromPolar(parametrosUsados.va.magnitude, parametrosUsados.va.angulo);
    const Vb = Complexo.fromPolar(parametrosUsados.vb.magnitude, parametrosUsados.vb.angulo);
    const Vc = Complexo.fromPolar(parametrosUsados.vc.magnitude, parametrosUsados.vc.angulo);
    
    // Normalizar tensões (maior tensão = 1)
    const maxTensao = Math.max(Va.magnitude(), Vb.magnitude(), Vc.magnitude());
    const escala = 1.0 / maxTensao;
    
    // Normalizar corrente para 0.7
    const escalaCorrente = 0.7 / corrente.magnitude();
    
    // Gerar pontos da região de operação
    const pontosRegiao = gerarPontosRegiaoOperacao(anguloMin, anguloMax);
    
    // Preparar datasets
    const datasets = [
        // Região de operação (sombreada)
        {
            label: 'Região de Operação',
            data: pontosRegiao,
            backgroundColor: corFase.replace('0.8', '0.15'),
            borderColor: corFase.replace('0.8', '0.5'),
            borderWidth: 2,
            borderDash: [5, 5],
            fill: true,
            pointRadius: 0,
            showLine: true,
            tension: 0,
            order: 10
        },
        // Tensão Va (azul, linha contínua)
        {
            label: 'Va',
            data: [
                { x: 0, y: 0 },
                { x: Va.real * escala, y: Va.imag * escala }
            ],
            borderColor: 'rgba(0, 0, 255, 1)',
            backgroundColor: 'rgba(0, 0, 255, 1)',
            borderWidth: 3,
            pointRadius: 5,
            showLine: true,
            fill: false,
            order: 1
        },
        // Tensão Vb (preto, linha contínua)
        {
            label: 'Vb',
            data: [
                { x: 0, y: 0 },
                { x: Vb.real * escala, y: Vb.imag * escala }
            ],
            borderColor: 'rgba(0, 0, 0, 1)',
            backgroundColor: 'rgba(0, 0, 0, 1)',
            borderWidth: 3,
            pointRadius: 5,
            showLine: true,
            fill: false,
            order: 1
        },
        // Tensão Vc (vermelho, linha contínua)
        {
            label: 'Vc',
            data: [
                { x: 0, y: 0 },
                { x: Vc.real * escala, y: Vc.imag * escala }
            ],
            borderColor: 'rgba(255, 0, 0, 1)',
            backgroundColor: 'rgba(255, 0, 0, 1)',
            borderWidth: 3,
            pointRadius: 5,
            showLine: true,
            fill: false,
            order: 1
        },
        // Corrente (cor da fase, linha tracejada)
        {
            label: nomeFase,
            data: [
                { x: 0, y: 0 },
                { x: corrente.real * escalaCorrente, y: corrente.imag * escalaCorrente }
            ],
            borderColor: corFase,
            backgroundColor: corFase,
            borderWidth: 3,
            borderDash: [10, 5],
            pointRadius: 5,
            showLine: true,
            fill: false,
            order: 1
        }
    ];
    
    // Criar gráfico
    canvas.chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1,
            scales: {
                x: {
                    type: 'linear',
                    position: 'center',
                    min: -1.2,
                    max: 1.2,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: true
                    },
                    ticks: {
                        stepSize: 0.5
                    },
                    title: {
                        display: true,
                        text: 'Parte Real'
                    }
                },
                y: {
                    type: 'linear',
                    position: 'center',
                    min: -1.2,
                    max: 1.2,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        drawBorder: true
                    },
                    ticks: {
                        stepSize: 0.5
                    },
                    title: {
                        display: true,
                        text: 'Parte Imaginária'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: `Diagrama Fasorial - Fase ${nomeFase}`,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const x = context.parsed.x.toFixed(3);
                            const y = context.parsed.y.toFixed(3);
                            return `${label}: (${x}, ${y})`;
                        }
                    }
                }
            }
        }
    });
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
    html += `<p class="formula-display">${resultados.VpolIa.formula}</p>`;
    html += `<p class="resultado-destaque">${resultados.VpolIa.fasor.toString()}</p>`;
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
    html += '<canvas id="grafico-ia"></canvas>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    // Região de disparo Ib
    html += '<div class="fase-resultado mb-5">';
    html += '<h5 class="mb-3" style="color: #e30613; border-bottom: 2px solid #e30613; padding-bottom: 10px;">Região de Disparo Ib</h5>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Tensão de Polarização (V<sub>pol Ib</sub>):</h6>';
    html += `<p class="formula-display">${resultados.VpolIb.formula}</p>`;
    html += `<p class="resultado-destaque">${resultados.VpolIb.fasor.toString()}</p>`;
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
    html += '<canvas id="grafico-ib"></canvas>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    // Região de disparo Ic
    html += '<div class="fase-resultado mb-5">';
    html += '<h5 class="mb-3" style="color: #e30613; border-bottom: 2px solid #e30613; padding-bottom: 10px;">Região de Disparo Ic</h5>';
    
    html += '<div class="calculo-item mb-3">';
    html += '<h6>Tensão de Polarização (V<sub>pol Ic</sub>):</h6>';
    html += `<p class="formula-display">${resultados.VpolIc.formula}</p>`;
    html += `<p class="resultado-destaque">${resultados.VpolIc.fasor.toString()}</p>`;
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
    html += '<canvas id="grafico-ic"></canvas>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

// Integração com o formulário
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-67');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        try {
            // Coletar dados do formulário
            const parametros = {
                sequenciaFases: document.getElementById('sequenciaFases').value,
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
                throw new Error('Por favor, preencha todos os campos obrigatórios.');
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

    // Botão limpar
    const btnLimpar = document.getElementById('btnLimpar');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', function() {
            form.reset();
            const resultadosDiv = document.getElementById('resultados');
            resultadosDiv.innerHTML = '<p class="text-center text-muted">Os resultados do cálculo aparecerão aqui após o processamento.</p>';
        });
    }
});

// Exportar funções para uso global
window.calcularFuncao67 = calcularFuncao67;
window.formatarResultadosHTML = formatarResultadosHTML;
window.criarGraficoFasorial = criarGraficoFasorial;
window.Complexo = Complexo;

