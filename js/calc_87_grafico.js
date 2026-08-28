// calc_87_grafico.js - Geração de Gráfico (Função 87)

// Ponto de operação de uma fase: "X" vermelho maior quando atua (dispara),
// círculo na cor da fase quando não atua — mesma lógica de destaque da planilha Excel
const SIMBOLO_DISPARO = 'path://M -8 -8 L 8 8 M -8 8 L 8 -8';

function criarSerieFase(letraFase, ponto, atua, cor) {
    return {
        name: `Fase ${letraFase}`,
        type: 'scatter',
        data: [ponto],
        symbol: atua ? SIMBOLO_DISPARO : 'circle',
        symbolSize: atua ? 16 : 12,
        itemStyle: {
            color: atua ? 'transparent' : cor,
            borderColor: atua ? '#cc0000' : cor,
            borderWidth: atua ? 3 : 0,
            borderCap: 'round'
        },
        z: 3,
        label: {
            show: true,
            formatter: letraFase,
            position: 'top',
            fontSize: 12,
            fontWeight: 'bold',
            color: atua ? '#cc0000' : cor
        }
    };
}

function criarGraficoDiferencial(resultados, config) {
    const container = document.getElementById('grafico-diferencial');
    if (!container) return;

    const chart = echarts.init(container);

    // Pontos das três fases
    const pontoFaseA = [resultados.faseA.ifren, resultados.faseA.idif];
    const pontoFaseB = [resultados.faseB.ifren, resultados.faseB.idif];
    const pontoFaseC = [resultados.faseC.ifren, resultados.faseC.idif];

    // Limites do gráfico: fim natural do Trecho 3 + folga, ou até onde as fases
    // plotadas exigirem (ver calcularLimitesCurva87 em calc_87.js)
    const pontosExtras = [
        [resultados.faseA.ifren, resultados.faseA.idif],
        [resultados.faseB.ifren, resultados.faseB.idif],
        [resultados.faseC.ifren, resultados.faseC.idif]
    ];
    const limites = calcularLimitesCurva87(config, pontosExtras);

    // Parâmetros da curva (do formulário) — mesma função usada para decidir se a fase atua
    const pickupMin = config.sensibilidade; // Sensibilidade (xTAP)
    const pontoInflexao1 = config.pontoInflexao1; // Ponto de inflexão 1 (xTAP)
    const pontoInflexao2 = config.pontoInflexao2; // Ponto de inflexão 2 (xTAP)
    const ifren_final = limites.ifrenFinal;

    const curvaCaracteristica = [0, pontoInflexao1, pontoInflexao2, ifren_final]
        .map(ifren => [ifren, curvaOperacaoY(ifren, config)]);
    const idif_inflexao2 = curvaCaracteristica[2][1];
    const idif_final = curvaCaracteristica[3][1];

    // Área de operação (acima da curva)
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
            text: 'Curva Característica da Proteção Diferencial',
            left: 'center',
            top: 10,
            textStyle: {
                fontSize: 16,
                fontWeight: 'bold'
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: function(params) {
                if (params.seriesName.includes('Fase')) {
                    const fase = resultados[`fase${params.seriesName.slice(-1)}`];
                    const status = fase.atua ? 'ATUA' : 'NÃO ATUA';
                    return `${params.seriesName} — ${status}<br/>I<sub>fren</sub>: ${params.value[0].toFixed(3)} xTAP<br/>I<sub>dif</sub>: ${params.value[1].toFixed(3)} xTAP`;
                }
                return params.seriesName;
            }
        },
        legend: {
            data: [
                { name: 'Curva Característica', icon: 'path://M-10,-1.5L10,-1.5L10,1.5L-10,1.5Z', itemStyle: { color: '#333' } },
                { name: 'Região de Operação', icon: 'rect', itemStyle: { color: 'rgba(255, 0, 0, 0.1)', borderWidth: 0 } },
                'Fase A', 'Fase B', 'Fase C'
            ],
            bottom: 10,
            textStyle: {
                fontSize: 11
            }
        },
        grid: {
            left: '10%',
            right: '5%',
            bottom: '15%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: 'Corrente de Frenagem (xTAP)',
            nameLocation: 'middle',
            nameGap: 35,
            nameTextStyle: {
                fontSize: 13,
                fontWeight: 'bold'
            },
            min: 0,
            max: limites.xMax,
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed',
                    color: '#e0e0e0'
                }
            }
        },
        yAxis: {
            type: 'value',
            name: 'Corrente Diferencial (xTAP)',
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: {
                fontSize: 13,
                fontWeight: 'bold'
            },
            min: 0,
            max: limites.yMax,
            splitLine: {
                show: true,
                lineStyle: {
                    type: 'dashed',
                    color: '#e0e0e0'
                }
            }
        },
        series: [
            {
                name: 'Região de Operação',
                type: 'line',
                data: areaOperacao,
                lineStyle: {
                    width: 0
                },
                areaStyle: {
                    color: 'rgba(255, 0, 0, 0.1)'
                },
                symbol: 'none',
                smooth: false,
                z: 1
            },
            {
                name: 'Curva Característica',
                type: 'line',
                data: curvaCaracteristica,
                lineStyle: {
                    color: '#333',
                    width: 3,
                    type: 'solid'
                },
                symbol: 'none',
                smooth: false,
                z: 2
            },
            criarSerieFase('A', pontoFaseA, resultados.faseA.atua, '#0066cc'),
            criarSerieFase('B', pontoFaseB, resultados.faseB.atua, '#000000'),
            criarSerieFase('C', pontoFaseC, resultados.faseC.atua, '#cc0000')
        ]
    };

    chart.setOption(option);

    // Responsividade
    window.addEventListener('resize', function() {
        chart.resize();
    });
}

