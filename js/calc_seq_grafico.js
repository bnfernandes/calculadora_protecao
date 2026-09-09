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

// Largura "de projeto" dos diagramas NA IMPRESSÃO/PDF — fixa e independente
// da largura medida na tela (container.offsetWidth), pelo mesmo motivo já
// documentado em LARGURA_IMPRESSAO_FASORIAL_67 (calc_67_echarts.js): a
// largura da tela é só o tamanho da janela de quem calculou, sem nenhuma
// relação com o papel — reaproveitá-la pra decidir o tamanho/layout da
// impressão gera inconsistência (calcular numa janela larga ou estreita
// mudava o resultado impresso).
//
// 240 (não 300): os 2 diagramas de uma mesma linha do grid 2x2
// (.grid-graficos-fasoriais-seq) precisam caber lado a lado dentro da
// largura útil da página (A4 menos margens) — testado com Chromium
// "Salvar como PDF" (margem de 1.5cm, @page em styles.css) cabia com folga,
// mas testado pelo usuário via "Microsoft Print to PDF" do Windows (margens
// padrão do driver, maiores que 1.5cm - não necessariamente respeitam o
// @page da mesma forma) ficava por pouco NÃO cabendo lado a lado. Reduzido
// com folga extra pra tolerar essa diferença de margem entre destinos de
// impressão diferentes, não só entre tela e papel.
const LARGURA_IMPRESSAO_FASORIAL_SEQ = 240;

// Geometria de um diagrama fasorial (área quadrada de plotagem + coluna da
// legenda, se aplicável) a partir de uma largura de projeto em pixels — pura
// função de `largura`/`legendaLateral`/`paraImpressao`, sem ler nada do DOM.
// Na tela sempre embaixo (experimentou-se legenda lateral também na tela,
// mas voltou pra embaixo a pedido).
//
// `paraImpressao` só muda a legenda embaixo: usa type:'plain' (quebra linha,
// mostra tudo) em vez de 'scroll' (pagina, com setas "◀ 1/3 ▶" clicáveis) —
// na largura reduzida da impressão (LARGURA_IMPRESSAO_FASORIAL_SEQ), 3 itens
// como "B: 2.000∠-120.000°" não cabem numa linha só, e uma legenda paginada
// no papel esconderia os itens da página seguinte sem jeito de "clicar" pra
// ver (funcionou na tela só porque lá a legenda cabe numa linha e o
// paginador nem chega a aparecer). gridBottom maior reserva espaço pra 2
// linhas de legenda, não só 1.
function layoutFasorialSeq(largura, legendaLateral = false, paraImpressao = false) {
    const titleHeight = 10;

    let plotSize, plotLeft, gridBottom, legendOption;
    if (legendaLateral) {
        const legendWidth = Math.max(95, Math.min(150, largura * 0.34));
        const gapLegenda = 12;
        plotSize = largura - legendWidth - gapLegenda;
        plotLeft = 0;
        gridBottom = 8; // só uma pequena margem inferior, sem legenda aqui embaixo
        legendOption = {
            type: 'scroll',
            orient: 'vertical',
            right: 4,
            top: 'middle',
            itemWidth: 18,
            itemHeight: 11,
            itemGap: 8,
            textStyle: { fontSize: 9 },
            pageIconSize: 9,
            padding: [4, 4]
        };
    } else {
        const legendHeight = paraImpressao ? 65 : 45; // impressão reserva espaço pra 2 linhas
        plotSize = Math.min(largura * 0.85, largura - 30);
        plotLeft = (largura - plotSize) / 2;
        gridBottom = legendHeight;
        legendOption = {
            type: paraImpressao ? 'plain' : 'scroll',
            bottom: 5,
            left: 'center',
            orient: 'horizontal',
            itemWidth: 20,
            itemHeight: 12,
            itemGap: 10,
            textStyle: { fontSize: 10 },
            pageIconSize: 10,
            padding: [5, 10]
        };
    }

    return { plotSize, plotLeft, gridBottom, titleHeight, legendOption, totalHeight: titleHeight + plotSize + gridBottom };
}

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

// Ícone da legenda calcado no conteúdo real de cada série (mesma ideia já
// usada nas páginas 51/67/87) — todas as séries aqui são o mesmo tipo de
// seta sólida (phasorSeq), então um ícone só (a cor de cada item vem da
// própria lineStyle da série) resolve todos os diagramas desta página. O
// ícone padrão do ECharts pra série 'lines' não reflete symbol/lineStyle
// (linha+bolinha genérica, sem seta).
const ICONE_SETA_SOLIDA_SEQ = 'path://M-10,0L5,0M5,-3L10,0L5,3Z';
function dadosLegendaSeq(series) {
    return series.map(s => ({
        name: s.name,
        icon: ICONE_SETA_SOLIDA_SEQ,
        itemStyle: { color: s.lineStyle.color, borderColor: s.lineStyle.color, borderWidth: 2 }
    }));
}

function montarGraficoBase(containerId, series) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (container.chartInstance) {
        container.chartInstance.dispose();
    }

    const containerWidth = container.offsetWidth || 260;
    const layout = layoutFasorialSeq(containerWidth);
    container.style.height = layout.totalHeight + 'px';

    const chart = echarts.init(container, null, { renderer: 'canvas' });

    chart.setOption({
        animation: true,
        tooltip: { trigger: 'item', formatter: params => params.seriesName },
        graphic: [
            {
                type: 'image',
                style: {
                    image: '../img/coordpolar.png',
                    x: layout.plotLeft,
                    y: layout.titleHeight,
                    width: layout.plotSize,
                    height: layout.plotSize
                },
                z: -1
            }
        ],
        grid: {
            left: layout.plotLeft,
            top: layout.titleHeight,
            bottom: layout.gridBottom,
            width: layout.plotSize,
            height: layout.plotSize,
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
            ...layout.legendOption,
            data: dadosLegendaSeq(series)
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

// PDF: redesenha cada diagrama numa largura fixa (LARGURA_IMPRESSAO_FASORIAL_SEQ,
// menor que a largura normal da tela), com legenda embaixo (mesma orientação
// da tela, só que menor) - e remove da legenda os itens que o usuário
// desativou na tela (clicando neles) — sem interatividade no papel, um ícone
// acinzentado de algo que nem aparece no círculo é só ruído. Restaura o
// estado de tela exato no afterprint. Mesmo padrão de
// ajustarGraficoFasorialImpressao67 (calc_67_echarts.js): chart.resize()/
// setOption() só no clique de "Gerar PDF", nunca no beforeprint (setOption
// ali corrompe o snapshot de impressão - ver nota no topo de main.js).
function ajustarGraficoFasorialImpressaoSeq(paraImpressao) {
    GRAFICOS_FASORIAIS_SEQ.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !el.chartInstance) return;
        const chart = el.chartInstance;
        const opt = chart.getOption();
        const legendAtual = opt.legend[0];

        if (paraImpressao) {
            el.legendaFasorialCompleta = legendAtual.data;
            el.tamanhoFasorialTela = { width: chart.getWidth(), height: chart.getHeight() };

            const selecionados = legendAtual.selected || {};
            const dataFiltrada = legendAtual.data.filter(item => {
                const nome = typeof item === 'string' ? item : item.name;
                return selecionados[nome] !== false;
            });

            const layout = layoutFasorialSeq(LARGURA_IMPRESSAO_FASORIAL_SEQ, false, true);
            chart.resize({ width: LARGURA_IMPRESSAO_FASORIAL_SEQ, height: layout.totalHeight });
            chart.setOption({
                graphic: [{ style: { x: layout.plotLeft, y: layout.titleHeight, width: layout.plotSize, height: layout.plotSize } }],
                grid: { left: layout.plotLeft, top: layout.titleHeight, bottom: layout.gridBottom, width: layout.plotSize, height: layout.plotSize },
                legend: { ...layout.legendOption, data: dataFiltrada }
            });
        } else if (el.tamanhoFasorialTela) {
            const layout = layoutFasorialSeq(el.tamanhoFasorialTela.width, false);
            chart.resize({ width: el.tamanhoFasorialTela.width, height: el.tamanhoFasorialTela.height });
            chart.setOption({
                graphic: [{ style: { x: layout.plotLeft, y: layout.titleHeight, width: layout.plotSize, height: layout.plotSize } }],
                grid: { left: layout.plotLeft, top: layout.titleHeight, bottom: layout.gridBottom, width: layout.plotSize, height: layout.plotSize },
                legend: { ...layout.legendOption, data: el.legendaFasorialCompleta || legendAtual.data }
            });
        }
    });
}
window.addEventListener('afterprint', function() { ajustarGraficoFasorialImpressaoSeq(false); });
document.addEventListener('DOMContentLoaded', function() {
    const btnPdf = document.getElementById('btnGerarPdf');
    if (btnPdf) btnPdf.addEventListener('click', function() { ajustarGraficoFasorialImpressaoSeq(true); });
});

window.atualizarGraficosSeq = atualizarGraficosSeq;
