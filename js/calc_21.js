// ============================================================================
// FUNÇÃO 21 - PROTEÇÃO DE DISTÂNCIA
// Arquivo: calc_21.js
// Descrição: Lógica de cálculos e controle do formulário
// ============================================================================

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    configurarVersaoExperimental21();
    inicializarFormulario21();
    configurarEventosFormulario21();
});

/**
 * Liga o checkbox "Usar versão experimental" aos 3 cards que ele revela
 * (Descrição, Parâmetros de Entrada, Resultados). Nunca lembra a escolha entre
 * visitas — de propósito: a página não está totalmente validada ainda (falta
 * testar contra outros softwares e o equipamento real), então cada visita
 * precisa marcar de novo, sem estado salvo em localStorage/sessionStorage.
 */
function configurarVersaoExperimental21() {
    const checkbox = document.getElementById('usarVersaoExperimental21');
    if (!checkbox) return;

    const cards = ['cardDescricao21', 'cardParametros21', 'cardResultados21']
        .map(id => document.getElementById(id))
        .filter(Boolean);

    checkbox.addEventListener('change', () => {
        cards.forEach(card => { card.style.display = checkbox.checked ? '' : 'none'; });
    });
}

/**
 * Inicializa o formulário com valores padrão e configurações
 */
function inicializarFormulario21() {
    // Configurar visibilidade inicial dos campos condicionais
    atualizarVisibilidadeIFaseFase();
    atualizarVisibilidadeIFaseTerra();
    
    // Configurar visibilidade para todas as zonas
    for (let i = 1; i <= 5; i++) {
        atualizarVisibilidadeZona(i);
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
        const usaZona = document.getElementById(`z${i}UsaZona`);
        const direcao = document.getElementById(`z${i}Direcao`);

        if (habFase) {
            habFase.addEventListener('change', () => {
                atualizarVisibilidadeZonaFase(i);
                atualizarVisibilidadeDirecaoZona(i);
            });
        }

        if (habTerra) {
            habTerra.addEventListener('change', () => {
                atualizarVisibilidadeZonaTerra(i);
                atualizarVisibilidadeDirecaoZona(i);
            });
        }

        if (usaZona) {
            usaZona.addEventListener('change', () => atualizarVisibilidadeZona(i));
        }

        if (direcao) {
            direcao.addEventListener('change', () => atualizarVisibilidadeDirecaoZona(i));
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
 * Mostra/oculta os ajustes de uma zona inteira (Direção, Ângulo Característico e as
 * subseções Fase/Terra) a partir do checkbox "Zona N" — não é um gate novo de
 * cálculo, é o que já existe hoje (Habilitação fase/Habilitação terra) só que numa
 * camada acima: desmarcar o checkbox força fase e terra pra "inativo" (deixando de
 * aparecer nos resultados) e reaplica atualizarVisibilidadeZonaFase/Terra, que já
 * cuidam do disabled/enabled dos campos internos a partir desse valor.
 * @param {number} zona - Número da zona (1-5)
 */
function atualizarVisibilidadeZona(zona) {
    const checkbox = document.getElementById(`z${zona}UsaZona`);
    if (!checkbox) return;
    const usaZona = checkbox.checked;

    document.querySelectorAll(`.campos-zona-${zona}`).forEach(campo => {
        campo.style.display = usaZona ? '' : 'none';
    });

    if (!usaZona) {
        const habFase = document.getElementById(`z${zona}HabilitacaoFase`);
        const habTerra = document.getElementById(`z${zona}HabilitacaoTerra`);
        if (habFase) habFase.value = 'inativo';
        if (habTerra) habTerra.value = 'inativo';
    }

    atualizarVisibilidadeZonaFase(zona);
    atualizarVisibilidadeZonaTerra(zona);
    atualizarVisibilidadeDirecaoZona(zona);
}

/**
 * Mostra só o Alcance X relevante pra direção da zona (Frente ou Reverso) — o
 * outro não entra no cálculo dessa direção (prepararRetasFaseFaseFrente só usa
 * alcanceXFrente, prepararRetasFaseFaseReverso só usa alcanceXReverso, e o
 * mesmo vale pras versões fase-terra), então preenchê-lo não muda nada; ocultar
 * evita confusão. Recalcula a partir de Habilitação fase/terra + Direção toda
 * vez (em vez de assumir a ordem de chamada com atualizarVisibilidadeZonaFase/
 * Terra), pra nunca reexibir um campo que deveria continuar oculto por a zona
 * (ou fase/terra dela) estar inativa.
 * @param {number} zona - Número da zona (1-5)
 */
function atualizarVisibilidadeDirecaoZona(zona) {
    const direcaoEl = document.getElementById(`z${zona}Direcao`);
    if (!direcaoEl) return;
    const frente = direcaoEl.value === 'frente';

    const habFaseEl = document.getElementById(`z${zona}HabilitacaoFase`);
    const habTerraEl = document.getElementById(`z${zona}HabilitacaoTerra`);
    const faseAtiva = !!habFaseEl && habFaseEl.value === 'ativo';
    const terraAtiva = !!habTerraEl && habTerraEl.value === 'ativo';

    const aplicar = (id, visivel) => {
        const campo = document.getElementById(id);
        if (!campo) return;
        const grupo = campo.closest('.form-group');
        if (!grupo) return;
        grupo.style.display = visivel ? '' : 'none';
        if (visivel) {
            campo.removeAttribute('disabled');
        } else {
            campo.setAttribute('disabled', 'disabled');
        }
    };

    aplicar(`z${zona}AlcanceXFrenteFase`, faseAtiva && frente);
    aplicar(`z${zona}AlcanceXReversoFase`, faseAtiva && !frente);
    aplicar(`z${zona}AlcanceXFrenteTerra`, terraAtiva && frente);
    aplicar(`z${zona}AlcanceXReversoTerra`, terraAtiva && !frente);
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
            'correnteTerraMinimaFrente': parseFloat(document.getElementById('correnteTerraMinimaFrente').value) || 0.5,
            'correnteTerraMinimaReverso': parseFloat(document.getElementById('correnteTerraMinimaReverso').value) || 0.5
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

// ============================================================================
// FUNÇÃO PRINCIPAL DE CÁLCULO
// ============================================================================

/**
 * Função principal de cálculo da proteção 21
 * Calcula as regiões para todos os casos de falta respeitando a direção selecionada
 */
function calcularProtecao21() {
    try {
        const dados = coletarDadosFormulario21();

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
                    const bounds = calcularBounds(linesPolar, paramsFase);
                    const vertices = calcularVerticesRegiao(linesPolar, bounds);

                    // Converter retas polares para cartesianas (para debug)
                    const retas = linesPolar.map(lp => ({
                        nome: lp.nome,
                        R0: lp.R0,
                        X0: lp.X0,
                        thetaDeg: lp.thetaDeg,
                        keepSide: lp.keepSide,
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
                    const bounds = calcularBounds(linesPolar, paramsFase);
                    const vertices = calcularVerticesRegiao(linesPolar, bounds);

                    // Converter retas polares para cartesianas (para debug)
                    const retas = linesPolar.map(lp => ({
                        nome: lp.nome,
                        R0: lp.R0,
                        X0: lp.X0,
                        thetaDeg: lp.thetaDeg,
                        keepSide: lp.keepSide,
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
                    const bounds = calcularBounds(linesPolar, paramsTerra);
                    const vertices = calcularVerticesRegiao(linesPolar, bounds);

                    // Converter retas polares para cartesianas (para debug)
                    const retas = linesPolar.map(lp => ({
                        nome: lp.nome,
                        R0: lp.R0,
                        X0: lp.X0,
                        thetaDeg: lp.thetaDeg,
                        keepSide: lp.keepSide,
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
                    const bounds = calcularBounds(linesPolar, paramsTerra);
                    const vertices = calcularVerticesRegiao(linesPolar, bounds);

                    // Converter retas polares para cartesianas (para debug)
                    const retas = linesPolar.map(lp => ({
                        nome: lp.nome,
                        R0: lp.R0,
                        X0: lp.X0,
                        thetaDeg: lp.thetaDeg,
                        keepSide: lp.keepSide,
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

        // Exibir resultados
        exibirResultados21(dados, resultados);
        
        // Exibir debug das retas (se função existir)
        if (typeof exibirDebugRetas === 'function') {
            exibirDebugRetas(dados, resultados);
        }
        
        // Criar gráficos separados
        criarGraficosFaseFaseFaseTerra(resultados);

        // Formulário de ponto de teste (Módulo/Ângulo ou R/X) abaixo dos gráficos
        if (typeof garantirFormularioPontoTeste21 === 'function') {
            garantirFormularioPontoTeste21();
        }

    } catch (erro) {
        const resultadosDiv = document.getElementById('resultados');
        if (resultadosDiv) {
            resultadosDiv.innerHTML = `<div class="alert alert-danger">Erro ao calcular: ${erro.message}</div>`;
        }
    }
}


