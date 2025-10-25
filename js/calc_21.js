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

/**
 * Calcula as 6 retas que delimitam a região quadrilateral no plano R-X
 * @param {Object} zona - Dados da zona (fase ou terra)
 * @param {number} anguloCaracteristico - Ângulo característico em graus
 * @param {number} anguloBasculamento - Ângulo de basculamento em graus (opcional, padrão 0)
 * @returns {Array} Array com as 6 retas no formato {a, b, c} onde aR + bX + c = 0
 */
function calcularRetasQuadrilateral(zona, anguloCaracteristico, anguloBasculamento = 0) {
    const retas = [];
    
    // Converter ângulos para radianos
    const thetaCarac = (anguloCaracteristico * Math.PI) / 180;
    const thetaBlinder = (zona.anguloBlinderR * Math.PI) / 180;
    const thetaBasc = (anguloBasculamento * Math.PI) / 180;
    
    // Reta 1: Limite superior (X = alcanceXFrente)
    // X - alcanceXFrente = 0
    retas.push({
        nome: 'R1 - Limite X Frente',
        a: 0,
        b: 1,
        c: -zona.alcanceXFrente
    });
    
    // Reta 2: Limite inferior (X = -alcanceXReverso)
    // X + alcanceXReverso = 0
    retas.push({
        nome: 'R2 - Limite X Reverso',
        a: 0,
        b: 1,
        c: zona.alcanceXReverso
    });
    
    // Reta 3: Limite direito (R = alcanceR)
    // R - alcanceR = 0
    retas.push({
        nome: 'R3 - Limite R',
        a: 1,
        b: 0,
        c: -zona.alcanceR
    });
    
    // Reta 4: Blinder R superior (passa pela origem com ângulo blinder)
    // X - R * tan(thetaBlinder) = 0
    retas.push({
        nome: 'R4 - Blinder R Superior',
        a: -Math.tan(thetaBlinder),
        b: 1,
        c: 0
    });
    
    // Reta 5: Blinder R inferior (passa pela origem com ângulo -blinder)
    // X + R * tan(thetaBlinder) = 0
    retas.push({
        nome: 'R5 - Blinder R Inferior',
        a: Math.tan(thetaBlinder),
        b: 1,
        c: 0
    });
    
    // Reta 6: Linha característica (passa pelo ponto alcanceR com ângulo característico + basculamento)
    // Inclinação: tan(thetaCarac + thetaBasc)
    // Passa por (alcanceR, 0) após rotação
    const thetaTotal = thetaCarac + thetaBasc;
    const m = Math.tan(thetaTotal);
    // X - m*(R - alcanceR) = 0
    // X - m*R + m*alcanceR = 0
    retas.push({
        nome: 'R6 - Linha Característica',
        a: -m,
        b: 1,
        c: m * zona.alcanceR
    });
    
    return retas;
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

/**
 * Determina os vértices da região quadrilateral
 * @param {Array} retas - Array com as 6 retas
 * @returns {Array} Array com os vértices ordenados {R, X}
 */
function determinarVerticesQuadrilateral(retas) {
    const interseccoes = [];
    
    // Calcular todas as intersecções possíveis
    for (let i = 0; i < retas.length; i++) {
        for (let j = i + 1; j < retas.length; j++) {
            const ponto = calcularInterseccao(retas[i], retas[j]);
            if (ponto && ponto.R >= -0.01 && ponto.X >= -1000) { // Filtrar pontos válidos
                interseccoes.push({
                    ...ponto,
                    retas: [i, j]
                });
            }
        }
    }
    
    // Ordenar pontos em sentido anti-horário
    // Simplificação: ordenar por ângulo em relação à origem
    const pontosOrdenados = interseccoes.sort((a, b) => {
        const anguloA = Math.atan2(a.X, a.R);
        const anguloB = Math.atan2(b.X, b.R);
        return anguloA - anguloB;
    });
    
    return pontosOrdenados;
}

/**
 * Função principal de cálculo da proteção 21
 */
function calcularProtecao21() {
    console.log('Iniciando cálculo da Função 21...');
    
    try {
        // Coletar dados do formulário
        const dados = coletarDadosFormulario21();
        console.log('Dados coletados:', dados);
        
        // Processar cada zona habilitada
        const resultados = {
            zonas: []
        };
        
        dados.zonas.forEach(zona => {
            const resultadoZona = {
                numero: zona.numero,
                direcao: zona.direcao,
                fase: null,
                terra: null
            };
            
            // Processar fase se habilitada
            if (zona.fase.habilitado) {
                const retasFase = calcularRetasQuadrilateral(
                    zona.fase,
                    zona.anguloCaracteristico,
                    zona.fase.anguloBasculamento || 0
                );
                const verticesFase = determinarVerticesQuadrilateral(retasFase);
                
                resultadoZona.fase = {
                    retas: retasFase,
                    vertices: verticesFase,
                    parametros: zona.fase
                };
            }
            
            // Processar terra se habilitada
            if (zona.terra.habilitado) {
                const retasTerra = calcularRetasQuadrilateral(
                    zona.terra,
                    zona.anguloCaracteristico,
                    zona.terra.anguloBasculamento || 0
                );
                const verticesTerra = determinarVerticesQuadrilateral(retasTerra);
                
                resultadoZona.terra = {
                    retas: retasTerra,
                    vertices: verticesTerra,
                    parametros: zona.terra
                };
            }
            
            resultados.zonas.push(resultadoZona);
        });
        
        console.log('Resultados calculados:', resultados);
        
        // Exibir resultados e equações
        if (typeof exibirResultados21 === 'function') {
            exibirResultados21(dados, resultados);
        }
        
        // Criar gráficos
        if (typeof criarGrafico21 === 'function') {
            criarGrafico21(resultados);
        }
        
    } catch (erro) {
        console.error('Erro no cálculo:', erro);
        alert('Erro ao realizar o cálculo. Verifique os dados inseridos.');
    }
}

// Exportar funções para uso global
window.calcularProtecao21 = calcularProtecao21;
window.coletarDadosFormulario21 = coletarDadosFormulario21;
window.calcularRetasQuadrilateral = calcularRetasQuadrilateral;
window.determinarVerticesQuadrilateral = determinarVerticesQuadrilateral;

