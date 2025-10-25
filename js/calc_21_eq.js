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
    resultados.zonas.forEach((zona, idx) => {
        const dadosZona = dados.zonas[idx];
        
        if (!zona.faseFase && !zona.faseTerra) return; // Pular zonas totalmente desabilitadas
        
        html += `<div class="resultado-secao mb-4">`;
        html += `<h6 class="resultado-titulo">Zona ${zona.numero} - Direção: ${zona.direcao === 'frente' ? 'Frente' : 'Reverso'}</h6>`;
        html += `<p><strong>Ângulo Característico:</strong> ${dadosZona.anguloCaracteristico}°</p>`;
        
        // Resultados Fase-Fase
        if (zona.faseFase) {
            html += '<div class="resultado-subsecao mb-3">';
            html += '<h6 class="resultado-subtitulo">Faltas Fase-Fase</h6>';
            html += '<div class="resultado-conteudo">';
            
            // Parâmetros
            html += `<p><strong>Tipo:</strong> Quadrilateral</p>`;
            html += `<p><strong>Alcance R:</strong> ${dadosZona.fase.alcanceR.toFixed(4)} Ω</p>`;
            html += `<p><strong>Alcance X Frente:</strong> ${dadosZona.fase.alcanceXFrente.toFixed(4)} Ω</p>`;
            html += `<p><strong>Alcance X Reverso:</strong> ${dadosZona.fase.alcanceXReverso.toFixed(4)} Ω</p>`;
            html += `<p><strong>Ângulo Blinder R:</strong> ${dadosZona.fase.anguloBlinderR.toFixed(2)}°</p>`;
            
            if (zona.numero === 1 && dadosZona.fase.anguloBasculamento !== undefined) {
                html += `<p><strong>Ângulo Basculamento:</strong> ${dadosZona.fase.anguloBasculamento.toFixed(2)}°</p>`;
            }
            
            // Vértices Frente
            if (zona.faseFase.frente && zona.faseFase.frente.vertices.length > 0) {
                html += '<div class="mt-3">';
                html += '<p><strong>Vértices da região Frente (R, X):</strong></p>';
                html += '<ul>';
                zona.faseFase.frente.vertices.forEach((v, idx) => {
                    html += `<li>P${idx + 1}: (${v.R.toFixed(4)}, ${v.X.toFixed(4)}) Ω</li>`;
                });
                html += '</ul>';
                html += '</div>';
            }
            
            // Vértices Reverso
            if (zona.faseFase.reverso && zona.faseFase.reverso.vertices.length > 0) {
                html += '<div class="mt-3">';
                html += '<p><strong>Vértices da região Reverso (R, X):</strong></p>';
                html += '<ul>';
                zona.faseFase.reverso.vertices.forEach((v, idx) => {
                    html += `<li>P${idx + 1}: (${v.R.toFixed(4)}, ${v.X.toFixed(4)}) Ω</li>`;
                });
                html += '</ul>';
                html += '</div>';
            }
            
            html += '</div>';
            html += '</div>';
        }
        
        // Resultados Fase-Terra
        if (zona.faseTerra) {
            html += '<div class="resultado-subsecao mb-3">';
            html += '<h6 class="resultado-subtitulo">Faltas Fase-Terra</h6>';
            html += '<div class="resultado-conteudo">';
            
            // Parâmetros
            html += `<p><strong>Tipo:</strong> Quadrilateral</p>`;
            html += `<p><strong>Módulo kn:</strong> ${dadosZona.terra.moduloKn.toFixed(4)}</p>`;
            html += `<p><strong>Ângulo kn:</strong> ${dadosZona.terra.anguloKn.toFixed(2)}°</p>`;
            html += `<p><strong>Compensação Homopolar (α):</strong> ${zona.faseTerra.alpha.toFixed(4)}°</p>`;
            html += `<p><strong>Alcance R:</strong> ${dadosZona.terra.alcanceR.toFixed(4)} Ω</p>`;
            html += `<p><strong>Alcance X Frente:</strong> ${dadosZona.terra.alcanceXFrente.toFixed(4)} Ω</p>`;
            html += `<p><strong>Alcance X Reverso:</strong> ${dadosZona.terra.alcanceXReverso.toFixed(4)} Ω</p>`;
            html += `<p><strong>Ângulo Blinder R:</strong> ${dadosZona.terra.anguloBlinderR.toFixed(2)}°</p>`;
            
            if (zona.numero === 1 && dadosZona.terra.anguloBasculamento !== undefined) {
                html += `<p><strong>Ângulo Basculamento:</strong> ${dadosZona.terra.anguloBasculamento.toFixed(2)}°</p>`;
            }
            
            // Vértices Frente
            if (zona.faseTerra.frente && zona.faseTerra.frente.vertices.length > 0) {
                html += '<div class="mt-3">';
                html += '<p><strong>Vértices da região Frente (R, X):</strong></p>';
                html += '<ul>';
                zona.faseTerra.frente.vertices.forEach((v, idx) => {
                    html += `<li>P${idx + 1}: (${v.R.toFixed(4)}, ${v.X.toFixed(4)}) Ω</li>`;
                });
                html += '</ul>';
                html += '</div>';
            }
            
            // Vértices Reverso
            if (zona.faseTerra.reverso && zona.faseTerra.reverso.vertices.length > 0) {
                html += '<div class="mt-3">';
                html += '<p><strong>Vértices da região Reverso (R, X):</strong></p>';
                html += '<ul>';
                zona.faseTerra.reverso.vertices.forEach((v, idx) => {
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
    html += '<li><strong>r1:</strong> Supervisão direcional (limite angular inferior)</li>';
    html += '<li><strong>r2:</strong> Limite de alcance X (horizontal inferior)</li>';
    html += '<li><strong>r3:</strong> Limite de alcance R com ângulo blinder</li>';
    html += '<li><strong>r4:</strong> Linha característica com basculamento (zona 1) ou limite X superior</li>';
    html += '<li><strong>r5:</strong> Limite de alcance R negativo (vertical)</li>';
    html += '<li><strong>r6:</strong> Supervisão direcional (limite angular superior)</li>';
    html += '</ol>';
    html += '<p><strong>Nota:</strong> Para faltas fase-terra, as retas são rotacionadas pelo ângulo de compensação homopolar α = arg(1 + k<sub>n</sub>).</p>';
    html += '</div>';
    html += '</div>';
    
    html += '<div class="formula mb-4">';
    html += '<div class="formula-title">Conversão Polar para Cartesiano</div>';
    html += '<div class="formula-text">';
    html += '<p>Uma reta passando por (R₀, X₀) com inclinação θ é convertida para a forma a×R + b×X + c = 0:</p>';
    html += '</div>';
    html += '<div class="formula-equation">';
    html += 'a = -sin(θ)<br>';
    html += 'b = cos(θ)<br>';
    html += 'c = sin(θ)×R₀ - cos(θ)×X₀';
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
    html += '<div class="constant">a, b, c = coeficientes normalizados da reta</div>';
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
    html += '<div class="formula-title">Compensação Homopolar (Faltas Fase-Terra)</div>';
    html += '<div class="formula-equation">';
    html += 'α = arg(1 + k<sub>n</sub>)<br><br>';
    html += 'k<sub>n</sub> = |k<sub>n</sub>| ∠φ<sub>n</sub><br><br>';
    html += 'k<sub>n</sub> = (Z<sub>0</sub> - Z<sub>1</sub>) / Z<sub>1</sub>';
    html += '</div>';
    html += '<div class="formula-constants">';
    html += '<div class="constants-title">Onde:</div>';
    html += '<div class="constant">α = ângulo de compensação homopolar</div>';
    html += '<div class="constant">k<sub>n</sub> = fator de compensação de sequência zero</div>';
    html += '<div class="constant">Z<sub>0</sub> = impedância de sequência zero</div>';
    html += '<div class="constant">Z<sub>1</sub> = impedância de sequência positiva</div>';
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

