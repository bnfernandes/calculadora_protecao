// ============================================================================
// FUNÇÃO 21 - PROTEÇÃO DE DISTÂNCIA
// Arquivo: calc_21_eq.js
// Descrição: Exibição de resultados e equações
// ============================================================================

/**
 * Exibe os resultados do cálculo na área de resultados
 * @param {Object} dados - Dados de entrada do formulário
 * @param {Object} resultados - Resultados calculados
 */
function exibirResultados21(dados, resultados) {
    const areaResultados = document.getElementById('resultados');
    if (!areaResultados) return;
    
    let html = '<div class="resultados-21">';
    
    // Título
    html += '<h5 class="mb-4">Resultados do Cálculo - Função 21</h5>';
    
    // Supervisão Direcional
    html += '<div class="resultado-secao mb-4">';
    html += '<h6 class="resultado-titulo">Supervisão Direcional</h6>';
    html += '<div class="resultado-conteudo">';
    html += `<p><strong>Ângulo fase-fase:</strong> ${dados.supervisaoDirecional.anguloFaseFase}°</p>`;
    html += `<p><strong>Amplitude fase-fase:</strong> ${dados.supervisaoDirecional.amplitudeFaseFase}°</p>`;
    html += `<p><strong>Ângulo fase-terra:</strong> ${dados.supervisaoDirecional.anguloFaseTerra}°</p>`;
    html += `<p><strong>Amplitude fase-terra:</strong> ${dados.supervisaoDirecional.amplitudeFaseTerra}°</p>`;
    html += '</div>';
    html += '</div>';
    
    // Resultados por zona
    resultados.zonas.forEach(zona => {
        if (!zona.fase && !zona.terra) return; // Pular zonas totalmente desabilitadas
        
        html += `<div class="resultado-secao mb-4">`;
        html += `<h6 class="resultado-titulo">Zona ${zona.numero} - Direção: ${zona.direcao === 'frente' ? 'Frente' : 'Reverso'}</h6>`;
        
        // Resultados Fase
        if (zona.fase) {
            html += '<div class="resultado-subsecao mb-3">';
            html += '<h6 class="resultado-subtitulo">Fase</h6>';
            html += '<div class="resultado-conteudo">';
            
            // Parâmetros
            html += `<p><strong>Tipo:</strong> ${zona.fase.parametros.tipo}</p>`;
            html += `<p><strong>Alcance R:</strong> ${zona.fase.parametros.alcanceR.toFixed(4)} Ω</p>`;
            html += `<p><strong>Alcance X Frente:</strong> ${zona.fase.parametros.alcanceXFrente.toFixed(4)} Ω</p>`;
            html += `<p><strong>Alcance X Reverso:</strong> ${zona.fase.parametros.alcanceXReverso.toFixed(4)} Ω</p>`;
            html += `<p><strong>Ângulo Blinder R:</strong> ${zona.fase.parametros.anguloBlinderR.toFixed(2)}°</p>`;
            
            if (zona.numero === 1 && zona.fase.parametros.anguloBasculamento !== undefined) {
                html += `<p><strong>Ângulo Basculamento:</strong> ${zona.fase.parametros.anguloBasculamento.toFixed(2)}°</p>`;
            }
            
            // Vértices do quadrilátero
            if (zona.fase.vertices && zona.fase.vertices.length > 0) {
                html += '<div class="mt-3">';
                html += '<p><strong>Vértices da região de operação (R, X):</strong></p>';
                html += '<ul>';
                zona.fase.vertices.forEach((v, idx) => {
                    html += `<li>P${idx + 1}: (${v.R.toFixed(4)}, ${v.X.toFixed(4)}) Ω</li>`;
                });
                html += '</ul>';
                html += '</div>';
            }
            
            html += '</div>';
            html += '</div>';
        }
        
        // Resultados Terra
        if (zona.terra) {
            html += '<div class="resultado-subsecao mb-3">';
            html += '<h6 class="resultado-subtitulo">Terra</h6>';
            html += '<div class="resultado-conteudo">';
            
            // Parâmetros
            html += `<p><strong>Tipo:</strong> ${zona.terra.parametros.tipo}</p>`;
            html += `<p><strong>Módulo kn:</strong> ${zona.terra.parametros.moduloKn.toFixed(4)}</p>`;
            html += `<p><strong>Ângulo kn:</strong> ${zona.terra.parametros.anguloKn.toFixed(2)}°</p>`;
            html += `<p><strong>Alcance R:</strong> ${zona.terra.parametros.alcanceR.toFixed(4)} Ω</p>`;
            html += `<p><strong>Alcance X Frente:</strong> ${zona.terra.parametros.alcanceXFrente.toFixed(4)} Ω</p>`;
            html += `<p><strong>Alcance X Reverso:</strong> ${zona.terra.parametros.alcanceXReverso.toFixed(4)} Ω</p>`;
            html += `<p><strong>Ângulo Blinder R:</strong> ${zona.terra.parametros.anguloBlinderR.toFixed(2)}°</p>`;
            
            if (zona.numero === 1 && zona.terra.parametros.anguloBasculamento !== undefined) {
                html += `<p><strong>Ângulo Basculamento:</strong> ${zona.terra.parametros.anguloBasculamento.toFixed(2)}°</p>`;
            }
            
            // Vértices do quadrilátero
            if (zona.terra.vertices && zona.terra.vertices.length > 0) {
                html += '<div class="mt-3">';
                html += '<p><strong>Vértices da região de operação (R, X):</strong></p>';
                html += '<ul>';
                zona.terra.vertices.forEach((v, idx) => {
                    html += `<li>P${idx + 1}: (${v.R.toFixed(4)}, ${v.X.toFixed(4)}) Ω</li>`;
                });
                html += '</ul>';
                html += '</div>';
            }
            
            html += '</div>';
            html += '</div>';
        }
        
        html += '</div>';
    });
    
    // Equações
    html += gerarSecaoEquacoes();
    
    html += '</div>';
    
    areaResultados.innerHTML = html;
}

/**
 * Gera a seção de equações explicativas
 * @returns {string} HTML com as equações
 */
function gerarSecaoEquacoes() {
    let html = '<div class="resultado-secao mb-4">';
    html += '<h6 class="resultado-titulo">Equações Utilizadas</h6>';
    html += '<div class="resultado-conteudo">';
    
    html += '<div class="formula mb-4">';
    html += '<div class="formula-title">Característica Quadrilateral no Plano R-X</div>';
    html += '<div class="formula-text">';
    html += '<p>A região de operação quadrilateral é delimitada por 6 retas no plano R-X (resistência-reatância):</p>';
    html += '<ol>';
    html += '<li><strong>R1 - Limite X Frente:</strong> X = X<sub>frente</sub></li>';
    html += '<li><strong>R2 - Limite X Reverso:</strong> X = -X<sub>reverso</sub></li>';
    html += '<li><strong>R3 - Limite R:</strong> R = R<sub>alcance</sub></li>';
    html += '<li><strong>R4 - Blinder R Superior:</strong> X = R × tan(θ<sub>blinder</sub>)</li>';
    html += '<li><strong>R5 - Blinder R Inferior:</strong> X = -R × tan(θ<sub>blinder</sub>)</li>';
    html += '<li><strong>R6 - Linha Característica:</strong> Passa pelo ponto (R<sub>alcance</sub>, 0) com inclinação θ<sub>carac</sub> + θ<sub>basc</sub></li>';
    html += '</ol>';
    html += '</div>';
    html += '</div>';
    
    html += '<div class="formula mb-4">';
    html += '<div class="formula-title">Forma Geral da Reta</div>';
    html += '<div class="formula-equation">';
    html += 'a × R + b × X + c = 0';
    html += '</div>';
    html += '<div class="formula-constants">';
    html += '<div class="constants-title">Onde:</div>';
    html += '<div class="constant">R = componente resistiva da impedância (Ω)</div>';
    html += '<div class="constant">X = componente reativa da impedância (Ω)</div>';
    html += '<div class="constant">a, b, c = coeficientes da reta</div>';
    html += '</div>';
    html += '</div>';
    
    html += '<div class="formula mb-4">';
    html += '<div class="formula-title">Impedância Medida</div>';
    html += '<div class="formula-equation">';
    html += 'Z = R + jX = |Z| ∠θ';
    html += '</div>';
    html += '<div class="formula-constants">';
    html += '<div class="constants-title">Onde:</div>';
    html += '<div class="constant">Z = impedância complexa vista pelo relé</div>';
    html += '<div class="constant">|Z| = módulo da impedância</div>';
    html += '<div class="constant">θ = ângulo da impedância</div>';
    html += '</div>';
    html += '</div>';
    
    html += '<div class="formula">';
    html += '<div class="formula-title">Compensação de Terra (kn)</div>';
    html += '<div class="formula-equation">';
    html += 'Z<sub>terra</sub> = Z<sub>fase</sub> + k<sub>n</sub> × Z<sub>0</sub>';
    html += '</div>';
    html += '<div class="formula-constants">';
    html += '<div class="constants-title">Onde:</div>';
    html += '<div class="constant">k<sub>n</sub> = fator de compensação de sequência zero</div>';
    html += '<div class="constant">k<sub>n</sub> = |k<sub>n</sub>| ∠φ<sub>n</sub></div>';
    html += '<div class="constant">Z<sub>0</sub> = impedância de sequência zero</div>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    html += '</div>';
    
    return html;
}

/**
 * Formata um número para exibição
 * @param {number} valor - Valor a ser formatado
 * @param {number} casas - Número de casas decimais
 * @returns {string} Valor formatado
 */
function formatarNumero(valor, casas = 4) {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return 'N/A';
    }
    return valor.toFixed(casas);
}

// Exportar funções
window.exibirResultados21 = exibirResultados21;
window.gerarSecaoEquacoes = gerarSecaoEquacoes;

