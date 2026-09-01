// ============================================================================
// FUNÇÃO 21 - PROTEÇÃO DE DISTÂNCIA
// Arquivo: calc_21_debug.js
// Descrição: Painel de debug com as retas calculadas (fonte única de verdade: o
// array `retas` já montado em calc_21.js) e invariantes geométricos do polígono
// resultante — serve também de ferramenta informal de regressão, já que o projeto
// não tem suíte de testes.
// ============================================================================

/**
 * Cria o checkbox "debug" e o container (#detalhesDebug21, oculto por padrão)
 * onde exibirResultados21 (calc_21_eq.js) e exibirDebugRetas (abaixo) colocam
 * o título, Supervisão Direcional, resultados numéricos por zona, equações e
 * as tabelas de retas — tudo o que não é gráfico nem o formulário de ponto de
 * teste, então só interessa a quem está de fato depurando/validando a conta.
 * Chamado a cada "Calcular", depois dos gráficos e do formulário de ponto de
 * teste (ordem visual: gráficos -> ponto de teste -> checkbox -> detalhes).
 * @param {boolean} estavaMarcado - Estado do checkbox antes de #resultados
 * ser limpo pra este novo cálculo (calc_21.js captura isso ANTES de limpar,
 * já que por aqui o checkbox anterior já não existe mais). Diferente do
 * formulário de ponto de teste (que reseta a cada "Calcular"), aqui o
 * usuário normalmente está comparando números enquanto ajusta os
 * parâmetros, faz sentido a área de debug continuar aberta se já estava.
 */
function criarAreaDebug21(estavaMarcado) {
    const areaResultados = document.getElementById('resultados');
    if (!areaResultados) return;

    const areaCheckboxAnterior = document.getElementById('areaCheckboxDebug21');
    if (areaCheckboxAnterior) areaCheckboxAnterior.remove();
    const detalhesAnteriores = document.getElementById('detalhesDebug21');
    if (detalhesAnteriores) detalhesAnteriores.remove();

    const areaCheckbox = document.createElement('div');
    areaCheckbox.className = 'resultado-secao mt-4';
    areaCheckbox.id = 'areaCheckboxDebug21';
    areaCheckbox.innerHTML = `
        <label class="form-check-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" class="form-check-input" id="mostrarDebug21" style="margin: 0;">
            🔍 Exibir detalhes de depuração
        </label>
    `;
    areaResultados.appendChild(areaCheckbox);

    const detalhes = document.createElement('div');
    detalhes.id = 'detalhesDebug21';
    detalhes.style.display = estavaMarcado ? '' : 'none';
    areaResultados.appendChild(detalhes);

    const checkbox = document.getElementById('mostrarDebug21');
    checkbox.checked = estavaMarcado;
    checkbox.addEventListener('change', () => {
        detalhes.style.display = checkbox.checked ? '' : 'none';
    });
}

/**
 * Adiciona seção de debug aos resultados mostrando as retas em formato polar e cartesiano
 * @param {Object} dados - Dados de entrada do formulário
 * @param {Object} resultados - Resultados calculados
 */
function exibirDebugRetas(dados, resultados) {
    // Mesma área de debug usada por exibirResultados21 (calc_21_eq.js) —
    // ver criarAreaDebug21 logo abaixo.
    const areaResultados = document.getElementById('detalhesDebug21');
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
                zona.faseFase.frente.vertices,
                dadosZona,
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
                zona.faseFase.reverso.vertices,
                dadosZona,
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
                zona.faseTerra.frente.vertices,
                dadosZona,
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
                zona.faseTerra.reverso.vertices,
                dadosZona,
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
 * Gera tabela com informações das retas em formato polar e cartesiano, a partir do
 * array `retas` já calculado por calcularProtecao21() (calc_21.js) — nunca recalcula
 * a geometria de forma independente, só formata o que já foi calculado.
 * @param {Array} retas - Retas já calculadas {nome, R0, X0, thetaDeg, keepSide, a, b, c}
 * @param {Array} vertices - Vértices do polígono já calculado {R, X}
 * @param {Object} dadosZona - Dados da zona
 * @param {string} tipo - 'fase' ou 'terra'
 * @param {string} direcao - 'frente' ou 'reverso'
 * @param {number|null} alpha - Ângulo de compensação homopolar (null para fase-fase)
 * @returns {string} HTML da tabela + resumo de invariantes
 */
function gerarTabelaRetasDebug(retas, vertices, dadosZona, tipo, direcao, alpha) {
    const params = tipo === 'fase' ? dadosZona.fase : dadosZona.terra;
    const temBasculamento = dadosZona.numero === 1;

    let html = '<table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 10px;">';
    html += '<thead>';
    html += '<tr style="background-color: #e9ecef;">';
    html += '<th style="border: 1px solid #dee2e6; padding: 8px;">Reta</th>';
    html += '<th style="border: 1px solid #dee2e6; padding: 8px;">Fórmula Polar</th>';
    html += '<th style="border: 1px solid #dee2e6; padding: 8px;">Ponto (R₀, X₀)</th>';
    html += '<th style="border: 1px solid #dee2e6; padding: 8px;">Ângulo θ</th>';
    html += '<th style="border: 1px solid #dee2e6; padding: 8px;">Cartesiano (a, b, c)</th>';
    html += '<th style="border: 1px solid #dee2e6; padding: 8px;">keepSide</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    retas.forEach(reta => {
        const formula = formulaTextoReta(reta.nome, tipo, direcao, temBasculamento);
        html += '<tr>';
        html += `<td style="border: 1px solid #dee2e6; padding: 8px; font-weight: bold;">${reta.nome}</td>`;
        html += `<td style="border: 1px solid #dee2e6; padding: 8px; font-family: monospace;">${formula}</td>`;
        html += `<td style="border: 1px solid #dee2e6; padding: 8px;">(${reta.R0.toFixed(4)}, ${reta.X0.toFixed(4)})</td>`;
        html += `<td style="border: 1px solid #dee2e6; padding: 8px;">${reta.thetaDeg.toFixed(4)}°</td>`;
        html += `<td style="border: 1px solid #dee2e6; padding: 8px; font-family: monospace;">`;
        html += `a=${reta.a.toFixed(6)}<br>b=${reta.b.toFixed(6)}<br>c=${reta.c.toFixed(6)}`;
        html += `</td>`;
        html += `<td style="border: 1px solid #dee2e6; padding: 8px; font-family: monospace;">${reta.keepSide}</td>`;
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

    html += gerarResumoInvariantes(vertices);

    return html;
}

/**
 * Texto simbólico (sem números embutidos) da fórmula polar de cada reta, só para
 * exibição — derivado diretamente de js/calc_21_region.js. Os valores numéricos da
 * tabela vêm sempre do array `retas` já calculado, nunca deste texto.
 * @param {string} nomeReta - 'r1'..'r6'
 * @param {string} tipo - 'fase' ou 'terra'
 * @param {string} direcao - 'frente' ou 'reverso'
 * @param {boolean} temBasculamento
 * @returns {string}
 */
function formulaTextoReta(nomeReta, tipo, direcao, temBasculamento) {
    const off = direcao === 'reverso' ? ' + 180' : '';
    const alfa = tipo === 'terra' ? ' − α' : '';
    const frente = direcao === 'frente';

    switch (nomeReta) {
        case 'r1':
            return `(0,0) < ∠sup − amp/2${alfa}${off}`;
        case 'r6':
            return `(0,0) < ∠sup + amp/2${alfa}${off}`;
        case 'r3':
            return frente ? '(Rzona, 0) < θblinder' : '(−Rzona, 0) < θblinder';
        case 'r5':
            return frente ? '(−Rzona, 0) < 90' : '(Rzona, 0) < 90';
        case 'r2':
            if (tipo === 'fase') {
                return frente ? '(0, −Xf) < 0' : '(0, Xr) < 0';
            }
            return frente
                ? '(0, −Xf·(1+tan(α)/tan(θc))) < −α'
                : '(0, −Xr·(1+tan(α)/tan(θc))) < −α';
        case 'r4':
            if (tipo === 'fase') {
                if (temBasculamento) {
                    return frente
                        ? '(0, Xf·(1+tan(−θb)/tan(θc))) < θb'
                        : '(0, −Xr·(1+tan(−θb)/tan(θc))) < θb';
                }
                return frente ? '(0, Xf) < 0' : '(0, −Xr) < 0';
            }
            if (temBasculamento) {
                return frente
                    ? '(0, Xf·(1+tan(−θb+α)/tan(θc))) < θb − α'
                    : '(0, −Xr·(1+tan(−θb+α)/tan(θc))) < θb − α';
            }
            return frente
                ? '(0, Xf·(1+tan(α)/tan(θc))) < −α'
                : '(0, −Xr·(1+tan(α)/tan(θc))) < −α';
        default:
            return '';
    }
}

/**
 * Testa se a origem (0,0) está dentro do polígono convexo — invariante físico
 * esperado sempre (a origem, impedância zero, é o próprio relé): testa se ela fica
 * do mesmo lado de todas as arestas, usando o produto vetorial de vértices
 * consecutivos relativos à origem.
 * @param {Array} vertices - Array de vértices {R, X}
 * @returns {boolean}
 */
function polygonContemOrigem(vertices) {
    if (!vertices || vertices.length < 3) return false;
    let sinal = 0;
    for (let i = 0; i < vertices.length; i++) {
        const A = vertices[i];
        const B = vertices[(i + 1) % vertices.length];
        const cross = A.R * B.X - A.X * B.R;
        if (Math.abs(cross) > 1e-9) {
            const s = Math.sign(cross);
            if (sinal === 0) sinal = s;
            else if (s !== sinal) return false;
        }
    }
    return true;
}

/**
 * Testa a convexidade do polígono: o produto vetorial de arestas consecutivas deve
 * manter o mesmo sinal em toda a volta. Mesmo princípio já usado em dedupCollinear
 * (calc_21_geom.js) para detectar pontos colineares.
 * @param {Array} vertices - Array de vértices {R, X}
 * @returns {boolean}
 */
function polygonConvexo(vertices) {
    if (!vertices || vertices.length < 3) return false;
    let sinal = 0;
    const n = vertices.length;
    for (let i = 0; i < n; i++) {
        const A = vertices[i];
        const B = vertices[(i + 1) % n];
        const C = vertices[(i + 2) % n];
        const v1 = { R: B.R - A.R, X: B.X - A.X };
        const v2 = { R: C.R - B.R, X: C.X - B.X };
        const cross = v1.R * v2.X - v1.X * v2.R;
        if (Math.abs(cross) > 1e-9) {
            const s = Math.sign(cross);
            if (sinal === 0) sinal = s;
            else if (s !== sinal) return false;
        }
    }
    return true;
}

/**
 * Resumo visual dos invariantes geométricos esperados para qualquer ajuste legal:
 * 3 a 6 vértices, polígono convexo, e origem sempre dentro (relé em Z=0). Serve como
 * checagem de regressão informal, já que o projeto não tem suíte de testes.
 * @param {Array} vertices - Array de vértices {R, X}
 * @returns {string}
 */
function gerarResumoInvariantes(vertices) {
    const n = vertices ? vertices.length : 0;
    const origemDentro = polygonContemOrigem(vertices);
    const convexo = polygonConvexo(vertices);
    const nOk = n >= 3 && n <= 6;
    const tudoOk = origemDentro && convexo && nOk;
    const cor = tudoOk ? '#155724' : '#721c24';
    const fundo = tudoOk ? '#d4edda' : '#f8d7da';

    return `<div style="font-size: 11px; margin-top: 4px; padding: 4px 8px; background-color: ${fundo}; color: ${cor}; border-radius: 3px;">` +
        `${tudoOk ? '✓' : '⚠'} ${n} vértice(s)` +
        ` · origem ${origemDentro ? 'dentro' : 'FORA'}` +
        ` · ${convexo ? 'convexo' : 'NÃO convexo'}` +
        `</div>`;
}

// Exportar funções
window.exibirDebugRetas = exibirDebugRetas;
window.criarAreaDebug21 = criarAreaDebug21;
