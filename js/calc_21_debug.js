// ============================================================================
// FUNÇÃO 21 - PROTEÇÃO DE DISTÂNCIA
// Arquivo: calc_21_debug.js
// Descrição: Funções de debug para análise das retas calculadas
// ============================================================================

/**
 * Adiciona seção de debug aos resultados mostrando as retas em formato polar e cartesiano
 * @param {Object} dados - Dados de entrada do formulário
 * @param {Object} resultados - Resultados calculados
 */
function exibirDebugRetas(dados, resultados) {
    const areaResultados = document.getElementById('resultados');
    if (!areaResultados) return;
    
    let html = '<div class="resultado-secao mb-4" style="background-color: #fff3cd; border: 2px solid #ffc107;">';
    html += '<h6 class="resultado-titulo" style="color: #856404;">🔍 DEBUG - Análise das Retas</h6>';
    html += '<div class="resultado-conteudo">';
    
    resultados.zonas.forEach((zona, idx) => {
        const dadosZona = dados.zonas[idx];
        
        if (!zona.faseFase && !zona.faseTerra) return;
        
        html += `<div class="mb-4" style="border-left: 4px solid #007bff; padding-left: 15px;">`;
        html += `<h6 style="color: #007bff;">Zona ${zona.numero} - Direção: ${zona.direcao}</h6>`;
        
        // Debug Fase-Fase Frente
        if (zona.faseFase && zona.faseFase.frente) {
            html += '<div class="mb-3">';
            html += '<h6 style="color: #28a745; font-size: 14px;">📊 Fase-Fase FRENTE</h6>';
            html += gerarTabelaRetasDebug(
                zona.faseFase.frente.retas,
                dadosZona,
                dados.supervisaoDirecional,
                'fase',
                'frente',
                null
            );
            html += '</div>';
        }
        
        // Debug Fase-Fase Reverso
        if (zona.faseFase && zona.faseFase.reverso) {
            html += '<div class="mb-3">';
            html += '<h6 style="color: #dc3545; font-size: 14px;">📊 Fase-Fase REVERSO</h6>';
            html += gerarTabelaRetasDebug(
                zona.faseFase.reverso.retas,
                dadosZona,
                dados.supervisaoDirecional,
                'fase',
                'reverso',
                null
            );
            html += '</div>';
        }
        
        // Debug Fase-Terra Frente
        if (zona.faseTerra && zona.faseTerra.frente) {
            html += '<div class="mb-3">';
            html += '<h6 style="color: #28a745; font-size: 14px;">📊 Fase-Terra FRENTE (α = ' + zona.faseTerra.alpha.toFixed(4) + '°)</h6>';
            html += gerarTabelaRetasDebug(
                zona.faseTerra.frente.retas,
                dadosZona,
                dados.supervisaoDirecional,
                'terra',
                'frente',
                zona.faseTerra.alpha
            );
            html += '</div>';
        }
        
        // Debug Fase-Terra Reverso
        if (zona.faseTerra && zona.faseTerra.reverso) {
            html += '<div class="mb-3">';
            html += '<h6 style="color: #dc3545; font-size: 14px;">📊 Fase-Terra REVERSO (α = ' + zona.faseTerra.alpha.toFixed(4) + '°)</h6>';
            html += gerarTabelaRetasDebug(
                zona.faseTerra.reverso.retas,
                dadosZona,
                dados.supervisaoDirecional,
                'terra',
                'reverso',
                zona.faseTerra.alpha
            );
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    html += '</div>';
    html += '</div>';
    
    areaResultados.insertAdjacentHTML('beforeend', html);
}

/**
 * Gera tabela com informações das retas em formato polar e cartesiano
 * @param {Array} retas - Array de retas calculadas
 * @param {Object} dadosZona - Dados da zona
 * @param {Object} supervisao - Dados de supervisão direcional
 * @param {string} tipo - 'fase' ou 'terra'
 * @param {string} direcao - 'frente' ou 'reverso'
 * @param {number} alpha - Ângulo de compensação homopolar (null para fase-fase)
 * @returns {string} HTML da tabela
 */
function gerarTabelaRetasDebug(retas, dadosZona, supervisao, tipo, direcao, alpha) {
    const params = tipo === 'fase' ? dadosZona.fase : dadosZona.terra;
    const anguloSup = tipo === 'fase' ? supervisao.anguloFaseFase : supervisao.anguloFaseTerra;
    const amplitudeSup = tipo === 'fase' ? supervisao.amplitudeFaseFase : supervisao.amplitudeFaseTerra;
    
    let html = '<table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px;">';
    html += '<thead>';
    html += '<tr style="background-color: #e9ecef;">';
    html += '<th style="border: 1px solid #dee2e6; padding: 8px;">Reta</th>';
    html += '<th style="border: 1px solid #dee2e6; padding: 8px;">Fórmula Polar</th>';
    html += '<th style="border: 1px solid #dee2e6; padding: 8px;">Ponto (R₀, X₀)</th>';
    html += '<th style="border: 1px solid #dee2e6; padding: 8px;">Ângulo θ</th>';
    html += '<th style="border: 1px solid #dee2e6; padding: 8px;">Cartesiano (a, b, c)</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';
    
    retas.forEach((reta, idx) => {
        const info = calcularInfoPolarReta(
            reta.nome,
            dadosZona,
            supervisao,
            tipo,
            direcao,
            alpha
        );
        
        html += '<tr>';
        html += `<td style="border: 1px solid #dee2e6; padding: 8px; font-weight: bold;">${reta.nome}</td>`;
        html += `<td style="border: 1px solid #dee2e6; padding: 8px; font-family: monospace;">${info.formula}</td>`;
        html += `<td style="border: 1px solid #dee2e6; padding: 8px;">(${info.R0.toFixed(4)}, ${info.X0.toFixed(4)})</td>`;
        html += `<td style="border: 1px solid #dee2e6; padding: 8px;">${info.theta.toFixed(4)}°</td>`;
        html += `<td style="border: 1px solid #dee2e6; padding: 8px; font-family: monospace;">`;
        html += `a=${reta.a.toFixed(6)}<br>b=${reta.b.toFixed(6)}<br>c=${reta.c.toFixed(6)}`;
        html += `</td>`;
        html += '</tr>';
    });
    
    html += '</tbody>';
    html += '</table>';
    
    // Adicionar parâmetros de referência
    html += '<div style="font-size: 11px; color: #6c757d; margin-top: 5px;">';
    html += '<strong>Parâmetros:</strong> ';
    html += `Alcance R = ${params.alcanceR.toFixed(4)}, `;
    html += `Alcance X Frente = ${params.alcanceXFrente.toFixed(4)}, `;
    html += `Alcance X Reverso = ${params.alcanceXReverso.toFixed(4)}, `;
    html += `Ângulo Característico = ${dadosZona.anguloCaracteristico.toFixed(2)}°, `;
    html += `Ângulo Blinder R = ${params.anguloBlinderR.toFixed(2)}°`;
    if (dadosZona.numero === 1 && params.anguloBasculamento !== undefined) {
        html += `, Ângulo Basculamento = ${params.anguloBasculamento.toFixed(2)}°`;
    }
    if (alpha !== null) {
        html += `, α = ${alpha.toFixed(4)}°`;
    }
    html += '</div>';
    
    return html;
}

/**
 * Calcula informações polares de uma reta específica
 * @param {string} nomeReta - Nome da reta (r1, r2, etc)
 * @param {Object} dadosZona - Dados da zona
 * @param {Object} supervisao - Dados de supervisão direcional
 * @param {string} tipo - 'fase' ou 'terra'
 * @param {string} direcao - 'frente' ou 'reverso'
 * @param {number} alpha - Ângulo de compensação homopolar (null para fase-fase)
 * @returns {Object} Informações polares {formula, R0, X0, theta}
 */
function calcularInfoPolarReta(nomeReta, dadosZona, supervisao, tipo, direcao, alpha) {
    const params = tipo === 'fase' ? dadosZona.fase : dadosZona.terra;
    const anguloSup = tipo === 'fase' ? supervisao.anguloFaseFase : supervisao.anguloFaseTerra;
    const amplitudeSup = tipo === 'fase' ? supervisao.amplitudeFaseFase : supervisao.amplitudeFaseTerra;
    const alcanceXFrente = params.alcanceXFrente;
    const alcanceXReverso = params.alcanceXReverso;
    const alcanceR = params.alcanceR;
    const anguloBlinderR = params.anguloBlinderR;
    const anguloCaracteristico = dadosZona.anguloCaracteristico;
    const anguloBasculamento = params.anguloBasculamento || 0;
    const temBasculamento = dadosZona.numero === 1;
    const alphaVal = alpha || 0;
    
    const offset = direcao === 'reverso' ? 180 : 0;
    
    let info = { formula: '', R0: 0, X0: 0, theta: 0 };
    
    switch (nomeReta) {
        case 'r1':
            if (tipo === 'fase') {
                info.theta = anguloSup - amplitudeSup / 2 + offset;
                info.formula = `(0,0)<${anguloSup} - ${amplitudeSup}/2 ${offset > 0 ? '+ 180' : ''}`;
            } else {
                info.theta = anguloSup - amplitudeSup / 2 - alphaVal + offset;
                info.formula = `(0,0)<${anguloSup} - ${amplitudeSup}/2 - α ${offset > 0 ? '+ 180' : ''}`;
            }
            break;
            
        case 'r2':
            if (tipo === 'fase') {
                if (direcao === 'frente') {
                    info.X0 = -alcanceXFrente;
                    info.theta = 0;
                    info.formula = `(0, -${alcanceXFrente.toFixed(4)})<0`;
                } else {
                    info.X0 = alcanceXReverso;
                    info.theta = 0;
                    info.formula = `(0, ${alcanceXReverso.toFixed(4)})<0`;
                }
            } else {
                const tanAlpha = Math.tan((alphaVal * Math.PI) / 180);
                const tanCarac = Math.tan((anguloCaracteristico * Math.PI) / 180);
                if (direcao === 'frente') {
                    info.X0 = -alcanceXFrente * (1 + tanAlpha / tanCarac);
                    info.theta = -alphaVal;
                    info.formula = `(0, -${alcanceXFrente.toFixed(4)}*(1+tan(α)/tan(θc)))<-α`;
                } else {
                    info.X0 = -alcanceXReverso * (1 + tanAlpha / tanCarac);
                    info.theta = -alphaVal;
                    info.formula = `(0, -${alcanceXReverso.toFixed(4)}*(1+tan(α)/tan(θc)))<-α`;
                }
            }
            break;
            
        case 'r3':
            if (direcao === 'frente') {
                info.R0 = alcanceR;
                info.theta = anguloBlinderR;
                info.formula = `(${alcanceR.toFixed(4)}, 0)<${anguloBlinderR.toFixed(2)}`;
            } else {
                info.R0 = -alcanceR;
                info.theta = anguloBlinderR;
                info.formula = `(-${alcanceR.toFixed(4)}, 0)<${anguloBlinderR.toFixed(2)}`;
            }
            break;
            
        case 'r4':
            if (tipo === 'fase') {
                if (temBasculamento) {
                    const tanBasc = Math.tan((-anguloBasculamento * Math.PI) / 180);
                    const tanCarac = Math.tan((anguloCaracteristico * Math.PI) / 180);
                    if (direcao === 'frente') {
                        info.X0 = alcanceXFrente * (1 + tanBasc / tanCarac);
                        info.theta = anguloBasculamento;
                        info.formula = `(0, ${alcanceXFrente.toFixed(4)}*(1+tan(-θb)/tan(θc)))<${anguloBasculamento.toFixed(2)}`;
                    } else {
                        info.X0 = -alcanceXReverso * (1 + tanBasc / tanCarac);
                        info.theta = anguloBasculamento;
                        info.formula = `(0, -${alcanceXReverso.toFixed(4)}*(1+tan(-θb)/tan(θc)))<${anguloBasculamento.toFixed(2)}`;
                    }
                } else {
                    if (direcao === 'frente') {
                        info.X0 = alcanceXFrente;
                        info.theta = 0;
                        info.formula = `(0, ${alcanceXFrente.toFixed(4)})<0`;
                    } else {
                        info.X0 = -alcanceXReverso;
                        info.theta = 0;
                        info.formula = `(0, -${alcanceXReverso.toFixed(4)})<0`;
                    }
                }
            } else {
                const tanCarac = Math.tan((anguloCaracteristico * Math.PI) / 180);
                if (temBasculamento) {
                    const tanBasc = Math.tan(((-anguloBasculamento + alphaVal) * Math.PI) / 180);
                    if (direcao === 'frente') {
                        info.X0 = alcanceXFrente * (1 + tanBasc / tanCarac);
                        info.theta = anguloBasculamento - alphaVal;
                        info.formula = `(0, ${alcanceXFrente.toFixed(4)}*(1+tan(-θb+α)/tan(θc)))<θb-α`;
                    } else {
                        info.X0 = -alcanceXReverso * (1 + tanBasc / tanCarac);
                        info.theta = anguloBasculamento - alphaVal;
                        info.formula = `(0, -${alcanceXReverso.toFixed(4)}*(1+tan(-θb+α)/tan(θc)))<θb-α`;
                    }
                } else {
                    const tanAlpha = Math.tan((alphaVal * Math.PI) / 180);
                    if (direcao === 'frente') {
                        info.X0 = alcanceXFrente * (1 + tanAlpha / tanCarac);
                        info.theta = -alphaVal;
                        info.formula = `(0, ${alcanceXFrente.toFixed(4)}*(1+tan(α)/tan(θc)))<-α`;
                    } else {
                        info.X0 = -alcanceXReverso * (1 + tanAlpha / tanCarac);
                        info.theta = -alphaVal;
                        info.formula = `(0, -${alcanceXReverso.toFixed(4)}*(1+tan(α)/tan(θc)))<-α`;
                    }
                }
            }
            break;
            
        case 'r5':
            if (direcao === 'frente') {
                info.R0 = -alcanceR;
                info.theta = 90;
                info.formula = `(-${alcanceR.toFixed(4)}, 0)<90`;
            } else {
                info.R0 = alcanceR;
                info.theta = 90;
                info.formula = `(${alcanceR.toFixed(4)}, 0)<90`;
            }
            break;
            
        case 'r6':
            if (tipo === 'fase') {
                info.theta = anguloSup + amplitudeSup / 2 + offset;
                info.formula = `(0,0)<${anguloSup} + ${amplitudeSup}/2 ${offset > 0 ? '+ 180' : ''}`;
            } else {
                info.theta = anguloSup + amplitudeSup / 2 - alphaVal + offset;
                info.formula = `(0,0)<${anguloSup} + ${amplitudeSup}/2 - α ${offset > 0 ? '+ 180' : ''}`;
            }
            break;
    }
    
    return info;
}

// Exportar funções
window.exibirDebugRetas = exibirDebugRetas;

