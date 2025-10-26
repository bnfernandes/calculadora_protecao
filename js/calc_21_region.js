// ============================================================================
// FUNÇÃO 21 - PROTEÇÃO DE DISTÂNCIA
// Arquivo: calc_21_region.js
// Descrição: Funções para preparar retas e calcular região usando Sutherland-Hodgman
// ============================================================================

/**
 * Prepara as 6 retas no formato polar para falta fase-fase frente
 * @param {Object} params - Parâmetros de entrada
 * @returns {Array} Array com 6 retas no formato {R0, X0, thetaDeg, nome}
 */
function prepararRetasFaseFaseFrente(params) {
    const {
        anguloFaseFase,
        amplitudeFaseFase,
        alcanceXFrente,
        alcanceR,
        anguloBlinderR,
        anguloCaracteristico,
        anguloBasculamento,
        temBasculamento
    } = params;
    
    const lines = [];
    
    // r1: (0,0) < anguloFaseFase - amplitudeFaseFase/2
    const theta1 = anguloFaseFase - amplitudeFaseFase / 2;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta1, nome: 'r1' });
    
    // r2: (0, -alcanceXFrente) < 0
    lines.push({ R0: 0, X0: -alcanceXFrente, thetaDeg: 0, nome: 'r2' });
    
    // r3: (alcanceR, 0) < anguloBlinderR
    lines.push({ R0: alcanceR, X0: 0, thetaDeg: anguloBlinderR, nome: 'r3' });
    
    // r4: Depende se tem basculamento
    if (temBasculamento) {
        const tanBasc = Math.tan((-anguloBasculamento * Math.PI) / 180);
        const tanCarac = Math.tan((anguloCaracteristico * Math.PI) / 180);
        const X0_r4 = alcanceXFrente * (1 + tanBasc / tanCarac);
        lines.push({ R0: 0, X0: X0_r4, thetaDeg: anguloBasculamento, nome: 'r4' });
    } else {
        lines.push({ R0: 0, X0: alcanceXFrente, thetaDeg: 0, nome: 'r4' });
    }
    
    // r5: (-alcanceR, 0) < 90
    lines.push({ R0: -alcanceR, X0: 0, thetaDeg: 90, nome: 'r5' });
    
    // r6: (0,0) < anguloFaseFase + amplitudeFaseFase/2
    const theta6 = anguloFaseFase + amplitudeFaseFase / 2;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta6, nome: 'r6' });
    
    return lines;
}

/**
 * Prepara as 6 retas no formato polar para falta fase-fase reverso
 * @param {Object} params - Parâmetros de entrada
 * @returns {Array} Array com 6 retas no formato {R0, X0, thetaDeg, nome}
 */
function prepararRetasFaseFaseReverso(params) {
    const {
        anguloFaseFase,
        amplitudeFaseFase,
        alcanceXReverso,
        alcanceR,
        anguloBlinderR,
        anguloCaracteristico,
        anguloBasculamento,
        temBasculamento
    } = params;
    
    const lines = [];
    
    // r1: (0,0) < anguloFaseFase - amplitudeFaseFase/2 + 180
    const theta1 = anguloFaseFase - amplitudeFaseFase / 2 + 180;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta1, nome: 'r1' });
    
    // r2: (0, alcanceXReverso) < 0
    lines.push({ R0: 0, X0: alcanceXReverso, thetaDeg: 0, nome: 'r2' });
    
    // r3: (-alcanceR, 0) < anguloBlinderR
    lines.push({ R0: -alcanceR, X0: 0, thetaDeg: anguloBlinderR, nome: 'r3' });
    
    // r4: Depende se tem basculamento
    if (temBasculamento) {
        const tanBasc = Math.tan((-anguloBasculamento * Math.PI) / 180);
        const tanCarac = Math.tan((anguloCaracteristico * Math.PI) / 180);
        const X0_r4 = -alcanceXReverso * (1 + tanBasc / tanCarac);
        lines.push({ R0: 0, X0: X0_r4, thetaDeg: anguloBasculamento, nome: 'r4' });
    } else {
        lines.push({ R0: 0, X0: -alcanceXReverso, thetaDeg: 0, nome: 'r4' });
    }
    
    // r5: (alcanceR, 0) < 90
    lines.push({ R0: alcanceR, X0: 0, thetaDeg: 90, nome: 'r5' });
    
    // r6: (0,0) < anguloFaseFase + amplitudeFaseFase/2 + 180
    const theta6 = anguloFaseFase + amplitudeFaseFase / 2 + 180;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta6, nome: 'r6' });
    
    return lines;
}

/**
 * Prepara as 6 retas no formato polar para falta fase-terra frente
 * @param {Object} params - Parâmetros de entrada
 * @returns {Array} Array com 6 retas no formato {R0, X0, thetaDeg, nome}
 */
function prepararRetasFaseTerraFrente(params) {
    const {
        anguloFaseTerra,
        amplitudeFaseTerra,
        alcanceXFrente,
        alcanceR,
        anguloBlinderR,
        anguloCaracteristico,
        anguloBasculamento,
        temBasculamento,
        alpha
    } = params;
    
    const lines = [];
    
    // r1: (0,0) < anguloFaseTerra - amplitudeFaseTerra/2 - alpha
    const theta1 = anguloFaseTerra - amplitudeFaseTerra / 2 - alpha;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta1, nome: 'r1' });
    
    // r2: (0, -alcanceXFrente*(1+tan(alpha)/tan(anguloCaracteristico))) < -alpha
    const tanAlpha = Math.tan((alpha * Math.PI) / 180);
    const tanCarac = Math.tan((anguloCaracteristico * Math.PI) / 180);
    const X0_r2 = -alcanceXFrente * (1 + tanAlpha / tanCarac);
    lines.push({ R0: 0, X0: X0_r2, thetaDeg: -alpha, nome: 'r2' });
    
    // r3: (alcanceR, 0) < anguloBlinderR
    lines.push({ R0: alcanceR, X0: 0, thetaDeg: anguloBlinderR, nome: 'r3' });
    
    // r4: Depende se tem basculamento
    if (temBasculamento) {
        const tanBasc = Math.tan(((-anguloBasculamento + alpha) * Math.PI) / 180);
        const X0_r4 = alcanceXFrente * (1 + tanBasc / tanCarac);
        lines.push({ R0: 0, X0: X0_r4, thetaDeg: anguloBasculamento - alpha, nome: 'r4' });
    } else {
        const X0_r4 = alcanceXFrente * (1 + tanAlpha / tanCarac);
        lines.push({ R0: 0, X0: X0_r4, thetaDeg: -alpha, nome: 'r4' });
    }
    
    // r5: (-alcanceR, 0) < 90
    lines.push({ R0: -alcanceR, X0: 0, thetaDeg: 90, nome: 'r5' });
    
    // r6: (0,0) < anguloFaseTerra + amplitudeFaseTerra/2 - alpha
    const theta6 = anguloFaseTerra + amplitudeFaseTerra / 2 - alpha;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta6, nome: 'r6' });
    
    return lines;
}

/**
 * Prepara as 6 retas no formato polar para falta fase-terra reverso
 * @param {Object} params - Parâmetros de entrada
 * @returns {Array} Array com 6 retas no formato {R0, X0, thetaDeg, nome}
 */
function prepararRetasFaseTerraReverso(params) {
    const {
        anguloFaseTerra,
        amplitudeFaseTerra,
        alcanceXReverso,
        alcanceR,
        anguloBlinderR,
        anguloCaracteristico,
        anguloBasculamento,
        temBasculamento,
        alpha
    } = params;
    
    const lines = [];
    
    // r1: (0,0) < anguloFaseTerra - amplitudeFaseTerra/2 - alpha + 180
    const theta1 = anguloFaseTerra - amplitudeFaseTerra / 2 - alpha + 180;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta1, nome: 'r1' });
    
    // r2: (0, -alcanceXReverso*(1+tan(alpha)/tan(anguloCaracteristico))) < -alpha
    const tanAlpha = Math.tan((alpha * Math.PI) / 180);
    const tanCarac = Math.tan((anguloCaracteristico * Math.PI) / 180);
    const X0_r2 = -alcanceXReverso * (1 + tanAlpha / tanCarac);
    lines.push({ R0: 0, X0: X0_r2, thetaDeg: -alpha, nome: 'r2' });
    
    // r3: (-alcanceR, 0) < anguloBlinderR
    lines.push({ R0: -alcanceR, X0: 0, thetaDeg: anguloBlinderR, nome: 'r3' });
    
    // r4: Depende se tem basculamento
    if (temBasculamento) {
        const tanBasc = Math.tan(((-anguloBasculamento + alpha) * Math.PI) / 180);
        const X0_r4 = -alcanceXReverso * (1 + tanBasc / tanCarac);
        lines.push({ R0: 0, X0: X0_r4, thetaDeg: anguloBasculamento - alpha, nome: 'r4' });
    } else {
        const X0_r4 = -alcanceXReverso * (1 + tanAlpha / tanCarac);
        lines.push({ R0: 0, X0: X0_r4, thetaDeg: -alpha, nome: 'r4' });
    }
    
    // r5: (alcanceR, 0) < 90
    lines.push({ R0: alcanceR, X0: 0, thetaDeg: 90, nome: 'r5' });
    
    // r6: (0,0) < anguloFaseTerra + amplitudeFaseTerra/2 - alpha + 180
    const theta6 = anguloFaseTerra + amplitudeFaseTerra / 2 - alpha + 180;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta6, nome: 'r6' });
    
    return lines;
}

/**
 * Calcula os vértices da região usando o algoritmo de Sutherland-Hodgman
 * @param {Array} linesPolar - Array de retas no formato polar {R0, X0, thetaDeg, nome}
 * @param {number} theta1 - Ângulo da reta r1 (para calcular ponto âncora)
 * @param {number} theta6 - Ângulo da reta r6 (para calcular ponto âncora)
 * @param {Object} bounds - Limites {Rmin, Rmax, Xmin, Xmax}
 * @returns {Array} Array de vértices {R, X}
 */
function calcularVerticesRegiao(linesPolar, theta1, theta6, bounds) {
    // Calcular ponto âncora para seleção automática de lado
    const anchor = computeAnchor(theta1, theta6, bounds);
    
    // Determinar automaticamente o lado a manter para cada reta
    const linesWithSide = autoSides(linesPolar, anchor);
    
    // Aplicar clipping sucessivo (Sutherland-Hodgman)
    const { polygon } = buildRegionFromPolarLines(linesWithSide, bounds);
    
    return polygon;
}

/**
 * Calcula os limites (bounds) para o gráfico baseado nos parâmetros da zona
 * @param {Object} params - Parâmetros da zona
 * @returns {Object} Limites {Rmin, Rmax, Xmin, Xmax}
 */
function calcularBounds(params) {
    const alcanceR = params.alcanceR || 1;
    const alcanceXFrente = params.alcanceXFrente || 1;
    const alcanceXReverso = params.alcanceXReverso || 1;
    
    const margem = 1.5;
    
    return {
        Rmin: -alcanceR * margem,
        Rmax: alcanceR * margem,
        Xmin: -alcanceXReverso * margem,
        Xmax: alcanceXFrente * margem
    };
}

// Exportar funções para uso global
window.prepararRetasFaseFaseFrente = prepararRetasFaseFaseFrente;
window.prepararRetasFaseFaseReverso = prepararRetasFaseFaseReverso;
window.prepararRetasFaseTerraFrente = prepararRetasFaseTerraFrente;
window.prepararRetasFaseTerraReverso = prepararRetasFaseTerraReverso;
window.calcularVerticesRegiao = calcularVerticesRegiao;
window.calcularBounds = calcularBounds;

