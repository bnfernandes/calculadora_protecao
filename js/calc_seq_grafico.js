// calc_seq_grafico.js - Componentes Simétricas: 4 diagramas fasoriais (ABC/ACB,
// Seq0, Seq1, Seq2) com ECharts, replicando o padrão cartesiano já usado em
// js/calc_67_echarts.js (não há import/módulo no site - cada calc_*.js é
// auto-contido, então o padrão é replicado, não compartilhado).

const deg2radSeq = (d) => (d * Math.PI) / 180;
const toXYSeq = (angleDeg, r = 1) => [
    +(r * Math.cos(deg2radSeq(angleDeg))).toFixed(6),
    +(r * Math.sin(deg2radSeq(angleDeg))).toFixed(6)
];

const GRAFICOS_FASORIAIS_SEQ = ['grafico-abc', 'grafico-seq0', 'grafico-seq1', 'grafico-seq2'];
let resizeListenerRegistradoSeq = false;
function registrarResizeGraficosSeq() {
    if (resizeListenerRegistradoSeq) return;
    resizeListenerRegistradoSeq = true;
    window.addEventListener('resize', () => {
        GRAFICOS_FASORIAIS_SEQ.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.chartInstance) el.chartInstance.resize();
        });
    });
}

function phasorSeq(fasor, escala, color, label) {
    const magnitude = fasor.magnitude() * escala;
    const angulo = fasor.angulo();
    const [x, y] = toXYSeq(angulo, magnitude);
    return {
        type: 'lines',
        name: label,
        coordinateSystem: 'cartesian2d',
        clip: true,
        z: 5,
        symbol: ['none', 'arrow'],
        symbolSize: 12,
        lineStyle: { width: 3, opacity: 0.95, color, type: 'solid' },
        effect: { show: false },
        data: [{ coords: [[0, 0], [x, y]] }]
    };
}

function montarGraficoBase(containerId, series) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (container.chartInstance) {
        container.chartInstance.dispose();
    }

    const containerWidth = container.offsetWidth || 260;
    const titleHeight = 10;
    const legendHeight = 45;
    const plotSize = Math.min(containerWidth * 0.85, containerWidth - 30);
    container.style.height = (plotSize + titleHeight + legendHeight) + 'px';

    const chart = echarts.init(container, null, { renderer: 'canvas' });

    chart.setOption({
        animation: true,
        tooltip: { trigger: 'item', formatter: params => params.seriesName },
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
            type: 'scroll',
            bottom: 5,
            left: 'center',
            orient: 'horizontal',
            itemWidth: 20,
            itemHeight: 12,
            itemGap: 10,
            textStyle: { fontSize: 10 },
            pageIconSize: 10,
            padding: [5, 10]
        },
        series
    });

    container.chartInstance = chart;
}

// Cores por fase (mesmas de A/B/C no diagrama ABC) - usadas nos diagramas de
// Seq1/Seq2, que agora mostram a contribuição rotacionada de cada fase, não
// só a componente "crua".
const CORES_FASE_SEQ = { A: '#1976d2', B: '#000000', C: '#d32f2f' };

function criarGraficoABC(dados) {
    const magMax = Math.max(dados.A.magnitude(), dados.B.magnitude(), dados.C.magnitude());
    const escala = magMax > 0 ? 0.9 / magMax : 0;
    montarGraficoBase('grafico-abc', [
        phasorSeq(dados.A, escala, CORES_FASE_SEQ.A, `A: ${dados.A}`),
        phasorSeq(dados.B, escala, CORES_FASE_SEQ.B, `B: ${dados.B}`),
        phasorSeq(dados.C, escala, CORES_FASE_SEQ.C, `C: ${dados.C}`)
    ]);
}

// Seq0: um único fasor (as 3 fases enxergam a mesma componente, sem rotação -
// mostrar 3 fasores sobrepostos não acrescentaria nada).
function criarGraficoSeq0(fasor, escala) {
    montarGraficoBase('grafico-seq0', [phasorSeq(fasor, escala, '#6c757d', `Seq0: ${fasor}`)]);
}

// Seq1/Seq2: os 3 termos rotacionados (contribuição de A, B e C) - já vêm
// prontos em dados.termosA/B/C[indice], mesmos valores exibidos na tabela.
function criarGraficoSeqMultiplo(containerId, termosPorFase, escala) {
    const letras = ['A', 'B', 'C'];
    montarGraficoBase(containerId, termosPorFase.map((t, i) =>
        phasorSeq(t.fasor, escala, CORES_FASE_SEQ[letras[i]], `${letras[i]}: ${t.fasor}`)
    ));
}

function atualizarGraficosSeq(dados) {
    criarGraficoABC(dados);

    // Escala compartilhada entre os 3 diagramas de sequência (não mais uma
    // por gráfico) - senão o maior fasor de CADA diagrama é sempre esticado
    // até preencher o círculo, escondendo diferenças reais de magnitude
    // entre seq0/seq1/seq2. Rotação não muda magnitude, então o maior fasor
    // de seq1/seq2 é sempre o próprio seq1/seq2 (mesma magnitude dos 3 termos).
    const magMaxSeq = Math.max(dados.seq0.magnitude(), dados.seq1.magnitude(), dados.seq2.magnitude());
    const escalaSeq = magMaxSeq > 0 ? 0.9 / magMaxSeq : 0;

    criarGraficoSeq0(dados.seq0, escalaSeq);
    criarGraficoSeqMultiplo('grafico-seq1', [dados.termosA[1], dados.termosB[1], dados.termosC[1]], escalaSeq);
    criarGraficoSeqMultiplo('grafico-seq2', [dados.termosA[2], dados.termosB[2], dados.termosC[2]], escalaSeq);

    registrarResizeGraficosSeq();
}

window.atualizarGraficosSeq = atualizarGraficosSeq;
