// ============================================================================
// FUNÇÃO 21 - PROTEÇÃO DE DISTÂNCIA
// Arquivo: calc_21_region.js
// Descrição: Funções para preparar retas e calcular região usando Sutherland-Hodgman
// ============================================================================

/**
 * keepSide para retas cujo lado correto é "o que contém a origem": c é o próprio
 * valor de a*R+b*X+c avaliado em (0,0). A origem (impedância zero, o relé) sempre
 * precisa ficar dentro da região das zonas à frente, então mantemos o lado que a
 * contém. No caso-limite c≈0 (reta passando exatamente pela origem — alcançável em
 * r2/r4 de zona 1 com basculamento/alpha específicos), a origem já é vértice do
 * polígono via r1∩r6, então qualquer lado escolhido preserva a região corretamente —
 * o empate cai para 'left' só por determinismo, não por necessidade.
 * @param {number} R0
 * @param {number} X0
 * @param {number} thetaDeg
 * @returns {string} 'left' ou 'right'
 */
function keepSideOrigem(R0, X0, thetaDeg) {
    const c = polarParaCartesianoEstavel(R0, X0, thetaDeg).c;
    return c < -1e-9 ? 'right' : 'left';
}

/**
 * anguloCaracteristico só aparece como denominador de tan(...)/tan(anguloCaracteristico)
 * nas fórmulas de r2/r4. O formulário permite 0° (min="0" em z*AnguloCaracteristico),
 * o que faria tan(0)=0 e levaria a razão a +-Infinity/NaN — afasta o ângulo de 0° por
 * uma margem mínima.
 * @param {number} anguloGraus
 * @returns {number}
 */
function anguloCaracteristicoSeguro(anguloGraus) {
    const EPS_GRAUS = 0.01;
    if (Math.abs(anguloGraus) < EPS_GRAUS) {
        console.warn(`Ângulo característico muito próximo de 0° (${anguloGraus}°) — ajustado para ${EPS_GRAUS}° para evitar divisão por tan(0).`);
        return EPS_GRAUS;
    }
    return anguloGraus;
}

/**
 * Prepara as 6 retas no formato polar para falta fase-fase frente
 * @param {Object} params - Parâmetros de entrada
 * @returns {Array} Array com 6 retas no formato {R0, X0, thetaDeg, nome, keepSide}
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

    const anguloCaracteristicoCalc = anguloCaracteristicoSeguro(anguloCaracteristico);
    const lines = [];

    // r1: (0,0) < anguloFaseFase - amplitudeFaseFase/2
    // keepSide 'left' sempre: a cunha [theta1,theta6] nunca é reflexa porque o
    // formulário trava amplitude em (0°,180°)
    const theta1 = anguloFaseFase - amplitudeFaseFase / 2;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta1, nome: 'r1', keepSide: 'left' });

    // r2: (0, -alcanceXFrente) < 0
    const X0_r2 = -alcanceXFrente;
    lines.push({ R0: 0, X0: X0_r2, thetaDeg: 0, nome: 'r2', keepSide: keepSideOrigem(0, X0_r2, 0) });

    // r3: (alcanceR, 0) < anguloBlinderR
    lines.push({ R0: alcanceR, X0: 0, thetaDeg: anguloBlinderR, nome: 'r3', keepSide: keepSideOrigem(alcanceR, 0, anguloBlinderR) });

    // r4: Depende se tem basculamento
    if (temBasculamento) {
        const tanBasc = Math.tan((-anguloBasculamento * Math.PI) / 180);
        const tanCarac = Math.tan((anguloCaracteristicoCalc * Math.PI) / 180);
        const X0_r4 = alcanceXFrente * (1 + tanBasc / tanCarac);
        lines.push({ R0: 0, X0: X0_r4, thetaDeg: anguloBasculamento, nome: 'r4', keepSide: keepSideOrigem(0, X0_r4, anguloBasculamento) });
    } else {
        lines.push({ R0: 0, X0: alcanceXFrente, thetaDeg: 0, nome: 'r4', keepSide: keepSideOrigem(0, alcanceXFrente, 0) });
    }

    // r5: (-alcanceR, 0) < 90
    lines.push({ R0: -alcanceR, X0: 0, thetaDeg: 90, nome: 'r5', keepSide: keepSideOrigem(-alcanceR, 0, 90) });

    // r6: (0,0) < anguloFaseFase + amplitudeFaseFase/2
    // keepSide 'right' sempre (mesmo raciocínio de r1)
    const theta6 = anguloFaseFase + amplitudeFaseFase / 2;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta6, nome: 'r6', keepSide: 'right' });

    return lines;
}

/**
 * Prepara as 6 retas no formato polar para falta fase-fase reverso
 * @param {Object} params - Parâmetros de entrada
 * @returns {Array} Array com 6 retas no formato {R0, X0, thetaDeg, nome, keepSide}
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

    const anguloCaracteristicoCalc = anguloCaracteristicoSeguro(anguloCaracteristico);
    const lines = [];

    // r1: (0,0) < anguloFaseFase - amplitudeFaseFase/2 + 180
    const theta1 = anguloFaseFase - amplitudeFaseFase / 2 + 180;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta1, nome: 'r1', keepSide: 'left' });

    // r2: (0, alcanceXReverso) < 0
    lines.push({ R0: 0, X0: alcanceXReverso, thetaDeg: 0, nome: 'r2', keepSide: keepSideOrigem(0, alcanceXReverso, 0) });

    // r3: (-alcanceR, 0) < anguloBlinderR
    lines.push({ R0: -alcanceR, X0: 0, thetaDeg: anguloBlinderR, nome: 'r3', keepSide: keepSideOrigem(-alcanceR, 0, anguloBlinderR) });

    // r4: Depende se tem basculamento
    if (temBasculamento) {
        const tanBasc = Math.tan((-anguloBasculamento * Math.PI) / 180);
        const tanCarac = Math.tan((anguloCaracteristicoCalc * Math.PI) / 180);
        const X0_r4 = -alcanceXReverso * (1 + tanBasc / tanCarac);
        lines.push({ R0: 0, X0: X0_r4, thetaDeg: anguloBasculamento, nome: 'r4', keepSide: keepSideOrigem(0, X0_r4, anguloBasculamento) });
    } else {
        lines.push({ R0: 0, X0: -alcanceXReverso, thetaDeg: 0, nome: 'r4', keepSide: keepSideOrigem(0, -alcanceXReverso, 0) });
    }

    // r5: (alcanceR, 0) < 90
    lines.push({ R0: alcanceR, X0: 0, thetaDeg: 90, nome: 'r5', keepSide: keepSideOrigem(alcanceR, 0, 90) });

    // r6: (0,0) < anguloFaseFase + amplitudeFaseFase/2 + 180
    const theta6 = anguloFaseFase + amplitudeFaseFase / 2 + 180;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta6, nome: 'r6', keepSide: 'right' });

    return lines;
}

/**
 * Prepara as 6 retas no formato polar para falta fase-terra frente
 * @param {Object} params - Parâmetros de entrada
 * @returns {Array} Array com 6 retas no formato {R0, X0, thetaDeg, nome, keepSide}
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

    const anguloCaracteristicoCalc = anguloCaracteristicoSeguro(anguloCaracteristico);
    const lines = [];

    // r1: (0,0) < anguloFaseTerra - amplitudeFaseTerra/2 - alpha
    const theta1 = anguloFaseTerra - amplitudeFaseTerra / 2 - alpha;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta1, nome: 'r1', keepSide: 'left' });

    // r2: (0, -alcanceXFrente*(1+tan(alpha)/tan(anguloCaracteristico))) < -alpha
    const tanAlpha = Math.tan((alpha * Math.PI) / 180);
    const tanCarac = Math.tan((anguloCaracteristicoCalc * Math.PI) / 180);
    const X0_r2 = -alcanceXFrente * (1 + tanAlpha / tanCarac);
    lines.push({ R0: 0, X0: X0_r2, thetaDeg: -alpha, nome: 'r2', keepSide: keepSideOrigem(0, X0_r2, -alpha) });

    // r3: (alcanceR, 0) < anguloBlinderR
    lines.push({ R0: alcanceR, X0: 0, thetaDeg: anguloBlinderR, nome: 'r3', keepSide: keepSideOrigem(alcanceR, 0, anguloBlinderR) });

    // r4: Depende se tem basculamento
    if (temBasculamento) {
        const tanBasc = Math.tan(((-anguloBasculamento + alpha) * Math.PI) / 180);
        const X0_r4 = alcanceXFrente * (1 + tanBasc / tanCarac);
        const theta4 = anguloBasculamento - alpha;
        lines.push({ R0: 0, X0: X0_r4, thetaDeg: theta4, nome: 'r4', keepSide: keepSideOrigem(0, X0_r4, theta4) });
    } else {
        const X0_r4 = alcanceXFrente * (1 + tanAlpha / tanCarac);
        lines.push({ R0: 0, X0: X0_r4, thetaDeg: -alpha, nome: 'r4', keepSide: keepSideOrigem(0, X0_r4, -alpha) });
    }

    // r5: (-alcanceR, 0) < 90
    lines.push({ R0: -alcanceR, X0: 0, thetaDeg: 90, nome: 'r5', keepSide: keepSideOrigem(-alcanceR, 0, 90) });

    // r6: (0,0) < anguloFaseTerra + amplitudeFaseTerra/2 - alpha
    const theta6 = anguloFaseTerra + amplitudeFaseTerra / 2 - alpha;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta6, nome: 'r6', keepSide: 'right' });

    return lines;
}

/**
 * Prepara as 6 retas no formato polar para falta fase-terra reverso
 * @param {Object} params - Parâmetros de entrada
 * @returns {Array} Array com 6 retas no formato {R0, X0, thetaDeg, nome, keepSide}
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

    const anguloCaracteristicoCalc = anguloCaracteristicoSeguro(anguloCaracteristico);
    const lines = [];

    // r1: (0,0) < anguloFaseTerra - amplitudeFaseTerra/2 - alpha + 180
    const theta1 = anguloFaseTerra - amplitudeFaseTerra / 2 - alpha + 180;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta1, nome: 'r1', keepSide: 'left' });

    // r2: (0, -alcanceXReverso*(1+tan(alpha)/tan(anguloCaracteristico))) < -alpha
    const tanAlpha = Math.tan((alpha * Math.PI) / 180);
    const tanCarac = Math.tan((anguloCaracteristicoCalc * Math.PI) / 180);
    const X0_r2 = -alcanceXReverso * (1 + tanAlpha / tanCarac);
    lines.push({ R0: 0, X0: X0_r2, thetaDeg: -alpha, nome: 'r2', keepSide: keepSideOrigem(0, X0_r2, -alpha) });

    // r3: (-alcanceR, 0) < anguloBlinderR
    lines.push({ R0: -alcanceR, X0: 0, thetaDeg: anguloBlinderR, nome: 'r3', keepSide: keepSideOrigem(-alcanceR, 0, anguloBlinderR) });

    // r4: Depende se tem basculamento
    if (temBasculamento) {
        const tanBasc = Math.tan(((-anguloBasculamento + alpha) * Math.PI) / 180);
        const X0_r4 = -alcanceXReverso * (1 + tanBasc / tanCarac);
        const theta4 = anguloBasculamento - alpha;
        lines.push({ R0: 0, X0: X0_r4, thetaDeg: theta4, nome: 'r4', keepSide: keepSideOrigem(0, X0_r4, theta4) });
    } else {
        const X0_r4 = -alcanceXReverso * (1 + tanAlpha / tanCarac);
        lines.push({ R0: 0, X0: X0_r4, thetaDeg: -alpha, nome: 'r4', keepSide: keepSideOrigem(0, X0_r4, -alpha) });
    }

    // r5: (alcanceR, 0) < 90
    lines.push({ R0: alcanceR, X0: 0, thetaDeg: 90, nome: 'r5', keepSide: keepSideOrigem(alcanceR, 0, 90) });

    // r6: (0,0) < anguloFaseTerra + amplitudeFaseTerra/2 - alpha + 180
    const theta6 = anguloFaseTerra + amplitudeFaseTerra / 2 - alpha + 180;
    lines.push({ R0: 0, X0: 0, thetaDeg: theta6, nome: 'r6', keepSide: 'right' });

    return lines;
}

/**
 * Calcula os vértices da região aplicando clipping sucessivo (Sutherland-Hodgman).
 * Cada reta já chega com keepSide definido por prepararRetas* — não há mais ponto-
 * âncora nem inferência de lado em tempo de execução.
 * @param {Array} linesPolar - Array de retas no formato polar {R0, X0, thetaDeg, nome, keepSide}
 * @param {Object} bounds - Limites {Rmin, Rmax, Xmin, Xmax}
 * @returns {Array} Array de vértices {R, X}
 */
function calcularVerticesRegiao(linesPolar, bounds) {
    const { polygon } = buildRegionFromPolarLines(linesPolar, bounds);
    return polygon;
}

/**
 * Calcula os limites (bounds) do box inicial de clipping a partir das retas já
 * preparadas da zona (ver computeBoundsFromLines em calc_21_geom.js) — mais robusto
 * que um box de tamanho fixo quando alcance R e alcance X têm ordens de grandeza
 * diferentes (ex.: blinder raso com alcance X bem maior que alcance R).
 * @param {Array} linesPolar - Array de retas no formato polar {R0, X0, thetaDeg}
 * @param {Object} params - Parâmetros da zona (usados só pela escala natural)
 * @returns {Object} Limites {Rmin, Rmax, Xmin, Xmax}
 */
function calcularBounds(linesPolar, params) {
    const naturalScale = Math.max(params.alcanceR || 0, params.alcanceXFrente || 0, params.alcanceXReverso || 0);
    const cartesianLines = linesPolar.map(lp => polarParaCartesianoEstavel(lp.R0, lp.X0, lp.thetaDeg));
    return computeBoundsFromLines(cartesianLines, naturalScale);
}

// Exportar funções para uso global
window.prepararRetasFaseFaseFrente = prepararRetasFaseFaseFrente;
window.prepararRetasFaseFaseReverso = prepararRetasFaseFaseReverso;
window.prepararRetasFaseTerraFrente = prepararRetasFaseTerraFrente;
window.prepararRetasFaseTerraReverso = prepararRetasFaseTerraReverso;
window.calcularVerticesRegiao = calcularVerticesRegiao;
window.calcularBounds = calcularBounds;
