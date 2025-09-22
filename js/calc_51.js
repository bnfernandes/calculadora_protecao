// Constantes das curvas de proteção
const CURVE_CONSTANTS = {
    // ANSI
    'ANSI-NI': { padrao: 'ANSI', A: 0.0274, B: 22.614, C: 0.3, D: -41.899, E: 91.272, tr: 0.99 },
    'ANSI-MI': { padrao: 'ANSI', A: 0.0615, B: 0.7989, C: 0.34, D: -0.284, E: 40.505, tr: 4.678 },
    'ANSI-EI': { padrao: 'ANSI', A: 0.0399, B: 0.2294, C: 0.5, D: 30.094, E: 0.7222, tr: 6.008 },
    'ANSI-MODI': { padrao: 'ANSI', A: 0.1735, B: 0.6791, C: 0.8, D: -0.08, E: 0.1271, tr: 1.2 },

    // IEC
    'IEC-NI': { padrao: 'IEC', K: 0.14, a: 0.02, tr: 9.7 },
    'IEC-IC': { padrao: 'IEC', K: 0.05, a: 0.04, tr: 0.5 },
    'IEC-IL': { padrao: 'IEC', K: 120, a: 1, tr: 120 },
    'IEC-MI': { padrao: 'IEC', K: 13.5, a: 1, tr: 43.2 },
    'IEC-EI': { padrao: 'IEC', K: 80, a: 2, tr: 58.2 },
    'IEC-MIEs': { padrao: 'IEC', K: 2.6, a: 1, tr: 21.2 },

    // IEEE
    'IEEE-MI': { padrao: 'IEEE', K: 0.0515, a: 0.02, c: 0.114, tr: 4.85 },
    'IEEE-VI': { padrao: 'IEEE', K: 19.61, a: 2, c: 0.491, tr: 21.6 },
    'IEEE-EI': { padrao: 'IEEE', K: 28.2, a: 2, c: 0.1217, tr: 29.1 }
};


// Função para calcular o tempo de atuação
function calcularTempoAtuacao(tipoCurva, multiplicador, I, I0, tempoMinimo = 0) {
    if (tipoCurva === 'TEMPO-FIXO') {
        return tempoMinimo / 1000; // Converte ms para s
    }
    
    const constants = CURVE_CONSTANTS[tipoCurva];
    if (!constants) {
        throw new Error(`Tipo de curva não reconhecido: ${tipoCurva}`);
    }
    
    const { padrao } = constants;
    const razaoCorrente = I / I0;
    let tempo = 0;

    if (padrao === 'IEC') {
        const { K, a } = constants;
        if (razaoCorrente <= 1) return Infinity;
        tempo = multiplicador * K / (Math.pow(razaoCorrente, a) - 1);
    } else if (padrao === 'ANSI') {
        const { A, B, C, D, E } = constants;
        if (razaoCorrente <= C) return Infinity;
        const term = razaoCorrente - C;
        tempo = multiplicador * (A + B / term + D / Math.pow(term, 2) + E / Math.pow(term, 3));
    } else if (padrao === 'IEEE') {
        const { K, a, c } = constants;
        if (razaoCorrente <= 1) return Infinity;
        tempo = multiplicador * (K / (Math.pow(razaoCorrente, a) - 1) + c);
    } else {
        throw new Error('Padrão de curva não reconhecido: ' + padrao);
    }
    
    return Math.max(tempo, tempoMinimo / 1000);
}

// Função para gerar pontos da curva
function gerarPontosCurva(tipoCurva, multiplicador, I0, tempoMinimo = 0) {
    const correntes = [];
    const tempos = [];

    const constants = CURVE_CONSTANTS[tipoCurva];
    const padrao = constants ? constants.padrao : null;

    // Lista fixa de razões de corrente
    const razoesCorrente = [1.05, 1.1, 1.2, 1.3, 1.5, 2, 2.5, 3, 5, 10, 20, 40];

    for (const razaoCorrente of razoesCorrente) {
        // Se for ANSI, garantir que a razão mínima respeita C+0.1
        if (padrao === 'ANSI' && constants && constants.C && razaoCorrente <= constants.C) {
            continue;
        }

        const I = razaoCorrente * I0;
        correntes.push(I);

        try {
            const tempo = calcularTempoAtuacao(tipoCurva, multiplicador, I, I0, tempoMinimo);
            tempos.push(tempo);
        } catch (error) {
            tempos.push(null);
        }
    }

    return { correntes, tempos };
}

// Função principal de cálculo da função 51
function calcularFuncao51(parametros) {
    const {
        correntePartida, // I0
        tipoCurva,
        indiceTempo,     // M
        tempoFixoMinimo,
        correnteFalta,    // I
        fator
    } = parametros;
    
    let I_calc = correnteFalta;
    if (fator && !correnteFalta) {
        I_calc = fator * correntePartida;
    }

    if (!I_calc || !correntePartida) {
        throw new Error('É necessário fornecer a corrente de falta (I) ou o fator, e a corrente de partida (I0)');
    }
    
    const tempoAtuacao = calcularTempoAtuacao(tipoCurva, indiceTempo, I_calc, correntePartida, tempoFixoMinimo);
    
    const pontosCurva = gerarPontosCurva(tipoCurva, indiceTempo, correntePartida, tempoFixoMinimo);
    
    return {
        fatorCalculado: I_calc / correntePartida,
        tempoAtuacao,
        pontosCurva,
        parametrosUsados: parametros
    };
}

// Função para formatar equação LaTeX
function formatarEquacaoLatex(tipoCurva, multiplicador) {
    if (tipoCurva === 'TEMPO-FIXO') {
        return `t = ${multiplicador} \\text{ ms}`;
    }
    
    const constants = CURVE_CONSTANTS[tipoCurva];
    if (!constants) return '';
    
    const { padrao } = constants;
    let equacao = '';
    if (padrao === 'IEC') {
        const { K, a } = constants;
        equacao = `T = M \\times \\frac{K}{(\\frac{I}{I_0})^{a}-1}`;
        equacao = equacao.replace('M', multiplicador).replace('K', K).replace('a', a);
    } else if (padrao === 'ANSI') {
        const { A, B, C, D, E } = constants;
        equacao = `T = M \\times (A + \\frac{B}{(\\frac{I}{I_0}-C)} + \\frac{D}{(\\frac{I}{I_0}-C)^2} + \\frac{E}{(\\frac{I}{I_0}-C)^3})`;
        equacao = equacao.replace('M', multiplicador).replace('A', A).replace('B', B).replace('C', C).replace('D', D).replace('E', E);
    } else if (padrao === 'IEEE') {
        const { K, a, c } = constants;
        equacao = `T = M \\times (\\frac{K}{(\\frac{I}{I_0})^{a}-1} + c)`;
        equacao = equacao.replace('M', multiplicador).replace('K', K).replace('a', a).replace('c', c);
    }
    
    return equacao;
}

// Função para criar gráfico
function criarGrafico(canvasId, pontosCurva, pontoAtuacao = null) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    const dadosValidos = pontosCurva.correntes.map((corrente, i) => ({
        x: pontoAtuacao ? corrente / pontoAtuacao.parametrosUsados.correntePartida : corrente,
        y: pontosCurva.tempos[i]
    })).filter(ponto => ponto.y !== null && ponto.y > 0 && ponto.y !== Infinity);
    
    const datasets = [{
        label: 'Curva de Proteção',
        data: dadosValidos,
        borderColor: '#e30613',
        backgroundColor: 'rgba(227, 6, 19, 0.1)',
        borderWidth: 2,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 5
    }];
    
    if (pontoAtuacao) {
        datasets.push({
            label: 'Ponto de Atuação',
            data: [{
                x: pontoAtuacao.fatorCalculado,
                y: pontoAtuacao.tempoAtuacao
            }],
            backgroundColor: '#ff6b35',
            borderColor: '#ff6b35',
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false
        });
    }
    
    // Destruir gráfico antigo se existir
    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: 'Fator (I/Ipartida)'
                    },
                    min: 1,
                    max: 100
                },
                y: {
                    type: 'logarithmic',
                    title: {
                        display: true,
                        text: 'Tempo (s)'
                    },
                    min: 0.01,
                    max: 10000
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Curva Característica de Proteção'
                }
            }
        }
    });
}

// Exporta as funções para uso global
window.calcularFuncao51 = calcularFuncao51;
window.criarGrafico = criarGrafico;
window.formatarEquacaoLatex = formatarEquacaoLatex;