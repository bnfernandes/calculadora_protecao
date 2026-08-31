// ============================================================================
// FUNÇÃO 21 - PROTEÇÃO DE DISTÂNCIA
// Arquivo: calc_21_geom.js
// Descrição: Funções geométricas para clipping de polígonos (Sutherland-Hodgman)
// Baseado em: Algoritmo de Sutherland-Hodgman (1974)
// ============================================================================

const EPS = 1e-10;

/**
 * Converte uma reta (passando por R0,X0 com inclinação theta) para a*R + b*X + c = 0
 * Versão estável (sem tangente).
 * @param {number} R0 - Coordenada R do ponto por onde a reta passa
 * @param {number} X0 - Coordenada X do ponto por onde a reta passa
 * @param {number} thetaGraus - Ângulo de inclinação em graus
 * @returns {Object} Coeficientes {a, b, c} normalizados
 */
function polarParaCartesianoEstavel(R0, X0, thetaGraus) {
    const t = (thetaGraus * Math.PI) / 180;
    const a = -Math.sin(t);
    const b = Math.cos(t);
    const c = Math.sin(t) * R0 - Math.cos(t) * X0;
    const norm = Math.hypot(a, b);
    return norm > 0 ? { a: a / norm, b: b / norm, c: c / norm } : { a, b, c };
}

/**
 * Avalia a reta L no ponto (R, X)
 * Retorna o valor de a*R + b*X + c
 * @param {Object} L - Reta com coeficientes {a, b, c}
 * @param {number} R - Coordenada R
 * @param {number} X - Coordenada X
 * @returns {number} Valor da expressão a*R + b*X + c
 */
function lineEval(L, R, X) {
    return L.a * R + L.b * X + L.c;
}

/**
 * Calcula a interseção de duas retas
 * @param {Object} L1 - Primeira reta {a, b, c}
 * @param {Object} L2 - Segunda reta {a, b, c}
 * @returns {Object|null} Ponto de interseção {R, X} ou null se paralelas
 */
function intersectLines(L1, L2) {
    const { a: a1, b: b1, c: c1 } = L1;
    const { a: a2, b: b2, c: c2 } = L2;
    const D = a1 * b2 - a2 * b1;
    if (Math.abs(D) < EPS) return null;
    const R = (b1 * c2 - b2 * c1) / D;
    const X = (a2 * c1 - a1 * c2) / D;
    return { R, X };
}

/**
 * Calcula a interseção do segmento AB com a reta L
 * @param {Object} A - Ponto inicial {R, X}
 * @param {Object} B - Ponto final {R, X}
 * @param {Object} L - Reta {a, b, c}
 * @returns {Object|null} Ponto de interseção {R, X} ou null se não houver
 */
function intersectSegmentWithLine(A, B, L) {
    const fA = lineEval(L, A.R, A.X);
    const fB = lineEval(L, B.R, B.X);
    const denom = fA - fB;
    if (Math.abs(denom) < EPS) return null;
    const t = fA / denom; // A + t(B-A)
    if (t < -EPS || t > 1 + EPS) return null;
    return { R: A.R + t * (B.R - A.R), X: A.X + t * (B.X - A.X) };
}

/**
 * Remove pontos duplicados e colineares consecutivos
 * @param {Array} poly - Array de pontos {R, X}
 * @returns {Array} Array de pontos sem duplicados e colineares
 */
function dedupCollinear(poly) {
    if (poly.length <= 2) return poly.slice();
    
    // Remover duplicados
    const uniq = [];
    for (const p of poly) {
        const q = uniq[uniq.length - 1];
        if (!q || Math.hypot(p.R - q.R, p.X - q.X) > 1e-9) {
            uniq.push(p);
        }
    }
    
    // Remover colineares
    if (uniq.length > 2) {
        const cleaned = [];
        for (let i = 0; i < uniq.length; i++) {
            const A = uniq[(i - 1 + uniq.length) % uniq.length];
            const B = uniq[i];
            const C = uniq[(i + 1) % uniq.length];
            const v1 = { R: B.R - A.R, X: B.X - A.X };
            const v2 = { R: C.R - B.R, X: C.X - B.X };
            const cross = v1.R * v2.X - v1.X * v2.R;
            if (Math.abs(cross) > 1e-12) {
                cleaned.push(B);
            }
        }
        return cleaned;
    }
    return uniq;
}

/**
 * Clipping de polígono por semiplano (Algoritmo de Sutherland-Hodgman)
 * @param {Array} poly - Array de pontos {R, X} do polígono
 * @param {Object} L - Reta {a, b, c} que define o semiplano
 * @param {string} keepSide - "left" (mantém a*R+b*X+c >= 0) ou "right" (mantém a*R+b*X+c <= 0)
 * @returns {Array} Array de pontos do polígono recortado
 */
function clipPolygonWithHalfPlane(poly, L, keepSide = "left") {
    if (!poly.length) return [];
    
    const out = [];
    const keepPositive = (keepSide === "left");
    const inside = (v) => keepPositive ? (v >= -EPS) : (v <= EPS);
    
    for (let i = 0; i < poly.length; i++) {
        const A = poly[i];
        const B = poly[(i + 1) % poly.length];
        const fA = lineEval(L, A.R, A.X);
        const fB = lineEval(L, B.R, B.X);
        const Ain = inside(fA);
        const Bin = inside(fB);
        
        if (Ain && Bin) {
            // Ambos dentro: mantém B
            out.push(B);
        } else if (Ain && !Bin) {
            // A dentro, B fora: adiciona intersecção
            const I = intersectSegmentWithLine(A, B, L);
            if (I) out.push(I);
        } else if (!Ain && Bin) {
            // A fora, B dentro: adiciona intersecção + B
            const I = intersectSegmentWithLine(A, B, L);
            if (I) out.push(I);
            out.push(B);
        }
        // Ambos fora: não adiciona nada
    }
    
    return dedupCollinear(out);
}

/**
 * Cria um retângulo inicial para clipping
 * @param {number} Rmin - R mínimo
 * @param {number} Rmax - R máximo
 * @param {number} Xmin - X mínimo
 * @param {number} Xmax - X máximo
 * @returns {Array} Array de 4 pontos formando um retângulo
 */
function initialBox(Rmin, Rmax, Xmin, Xmax) {
    return [
        { R: Rmin, X: Xmin },
        { R: Rmax, X: Xmin },
        { R: Rmax, X: Xmax },
        { R: Rmin, X: Xmax }
    ];
}

/**
 * Constrói a região de operação aplicando clipping sucessivo por todas as retas
 * @param {Array} lines - Array de retas no formato {R0, X0, thetaDeg, keepSide}
 * @param {Object} bounds - Limites {Rmin, Rmax, Xmin, Xmax}
 * @returns {Object} {polygon: Array de vértices, usedLines: Array de retas usadas}
 */
function buildRegionFromPolarLines(lines, bounds) {
    let poly = initialBox(bounds.Rmin, bounds.Rmax, bounds.Xmin, bounds.Xmax);
    const used = [];

    for (const Lp of lines) {
        if (!Lp.keepSide) {
            throw new Error(`Reta "${Lp.nome || '?'}" sem keepSide definido — bug em prepararRetas*.`);
        }
        const L = polarParaCartesianoEstavel(Lp.R0, Lp.X0, Lp.thetaDeg);
        const newPoly = clipPolygonWithHalfPlane(poly, L, Lp.keepSide);
        
        if (!newPoly.length) {
            return { polygon: [], usedLines: used };
        }
        
        poly = newPoly;
        used.push(Lp);
    }
    
    // Ordenação por ângulo ao redor do centróide (para desenhar o path corretamente)
    if (poly.length > 0) {
        const cx = poly.reduce((s, p) => s + p.R, 0) / poly.length;
        const cy = poly.reduce((s, p) => s + p.X, 0) / poly.length;
        poly.sort((p, q) => Math.atan2(p.X - cy, p.R - cx) - Math.atan2(q.X - cy, q.R - cx));
    }
    
    return { polygon: poly, usedLines: used };
}

/**
 * Calcula o segmento visível de uma reta dentro do box (para desenhar linhas tracejadas)
 * @param {Object} L - Reta {a, b, c}
 * @param {number} Rmin - R mínimo
 * @param {number} Rmax - R máximo
 * @param {number} Xmin - X mínimo
 * @param {number} Xmax - X máximo
 * @returns {Array|null} Array com 2 pontos [[R1,X1], [R2,X2]] ou null
 */
function clipLineToBox(L, Rmin, Rmax, Xmin, Xmax) {
    const edges = [
        { a: 1, b: 0, c: -Rmin },
        { a: 1, b: 0, c: -Rmax },
        { a: 0, b: 1, c: -Xmin },
        { a: 0, b: 1, c: -Xmax }
    ];
    
    const pts = [];
    for (const E of edges) {
        const P = intersectLines(L, E);
        if (!P) continue;
        if (P.R >= Rmin - EPS && P.R <= Rmax + EPS && P.X >= Xmin - EPS && P.X <= Xmax + EPS) {
            if (!pts.some(q => Math.hypot(q.R - P.R, q.X - P.X) < 1e-7)) {
                pts.push(P);
            }
        }
    }
    
    if (pts.length >= 2) {
        pts.sort((p, q) => (p.R - q.R) || (p.X - q.X));
        return [[pts[0].R, pts[0].X], [pts[pts.length - 1].R, pts[pts.length - 1].X]];
    }
    return null;
}

/**
 * Calcula os limites do box inicial de clipping a partir das intersecções par-a-par
 * das retas cartesianas fornecidas, mais a origem. Substitui um box de tamanho fixo
 * (que não cobre o polígono quando os alcances R e X têm ordens de grandeza muito
 * diferentes) por um dimensionado a partir dos candidatos a vértice reais.
 * Intersecções que estouram um teto (múltiplo de naturalScale) são descartadas antes
 * de entrar no cálculo — pares de retas quase paralelas (determinante pequeno, mas
 * acima do EPS de intersectLines) geram pontos numericamente absurdos que, se
 * usados, inflacionariam o box a ponto de prejudicar a precisão do clipping.
 * @param {Array} cartesianLines - Array de retas {a, b, c}
 * @param {number} naturalScale - Escala natural do problema (ex.: maior alcance da zona)
 * @returns {Object} Limites {Rmin, Rmax, Xmin, Xmax}
 */
function computeBoundsFromLines(cartesianLines, naturalScale) {
    const scale = naturalScale > 0 ? naturalScale : 1;
    const cap = 50 * scale;
    const margem = 1.5;
    const piso = scale * margem;

    const pts = [{ R: 0, X: 0 }];
    for (let i = 0; i < cartesianLines.length; i++) {
        for (let j = i + 1; j < cartesianLines.length; j++) {
            const P = intersectLines(cartesianLines[i], cartesianLines[j]);
            if (P && Math.abs(P.R) <= cap && Math.abs(P.X) <= cap) {
                pts.push(P);
            }
        }
    }

    const RminCand = Math.min(...pts.map(p => p.R));
    const RmaxCand = Math.max(...pts.map(p => p.R));
    const XminCand = Math.min(...pts.map(p => p.X));
    const XmaxCand = Math.max(...pts.map(p => p.X));

    return {
        Rmin: Math.min(RminCand * margem, -piso),
        Rmax: Math.max(RmaxCand * margem, piso),
        Xmin: Math.min(XminCand * margem, -piso),
        Xmax: Math.max(XmaxCand * margem, piso)
    };
}

// Exportar funções para uso global
window.polarParaCartesianoEstavel = polarParaCartesianoEstavel;
window.lineEval = lineEval;
window.intersectLines = intersectLines;
window.intersectSegmentWithLine = intersectSegmentWithLine;
window.dedupCollinear = dedupCollinear;
window.clipPolygonWithHalfPlane = clipPolygonWithHalfPlane;
window.initialBox = initialBox;
window.buildRegionFromPolarLines = buildRegionFromPolarLines;
window.clipLineToBox = clipLineToBox;
window.computeBoundsFromLines = computeBoundsFromLines;

