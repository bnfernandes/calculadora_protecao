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

// Pontos de I/I0 espaçados igualmente em escala log entre min e max (não em
// escala linear), para a curva ficar suave também perto do início (onde a
// característica é mais íngreme). O cálculo é uma fórmula fechada por ponto,
// então gerar dezenas de pontos em vez de poucos não pesa nada.
function gerarRazoesCorrente(min = 1.05, max = 40, quantidade = 80) {
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const razoes = [];
    for (let i = 0; i < quantidade; i++) {
        razoes.push(Math.pow(10, logMin + (i / (quantidade - 1)) * (logMax - logMin)));
    }
    return razoes;
}

// Função para gerar pontos da curva
function gerarPontosCurva(tipoCurva, multiplicador, I0, tempoMinimo = 0) {
    const correntes = [];
    const tempos = [];

    const constants = CURVE_CONSTANTS[tipoCurva];
    const padrao = constants ? constants.padrao : null;

    const razoesCorrente = gerarRazoesCorrente();

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

// Função para formatar equação em HTML puro (divisões sempre como frações em
// duas linhas — ver js/formula-html.js, mesmo padrão usado nas Funções 67 e 87)
function formatarEquacaoHTML(tipoCurva, multiplicador) {
    if (tipoCurva === 'TEMPO-FIXO') {
        return `<div class="formula">t = ${multiplicador} ms</div>`;
    }

    const constants = CURVE_CONSTANTS[tipoCurva];
    if (!constants) return '';

    const comuns = [
        'T = tempo de disparo (seg)',
        `M = ${multiplicador} (multiplicador)`,
        'I = intensidade medida',
        'I<sub>0</sub> = ajuste de intensidade de arranque'
    ];

    let titulo, equacao, extras;

    if (constants.padrao === 'IEC') {
        const { K, a } = constants;
        titulo = 'Fórmula IEC:';
        equacao = `T = M × ${fracaoHTML('K', '(I/I<sub>0</sub>)<sup>a</sup> - 1')}`;
        extras = [`K = ${K}`, `a = ${a}`];
    } else if (constants.padrao === 'ANSI') {
        const { A, B, C, D, E } = constants;
        titulo = 'Fórmula ANSI:';
        equacao = `T = M × (A + ${fracaoHTML('B', 'I/I<sub>0</sub> - C')} + ${fracaoHTML('D', '(I/I<sub>0</sub> - C)<sup>2</sup>')} + ${fracaoHTML('E', '(I/I<sub>0</sub> - C)<sup>3</sup>')})`;
        extras = [`A = ${A}`, `B = ${B}`, `C = ${C}`, `D = ${D}`, `E = ${E}`];
    } else if (constants.padrao === 'IEEE') {
        const { K, a, c } = constants;
        titulo = 'Fórmula IEEE:';
        equacao = `T = M × (${fracaoHTML('K', '(I/I<sub>0</sub>)<sup>a</sup> - 1')} + c)`;
        extras = [`K = ${K}`, `a = ${a}`, `c = ${c}`];
    } else {
        return '';
    }

    const constantesHTML = [...comuns, ...extras].map(c => `<div class="constant">${c}</div>`).join('');

    return `<div class="formula">` +
        `<div class="formula-title">${titulo}</div>` +
        linhaEquacaoHTML(equacao) +
        `<div class="formula-constants"><div class="constants-title">Onde:</div>${constantesHTML}</div>` +
        `</div>`;
}

// Formata uma potência de dez (expoente inteiro) como número comum: -2 -> "0.01", 2 -> "100"
// Posições (em log10) das marcações "menores" de um eixo log clássico —
// 2, 3, 4...9 dentro de cada década entre min e max — usadas para desenhar
// grades bem fracas nesses valores. Não são igualmente espaçadas em log10
// (por isso não dá pra usar um "interval" fixo: log10(2)=0.301, log10(3)=
// 0.477 etc), então cada posição é calculada explicitamente.
function gerarTicksMenores(min, max) {
    const ticks = [];
    for (let decada = Math.floor(min); decada < Math.ceil(max); decada++) {
        for (let m = 2; m <= 9; m++) {
            const v = decada + Math.log10(m);
            if (v > min && v < max) ticks.push(v);
        }
    }
    return ticks;
}

// Posições das potências de dez (1, 10, 100...) dentro de min e max — ficam
// de fora de gerarTicksMenores (que só cobre 2..9), mas sem elas não sobra
// nenhuma linha exatamente sobre os valores rotulados (1, 10, 100...) para
// conferir visualmente se um ponto calculado bate com o eixo
function gerarTicksDecada(min, max) {
    const ticks = [];
    for (let decada = Math.ceil(min); decada <= Math.floor(max); decada++) {
        ticks.push(decada);
    }
    return ticks;
}

function formatarPotenciaDez(expoente) {
    const exp = Math.round(expoente);
    // Ao dar zoom o ECharts força um tick extra exatamente no limite visível,
    // que raramente cai numa potência de dez "redonda". Sem essa checagem,
    // arredondar esse valor mostraria um rótulo enganoso (ex: "1000" grudado
    // na borda, perto da grade real de 1000) — em vez disso, não rotula.
    if (Math.abs(expoente - exp) > 1e-6) return '';
    return exp >= 0 ? String(10 ** exp) : (10 ** exp).toFixed(-exp);
}

// Função para criar gráfico (ECharts, com scroll/zoom nos eixos como na Função 21)
//
// Os eixos são log-log, mas o dataZoom do ECharts sempre mapeia a % da barra
// linearmente sobre o valor bruto do eixo — mesmo em eixo type:'log' (é uma
// limitação da biblioteca). Isso fazia a barra "acelerar" perto do início e
// "andar devagar" perto do fim. Para corrigir, os dados são pré-convertidos
// para log10 e plotados num eixo type:'value' comum (onde % da barra já
// corresponde a uma distância uniforme); os rótulos e o tooltip convertem de
// volta (10^valor) para mostrar os números reais.
function criarGrafico(containerId, pontosCurva, pontoAtuacao = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Limites dos eixos (em log10) — usados tanto na config dos eixos quanto
    // nas linhas-guia do ponto de atuação, que precisam terminar exatamente
    // na borda do gráfico
    const xMin = -0.2, xMax = 2;
    const yMin = -2, yMax = 4;

    const dadosValidos = pontosCurva.correntes.map((corrente, i) => [
        Math.log10(pontoAtuacao ? corrente / pontoAtuacao.parametrosUsados.correntePartida : corrente),
        Math.log10(pontosCurva.tempos[i])
    ]).filter(([, logTempo]) => Number.isFinite(logTempo));

    // Grades bem fracas em 2,3,4...9 de cada década (x: 1-100, y: 0.01-10000),
    // imitando as marcações menores de um eixo log clássico. As da própria
    // década (1, 10, 100...) ficam um pouco mais visíveis que as demais —
    // são a única linha exatamente sobre um valor rotulado, útil para
    // conferir visualmente se um ponto calculado bate com o eixo
    const estiloDecada = { color: '#ccc' };
    const gradesMenores = [
        ...gerarTicksMenores(xMin, xMax).map(v => ({ xAxis: v })),
        ...gerarTicksMenores(yMin, yMax).map(v => ({ yAxis: v })),
        ...gerarTicksDecada(xMin, xMax).map(v => ({ xAxis: v, lineStyle: estiloDecada })),
        ...gerarTicksDecada(yMin, yMax).map(v => ({ yAxis: v, lineStyle: estiloDecada }))
    ];

    // Série "vazia" só para carregar o markLine. markLine sempre desenha por
    // cima de tudo na mesma zlevel, cortando a linha vermelha — por isso essa
    // série fica numa zlevel própria, abaixo (zlevel menor = camada de baixo)
    const series = [{
        name: 'GradeMenor',
        type: 'line',
        data: [],
        silent: true,
        zlevel: 0,
        markLine: {
            silent: true,
            // Com ~70 linhas individuais (menores + década), a animação ao
            // dar zoom faz cada uma interpolar da posição antiga até a nova —
            // no meio do caminho elas ficam temporariamente na diagonal
            // (e some coisa junto, como o nome do eixo). Sem animação, a
            // grade pula direto para a posição certa.
            animation: false,
            symbol: 'none',
            label: { show: false },
            tooltip: { show: false },
            lineStyle: { color: '#eee', type: 'solid', width: 1 },
            data: gradesMenores
        }
    }, {
        name: 'Curva de Proteção',
        type: 'line',
        data: dadosValidos,
        lineStyle: { color: '#e30613', width: 2 },
        itemStyle: { color: '#e30613' },
        symbol: 'none',
        smooth: false,
        zlevel: 1
    }];

    if (pontoAtuacao) {
        const xPonto = Math.log10(pontoAtuacao.fatorCalculado);
        const yPonto = Math.log10(pontoAtuacao.tempoAtuacao);
        const corPonto = '#ff6b35';
        const corLinha = '#495057'; // cinza escuro — só as linhas-guia e o rótulo, não o marcador

        series.push({
            name: 'Ponto de Atuação',
            type: 'scatter',
            zlevel: 1,
            data: [[xPonto, yPonto]],
            symbolSize: 12,
            itemStyle: { color: corPonto }
        });

        // Linhas-guia numa série própria, separada do marcador acima — assim
        // dá pra ocultar só a projeção (clicando nela na legenda) sem
        // esconder o ponto em si
        series.push({
            name: 'Projeção do Ponto',
            type: 'scatter',
            zlevel: 1,
            data: [[xPonto, yPonto]],
            symbol: 'none',
            markLine: {
                silent: true,
                animation: false,
                symbol: 'none',
                lineStyle: { color: corLinha, type: 'dashed', width: 1.5 },
                label: { show: false },
                data: [
                    [{ coord: [xPonto, yPonto] }, { coord: [xPonto, yMin] }],
                    [{ coord: [xPonto, yPonto] }, { coord: [xMin, yPonto] }]
                ]
            }
        });
    }

    // Reaproveita a instância existente no container, se houver
    const chart = echarts.getInstanceByDom(container) || echarts.init(container);

    chart.setOption({
        title: {
            text: 'Curva Característica de Proteção',
            top: 8,
            left: 'center',
            textStyle: { fontSize: 16, fontWeight: 'bold' }
        },
        tooltip: {
            trigger: 'item',
            formatter: params => `${params.seriesName}<br/>I/I<sub>0</sub>: ${(10 ** params.value[0]).toFixed(3)}<br/>Tempo: ${(10 ** params.value[1]).toFixed(3)} s`
        },
        // Título, legenda e toolbox cada um em sua própria linha, para nunca
        // sobrepor uns aos outros em telas estreitas
        legend: {
            type: 'scroll',
            data: series.filter(s => s.name !== 'GradeMenor').map(s => s.name),
            top: 36,
            left: 'center'
        },
        // Margens em pixels (não %) para a área do gráfico ficar de fato mais
        // alta que larga — em % elas cresceriam junto com a altura do
        // container e a área plotada continuaria quase quadrada
        grid: {
            left: 60,
            right: 90,
            top: 95,
            bottom: 90,
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: 'I/I₀',
            nameLocation: 'middle',
            nameGap: 30,
            nameTextStyle: { fontSize: 14, fontWeight: 'bold' },
            // Começa um pouco antes de 1 (10^-0.2 ≈ 0.63), só para dar um
            // respiro antes da curva. Sem "interval" fixo aqui de propósito:
            // com esse mínimo fora de uma potência de dez, um interval fixo
            // desalinharia todos os ticks das potências de dez (1, 10, 100).
            // Deixando automático, o ECharts sempre inclui 0/1/2 no conjunto
            // de ticks, e o formatador oculta os ticks "extras" que sobram.
            min: xMin,
            max: xMax,
            // Sem isso, o eixo tipo 'value' gruda a linha do eixo X onde Y=0
            // (Tempo=1s) em vez de na base do gráfico, destacando essa grade
            axisLine: { onZero: false },
            // As marquinhas nativas do eixo seguem o mesmo tick "forçado" no
            // limite do zoom que não cai numa potência de dez — como as
            // grades menores já marcam a régua toda, essas ficam desativadas
            axisTick: { show: false },
            axisLabel: { formatter: formatarPotenciaDez },
            // Grade tracejada nativa desativada a pedido — só ficam as
            // grades menores (markLine da série "GradeMenor")
            splitLine: { show: false }
        },
        yAxis: {
            type: 'value',
            name: 'Tempo (s)',
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: { fontSize: 14, fontWeight: 'bold' },
            // Sem "interval" fixo aqui de propósito (mesmo caso do eixo X):
            // ao dar zoom, o ECharts recalcula os ticks a partir do novo
            // limite visível (raramente redondo) e soma o interval dali —
            // nenhum bate mais numa potência de dez, e o formatador esconde
            // todos. Automático, o ECharts sempre inclui os valores inteiros
            // no conjunto de ticks disponíveis, mesmo com zoom aplicado.
            min: yMin,
            max: yMax,
            axisLine: { onZero: false },
            // As marquinhas nativas do eixo seguem o mesmo tick "forçado" no
            // limite do zoom que não cai numa potência de dez — como as
            // grades menores já marcam a régua toda, essas ficam desativadas
            axisTick: { show: false },
            axisLabel: { formatter: formatarPotenciaDez },
            // Grade tracejada nativa desativada a pedido — só ficam as
            // grades menores (markLine da série "GradeMenor")
            splitLine: { show: false }
        },
        series,
        toolbox: {
            feature: {
                saveAsImage: { title: 'Salvar como imagem', pixelRatio: 2 },
                dataZoom: { title: { zoom: 'Zoom', back: 'Restaurar' } },
                restore: { title: 'Restaurar' }
            },
            right: 10,
            top: 64
        },
        dataZoom: [
            { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
            { type: 'inside', yAxisIndex: 0, filterMode: 'none' },
            { type: 'slider', xAxisIndex: 0, filterMode: 'none', bottom: 10 },
            { type: 'slider', yAxisIndex: 0, filterMode: 'none', right: 10 }
        ]
    }, true);

    // As linhas-guia terminam nas bordas do eixo (xMin/yMin) — mas isso é a
    // borda do eixo INTEIRO, não da área visível depois de um zoom. Se o
    // usuário der zoom e cortar fora a ponta onde a linha termina, ela some
    // (o ECharts não desenha um markLine cujo ponto final ficou fora do
    // range atualmente visível). Por isso, a cada zoom/pan, recalcula os
    // pontos finais para a borda VISÍVEL no momento, lendo o start/end (%)
    // dos componentes dataZoom e convertendo de volta pra valor no eixo.
    if (pontoAtuacao) {
        const xPonto = Math.log10(pontoAtuacao.fatorCalculado);
        const yPonto = Math.log10(pontoAtuacao.tempoAtuacao);

        const atualizarLinhasGuia = () => {
            const dz = chart.getOption().dataZoom;
            const visivelXMin = xMin + (xMax - xMin) * dz[0].start / 100;
            const visivelYMin = yMin + (yMax - yMin) * dz[1].start / 100;

            chart.setOption({
                series: [{
                    name: 'Projeção do Ponto',
                    markLine: {
                        data: [
                            [{ coord: [xPonto, yPonto] }, { coord: [xPonto, Math.min(visivelYMin, yPonto)] }],
                            [{ coord: [xPonto, yPonto] }, { coord: [Math.min(visivelXMin, xPonto), yPonto] }]
                        ]
                    }
                }]
            });
        };

        chart.off('datazoom');
        chart.on('datazoom', atualizarLinhasGuia);
    }

    window.addEventListener('resize', () => chart.resize());
}

// Exporta as funções para uso global
window.calcularFuncao51 = calcularFuncao51;
window.criarGrafico = criarGrafico;
window.formatarEquacaoHTML = formatarEquacaoHTML;
