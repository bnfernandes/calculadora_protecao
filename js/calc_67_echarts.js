// calc_67_echarts.js - Função 67 com Apache ECharts

// Classe para operações com números complexos
class Complexo {
    constructor(real, imag) {
        this.real = real;
        this.imag = imag;
    }

    static fromPolar(magnitude, anguloDeg) {
        const anguloRad = anguloDeg * Math.PI / 180;
        return new Complexo(
            magnitude * Math.cos(anguloRad),
            magnitude * Math.sin(anguloRad)
        );
    }

    magnitude() {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }

    angulo() {
        let angulo = Math.atan2(this.imag, this.real) * 180 / Math.PI;
        if (angulo < 0) angulo += 360;
        return angulo;
    }

    subtrair(outro) {
        return new Complexo(this.real - outro.real, this.imag - outro.imag);
    }

    adicionarAngulo(anguloDeg) {
        const novoAngulo = this.angulo() + anguloDeg;
        return Complexo.fromPolar(this.magnitude(), novoAngulo);
    }

    toString() {
        return `${this.magnitude().toFixed(2)} ∠ ${this.angulo().toFixed(2)}°`;
    }
}

// Controla se o card de Resultados entra na versão impressa (ver
// ajustarCardResultadoImpressao67 mais abaixo) — só depois de "Calcular",
// senão o PDF mostraria o placeholder "aparecerão aqui" em vez de nada.
let resultadosGerados67 = false;

// Função auxiliar para normalizar ângulos no intervalo [0, 360)
function normalizarAngulo(angulo) {
    while (angulo < 0) angulo += 360;
    while (angulo >= 360) angulo -= 360;
    return angulo;
}

// Função principal de cálculo
function calcularFuncao67(parametros) {
    const { sequencia, angulo, amplitude, direcional, ia, ib, ic, va, vb, vc } = parametros;

    // Criar fasores de tensão
    const Va = Complexo.fromPolar(va.magnitude, va.angulo);
    const Vb = Complexo.fromPolar(vb.magnitude, vb.angulo);
    const Vc = Complexo.fromPolar(vc.magnitude, vc.angulo);

    // Pares (fonte1 - fonte2) usados para calcular o Vpol de cada fase — além
    // do fasor em si, guarda-se os dois fasores de origem (com a letra da
    // fase) pra poder montar a equação com os valores substituídos, exibida
    // na tela antes do resultado final
    let parIa, parIb, parIc;
    if (sequencia === 'ABC') {
        parIa = { f1: { letra: 'b', fasor: Vb }, f2: { letra: 'c', fasor: Vc } }; // Vbc
        parIb = { f1: { letra: 'c', fasor: Vc }, f2: { letra: 'a', fasor: Va } }; // Vca
        parIc = { f1: { letra: 'a', fasor: Va }, f2: { letra: 'b', fasor: Vb } }; // Vab
    } else { // ACB
        parIa = { f1: { letra: 'c', fasor: Vc }, f2: { letra: 'b', fasor: Vb } }; // Vcb
        parIb = { f1: { letra: 'a', fasor: Va }, f2: { letra: 'c', fasor: Vc } }; // Vac
        parIc = { f1: { letra: 'b', fasor: Vb }, f2: { letra: 'a', fasor: Va } }; // Vba
    }

    let VpolIa = parIa.f1.fasor.subtrair(parIa.f2.fasor);
    let VpolIb = parIb.f1.fasor.subtrair(parIb.f2.fasor);
    let VpolIc = parIc.f1.fasor.subtrair(parIc.f2.fasor);

    // Ajustar para direção (Frente ou Reverso)
    const reverso = direcional === 'Reverso';
    if (reverso) {
        VpolIa = VpolIa.adicionarAngulo(180);
        VpolIb = VpolIb.adicionarAngulo(180);
        VpolIc = VpolIc.adicionarAngulo(180);
    }

    // Calcular ângulo de máximo torque
    const anguloMaxTorqueIa = normalizarAngulo(VpolIa.angulo() + 90 - angulo);
    const anguloMaxTorqueIb = normalizarAngulo(VpolIb.angulo() + 90 - angulo);
    const anguloMaxTorqueIc = normalizarAngulo(VpolIc.angulo() + 90 - angulo);

    // Calcular região de disparo
    const regiaoDisparoIa = {
        min: normalizarAngulo(anguloMaxTorqueIa - amplitude / 2),
        max: normalizarAngulo(anguloMaxTorqueIa + amplitude / 2)
    };

    const regiaoDisparoIb = {
        min: normalizarAngulo(anguloMaxTorqueIb - amplitude / 2),
        max: normalizarAngulo(anguloMaxTorqueIb + amplitude / 2)
    };

    const regiaoDisparoIc = {
        min: normalizarAngulo(anguloMaxTorqueIc - amplitude / 2),
        max: normalizarAngulo(anguloMaxTorqueIc + amplitude / 2)
    };

    return {
        VpolIa: { fasor: VpolIa, formula: sequencia === 'ABC' ? 'Vbc = Vb - Vc' : 'Vcb = Vc - Vb', par: parIa, reverso },
        VpolIb: { fasor: VpolIb, formula: sequencia === 'ABC' ? 'Vca = Vc - Va' : 'Vac = Va - Vc', par: parIb, reverso },
        VpolIc: { fasor: VpolIc, formula: sequencia === 'ABC' ? 'Vab = Va - Vb' : 'Vba = Vb - Va', par: parIc, reverso },
        anguloMaxTorqueIa,
        anguloMaxTorqueIb,
        anguloMaxTorqueIc,
        regiaoDisparoIa,
        regiaoDisparoIb,
        regiaoDisparoIc,
        parametrosUsados: parametros
    };
}

// Utilidades ECharts
const deg2rad = (d) => (d * Math.PI) / 180;
const toXY = (angleDeg, r = 1) => [
    +(r * Math.cos(deg2rad(angleDeg))).toFixed(6),
    +(r * Math.sin(deg2rad(angleDeg))).toFixed(6)
];

// Função para construir pontos do setor (região de operação)
function buildSectorPoints(startDeg, endDeg, step = 2) {
    const pts = [];
    pts.push([0, 0]); // Começa na origem
    
    // Se a região cruza 0° (ex: 325° → 95°)
    if (endDeg < startDeg) {
        // Vai de startDeg até 360°
        for (let a = startDeg; a <= 360; a += step) {
            pts.push(toXY(a, 1));
        }
        // Continua de 0° até endDeg
        for (let a = 0; a <= endDeg; a += step) {
            pts.push(toXY(a, 1));
        }
    } else {
        // Caso normal: vai de startDeg até endDeg
        for (let a = startDeg; a <= endDeg; a += step) {
            pts.push(toXY(a, 1));
        }
    }
    
    pts.push(toXY(endDeg, 1)); // Garante ponto final exato
    pts.push([0, 0]); // Fecha voltando à origem
    return pts;
}

// Redimensiona os 3 gráficos fasoriais (ia/ib/ic) num único listener de
// resize registrado uma vez — em vez de um novo listener a cada chamada de
// criarGraficoFasorial (chamada 3x por cálculo), que acumulava indefinidamente
// e podia referenciar instâncias já descartadas por dispose().
const GRAFICOS_FASORIAIS_67 = ['grafico-ia', 'grafico-ib', 'grafico-ic'];
let resizeListenerRegistrado67 = false;
function registrarResizeGraficosFasoriais67() {
    if (resizeListenerRegistrado67) return;
    resizeListenerRegistrado67 = true;
    window.addEventListener('resize', () => {
        GRAFICOS_FASORIAIS_67.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.chartInstance) el.chartInstance.resize();
        });
    });
}

// Função para criar gráfico fasorial com ECharts
function criarGraficoFasorial(containerId, fase, resultados) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Destruir gráfico anterior se existir
    if (container.chartInstance) {
        container.chartInstance.dispose();
    }

    const { parametrosUsados } = resultados;

    // Obter dados da fase específica
    let Vpol, anguloMin, anguloMax, anguloMaxTorque, corrente;
    let corFase, corFaseBorda, corFasorCorrente, nomeFase, nomeCorrenteFase;

    if (fase === 'Ia') {
        Vpol = resultados.VpolIa.fasor;
        anguloMin = resultados.regiaoDisparoIa.min;
        anguloMax = resultados.regiaoDisparoIa.max;
        anguloMaxTorque = resultados.anguloMaxTorqueIa;
        corrente = Complexo.fromPolar(parametrosUsados.ia.magnitude, parametrosUsados.ia.angulo);
        corFase = 'rgba(0, 0, 255, 0.18)'; // Azul transparente
        corFaseBorda = 'rgba(0, 0, 255, 0.6)';
        corFasorCorrente = '#1976d2'; // Azul sólido
        nomeFase = 'Ia';
        nomeCorrenteFase = `Ia: ${corrente.magnitude().toFixed(2)}∠${corrente.angulo().toFixed(0)}°`;
    } else if (fase === 'Ib') {
        Vpol = resultados.VpolIb.fasor;
        anguloMin = resultados.regiaoDisparoIb.min;
        anguloMax = resultados.regiaoDisparoIb.max;
        anguloMaxTorque = resultados.anguloMaxTorqueIb;
        corrente = Complexo.fromPolar(parametrosUsados.ib.magnitude, parametrosUsados.ib.angulo);
        corFase = 'rgba(0, 0, 0, 0.18)'; // Preto transparente
        corFaseBorda = 'rgba(0, 0, 0, 0.6)';
        corFasorCorrente = '#000000'; // Preto sólido
        nomeFase = 'Ib';
        nomeCorrenteFase = `Ib: ${corrente.magnitude().toFixed(2)}∠${corrente.angulo().toFixed(0)}°`;
    } else { // Ic
        Vpol = resultados.VpolIc.fasor;
        anguloMin = resultados.regiaoDisparoIc.min;
        anguloMax = resultados.regiaoDisparoIc.max;
        anguloMaxTorque = resultados.anguloMaxTorqueIc;
        corrente = Complexo.fromPolar(parametrosUsados.ic.magnitude, parametrosUsados.ic.angulo);
        corFase = 'rgba(255, 0, 0, 0.18)'; // Vermelho transparente
        corFaseBorda = 'rgba(255, 0, 0, 0.6)';
        corFasorCorrente = '#d32f2f'; // Vermelho sólido
        nomeFase = 'Ic';
        nomeCorrenteFase = `Ic: ${corrente.magnitude().toFixed(2)}∠${corrente.angulo().toFixed(0)}°`;
    }

    // Criar fasores de tensão
    const Va = Complexo.fromPolar(parametrosUsados.va.magnitude, parametrosUsados.va.angulo);
    const Vb = Complexo.fromPolar(parametrosUsados.vb.magnitude, parametrosUsados.vb.angulo);
    const Vc = Complexo.fromPolar(parametrosUsados.vc.magnitude, parametrosUsados.vc.angulo);

    // Normalizar tensões (maior tensão = 0.9) — guarda contra divisão por
    // zero se as 3 tensões forem 0 (o formulário permite magnitude mínima 0)
    const maxTensao = Math.max(Va.magnitude(), Vb.magnitude(), Vc.magnitude());
    const escala = maxTensao > 0 ? 0.9 / maxTensao : 0;

    // Normalizar corrente para 0.7 — mesma guarda, para corrente de magnitude 0
    const escalaCorrente = corrente.magnitude() > 0 ? 0.7 / corrente.magnitude() : 0;

    // Vpol usa a MESMA escala das tensões de fase (é uma tensão de linha),
    // não uma escala própria — senão a magnitude exibida fica incorreta em
    // relação a Va/Vb/Vc. Pode ultrapassar a região visível do gráfico, o
    // que é esperado (fica ocultada/cortada pela borda do grid).
    const nomeVpol = `Vpol: ${Vpol.magnitude().toFixed(1)}∠${Vpol.angulo().toFixed(0)}°`;

    // Linha do ângulo de máximo torque: direção de referência (não uma
    // grandeza medida), por isso sem ponta de flecha e desenhada além da
    // borda do círculo (o grid corta o que ultrapassar a área visível)
    const nomeMaxTorque = `Âng. Máx. Torque: ${anguloMaxTorque.toFixed(0)}°`;

    // Série custom para desenhar o setor preenchido (região de operação)
    const sectorSeries = {
        type: 'custom',
        name: `Região ${anguloMin.toFixed(0)}°–${anguloMax.toFixed(0)}°`,
        coordinateSystem: 'cartesian2d',
        silent: true,
        renderItem: function(params, api) {
            const points = buildSectorPoints(anguloMin, anguloMax, 2).map(p => api.coord(p));
            return {
                type: 'polygon',
                shape: { points },
                style: api.style({ 
                    fill: corFase, 
                    stroke: corFaseBorda, 
                    lineWidth: 1.5,
                    lineDash: [5, 5]
                })
            };
        },
        data: [0]
    };

    // Imagem de fundo removida - será adicionada via graphic

    // Função para criar fasor (seta)
    function phasor(fasor, escala, color, label, lineStyle = 'solid', comSeta = true) {
        const magnitude = fasor.magnitude() * escala;
        const angulo = fasor.angulo();
        const [x, y] = toXY(angulo, magnitude);

        const style = {
            type: 'lines',
            name: label,
            coordinateSystem: 'cartesian2d',
            clip: true,
            z: 5,
            symbol: ['none', comSeta ? 'arrow' : 'none'],
            symbolSize: 12,
            lineStyle: { 
                width: 3, 
                opacity: 0.95, 
                color,
                type: lineStyle
            },
            effect: { show: false },
            data: [{ coords: [[0, 0], [x, y]] }]
        };
        
        return style;
    }

    // Calcular dimensões para garantir área plotável quadrada
    // (sem título interno do gráfico — o texto já aparece no cabeçalho HTML acima
    // dele — e legenda do tipo "scroll", que não sobrepõe o gráfico em telas estreitas)
    const containerWidth = container.offsetWidth;
    const titleHeight = 15;  // Pequena margem superior
    const legendHeight = 50; // Espaço para legenda (rolável, não quebra linha)
    const verticalMargin = titleHeight + legendHeight;
    
    // Área plotável deve ser quadrada
    const plotSize = Math.min(containerWidth * 0.8, containerWidth - 40);
    const totalHeight = plotSize + verticalMargin;
    
    // Ajustar altura do container
    container.style.height = totalHeight + 'px';
    
    // Criar gráfico
    const chart = echarts.init(container, null, { renderer: 'canvas' });

    const option = {
        animation: true,
        tooltip: {
            trigger: 'item',
            formatter: params => params.seriesName
        },
        graphic: [
            {
                type: 'image',
                style: {
                    image: '../img/coordpolar.png',
                    x: (containerWidth - plotSize) / 2,
                    y: titleHeight,
                    width: plotSize,
                    height: plotSize
                },
                z: -1
            }
        ],
        grid: {
            left: (containerWidth - plotSize) / 2,
            right: (containerWidth - plotSize) / 2,
            top: titleHeight,
            bottom: legendHeight,
            width: plotSize,
            height: plotSize,
            containLabel: false
        },
        xAxis: {
            min: -1.1, 
            max: 1.1,
            show: false,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            splitLine: { show: false }
        },
        yAxis: {
            min: -1.1, 
            max: 1.1,
            show: false,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { show: false },
            splitLine: { show: false }
        },
        legend: {
            type: 'scroll',
            bottom: 5,
            left: 'center',
            orient: 'horizontal',
            itemWidth: 20,
            itemHeight: 12,
            itemGap: 12,
            textStyle: { fontSize: 10 },
            pageIconSize: 10,
            padding: [5, 10],
            // Vpol começa desmarcado — só aparece se o usuário clicar nele
            selected: { [nomeVpol]: false }
        },
        series: [
            sectorSeries,
            phasor(Va, escala, '#1976d2', `Va: ${Va.magnitude().toFixed(1)}∠${Va.angulo().toFixed(0)}°`, 'solid'),
            phasor(Vb, escala, '#000000', `Vb: ${Vb.magnitude().toFixed(1)}∠${Vb.angulo().toFixed(0)}°`, 'solid'),
            phasor(Vc, escala, '#d32f2f', `Vc: ${Vc.magnitude().toFixed(1)}∠${Vc.angulo().toFixed(0)}°`, 'solid'),
            phasor(corrente, escalaCorrente, corFasorCorrente, nomeCorrenteFase, 'dashed'),
            phasor(Complexo.fromPolar(2, anguloMaxTorque), 1, corFasorCorrente, nomeMaxTorque, 'dotted', false),
            phasor(Vpol, escala, '#8e24aa', nomeVpol, 'dashed')
        ]
    };

    chart.setOption(option);
    container.chartInstance = chart;

    // Redimensionar responsivamente
    registrarResizeGraficosFasoriais67();
}

// Alinhamento estilo LaTeX \align da Tensão de Polarização — via a grade
// compartilhada gradeAlinhadaHTML (js/formula-html.js, ver .eq-grade-igual
// em equations.css), não por medição em JS. Uma 1ª versão calculava um
// deslocamento em pixels (posição do "=") e o aplicava com position:left,
// mas esse valor fica congelado na escala de fonte de quando foi calculado
// (tipicamente a da tela) — a impressão/PDF muda a escala de fonte do site
// inteiro (@media print redefine html{font-size:10px}, ver ESCALA DE TEXTO
// no topo de equations.css) numa passagem de layout própria do motor de
// impressão, testada com um PDF real gerado pelo Chromium (não só emulação
// de mídia — o evento "beforeprint" não é confiável pra isso: o PDF final
// saía desalinhado mesmo recalculando nele). CSS Grid não tem esse problema
// porque é recalculado pelo próprio motor de layout do navegador em
// QUALQUER passagem de renderização (tela, impressão, PDF), sem depender de
// JS nem de quando um evento dispara.

// Monta uma equação com resultado como pares [rótulo, termo] — ex.
// ["Vpol Ia =", "(...)"], ["-", "(...)"]. No desktop cai tudo numa linha só,
// normal. Em telas estreitas ou quando a equação não cabe numa linha só (ver
// ajustarEmpilhamentoEquacoes67), vira uma grid de 2 colunas (rótulo |
// termo): o 1º termo fica ao lado do "=", os demais ao lado do rótulo deles
// (ex. "-") — como a coluna de termo é a mesma em toda a grid, o 2º termo já
// sai alinhado com o 1º sem precisar medir nada em JS.
function gradeTermosHTML67(pares) {
    const linhas = pares.map(([rotulo, termo]) =>
        `<span class="eq-termo-rotulo">${rotulo}</span><span class="eq-termo">${termo}</span>`
    ).join('');
    return `<span class="eq-termos-empilhaveis">${linhas}</span>`;
}

// Decide, pra cada equação empilhável dentro do container, se ela precisa da
// classe .eq-empilhado — não por um breakpoint fixo de largura de tela, mas
// medindo se ESSA equação cabe numa linha só no espaço realmente disponível
// (mesmo método de ajustarEmpilhamentoEquacoes em calc_seq_eq.js). O bloco
// agora vive dentro de uma célula da grid externa (.eq-linha-conteudo, ver
// gradeAlinhadaHTML em formula-html.js), não mais de um .formula-equation —
// o pai direto (bloco.parentElement) continua sendo a "linha" certa a medir
// nos dois casos, então não precisa mudar o restante da lógica.
function ajustarEmpilhamentoEquacoes67(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.eq-termos-empilhaveis').forEach(bloco => {
        const linha = bloco.parentElement;
        if (!linha) return;
        bloco.classList.remove('eq-empilhado');
        const larguraDisponivel = linha.clientWidth;
        linha.style.whiteSpace = 'nowrap';
        const larguraNecessaria = linha.scrollWidth;
        linha.style.whiteSpace = '';
        if (larguraNecessaria > larguraDisponivel) {
            bloco.classList.add('eq-empilhado');
        }
    });
}


// Monta a seção de resultados de uma fase (Vpol, ângulo de máximo torque,
// ângulo de disparo e gráfico fasorial) — reaproveitada para Ia, Ib e Ic.
function construirSecaoFase(letraFase, vpol, anguloMaxTorque, regiaoDisparo, parametrosUsados, graficoId) {
    const nomeI = `I${letraFase}`; // Ia, Ib, Ic

    // Bloco da Tensão de Polarização, como uma grid de 3 (ou 5, com
    // Reverso) linhas — ver gradeAlinhadaHTML (formula-html.js). A equação numérica fica sem o
    // resultado embutido nela mesma ("= valor" solto no fim): o resultado
    // vem numa linha própria logo abaixo, com o "=" alinhado ao das demais
    // pela grid, mesmo estilo LaTeX \align da página de Componentes
    // Simétricas.
    const { f1, f2 } = vpol.par;
    const semDirecao = f1.fasor.subtrair(f2.fasor);
    const rotuloVpol = `V<sub>pol ${nomeI}</sub> =`;
    const linhasVpol = [
        { rotulo: rotuloVpol, conteudo: vpol.formula },
        { rotulo: rotuloVpol, conteudo: gradeTermosHTML67([
            ['', `(${f1.fasor})`],
            ['-', `(${f2.fasor})`]
        ]) },
        { rotulo: rotuloVpol, conteudo: `${semDirecao}`, resultado: true }
    ];
    // Direção "Reverso" soma 180° depois da subtração — sem essa linha, o
    // resultado final pareceria não bater com a subtração mostrada acima
    if (vpol.reverso) {
        const rotuloReverso = `V<sub>pol ${nomeI}</sub> (Reverso) =`;
        linhasVpol.push(
            { rotulo: rotuloReverso, conteudo: gradeTermosHTML67([
                ['', `${semDirecao}`],
                ['+', '180°']
            ]) },
            { rotulo: rotuloReverso, conteudo: `${vpol.fasor}`, resultado: true }
        );
    }

    let conteudo = formulaBoxHTML({
        titulo: `Tensão de Polarização (V<sub>pol ${nomeI}</sub>)`,
        linhas: [gradeAlinhadaHTML(linhasVpol)]
    });


    // Mesma grade alinhada por "=" da Tensão de Polarização (gradeAlinhadaHTML)
    // — a linha de resultado vira "θmax torque = valor" em vez de um número
    // solto, com o "=" alinhado às duas equações acima.
    const rotuloTorque = `θ<sub>max torque</sub> =`;
    conteudo += formulaBoxHTML({
        titulo: 'Ângulo de Máximo Torque',
        linhas: [gradeAlinhadaHTML([
            { rotulo: rotuloTorque, conteudo: `arg(V<sub>pol ${nomeI}</sub>) + 90° - ${parametrosUsados.angulo}°` },
            { rotulo: rotuloTorque, conteudo: `${vpol.fasor.angulo().toFixed(2)}° + 90° - ${parametrosUsados.angulo}°` },
            { rotulo: rotuloTorque, conteudo: `${anguloMaxTorque.toFixed(2)}°`, resultado: true }
        ])]
    });

    // O ° precisa ficar junto do numerador (amplitude), não solto depois da
    // fração inteira — senão fica alinhado ao meio do bloco de duas linhas,
    // mais baixo que o número da amplitude.
    const metade = fracaoHTML(`${parametrosUsados.amplitude}°`, 2);
    // θmin e θmax são 2 equações DIFERENTES (não uma equação + seu próprio
    // resultado, como as demais grades desta página) — cada uma tem 2 "="
    // (ex. "θmin = θmax torque - .../2 = 300.00° - 85.00°"), então o rótulo
    // de cada uma leva só até o 1º "=" (θmin =/θmax =), e o 2º "=" de cada
    // linha fica solto dentro do conteúdo, sem entrar no alinhamento da
    // grade — mesmo cuidado do "Vpol Ia = Vbc = Vb - Vc" (só que aqui as
    // duas linhas não compartilham o mesmo resultado no fim, então a caixa
    // com a desigualdade final continua separada, como já era).
    conteudo += formulaBoxHTML({
        titulo: 'Ângulo de Disparo',
        linhas: [gradeAlinhadaHTML([
            { rotulo: `θ<sub>min</sub> =`, conteudo: `θ<sub>max torque</sub> - ${metade} = ${anguloMaxTorque.toFixed(2)}° - ${(parametrosUsados.amplitude / 2).toFixed(2)}°` },
            { rotulo: `θ<sub>max</sub> =`, conteudo: `θ<sub>max torque</sub> + ${metade} = ${anguloMaxTorque.toFixed(2)}° + ${(parametrosUsados.amplitude / 2).toFixed(2)}°` }
        ])],
        resultado: `${regiaoDisparo.min.toFixed(2)}° &lt; θ<sub>${letraFase}</sub> &lt; ${regiaoDisparo.max.toFixed(2)}°`
    });

    conteudo += boxResultadoHTML(
        `<p><strong>Gráfico Fasorial — Fase ${nomeI}</strong></p>` +
        `<div style="position: relative; width: 100%; max-width: 600px; margin: 0 auto;">` +
        `<div id="${graficoId}" style="width: 100%; max-width: 600px;"></div></div>`
    );

    return secaoResultadoHTML(`Região de Disparo ${nomeI}`, conteudo);
}

// Formata uma grandeza {magnitude, angulo} como "mag∠ang°" — mesmo par de
// campos usado em ia/ib/ic/va/vb/vc dentro de parametrosUsados.
function fmtGrandeza67(g) {
    return `${g.magnitude.toFixed(2)}∠${g.angulo.toFixed(2)}°`;
}

// Tabela Corrente/Tensão por fase com os valores exatamente como lidos do
// formulário no momento do cálculo (congelados) — mesmo papel de
// correntesInjetadasHTML na função 87 (js/calc_87_eq.js): a 1ª coisa exibida
// nos Resultados, antes de qualquer valor calculado, pra o PDF continuar
// mostrando as grandezas de falta usadas mesmo com o formulário omitido.
function grandezasFaltaHTML(parametrosUsados) {
    const { ia, ib, ic, va, vb, vc } = parametrosUsados;
    let html = '<div class="table-responsive tabela-grandezas-falta"><table class="tabela-pontos-teste">';
    // Sem coluna "Fase": a letra já vai no subscrito de cada valor (I_a, V_a,
    // ...), mesmo padrão das tabelas de correntesInjetadasHTML (87) e das de
    // falta trifásica/monofásica (21) — uma coluna à parte só pra repetir a
    // mesma letra que já está em cada célula é redundante.
    html += '<thead><tr><th>Tensão</th><th>Corrente</th></tr></thead><tbody>';
    [['a', ia, va], ['b', ib, vb], ['c', ic, vc]].forEach(([sub, i, v]) => {
        html += `<tr><td>V<sub>${sub}</sub> = ${fmtGrandeza67(v)} V</td><td>I<sub>${sub}</sub> = ${fmtGrandeza67(i)} A</td></tr>`;
    });
    html += '</tbody></table></div>';
    return html;
}

// Função para formatar resultados em HTML
function formatarResultadosHTML(resultados) {
    const { parametrosUsados } = resultados;
    let html = '<div class="resultados-67">';

    html += secaoResultadoHTML('Grandezas Elétricas de Falta', grandezasFaltaHTML(parametrosUsados));

    html += construirSecaoFase('a', resultados.VpolIa, resultados.anguloMaxTorqueIa, resultados.regiaoDisparoIa, parametrosUsados, 'grafico-ia');
    html += construirSecaoFase('b', resultados.VpolIb, resultados.anguloMaxTorqueIb, resultados.regiaoDisparoIb, parametrosUsados, 'grafico-ib');
    html += construirSecaoFase('c', resultados.VpolIc, resultados.anguloMaxTorqueIc, resultados.regiaoDisparoIc, parametrosUsados, 'grafico-ic');

    html += '</div>';

    return html;
}

// Event listener para o formulário
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-67');

    if (form) {
        ativarSanitizacaoFormulario(form);

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            sanitizarTodosCampos(form);

            try {
                // Coletar dados do formulário
                const parametros = {
                    sequencia: document.getElementById('sequenciaFases').value,
                    angulo: parseFloat(document.getElementById('angulo').value),
                    amplitude: parseFloat(document.getElementById('amplitude').value),
                    direcional: document.getElementById('direcional').value,
                    ia: {
                        magnitude: parseFloat(document.getElementById('iaMagnitude').value),
                        angulo: parseFloat(document.getElementById('iaAngulo').value)
                    },
                    ib: {
                        magnitude: parseFloat(document.getElementById('ibMagnitude').value),
                        angulo: parseFloat(document.getElementById('ibAngulo').value)
                    },
                    ic: {
                        magnitude: parseFloat(document.getElementById('icMagnitude').value),
                        angulo: parseFloat(document.getElementById('icAngulo').value)
                    },
                    va: {
                        magnitude: parseFloat(document.getElementById('vaMagnitude').value),
                        angulo: parseFloat(document.getElementById('vaAngulo').value)
                    },
                    vb: {
                        magnitude: parseFloat(document.getElementById('vbMagnitude').value),
                        angulo: parseFloat(document.getElementById('vbAngulo').value)
                    },
                    vc: {
                        magnitude: parseFloat(document.getElementById('vcMagnitude').value),
                        angulo: parseFloat(document.getElementById('vcAngulo').value)
                    }
                };

                // Validar dados
                const camposNumericos = [
                    parametros.angulo, parametros.amplitude,
                    parametros.ia.magnitude, parametros.ia.angulo,
                    parametros.ib.magnitude, parametros.ib.angulo,
                    parametros.ic.magnitude, parametros.ic.angulo,
                    parametros.va.magnitude, parametros.va.angulo,
                    parametros.vb.magnitude, parametros.vb.angulo,
                    parametros.vc.magnitude, parametros.vc.angulo
                ];
                if (camposNumericos.some(isNaN)) {
                    throw new Error('Por favor, preencha todos os campos de parâmetros.');
                }

                // Calcular
                const resultados = calcularFuncao67(parametros);

                // Exibir resultados
                const resultadosDiv = document.getElementById('resultados');
                resultadosDiv.innerHTML = formatarResultadosHTML(resultados);
                resultadosGerados67 = true;
                reajustarEquacoesVpol67();

                // Criar gráficos após o DOM ser atualizado — em try/catch próprio,
                // já que o try externo não cobre erros de um callback assíncrono
                setTimeout(() => {
                    try {
                        criarGraficoFasorial('grafico-ia', 'Ia', resultados);
                        criarGraficoFasorial('grafico-ib', 'Ib', resultados);
                        criarGraficoFasorial('grafico-ic', 'Ic', resultados);
                    } catch (error) {
                        resultadosDiv.innerHTML = `<div class="alert alert-danger">Erro ao desenhar gráficos: ${error.message}</div>`;
                    }
                }, 100);

            } catch (error) {
                const resultadosDiv = document.getElementById('resultados');
                resultadosDiv.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
            }
        });

        // Botão Limpar
        const btnLimpar = document.getElementById('btnLimpar');
        if (btnLimpar) {
            btnLimpar.addEventListener('click', function() {
                form.reset();
                document.getElementById('resultados').innerHTML = '';
                resultadosGerados67 = false;
            });
        }
    }

    // Botões "E" (Equilibrar): a partir da fase clicada, aplica a mesma
    // magnitude e reproduz o espaçamento de 120° nas outras duas fases do
    // mesmo grupo (corrente ou tensão), na direção definida pela Sequência de
    // Fases — a fase clicada não muda, serve de referência
    document.querySelectorAll('.btn-equilibrar').forEach(function(btn) {
        btn.addEventListener('click', function() {
            equilibrarFase(btn.dataset.grupo, btn.dataset.fase);
        });
    });
});

const GRUPOS_FASE_EQUILIBRAR = {
    corrente: ['ia', 'ib', 'ic'],
    tensao: ['va', 'vb', 'vc']
};

function equilibrarFase(grupo, faseClicada) {
    const fases = GRUPOS_FASE_EQUILIBRAR[grupo];
    const idx = fases.indexOf(faseClicada);
    if (idx === -1) return;

    const magnitudePivo = parseFloat(document.getElementById(`${faseClicada}Magnitude`).value) || 0;
    const anguloPivo = parseFloat(document.getElementById(`${faseClicada}Angulo`).value) || 0;

    // ABC: a fase seguinte (a->b->c) atrasa 120° da anterior. ACB: adianta.
    const sequencia = document.getElementById('sequenciaFases').value;
    const delta = sequencia === 'ABC' ? -120 : 120;

    const faseSeguinte = fases[(idx + 1) % 3];
    const faseAnterior = fases[(idx + 2) % 3];

    document.getElementById(`${faseSeguinte}Magnitude`).value = magnitudePivo;
    document.getElementById(`${faseSeguinte}Angulo`).value = normalizarAngulo(anguloPivo + delta);

    document.getElementById(`${faseAnterior}Magnitude`).value = magnitudePivo;
    document.getElementById(`${faseAnterior}Angulo`).value = normalizarAngulo(anguloPivo - delta);
}

// O PDF deve refletir só o que o usuário efetivamente pediu pra ver — card
// Resultados só entra na impressão se "Calcular" já foi usado (senão iria o
// placeholder "aparecerão aqui" pro papel). Mesmo papel de
// ajustarCardsResultadoImpressao87 (pages/calculo-87.html).
function ajustarCardResultadoImpressao67() {
    document.getElementById('cardResultados67').classList.toggle('oculto-impressao', !resultadosGerados67);
}
window.addEventListener('beforeprint', ajustarCardResultadoImpressao67);

function reajustarEquacoesVpol67() {
    if (!resultadosGerados67) return;
    ajustarEmpilhamentoEquacoes67('resultados');
}

// Reagir a redimensionamento/rotação: o critério de empilhar (ver
// ajustarEmpilhamentoEquacoes67) depende do espaço realmente disponível, não
// de um breakpoint fixo — se a janela mudar de tamanho, a decisão pode mudar
// também (mesmo raciocínio de calc_seq_eq.js, na página de Componentes
// Simétricas). Só reajusta o que já está na tela, e só se já houver
// resultados calculados. Não precisa de listener de beforeprint/afterprint
// aqui: o alinhamento do "=" agora é resolvido só por CSS Grid
// (gradeAlinhadaHTML, formula-html.js — ver comentário em cima de ajustarEmpilhamentoEquacoes67),
// que não depende de JS nem de quando um evento dispara — só essa decisão de
// empilhar os termos por falta de espaço depende de medir a largura
// disponível, e reagir ao resize já cobre isso.
let resizeEquacoesTimeoutId67 = null;
window.addEventListener('resize', function() {
    clearTimeout(resizeEquacoesTimeoutId67);
    resizeEquacoesTimeoutId67 = setTimeout(reajustarEquacoesVpol67, 150);
});

// Exportar funções para uso global
window.calcularFuncao67 = calcularFuncao67;
window.formatarResultadosHTML = formatarResultadosHTML;
window.criarGraficoFasorial = criarGraficoFasorial;
window.Complexo = Complexo;

