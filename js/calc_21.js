// ============================================================================
// FUNÇÃO 21 - PROTEÇÃO DE DISTÂNCIA
// Arquivo: calc_21.js
// Descrição: Lógica de cálculos e controle do formulário
// ============================================================================

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    inicializarFormulario21();
    configurarEventosFormulario21();
});

/**
 * Inicializa o formulário com valores padrão e configurações
 */
function inicializarFormulario21() {
    console.log('Inicializando formulário da Função 21...');
    
    // Configurar visibilidade inicial dos campos condicionais
    atualizarVisibilidadeIFaseFase();
    atualizarVisibilidadeIFaseTerra();
    
    // Configurar visibilidade para todas as zonas
    for (let i = 1; i <= 5; i++) {
        atualizarVisibilidadeZonaFase(i);
        atualizarVisibilidadeZonaTerra(i);
    }
}

/**
 * Configura todos os event listeners do formulário
 */
function configurarEventosFormulario21() {
    // Supervisão I fase-fase
    const habIFaseFase = document.getElementById('habilitacaoIFaseFase');
    if (habIFaseFase) {
        habIFaseFase.addEventListener('change', atualizarVisibilidadeIFaseFase);
    }
    
    // Supervisão I fase-terra
    const habIFaseTerra = document.getElementById('habilitacaoIFaseTerra');
    if (habIFaseTerra) {
        habIFaseTerra.addEventListener('change', atualizarVisibilidadeIFaseTerra);
    }
    
    // Event listeners para habilitação de zonas (fase e terra)
    for (let i = 1; i <= 5; i++) {
        const habFase = document.getElementById(`z${i}HabilitacaoFase`);
        const habTerra = document.getElementById(`z${i}HabilitacaoTerra`);
        
        if (habFase) {
            habFase.addEventListener('change', () => atualizarVisibilidadeZonaFase(i));
        }
        
        if (habTerra) {
            habTerra.addEventListener('change', () => atualizarVisibilidadeZonaTerra(i));
        }
    }
    
    // Botão Limpar
    const btnLimpar = document.getElementById('btnLimpar');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFormulario21);
    }
    
    // Formulário submit
    const form = document.getElementById('form-21');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            calcularProtecao21();
        });
    }
}

/**
 * Atualiza visibilidade dos campos de Supervisão I fase-fase
 */
function atualizarVisibilidadeIFaseFase() {
    const habilitacao = document.getElementById('habilitacaoIFaseFase').value;
    const campos = document.querySelectorAll('.campos-i-fase-fase');
    
    campos.forEach(campo => {
        const inputs = campo.querySelectorAll('input, select');
        if (habilitacao === 'ativo') {
            campo.style.display = '';
            inputs.forEach(input => input.removeAttribute('disabled'));
        } else {
            campo.style.display = 'none';
            inputs.forEach(input => input.setAttribute('disabled', 'disabled'));
        }
    });
}

/**
 * Atualiza visibilidade dos campos de Supervisão I fase-terra
 */
function atualizarVisibilidadeIFaseTerra() {
    const habilitacao = document.getElementById('habilitacaoIFaseTerra').value;
    const campos = document.querySelectorAll('.campos-i-fase-terra');
    
    campos.forEach(campo => {
        const inputs = campo.querySelectorAll('input, select');
        if (habilitacao === 'ativo') {
            campo.style.display = '';
            inputs.forEach(input => input.removeAttribute('disabled'));
        } else {
            campo.style.display = 'none';
            inputs.forEach(input => input.setAttribute('disabled', 'disabled'));
        }
    });
}

/**
 * Atualiza visibilidade dos campos de fase de uma zona específica
 * @param {number} zona - Número da zona (1-5)
 */
function atualizarVisibilidadeZonaFase(zona) {
    const habilitacao = document.getElementById(`z${zona}HabilitacaoFase`).value;
    const campos = document.querySelectorAll(`.campos-z${zona}-fase`);
    
    campos.forEach(campo => {
        const inputs = campo.querySelectorAll('input, select');
        if (habilitacao === 'ativo') {
            campo.style.display = '';
            inputs.forEach(input => input.removeAttribute('disabled'));
        } else {
            campo.style.display = 'none';
            inputs.forEach(input => input.setAttribute('disabled', 'disabled'));
        }
    });
}

/**
 * Atualiza visibilidade dos campos de terra de uma zona específica
 * @param {number} zona - Número da zona (1-5)
 */
function atualizarVisibilidadeZonaTerra(zona) {
    const habilitacao = document.getElementById(`z${zona}HabilitacaoTerra`).value;
    const campos = document.querySelectorAll(`.campos-z${zona}-terra`);
    
    campos.forEach(campo => {
        const inputs = campo.querySelectorAll('input, select');
        if (habilitacao === 'ativo') {
            campo.style.display = '';
            inputs.forEach(input => input.removeAttribute('disabled'));
        } else {
            campo.style.display = 'none';
            inputs.forEach(input => input.setAttribute('disabled', 'disabled'));
        }
    });
}

/**
 * Limpa todos os campos do formulário e restaura valores padrão
 */
function limparFormulario21() {
    const form = document.getElementById('form-21');
    if (form) {
        form.reset();
        
        // Restaurar visibilidade após reset
        setTimeout(() => {
            inicializarFormulario21();
        }, 50);
    }
    
    // Limpar área de resultados
    const resultados = document.getElementById('resultados');
    if (resultados) {
        resultados.innerHTML = '<p class="text-center text-muted">Os resultados do cálculo aparecerão aqui após o processamento.</p>';
    }
}

/**
 * Coleta todos os dados do formulário
 * @returns {Object} Objeto com todos os parâmetros do formulário
 */
function coletarDadosFormulario21() {
    const dados = {
        supervisaoDirecional: {
            anguloFaseFase: parseFloat(document.getElementById('anguloFaseFase').value) || 45,
            amplitudeFaseFase: parseFloat(document.getElementById('amplitudeFaseFase').value) || 170,
            anguloFaseTerra: parseFloat(document.getElementById('anguloFaseTerra').value) || 45,
            amplitudeFaseTerra: parseFloat(document.getElementById('amplitudeFaseTerra').value) || 170
        },
        supervisaoIFaseFase: {
            habilitado: document.getElementById('habilitacaoIFaseFase').value === 'ativo',
            correnteMinimaFrente: parseFloat(document.getElementById('correnteMinimaFaseFaseFrente').value) || 0.5,
            correnteMinimaReverso: parseFloat(document.getElementById('correnteMinimaFaseFaseReverso').value) || 0.5
        },
        supervisaoIFaseTerra: {
            habilitado: document.getElementById('habilitacaoIFaseTerra').value === 'ativo',
            correnteFaseMinimaFrente: parseFloat(document.getElementById('correnteFaseMinimaFrente').value) || 0.5,
            correnteFaseMinimaReverso: parseFloat(document.getElementById('correnteFaseMinimaReverso').value) || 0.5,
            'correnteTerraMinima Frente': parseFloat(document.getElementById('correnteTerraMinima Frente').value) || 0.5,
            'correnteTerraMinima Reverso': parseFloat(document.getElementById('correnteTerraMinima Reverso').value) || 0.5
        },
        zonas: []
    };
    
    // Coletar dados de todas as 5 zonas
    for (let i = 1; i <= 5; i++) {
        const zona = {
            numero: i,
            direcao: document.getElementById(`z${i}Direcao`).value,
            anguloCaracteristico: parseFloat(document.getElementById(`z${i}AnguloCaracteristico`).value) || 0,
            fase: {
                habilitado: document.getElementById(`z${i}HabilitacaoFase`).value === 'ativo',
                tipo: 'Quadrilateral',
                alcanceR: parseFloat(document.getElementById(`z${i}AlcanceRFase`).value) || 0,
                alcanceXFrente: parseFloat(document.getElementById(`z${i}AlcanceXFrenteFase`).value) || 0,
                alcanceXReverso: parseFloat(document.getElementById(`z${i}AlcanceXReversoFase`).value) || 0,
                anguloBlinderR: parseFloat(document.getElementById(`z${i}AnguloBlinderRFase`).value) || 0
            },
            terra: {
                habilitado: document.getElementById(`z${i}HabilitacaoTerra`).value === 'ativo',
                tipo: 'Quadrilateral',
                moduloKn: parseFloat(document.getElementById(`z${i}ModuloKn`).value) || 0,
                anguloKn: parseFloat(document.getElementById(`z${i}AnguloKn`).value) || 0,
                alcanceR: parseFloat(document.getElementById(`z${i}AlcanceRTerra`).value) || 0,
                alcanceXFrente: parseFloat(document.getElementById(`z${i}AlcanceXFrenteTerra`).value) || 0,
                alcanceXReverso: parseFloat(document.getElementById(`z${i}AlcanceXReversoTerra`).value) || 0,
                anguloBlinderR: parseFloat(document.getElementById(`z${i}AnguloBlinderRTerra`).value) || 0
            }
        };
        
        // Adicionar ângulo de basculamento apenas para Zona 1
        if (i === 1) {
            zona.fase.anguloBasculamento = parseFloat(document.getElementById('z1AnguloBasculamentoFase').value) || 0;
            zona.terra.anguloBasculamento = parseFloat(document.getElementById('z1AnguloBasculamentoTerra').value) || 0;
        }
        
        dados.zonas.push(zona);
    }
    
    return dados;
}

// ============================================================================
// FUNÇÕES AUXILIARES PARA CONVERSÃO E CÁLCULOS
// ============================================================================

/**
 * Converte uma reta em formato polar para cartesiano (versão estável)
 * @param {number} R0 - Coordenada R do ponto por onde a reta passa
 * @param {number} X0 - Coordenada X do ponto por onde a reta passa
 * @param {number} thetaGraus - Ângulo de inclinação em graus
 * @returns {Object} Reta no formato {a, b, c} onde a*R + b*X + c = 0
 */

/**
 * Calcula o ângulo de compensação homopolar alpha = arg(1 + kn)
 * @param {number} moduloKn - Módulo de kn
 * @param {number} anguloKnGraus - Ângulo de kn em graus
 * @returns {number} Ângulo alpha em graus
 */
function calcularAlpha(moduloKn, anguloKnGraus) {
    const anguloKnRad = (anguloKnGraus * Math.PI) / 180;
    
    // kn em coordenadas cartesianas
    const knReal = moduloKn * Math.cos(anguloKnRad);
    const knImag = moduloKn * Math.sin(anguloKnRad);
    
    // 1 + kn
    const somaReal = 1 + knReal;
    const somaImag = knImag;
    
    // arg(1 + kn)
    const alphaRad = Math.atan2(somaImag, somaReal);
    const alphaGraus = (alphaRad * 180) / Math.PI;
    
    return alphaGraus;
}

/**
 * Calcula a intersecção entre duas retas
 * @param {Object} reta1 - Primeira reta {a, b, c}
 * @param {Object} reta2 - Segunda reta {a, b, c}
 * @returns {Object|null} Ponto de intersecção {R, X} ou null se paralelas
 */
function calcularInterseccao(reta1, reta2) {
    const {a: a1, b: b1, c: c1} = reta1;
    const {a: a2, b: b2, c: c2} = reta2;
    
    const determinante = a1 * b2 - a2 * b1;
    
    if (Math.abs(determinante) < 1e-10) {
        return null; // Retas paralelas
    }
    
    const R = (b1 * c2 - b2 * c1) / determinante;
    const X = (a2 * c1 - a1 * c2) / determinante;
    
    return {R, X};
}

// ============================================================================
// FUNÇÕES DE CÁLCULO DAS RETAS PARA CADA CASO DE FALTA
// ============================================================================

/**
 * Calcula as 6 retas para falta fase-fase frente (delante)
 * @param {Object} params - Parâmetros de entrada
 * @returns {Array} Array com 6 retas no formato {nome, a, b, c}
 */

// ============================================================================
// FUNÇÃO PRINCIPAL DE CÁLCULO
// ============================================================================

/**
 * Função principal de cálculo da proteção 21
 * Calcula as regiões para todos os casos de falta respeitando a direção selecionada
 */
function calcularProtecao21() {
    console.log('Iniciando cálculo da Função 21...');
    
    try {
        const dados = coletarDadosFormulario21();
        console.log('Dados coletados:', dados);
        
        const resultados = {
            zonas: []
        };
        
        dados.zonas.forEach(zona => {
            const resultadoZona = {
                numero: zona.numero,
                direcao: zona.direcao,
                faseFase: null,
                faseTerra: null
            };
            
            // ========== PROCESSAR FASE-FASE ==========
            if (zona.fase.habilitado) {
                const paramsFase = {
                    anguloFaseFase: dados.supervisaoDirecional.anguloFaseFase,
                    amplitudeFaseFase: dados.supervisaoDirecional.amplitudeFaseFase,
                    alcanceXFrente: zona.fase.alcanceXFrente,
                    alcanceXReverso: zona.fase.alcanceXReverso,
                    alcanceR: zona.fase.alcanceR,
                    anguloBlinderR: zona.fase.anguloBlinderR,
                    anguloCaracteristico: zona.anguloCaracteristico,
                    anguloBasculamento: zona.fase.anguloBasculamento || 0,
                    temBasculamento: zona.numero === 1
                };
                
                resultadoZona.faseFase = {
                    frente: null,
                    reverso: null
                };
                
                // Calcular FRENTE se direção for "frente"
                if (zona.direcao === 'frente') {
                    const linesPolar = prepararRetasFaseFaseFrente(paramsFase);
                    const theta1 = paramsFase.anguloFaseFase - paramsFase.amplitudeFaseFase / 2;
                    const theta6 = paramsFase.anguloFaseFase + paramsFase.amplitudeFaseFase / 2;
                    const bounds = calcularBounds(paramsFase);
                    const vertices = calcularVerticesRegiao(linesPolar, theta1, theta6, bounds);
                    
                    // Converter retas polares para cartesianas (para debug)
                    const retas = linesPolar.map(lp => ({
                        nome: lp.nome,
                        ...polarParaCartesianoEstavel(lp.R0, lp.X0, lp.thetaDeg)
                    }));
                    
                    resultadoZona.faseFase.frente = {
                        retas: retas,
                        vertices: vertices
                    };
                }
                
                // Calcular REVERSO se direção for "reverso"
                if (zona.direcao === 'reverso') {
                    const linesPolar = prepararRetasFaseFaseReverso(paramsFase);
                    const theta1 = paramsFase.anguloFaseFase - paramsFase.amplitudeFaseFase / 2 + 180;
                    const theta6 = paramsFase.anguloFaseFase + paramsFase.amplitudeFaseFase / 2 + 180;
                    const bounds = calcularBounds(paramsFase);
                    const vertices = calcularVerticesRegiao(linesPolar, theta1, theta6, bounds);
                    
                    // Converter retas polares para cartesianas (para debug)
                    const retas = linesPolar.map(lp => ({
                        nome: lp.nome,
                        ...polarParaCartesianoEstavel(lp.R0, lp.X0, lp.thetaDeg)
                    }));
                    
                    resultadoZona.faseFase.reverso = {
                        retas: retas,
                        vertices: vertices
                    };
                }
            }
            
            // ========== PROCESSAR FASE-TERRA ==========
            if (zona.terra.habilitado) {
                // Calcular alpha (compensação homopolar)
                const alpha = calcularAlpha(zona.terra.moduloKn, zona.terra.anguloKn);
                
                const paramsTerra = {
                    anguloFaseTerra: dados.supervisaoDirecional.anguloFaseTerra,
                    amplitudeFaseTerra: dados.supervisaoDirecional.amplitudeFaseTerra,
                    alcanceXFrente: zona.terra.alcanceXFrente,
                    alcanceXReverso: zona.terra.alcanceXReverso,
                    alcanceR: zona.terra.alcanceR,
                    anguloBlinderR: zona.terra.anguloBlinderR,
                    anguloCaracteristico: zona.anguloCaracteristico,
                    anguloBasculamento: zona.terra.anguloBasculamento || 0,
                    temBasculamento: zona.numero === 1,
                    alpha: alpha
                };
                
                resultadoZona.faseTerra = {
                    alpha: alpha,
                    frente: null,
                    reverso: null
                };
                
                // Calcular FRENTE se direção for "frente"
                if (zona.direcao === 'frente') {
                    const linesPolar = prepararRetasFaseTerraFrente(paramsTerra);
                    const theta1 = paramsTerra.anguloFaseTerra - paramsTerra.amplitudeFaseTerra / 2 - alpha;
                    const theta6 = paramsTerra.anguloFaseTerra + paramsTerra.amplitudeFaseTerra / 2 - alpha;
                    const bounds = calcularBounds(paramsTerra);
                    const vertices = calcularVerticesRegiao(linesPolar, theta1, theta6, bounds);
                    
                    // Converter retas polares para cartesianas (para debug)
                    const retas = linesPolar.map(lp => ({
                        nome: lp.nome,
                        ...polarParaCartesianoEstavel(lp.R0, lp.X0, lp.thetaDeg)
                    }));
                    
                    resultadoZona.faseTerra.frente = {
                        retas: retas,
                        vertices: vertices
                    };
                }
                
                // Calcular REVERSO se direção for "reverso"
                if (zona.direcao === 'reverso') {
                    const linesPolar = prepararRetasFaseTerraReverso(paramsTerra);
                    const theta1 = paramsTerra.anguloFaseTerra - paramsTerra.amplitudeFaseTerra / 2 - alpha + 180;
                    const theta6 = paramsTerra.anguloFaseTerra + paramsTerra.amplitudeFaseTerra / 2 - alpha + 180;
                    const bounds = calcularBounds(paramsTerra);
                    const vertices = calcularVerticesRegiao(linesPolar, theta1, theta6, bounds);
                    
                    // Converter retas polares para cartesianas (para debug)
                    const retas = linesPolar.map(lp => ({
                        nome: lp.nome,
                        ...polarParaCartesianoEstavel(lp.R0, lp.X0, lp.thetaDeg)
                    }));
                    
                    resultadoZona.faseTerra.reverso = {
                        retas: retas,
                        vertices: vertices
                    };
                }
            }
            
            resultados.zonas.push(resultadoZona);
        });
        
        console.log('Resultados calculados:', resultados);
        
        // Exibir resultados
        exibirResultados21(dados, resultados);
        
        // Exibir debug das retas (se função existir)
        if (typeof exibirDebugRetas === 'function') {
            exibirDebugRetas(dados, resultados);
        }
        
        // Criar gráficos separados
        criarGraficosFaseFaseFaseTerra(resultados);
        
    } catch (erro) {
        console.error('Erro no cálculo:', erro);
        alert('Erro ao calcular: ' + erro.message);
    }
}

// ============================================================================
// FUNÇÃO DE EXIBIÇÃO DE RESULTADOS
// ============================================================================

/**
 * Exibe os resultados calculados na interface
 * @param {Object} resultados - Resultados calculados
 */
function exibirResultados21(resultados) {
    const areaResultados = document.getElementById('resultados');
    if (!areaResultados) return;
    
    let html = '<div class="resultado-secao">';
    html += '<h6 class="resultado-titulo">Resultados do Cálculo</h6>';
    
    resultados.zonas.forEach(zona => {
        if (zona.faseFase || zona.faseTerra) {
            html += `<div class="resultado-zona mb-3">`;
            html += `<h6 class="text-primary">Zona ${zona.numero} - Direção: ${zona.direcao}</h6>`;
            
            // Resultados Fase-Fase
            if (zona.faseFase) {
                if (zona.faseFase.frente) {
                    html += `<p><strong>Fase-Fase Frente:</strong> ${zona.faseFase.frente.vertices.length} vértices calculados</p>`;
                }
                if (zona.faseFase.reverso) {
                    html += `<p><strong>Fase-Fase Reverso:</strong> ${zona.faseFase.reverso.vertices.length} vértices calculados</p>`;
                }
            }
            
            // Resultados Fase-Terra
            if (zona.faseTerra) {
                html += `<p><strong>Compensação Homopolar (α):</strong> ${zona.faseTerra.alpha.toFixed(4)}°</p>`;
                if (zona.faseTerra.frente) {
                    html += `<p><strong>Fase-Terra Frente:</strong> ${zona.faseTerra.frente.vertices.length} vértices calculados</p>`;
                }
                if (zona.faseTerra.reverso) {
                    html += `<p><strong>Fase-Terra Reverso:</strong> ${zona.faseTerra.reverso.vertices.length} vértices calculados</p>`;
                }
            }
            
            html += `</div>`;
        }
    });
    
    html += '</div>';
    areaResultados.innerHTML = html;
}

