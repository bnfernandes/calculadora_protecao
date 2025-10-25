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
            right: '10%',
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
            right: '10%',
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

// Exportar funções
window.criarGraficosFaseFaseFaseTerra = criarGraficosFaseFaseFaseTerra;
window.criarGraficoFaseFase = criarGraficoFaseFase;
window.criarGraficoFaseTerra = criarGraficoFaseTerra;

