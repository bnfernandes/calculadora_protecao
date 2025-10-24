// calc_87_grafico.js - Geração de Gráfico (Função 87)

function criarGraficoDiferencial(resultados, config) {
    const container = document.getElementById('grafico-diferencial');
    if (!container) return;

    const chart = echarts.init(container);

    // Pontos das três fases
    const pontoFaseA = [resultados.faseA.ifren, resultados.faseA.idif];
    const pontoFaseB = [resultados.faseB.ifren, resultados.faseB.idif];
    const pontoFaseC = [resultados.faseC.ifren, resultados.faseC.idif];

    // Determinar limites do gráfico
    const maxIfren = Math.max(resultados.faseA.ifren, resultados.faseB.ifren, resultados.faseC.ifren, 10);
    const maxIdif = Math.max(resultados.faseA.idif, resultados.faseB.idif, resultados.faseC.idif, 5);

    // Parâmetros da curva (do formulário)
    const pickupMin = config.sensibilidade; // Sensibilidade (xTAP)
    const slope1 = config.inclinacao1 / 100; // Inclinação 1 (convertida para decimal)
    const slope2 = config.inclinacao2 / 100; // Inclinação 2 (convertida para decimal)
    const pontoInflexao1 = config.pontoInflexao1; // Ponto de inflexão 1 (xTAP)
    const pontoInflexao2 = config.pontoInflexao2; // Ponto de inflexão 2 (xTAP)

    const curvaCaracteristica = [];
    
    // Região 1: Pickup mínimo (horizontal)
    curvaCaracteristica.push([0, pickupMin]);
    curvaCaracteristica.push([pontoInflexao1, pickupMin]);
    
    // Região 2: Slope 1
    const idif_inflexao1 = pickupMin;
    const idif_inflexao2 = idif_inflexao1 + slope1 * (pontoInflexao2 - pontoInflexao1);
    curvaCaracteristica.push([pontoInflexao2, idif_inflexao2]);
    
    // Região 3: Slope 2
    const ifren_final = maxIfren * 1.2;
    const idif_final = idif_inflexao2 + slope2 * (ifren_final - pontoInflexao2);
    curvaCaracteristica.push([ifren_final, idif_final]);

    // Área de operação (acima da curva)
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
                    return `${params.seriesName}<br/>I<sub>fren</sub>: ${params.value[0].toFixed(3)} A<br/>I<sub>dif</sub>: ${params.value[1].toFixed(3)} A`;
                }
                return params.seriesName;
            }
        },
        legend: {
            data: ['Curva Característica', 'Região de Operação', 'Fase A', 'Fase B', 'Fase C'],
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
            name: 'Corrente de Frenagem (A)',
            nameLocation: 'middle',
            nameGap: 35,
            nameTextStyle: {
                fontSize: 13,
                fontWeight: 'bold'
            },
            min: 0,
            max: maxIfren * 1.2,
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
            name: 'Corrente Diferencial (A)',
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: {
                fontSize: 13,
                fontWeight: 'bold'
            },
            min: 0,
            max: Math.max(maxIdif * 1.3, idif_final * 1.1),
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
            {
                name: 'Fase A',
                type: 'scatter',
                data: [pontoFaseA],
                symbolSize: 12,
                itemStyle: {
                    color: '#0066cc'
                },
                z: 3,
                label: {
                    show: true,
                    formatter: 'A',
                    position: 'top',
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#0066cc'
                }
            },
            {
                name: 'Fase B',
                type: 'scatter',
                data: [pontoFaseB],
                symbolSize: 12,
                itemStyle: {
                    color: '#000000'
                },
                z: 3,
                label: {
                    show: true,
                    formatter: 'B',
                    position: 'top',
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#000000'
                }
            },
            {
                name: 'Fase C',
                type: 'scatter',
                data: [pontoFaseC],
                symbolSize: 12,
                itemStyle: {
                    color: '#cc0000'
                },
                z: 3,
                label: {
                    show: true,
                    formatter: 'C',
                    position: 'top',
                    fontSize: 12,
                    fontWeight: 'bold',
                    color: '#cc0000'
                }
            }
        ]
    };

    chart.setOption(option);

    // Responsividade
    window.addEventListener('resize', function() {
        chart.resize();
    });
}

