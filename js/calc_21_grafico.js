// ============================================================================
// FUNÇÃO 21 - PROTEÇÃO DE DISTÂNCIA
// Arquivo: calc_21_grafico.js
// Descrição: Geração de gráficos com ECharts
// ============================================================================

/**
 * Cria o gráfico da proteção 21 no plano R-X
 * @param {Object} resultados - Resultados calculados
 */
function criarGrafico21(resultados) {
    console.log('Criando gráfico da Função 21...');
    
    // Verificar se existe área de gráfico, senão criar
    let areaGrafico = document.getElementById('grafico-21');
    if (!areaGrafico) {
        const areaResultados = document.getElementById('resultados');
        if (!areaResultados) return;
        
        // Criar container do gráfico
        const divGrafico = document.createElement('div');
        divGrafico.className = 'resultado-secao mt-4';
        divGrafico.innerHTML = `
            <h6 class="resultado-titulo">Gráfico - Plano R-X</h6>
            <div id="grafico-21" style="width: 100%; height: 600px;"></div>
        `;
        areaResultados.appendChild(divGrafico);
        areaGrafico = document.getElementById('grafico-21');
    }
    
    // Inicializar ECharts
    const chart = echarts.init(areaGrafico);
    
    // Preparar séries de dados
    const series = [];
    const cores = ['#e30613', '#0066cc', '#00cc66', '#ff9900', '#9933cc'];
    
    resultados.zonas.forEach((zona, idx) => {
        // Série para Fase
        if (zona.fase && zona.fase.vertices && zona.fase.vertices.length > 0) {
            const dadosFase = zona.fase.vertices.map(v => [v.R, v.X]);
            // Fechar o polígono
            if (dadosFase.length > 0) {
                dadosFase.push(dadosFase[0]);
            }
            
            series.push({
                name: `Zona ${zona.numero} - Fase`,
                type: 'line',
                data: dadosFase,
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
        
        // Série para Terra
        if (zona.terra && zona.terra.vertices && zona.terra.vertices.length > 0) {
            const dadosTerra = zona.terra.vertices.map(v => [v.R, v.X]);
            // Fechar o polígono
            if (dadosTerra.length > 0) {
                dadosTerra.push(dadosTerra[0]);
            }
            
            series.push({
                name: `Zona ${zona.numero} - Terra`,
                type: 'line',
                data: dadosTerra,
                lineStyle: {
                    color: cores[idx % cores.length],
                    width: 2,
                    type: 'dashed'
                },
                itemStyle: {
                    color: cores[idx % cores.length]
                },
                symbol: 'diamond',
                symbolSize: 6,
                smooth: false,
                areaStyle: {
                    color: cores[idx % cores.length],
                    opacity: 0.05
                }
            });
        }
    });
    
    // Configurar opções do gráfico
    const option = {
        title: {
            text: 'Característica de Proteção de Distância - Plano R-X',
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
            },
            min: function(value) {
                return Math.min(0, value.min - 0.1);
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
    
    // Aplicar configuração
    chart.setOption(option);
    
    // Responsividade
    window.addEventListener('resize', function() {
        chart.resize();
    });
    
    // Armazenar instância do gráfico
    window.grafico21Instance = chart;
}

/**
 * Cria gráfico comparativo entre zonas
 * @param {Object} resultados - Resultados calculados
 * @param {string} tipo - 'fase' ou 'terra'
 */
function criarGraficoComparativo(resultados, tipo = 'fase') {
    console.log(`Criando gráfico comparativo - ${tipo}...`);
    
    const areaGrafico = document.getElementById(`grafico-21-${tipo}`);
    if (!areaGrafico) return;
    
    const chart = echarts.init(areaGrafico);
    const series = [];
    const cores = ['#e30613', '#0066cc', '#00cc66', '#ff9900', '#9933cc'];
    
    resultados.zonas.forEach((zona, idx) => {
        const dados = tipo === 'fase' ? zona.fase : zona.terra;
        
        if (dados && dados.vertices && dados.vertices.length > 0) {
            const pontos = dados.vertices.map(v => [v.R, v.X]);
            if (pontos.length > 0) {
                pontos.push(pontos[0]); // Fechar polígono
            }
            
            series.push({
                name: `Zona ${zona.numero}`,
                type: 'line',
                data: pontos,
                lineStyle: {
                    color: cores[idx % cores.length],
                    width: 2
                },
                itemStyle: {
                    color: cores[idx % cores.length]
                },
                symbol: 'circle',
                symbolSize: 6,
                areaStyle: {
                    color: cores[idx % cores.length],
                    opacity: 0.15
                }
            });
        }
    });
    
    const option = {
        title: {
            text: `Comparação de Zonas - ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: '{a}<br/>R: {c0} Ω<br/>X: {c1} Ω'
        },
        legend: {
            data: series.map(s => s.name),
            top: 30
        },
        grid: {
            left: '10%',
            right: '10%',
            bottom: '10%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: 'R (Ω)',
            nameLocation: 'middle',
            nameGap: 30
        },
        yAxis: {
            type: 'value',
            name: 'X (Ω)',
            nameLocation: 'middle',
            nameGap: 40
        },
        series: series
    };
    
    chart.setOption(option);
    
    window.addEventListener('resize', function() {
        chart.resize();
    });
}

// Exportar funções
window.criarGrafico21 = criarGrafico21;
window.criarGraficoComparativo = criarGraficoComparativo;

