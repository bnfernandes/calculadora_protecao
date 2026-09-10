// Constantes das curvas de proteção
const CURVE_CONSTANTS = {
    // ANSI
    'ANSI-NI': { padrao: 'ANSI', A: 0.0274, B: 22.614, C: 0.3, D: -41.899, E: 91.272, tr: 0.99 },
    'ANSI-MI': { padrao: 'ANSI', A: 0.0615, B: 0.7989, C: 0.34, D: -0.284, E: 40.505, tr: 4.678 },
    'ANSI-EI': { padrao: 'ANSI', A: 0.0399, B: 0.2294, C: 0.5, D: 30.094, E: 0.7222, tr: 6.008 },
    'ANSI-MODI': { padrao: 'ANSI', A: 0.1735, B: 0.6791, C: 0.8, D: -0.08, E: 0.1271, tr: 1.2 },

    // IEC
    'IEC-NI': { padrao: 'IEC', K: 0.14, a: 0.02, tr: 9.7 },
    'IEC-IC': { padrao: 'IEC', K: 0.05, a: 0.04, tr: 0.5 },
    'IEC-IL': { padrao: 'IEC', K: 120, a: 1, tr: 120 },
    'IEC-MI': { padrao: 'IEC', K: 13.5, a: 1, tr: 43.2 },
    'IEC-EI': { padrao: 'IEC', K: 80, a: 2, tr: 58.2 },
    'IEC-MIEs': { padrao: 'IEC', K: 2.6, a: 1, tr: 21.2 },

    // IEEE
    'IEEE-MI': { padrao: 'IEEE', K: 0.0515, a: 0.02, c: 0.114, tr: 4.85 },
    'IEEE-VI': { padrao: 'IEEE', K: 19.61, a: 2, c: 0.491, tr: 21.6 },
    'IEEE-EI': { padrao: 'IEEE', K: 28.2, a: 2, c: 0.1217, tr: 29.1 }
};

// Tempo de disparo da curva em si, sem aplicar o piso do tempo mínimo — usado
// tanto por calcularTempoAtuacao (que aplica o piso por cima) quanto por
// calcularFuncao51 (que precisa do valor bruto pra saber se o piso "cortou"
// o resultado da curva, e avisar o usuário nesse caso).
function calcularTempoBruto(tipoCurva, multiplicador, I, I0) {
    const constants = CURVE_CONSTANTS[tipoCurva];
    if (!constants) {
        throw new Error(`Tipo de curva não reconhecido: ${tipoCurva}`);
    }

    const { padrao } = constants;
    const razaoCorrente = I / I0;

    if (padrao === 'IEC') {
        const { K, a } = constants;
        if (razaoCorrente <= 1) return Infinity;
        return multiplicador * K / (Math.pow(razaoCorrente, a) - 1);
    } else if (padrao === 'ANSI') {
        const { A, B, C, D, E } = constants;
        if (razaoCorrente <= C) return Infinity;
        const term = razaoCorrente - C;
        return multiplicador * (A + B / term + D / Math.pow(term, 2) + E / Math.pow(term, 3));
    } else if (padrao === 'IEEE') {
        const { K, a, c } = constants;
        if (razaoCorrente <= 1) return Infinity;
        return multiplicador * (K / (Math.pow(razaoCorrente, a) - 1) + c);
    } else {
        throw new Error('Padrão de curva não reconhecido: ' + padrao);
    }
}

// Função para calcular o tempo de atuação (com o piso do tempo mínimo já aplicado)
function calcularTempoAtuacao(tipoCurva, multiplicador, I, I0, tempoMinimo = 0) {
    if (tipoCurva === 'TEMPO-FIXO') {
        return tempoMinimo / 1000; // Converte ms para s
    }
    return Math.max(calcularTempoBruto(tipoCurva, multiplicador, I, I0), tempoMinimo / 1000);
}

// Pontos de I/I0 espaçados igualmente em escala log entre min e max (não em
// escala linear), para a curva ficar suave também perto do início (onde a
// característica é mais íngreme). O cálculo é uma fórmula fechada por ponto,
// então gerar dezenas de pontos em vez de poucos não pesa nada.
function gerarRazoesCorrente(min = 1.05, max = 40, quantidade = 80) {
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    const razoes = [];
    for (let i = 0; i < quantidade; i++) {
        razoes.push(Math.pow(10, logMin + (i / (quantidade - 1)) * (logMax - logMin)));
    }
    return razoes;
}

// Função para gerar pontos da curva
// razaoPontoAtuacao: I/I0 do ponto de atuação já calculado (fatorCalculado em
// calcularFuncao51) — quando ultrapassa o teto padrão de 40x, o teto da curva
// é esticado até cobri-lo (com 20% de folga), senão o ponto ficava
// "flutuando" fora do traço da curva, sem ela realmente passar perto dele.
function gerarPontosCurva(tipoCurva, multiplicador, I0, tempoMinimo = 0, razaoPontoAtuacao = null) {
    const correntes = [];
    const tempos = [];
    const temposBrutos = [];

    const constants = CURVE_CONSTANTS[tipoCurva];
    const padrao = constants ? constants.padrao : null;

    const MAX_PADRAO = 40;
    const max = razaoPontoAtuacao && razaoPontoAtuacao > MAX_PADRAO
        ? razaoPontoAtuacao * 1.2
        : MAX_PADRAO;
    const razoesCorrente = gerarRazoesCorrente(1.05, max);

    for (const razaoCorrente of razoesCorrente) {
        // Se for ANSI, mantém uma margem de 0.1 acima de C — perto demais da
        // assíntota (razaoCorrente - C perto de 0), os termos B/D/E divididos
        // por potências desse valor disparam pra um tempo absurdamente alto,
        // distorcendo a curva. Hoje nenhuma constante ANSI passa de C=0.8 e o
        // menor ponto gerado é 1.05 (gerarRazoesCorrente), então esse filtro
        // nunca dispara na prática — é uma guarda para uma futura curva ANSI
        // com C mais alto.
        if (padrao === 'ANSI' && constants && constants.C && razaoCorrente <= constants.C + 0.1) {
            continue;
        }

        const I = razaoCorrente * I0;
        correntes.push(I);

        try {
            const tempo = calcularTempoAtuacao(tipoCurva, multiplicador, I, I0, tempoMinimo);
            tempos.push(tempo);
        } catch (error) {
            tempos.push(null);
        }

        // Curva "bruta", sem o piso do tempo mínimo — usada só para desenhar
        // a continuação em cinza claro abaixo do piso (ver criarGrafico).
        // TEMPO-FIXO não tem curva nenhuma (o tempo já É o piso, sempre),
        // então não existe "bruto" pra calcular ali.
        if (tipoCurva !== 'TEMPO-FIXO') {
            try {
                temposBrutos.push(calcularTempoBruto(tipoCurva, multiplicador, I, I0));
            } catch (error) {
                temposBrutos.push(null);
            }
        }
    }

    return { correntes, tempos, temposBrutos };
}

// Função principal de cálculo da função 51
function calcularFuncao51(parametros) {
    const {
        correntePartida, // I0
        tipoCurva,
        indiceTempo,     // M
        tempoFixoMinimo,
        correnteFalta,    // I
        fator
    } = parametros;
    
    let I_calc = correnteFalta;
    if (fator && !correnteFalta) {
        I_calc = fator * correntePartida;
    }

    if (!I_calc || !correntePartida) {
        throw new Error('É necessário fornecer a corrente de falta (I) ou o fator, e a corrente de partida (I0)');
    }

    const fatorCalculado = I_calc / correntePartida;

    // tempoCalculado: valor bruto da curva, sem o piso do tempo mínimo (null
    // pra TEMPO-FIXO, onde não existe "curva" pra calcular). limitadoPeloMinimo
    // indica se o piso efetivamente "cortou" o resultado da curva — usado pra
    // avisar o usuário (formatarEquacaoHTML) em vez de mostrar só o valor final,
    // que esconderia o que a curva teria dado sem o piso.
    const tempoCalculado = tipoCurva === 'TEMPO-FIXO'
        ? null
        : calcularTempoBruto(tipoCurva, indiceTempo, I_calc, correntePartida);
    const tempoAtuacao = calcularTempoAtuacao(tipoCurva, indiceTempo, I_calc, correntePartida, tempoFixoMinimo);
    const limitadoPeloMinimo = tempoCalculado !== null && (tempoFixoMinimo / 1000) > tempoCalculado;

    const pontosCurva = gerarPontosCurva(tipoCurva, indiceTempo, correntePartida, tempoFixoMinimo, fatorCalculado);

    return {
        fatorCalculado,
        correnteFaltaCalculada: I_calc,
        tempoCalculado,
        tempoAtuacao,
        limitadoPeloMinimo,
        pontosCurva,
        parametrosUsados: parametros
    };
}

// Função para formatar equação em HTML puro (divisões sempre como frações em
// duas linhas — ver js/formula-html.js, mesmo padrão usado nas Funções 67 e 87).
// Equação e legenda ("onde:") em cards lado a lado, mesmo padrão da 87
// (.cards-lado-a-lado) — .formula-legenda dá um min-width ao card da equação
// pra evitar que a fórmula ANSI (a mais larga, 3 frações) esprema a ponto de
// uma fração quebrar no meio (numerador e denominador cada um em sua linha).
// O card da equação já traz o tipo de curva no título, a substituição dos
// valores e o resultado final (vermelho); a legenda "onde" já traz os
// valores de I/I0/M/tempo mínimo — não precisam de cards à parte
// (Parâmetros Calculados/Configuração da Proteção/Tempo de Atuação).
function formatarEquacaoHTML({ tipoCurva, multiplicador, correntePartida, correnteFalta, razaoCorrente, tempoCalculado, tempoAtuacao, limitadoPeloMinimo, tempoFixoMinimo }) {
    if (tipoCurva === 'TEMPO-FIXO') {
        return formulaBoxHTML({
            titulo: 'Tempo Fixo',
            linhas: [linhaEquacaoHTML(`t = ${tempoFixoMinimo} ms (valor fixo, sem curva)`)],
            resultado: `t = ${tempoAtuacao.toFixed(3)} s`
        });
    }

    const constants = CURVE_CONSTANTS[tipoCurva];
    if (!constants) return '';

    const razao = razaoCorrente.toFixed(3);

    // Cada linha já traz o valor usado, não só o significado do símbolo —
    // substitui os cards "Parâmetros Calculados"/"Configuração da Proteção"
    // (corrente de partida = I0, corrente de falta = I, I/I0, multiplicador)
    const comuns = [
        't = tempo de disparo (seg)',
        `M = ${multiplicador} (multiplicador)`,
        `I = ${correnteFalta} A (corrente de falta)`,
        `I<sub>0</sub> = ${correntePartida} A (corrente de partida)`,
        `I/I<sub>0</sub> = ${razao}`,
        `Tempo mínimo = ${tempoFixoMinimo} ms (piso, se o valor calculado pela curva for menor)`
    ];

    const titulo = `Fórmula ${tipoCurva}`;
    let algebrica, substituida, extras;

    if (constants.padrao === 'IEC') {
        const { K, a } = constants;
        algebrica = `t = M × ${fracaoHTML('K', '(I/I<sub>0</sub>)<sup>a</sup> - 1')}`;
        substituida = `t = ${multiplicador} × ${fracaoHTML(K, `(${razao})<sup>${a}</sup> - 1`)}`;
        extras = [`K = ${K}`, `a = ${a}`];
    } else if (constants.padrao === 'ANSI') {
        const { A, B, C, D, E } = constants;
        algebrica = `t = M × (A + ${fracaoHTML('B', 'I/I<sub>0</sub> - C')} + ${fracaoHTML('D', '(I/I<sub>0</sub> - C)<sup>2</sup>')} + ${fracaoHTML('E', '(I/I<sub>0</sub> - C)<sup>3</sup>')})`;
        substituida = `t = ${multiplicador} × (${A} + ${fracaoHTML(B, `${razao} - ${C}`)} + ${fracaoHTML(D, `(${razao} - ${C})<sup>2</sup>`)} + ${fracaoHTML(E, `(${razao} - ${C})<sup>3</sup>`)})`;
        extras = [`A = ${A}`, `B = ${B}`, `C = ${C}`, `D = ${D}`, `E = ${E}`];
    } else if (constants.padrao === 'IEEE') {
        const { K, a, c } = constants;
        algebrica = `t = M × (${fracaoHTML('K', '(I/I<sub>0</sub>)<sup>a</sup> - 1')} + c)`;
        substituida = `t = ${multiplicador} × (${fracaoHTML(K, `(${razao})<sup>${a}</sup> - 1`)} + ${c})`;
        extras = [`K = ${K}`, `a = ${a}`, `c = ${c}`];
    } else {
        return '';
    }

    const legendaHTML = '<p><strong>onde:</strong></p>' +
        [...comuns, ...extras].map(c => `<p>${c}</p>`).join('');

    // O resultado mostrado aqui é sempre o valor calculado PELA CURVA (sem o
    // piso) — se o piso do tempo mínimo tiver "cortado" esse valor, mostra um
    // aviso com o tempo de atuação real (maior que o calculado) em vez de
    // simplesmente trocar o resultado, o que esconderia o que a curva deu.
    const linhasEquacao = [linhaEquacaoHTML(algebrica), linhaEquacaoHTML(substituida)];
    linhasEquacao.push(`<p class="resultado-valor text-center">t = ${tempoCalculado.toFixed(3)} s</p>`);
    if (limitadoPeloMinimo) {
        linhasEquacao.push(`<p class="formula-nota" style="color: #cc0000;">Tempo de atuação limitado pelo tempo mínimo: t = ${tempoAtuacao.toFixed(3)} s</p>`);
    }

    return '<div class="cards-lado-a-lado formula-legenda">' +
        formulaBoxHTML({ titulo, linhas: linhasEquacao }) +
        boxResultadoHTML(legendaHTML, 'legenda-onde') +
        '</div>';
}

// Formata uma potência de dez (expoente inteiro) como número comum: -2 -> "0.01", 2 -> "100"
// Posições (em log10) das marcações "menores" de um eixo log clássico —
// 2, 3, 4...9 dentro de cada década entre min e max — usadas para desenhar
// grades bem fracas nesses valores. Não são igualmente espaçadas em log10
// (por isso não dá pra usar um "interval" fixo: log10(2)=0.301, log10(3)=
// 0.477 etc), então cada posição é calculada explicitamente.
function gerarTicksMenores(min, max) {
    const ticks = [];
    for (let decada = Math.floor(min); decada < Math.ceil(max); decada++) {
        for (let m = 2; m <= 9; m++) {
            const v = decada + Math.log10(m);
            if (v > min && v < max) ticks.push(v);
        }
    }
    return ticks;
}

// Posições das potências de dez (1, 10, 100...) dentro de min e max — ficam
// de fora de gerarTicksMenores (que só cobre 2..9), mas sem elas não sobra
// nenhuma linha exatamente sobre os valores rotulados (1, 10, 100...) para
// conferir visualmente se um ponto calculado bate com o eixo
function gerarTicksDecada(min, max) {
    const ticks = [];
    for (let decada = Math.ceil(min); decada <= Math.floor(max); decada++) {
        ticks.push(decada);
    }
    return ticks;
}

function formatarPotenciaDez(expoente) {
    const exp = Math.round(expoente);
    // Ao dar zoom o ECharts força um tick extra exatamente no limite visível,
    // que raramente cai numa potência de dez "redonda". Sem essa checagem,
    // arredondar esse valor mostraria um rótulo enganoso (ex: "1000" grudado
    // na borda, perto da grade real de 1000) — em vez disso, não rotula.
    if (Math.abs(expoente - exp) > 1e-6) return '';
    return exp >= 0 ? String(10 ** exp) : (10 ** exp).toFixed(-exp);
}

// Função para criar gráfico (ECharts) — sem zoom/scroll nos eixos (removido a
// pedido: atrapalhava mais do que ajudava aqui). Os eixos são log-log, mas os
// dados são pré-convertidos para log10 e plotados num eixo type:'value' comum
// em vez de um eixo type:'log' nativo — não por causa do zoom (que nem existe
// mais), mas porque a grade de marcações menores (gerarTicksMenores/
// gerarTicksDecada, mais abaixo) já é calculada em espaço log10 uniforme,
// pensada para um eixo linear; os rótulos e o tooltip convertem de volta
// (10^valor) para mostrar os números reais.
// Largura (tela) a partir da qual a legenda do gráfico de curva vira lateral,
// e constantes do layout resultante — compartilhadas com
// ajustarLegendaToolboxImpressao51 (mais abaixo), que precisa das mesmas
// contas pra restaurar o grid/título certos depois de imprimir.
const LARGURA_MIN_LEGENDA_LATERAL_51 = 460;
const GRID_LEFT_51 = 60;
const GRID_RIGHT_NATURAL_51 = 30; // margem direita do gráfico em si, igual nos 2 modos
const GAP_LEGENDA_LATERAL_51 = 20;
const LARGURA_LEGENDA_LATERAL_51 = 150;

// Decide se a legenda fica lateral e, se sim, ALARGA o container pra caber a
// coluna da legenda ALÉM do tamanho natural do gráfico — em vez de espremer
// o gráfico pra caber a legenda dentro da largura de sempre (1ª versão desta
// ideia; o círculo/curva ficava visivelmente fora do centro, puxado pra
// esquerda pela margem direita bem maior que a esquerda). Assim o gráfico
// sempre tem o mesmo tamanho/proporção de quando não há legenda lateral, só
// squeeze ganha uma coluna extra do lado.
//
// container.dataset.maxWidthOriginal guarda o max-width do HTML (ex:
// "550px") na 1ª chamada, antes de qualquer alargamento — sem isso, alargar
// numa chamada e ler esse valor JÁ alargado como "tamanho natural" na
// próxima faria o container crescer sem parar a cada novo cálculo.
function ajustarLarguraContainer51(container) {
    if (container.dataset.maxWidthOriginal === undefined) {
        container.dataset.maxWidthOriginal = container.style.maxWidth || getComputedStyle(container).maxWidth;
    }
    container.style.maxWidth = container.dataset.maxWidthOriginal;
    const larguraNatural = container.offsetWidth;

    const lateral = larguraNatural >= LARGURA_MIN_LEGENDA_LATERAL_51;
    if (lateral) {
        container.style.maxWidth = (larguraNatural + GAP_LEGENDA_LATERAL_51 + LARGURA_LEGENDA_LATERAL_51) + 'px';
    }
    // container.offsetWidth de novo: se o pai (card/coluna) não tiver espaço
    // pro alargamento pedido, o navegador já limita sozinho (width:100% do
    // pai continua valendo) — containerWidth aqui reflete o que REALMENTE
    // coube, nunca estoura o layout da página.
    return { larguraNatural, containerWidth: container.offsetWidth, lateral };
}

// Config da legenda de tela (lateral ou embaixo) — função à parte (não só
// inline dentro de criarGrafico) porque ajustarLegendaToolboxImpressao51,
// mais abaixo, também precisa montar exatamente a mesma legenda ao restaurar
// o estado de tela depois de imprimir. Cada variante define TODAS as
// propriedades relevantes (itemWidth/itemHeight/itemGap/textStyle/padding),
// mesmo repetindo o padrão do ECharts — nunca conta com o setOption anterior
// (impressão, com valores diferentes) já ter deixado alguma pra trás: um
// setOption parcial faz merge, não reset, então uma propriedade omitida aqui
// ficaria com o que sobrou do estado anterior (impressão) em vez do padrão.
function legendOptionTela51(larguraNatural, lateral) {
    return lateral
        ? { type: 'scroll', orient: 'vertical', left: larguraNatural + GAP_LEGENDA_LATERAL_51, top: 'middle', itemWidth: 16, itemHeight: 10, itemGap: 8, textStyle: { fontSize: 9 }, pageIconSize: 9, padding: [4, 4] }
        : { type: 'scroll', orient: 'horizontal', top: 36, left: 'center', itemWidth: 25, itemHeight: 14, itemGap: 10, textStyle: { fontSize: 12 }, padding: [5, 5] };
}

// Largura "de projeto" do gráfico de curva NA IMPRESSÃO/PDF — fixa e
// independente da largura medida na tela (natural ou já alargada pra
// legenda lateral), pelo mesmo motivo já documentado em
// LARGURA_IMPRESSAO_FASORIAL_67/SEQ (calc_67_echarts.js/calc_seq_grafico.js):
// a largura de tela é só o tamanho da janela de quem calculou, sem relação
// com o papel. Menor que o natural de tela (550) a pedido; sempre com
// legenda lateral (mesma ideia da 67/seq: a impressão nunca herda a decisão
// lateral/embaixo tomada pra tela, decide sozinha).
const LARGURA_IMPRESSAO_NATURAL_51 = 400;

// Grid/título de uma largura "natural" (a do gráfico em si, tela ou
// impressão) + a largura REAL do container (pode ser maior, quando lateral e
// alargado pra caber a coluna da legenda) — usada pelas 3 chamadas que
// precisam montar esse trio (criarGrafico e os 2 ramos de
// ajustarLegendaToolboxImpressao51), sempre com a mesma conta.
function opcoesGridTitulo51(larguraNatural, containerWidthReal) {
    return {
        gridRight: (containerWidthReal - larguraNatural) + GRID_RIGHT_NATURAL_51,
        tituloLeft: (GRID_LEFT_51 + larguraNatural - GRID_RIGHT_NATURAL_51) / 2
    };
}

function criarGrafico(containerId, pontosCurva, pontoAtuacao = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { larguraNatural, containerWidth, lateral: usarLegendaLateral51 } = ajustarLarguraContainer51(container);

    // Altura responsiva (proporcional à largura NATURAL do gráfico, não à
    // largura total já alargada com a coluna da legenda — senão o alto
    // ficaria calculado como se o círculo fosse bem maior do que realmente
    // é) em vez de fixa — antes 800px, o que (a) cortava em monitores
    // comuns (a tela é quase sempre paisagem, sobra pouca altura de
    // viewport) e (b) numa tela de celular a largura encolhe mas a altura
    // continuava travada em 800px, deixando o gráfico espremido e
    // desproporcional. ×1.2 mantém a orientação vertical (mais alto que
    // largo) em qualquer largura; piso e teto evitam ficar baixo demais numa
    // tela minúscula ou alto demais.
    container.style.height = Math.max(380, Math.min(660, larguraNatural * 1.2)) + 'px';

    const dadosValidos = pontosCurva.correntes.map((corrente, i) => [
        Math.log10(pontoAtuacao ? corrente / pontoAtuacao.parametrosUsados.correntePartida : corrente),
        Math.log10(pontosCurva.tempos[i])
    ]).filter(([, logTempo]) => Number.isFinite(logTempo));

    // Continuação "não válida" da curva, sem o piso do tempo mínimo (cinza
    // claro) — mesmos pontos de corrente da curva válida, mas com o tempo
    // bruto da fórmula em vez do tempo já limitado pelo piso. Onde o piso
    // não corta nada (bruto >= tempo mínimo), os dois traços coincidem
    // exatamente e o vermelho (desenhado por cima, ver série abaixo) cobre o
    // cinza por completo; só aparece cinza visível na faixa em que o piso
    // "achata" a curva vermelha em uma reta.
    const dadosBrutos = (pontosCurva.temposBrutos || []).map((tempoBruto, i) => [
        Math.log10(pontoAtuacao ? pontosCurva.correntes[i] / pontoAtuacao.parametrosUsados.correntePartida : pontosCurva.correntes[i]),
        Math.log10(tempoBruto)
    ]).filter(([, logTempo]) => Number.isFinite(logTempo));

    // Só desenha (e só entra na legenda) quando de fato aparece na tela em
    // algum ponto — compara o tempo bruto com o já limitado pelo piso ponto
    // a ponto (não os valores de tempoFixoMinimo/faixa da curva, mais
    // simples e cobre os dois casos pedidos numa checagem só): tempo mínimo
    // nulo (bruto === piso sempre, por definição de Math.max) e tempo
    // mínimo menor que o piso natural da curva em toda a faixa plotada
    // (Math.max nunca escolhe o piso). Nos dois casos o traço cinza ficaria
    // 100% encoberto pelo vermelho, então nem vale a pena desenhar.
    const curvaSemTempoMinimoVisivel = (pontosCurva.temposBrutos || []).some((bruto, i) => {
        const piso = pontosCurva.tempos[i];
        return Number.isFinite(bruto) && Number.isFinite(piso) && Math.abs(bruto - piso) > 1e-9;
    });

    // Corrente/tempo fora da faixa de atuação da curva (ex: I/I0 abaixo do
    // pickup) resultam em tempoAtuacao = Infinity — log10 disso não é um
    // número finito, e um ponto/markLine assim não deve ser desenhado (o
    // ECharts não lida bem com coordenadas Infinity/NaN).
    const pontoValido = pontoAtuacao
        && Number.isFinite(Math.log10(pontoAtuacao.fatorCalculado))
        && Number.isFinite(Math.log10(pontoAtuacao.tempoAtuacao));

    // Limites dos eixos (em log10) — calculados a partir dos pontos de fato
    // desenhados (curva + ponto de atuação, quando válido), não fixos: uma
    // curva extremamente inversa com M pequeno (tempo bem alto perto do
    // pickup) ou um ponto de atuação fora da faixa usual de I/I0 ficavam
    // cortados fora da área visível.
    //
    // A margem é aditiva em log10 (não arredondada pra fora até a próxima
    // década inteira) — como o eixo já é log10 convertido pra escala linear
    // (ver comentário da função), uma margem fixa aqui tem SEMPRE o mesmo
    // tamanho visual, não importa se o extremo da curva cai perto do início
    // de uma década (onde as marcas 2,3,4... ficam bem espaçadas) ou perto
    // do fim (onde ficam espremidas). Arredondar pra fora até a década
    // inteira mais próxima (floor-1/ceil+1) dava uma folga inconsistente —
    // de pouco mais de 1 até quase 2 décadas, dependendo de onde o ponto
    // caía dentro da década — e visualmente parecia folga demais. 0.3
    // década ~ um pouco mais que 1 oitava (fator ×2).
    const MARGEM_EIXO_DECADAS = 0.3;
    const valoresX = dadosValidos.map(([x]) => x);
    const valoresY = dadosValidos.map(([, y]) => y);
    if (pontoValido) {
        valoresX.push(Math.log10(pontoAtuacao.fatorCalculado));
        valoresY.push(Math.log10(pontoAtuacao.tempoAtuacao));
    }
    // A curva não válida (cinza) também dimensiona os eixos, igual à curva
    // válida acima — senão a parte dela que se estende além do piso do tempo
    // mínimo ficaria cortada fora da área visível, sem cumprir o propósito
    // de mostrar a continuação. Só quando ela de fato aparece (ver
    // curvaSemTempoMinimoVisivel) — do contrário seus pontos são idênticos
    // aos de dadosValidos, já incluídos acima, então não mudaria nada mesmo
    // entrando.
    if (curvaSemTempoMinimoVisivel) {
        dadosBrutos.forEach(([x, y]) => { valoresX.push(x); valoresY.push(y); });
    }
    if (valoresX.length === 0) valoresX.push(0); // caso degenerado: nenhum ponto finito
    if (valoresY.length === 0) valoresY.push(0);
    const xMin = Math.min(...valoresX) - MARGEM_EIXO_DECADAS;
    const xMax = Math.max(...valoresX) + MARGEM_EIXO_DECADAS;
    const yMin = Math.min(...valoresY) - MARGEM_EIXO_DECADAS;
    const yMax = Math.max(...valoresY) + MARGEM_EIXO_DECADAS;

    // Grades bem fracas em 2,3,4...9 de cada década (x: 1-100, y: 0.01-10000),
    // imitando as marcações menores de um eixo log clássico. As da própria
    // década (1, 10, 100...) ficam um pouco mais visíveis que as demais —
    // são a única linha exatamente sobre um valor rotulado, útil para
    // conferir visualmente se um ponto calculado bate com o eixo
    const estiloDecada = { color: '#ccc' };
    const gradesMenores = [
        ...gerarTicksMenores(xMin, xMax).map(v => ({ xAxis: v })),
        ...gerarTicksMenores(yMin, yMax).map(v => ({ yAxis: v })),
        ...gerarTicksDecada(xMin, xMax).map(v => ({ xAxis: v, lineStyle: estiloDecada })),
        ...gerarTicksDecada(yMin, yMax).map(v => ({ yAxis: v, lineStyle: estiloDecada }))
    ];

    // Série "vazia" só para carregar o markLine. markLine sempre desenha por
    // cima de tudo na mesma zlevel, cortando a linha vermelha — por isso essa
    // série fica numa zlevel própria, abaixo (zlevel menor = camada de baixo)
    const series = [{
        name: 'GradeMenor',
        type: 'line',
        data: [],
        silent: true,
        zlevel: 0,
        markLine: {
            silent: true,
            // Com ~70 linhas individuais (menores + década), a animação ao
            // dar zoom faz cada uma interpolar da posição antiga até a nova —
            // no meio do caminho elas ficam temporariamente na diagonal
            // (e some coisa junto, como o nome do eixo). Sem animação, a
            // grade pula direto para a posição certa.
            animation: false,
            symbol: 'none',
            label: { show: false },
            tooltip: { show: false },
            lineStyle: { color: '#eee', type: 'solid', width: 1 },
            data: gradesMenores
        }
    },
    // Só entra no array quando de fato aparece (curvaSemTempoMinimoVisivel) —
    // tempo mínimo nulo ou irrelevante pra faixa plotada nem calcula/mostra
    // essa curva, nem na legenda. Mesma zlevel da curva válida, mas entra
    // ANTES dela no array — na mesma zlevel, quem entra depois é desenhado
    // por cima, então o vermelho sempre cobre o cinza onde os dois coincidem
    // (quando ambas aparecem).
    ...(curvaSemTempoMinimoVisivel ? [{
        name: 'Curva sem tempo mínimo',
        type: 'line',
        data: dadosBrutos,
        lineStyle: { color: '#ccc', width: 2, type: 'dotted' },
        itemStyle: { color: '#ccc' },
        symbol: 'none',
        smooth: false,
        zlevel: 1
    }] : []),
    {
        name: 'Curva de Proteção',
        type: 'line',
        data: dadosValidos,
        lineStyle: { color: '#e30613', width: 2 },
        itemStyle: { color: '#e30613' },
        symbol: 'none',
        smooth: false,
        zlevel: 1
    }];

    if (pontoValido) {
        const xPonto = Math.log10(pontoAtuacao.fatorCalculado);
        const yPonto = Math.log10(pontoAtuacao.tempoAtuacao);
        const corPonto = '#000000';
        const corLinha = '#495057'; // cinza escuro — só as linhas-guia e o rótulo, não o marcador

        series.push({
            name: 'Ponto de Atuação',
            // zlevel maior que o da curva (1) — camada de canvas própria, desenhada
            // por cima, garante que o "X" nunca fique parcialmente encoberto pela
            // linha vermelha passando exatamente por baixo dele
            zlevel: 2,
            type: 'scatter',
            data: [[xPonto, yPonto]],
            symbol: 'path://M -8 -8 L 8 8 M -8 8 L 8 -8',
            symbolSize: 16,
            itemStyle: { color: 'transparent', borderColor: corPonto, borderWidth: 3, borderCap: 'round' }
        });

        // Linhas-guia numa série própria, separada do marcador acima — assim
        // dá pra ocultar só a projeção (clicando nela na legenda) sem
        // esconder o ponto em si
        series.push({
            name: 'Projeção do Ponto',
            type: 'scatter',
            zlevel: 1,
            data: [[xPonto, yPonto]],
            symbol: 'none',
            markLine: {
                silent: true,
                animation: false,
                symbol: 'none',
                lineStyle: { color: corLinha, type: 'dashed', width: 1.5 },
                label: { show: false },
                data: [
                    [{ coord: [xPonto, yPonto] }, { coord: [xPonto, yMin] }],
                    [{ coord: [xPonto, yPonto] }, { coord: [xMin, yPonto] }]
                ]
            }
        });
    }

    // Ícones da legenda calcados no conteúdo real de cada série (mesma ideia
    // já usada na 87, js/calc_87_grafico.js) — o ícone padrão do ECharts pra
    // série 'line' sempre desenha uma bolinha no meio, mesmo com symbol:
    // 'none' na série (Curva de Proteção/Curva sem tempo mínimo não têm
    // marcador nenhum no traço real). "Projeção do Ponto" nem é uma linha de
    // verdade (é um markLine tracejado numa série scatter) — sem um ícone
    // customizado, a legenda mostraria só um círculo, sem relação com o
    // tracejado que ela realmente desenha. "Ponto de Atuação" fica de fora
    // deste mapa de propósito: seu símbolo já é o "X" customizado da própria
    // série, herdado automaticamente pela legenda sem precisar de ícone à
    // parte.
    const iconeLinha = 'path://M-10,-1.5L10,-1.5L10,1.5L-10,1.5Z'; // barra fina = linha sem marcador
    // 5 pontinhos (mais numerosos e menores que os 3 traços de "Projeção do
    // Ponto" abaixo) — combina com o type:'dotted' da linha real da curva
    // sem tempo mínimo, sem confundir com o tracejado da projeção.
    const iconePontilhado = 'path://M-9,-1L-7,-1L-7,1L-9,1Z M-5,-1L-3,-1L-3,1L-5,1Z M-1,-1L1,-1L1,1L-1,1Z M3,-1L5,-1L5,1L3,1Z M7,-1L9,-1L9,1L7,1Z';
    const ICONES_LEGENDA = {
        'Curva de Proteção': { icon: iconeLinha, itemStyle: { color: '#e30613' } },
        'Curva sem tempo mínimo': { icon: iconePontilhado, itemStyle: { color: '#ccc' } },
        // 3 barrinhas PREENCHIDAS (mesma técnica de retângulo fechado do
        // iconeLinha acima, só que 3 vezes com vãos) em vez de contorno
        // tracejado sobre um traço de área zero — este saía sólido na
        // prática (o preenchimento por área é o que realmente funciona no
        // ícone da legenda do ECharts, testado visualmente).
        'Projeção do Ponto': { icon: 'path://M-10,-1.5L-5,-1.5L-5,1.5L-10,1.5Z M-2.5,-1.5L2.5,-1.5L2.5,1.5L-2.5,1.5Z M5,-1.5L10,-1.5L10,1.5L5,1.5Z', itemStyle: { color: '#495057' } }
    };
    const nomesSeries = series.filter(s => s.name !== 'GradeMenor').map(s => s.name);
    // "Curva sem tempo mínimo" sempre por último na legenda — só a posição
    // visual do item, não interfere na ordem de sobreposição no gráfico
    // (essa é definida pela ordem em `series`/zlevel, não pela legenda).
    const dadosLegenda = [
        ...nomesSeries.filter(nome => nome !== 'Curva sem tempo mínimo'),
        ...nomesSeries.filter(nome => nome === 'Curva sem tempo mínimo')
    ].map(nome => ICONES_LEGENDA[nome] ? { name: nome, ...ICONES_LEGENDA[nome] } : nome);

    // Legenda lateral (coluna vertical à direita do gráfico) em vez de no
    // topo, quando o container é largo o bastante — mesma ideia já usada nos
    // fasoriais da 67/Componentes Simétricas, mas posicionada por `left`
    // (logo depois do fim natural do gráfico + um respiro pequeno,
    // GAP_LEGENDA_LATERAL_51) em vez de `right` (rente à borda do
    // container): como o container já foi alargado especificamente pra
    // caber essa coluna (ajustarLarguraContainer51, topo do arquivo), ancorar
    // pela borda direita funcionaria igual na prática, mas ancorar pelo fim
    // do gráfico deixa a intenção clara mesmo se o container não alargar
    // totalmente (ex: pai sem espaço de sobra) — a legenda sempre cola
    // imediatamente após o círculo, nunca flutua solta longe dele.
    const legendOption51 = legendOptionTela51(larguraNatural, usarLegendaLateral51);
    const gridTop51 = usarLegendaLateral51 ? 45 : 70;
    // Centraliza o título sobre o gráfico em si (largura NATURAL), nunca
    // sobre o container inteiro (que pode incluir a coluna da legenda) —
    // title.left:'center' (padrão do ECharts) centralizaria contra o
    // container inteiro, puxando o título visivelmente pra direita do
    // centro real do gráfico quando há legenda lateral.
    const { gridRight: gridRight51, tituloLeft: tituloLeft51 } = opcoesGridTitulo51(larguraNatural, containerWidth);

    // Reaproveita a instância existente no container, se houver
    const chart = echarts.getInstanceByDom(container) || echarts.init(container);

    chart.setOption({
        title: {
            text: 'Curva Característica de Proteção',
            top: 8,
            left: tituloLeft51,
            textAlign: 'center',
            textStyle: { fontSize: 16, fontWeight: 'bold' }
        },
        tooltip: {
            trigger: 'item',
            formatter: params => `${params.seriesName}<br/>I/I<sub>0</sub>: ${(10 ** params.value[0]).toFixed(3)}<br/>Tempo: ${(10 ** params.value[1]).toFixed(3)} s`
        },
        // Título, legenda e toolbox cada um em sua própria linha, para nunca
        // sobrepor uns aos outros em telas estreitas
        legend: {
            ...legendOption51,
            data: dadosLegenda
        },
        // Margens em pixels (não %) para a área do gráfico ficar de fato mais
        // alta que larga — em % elas cresceriam junto com a altura do
        // container e a área plotada continuaria quase quadrada
        grid: {
            left: GRID_LEFT_51,
            right: gridRight51,
            top: gridTop51,
            bottom: 55,
            containLabel: true,
            // Borda nos 4 lados da área plotada — sem isto só ficam visíveis
            // as linhas dos próprios eixos (embaixo e à esquerda), dando a
            // impressão de uma borda parcial. Mesma cor das grades de década
            // (estiloDecada), pra parecer uma extensão da própria grade em
            // vez de um elemento novo destoante.
            show: true,
            borderColor: '#ccc',
            borderWidth: 1
        },
        xAxis: {
            type: 'value',
            name: 'I/I₀',
            nameLocation: 'middle',
            nameGap: 30,
            // Sem "color" explícito, herda o cinza padrão do tema do
            // ECharts (o mesmo dos números do eixo) — bem mais claro que o
            // resto do texto do site, pedido pra escurecer
            nameTextStyle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
            // Começa um pouco antes de 1 (10^-0.2 ≈ 0.63), só para dar um
            // respiro antes da curva. Sem "interval" fixo aqui de propósito:
            // com esse mínimo fora de uma potência de dez, um interval fixo
            // desalinharia todos os ticks das potências de dez (1, 10, 100).
            // Deixando automático, o ECharts sempre inclui 0/1/2 no conjunto
            // de ticks, e o formatador oculta os ticks "extras" que sobram.
            min: xMin,
            max: xMax,
            // Sem isso, o eixo tipo 'value' gruda a linha do eixo X onde Y=0
            // (Tempo=1s) em vez de na base do gráfico, destacando essa grade
            // Cor igual à borda do grid (borderColor) — por padrão o ECharts
            // desenha a linha do eixo mais escura que isso, e como X fica
            // embaixo e Y fica à esquerda (posição padrão), só esses 2 lados
            // ficavam com uma linha dupla/mais escura sobre a borda, enquanto
            // topo e direita (só a borda do grid, sem linha de eixo) ficavam
            // mais claros — dava a impressão de borda desigual nos 4 lados.
            axisLine: { onZero: false, lineStyle: { color: '#ccc' } },
            // As marquinhas nativas do eixo coincidiriam com as grades
            // menores (markLine da série "GradeMenor", que já marcam a
            // régua toda) — desativadas pra não duplicar
            axisTick: { show: false },
            axisLabel: { formatter: formatarPotenciaDez },
            // Grade tracejada nativa desativada a pedido — só ficam as
            // grades menores (markLine da série "GradeMenor")
            splitLine: { show: false }
        },
        yAxis: {
            type: 'value',
            name: 'Tempo (s)',
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
            // Sem "interval" fixo aqui de propósito (mesmo caso do eixo X):
            // ao dar zoom, o ECharts recalcula os ticks a partir do novo
            // limite visível (raramente redondo) e soma o interval dali —
            // nenhum bate mais numa potência de dez, e o formatador esconde
            // todos. Automático, o ECharts sempre inclui os valores inteiros
            // no conjunto de ticks disponíveis, mesmo com zoom aplicado.
            min: yMin,
            max: yMax,
            // Cor igual à borda do grid (borderColor) — por padrão o ECharts
            // desenha a linha do eixo mais escura que isso, e como X fica
            // embaixo e Y fica à esquerda (posição padrão), só esses 2 lados
            // ficavam com uma linha dupla/mais escura sobre a borda, enquanto
            // topo e direita (só a borda do grid, sem linha de eixo) ficavam
            // mais claros — dava a impressão de borda desigual nos 4 lados.
            axisLine: { onZero: false, lineStyle: { color: '#ccc' } },
            // As marquinhas nativas do eixo coincidiriam com as grades
            // menores (markLine da série "GradeMenor", que já marcam a
            // régua toda) — desativadas pra não duplicar
            axisTick: { show: false },
            axisLabel: { formatter: formatarPotenciaDez },
            // Grade tracejada nativa desativada a pedido — só ficam as
            // grades menores (markLine da série "GradeMenor")
            splitLine: { show: false }
        },
        // Zoom/scroll nos eixos removido a pedido (atrapalhava mais do que
        // ajudava) — toolbox removido junto (só tinha o ícone de "salvar
        // como imagem", também a pedido). Sem dataZoom, os eixos são sempre
        // a faixa inteira calculada (xMin/xMax/yMin/yMax), então as
        // linhas-guia da "Projeção do Ponto" (mais abaixo, no push da
        // série) já terminam direto nessas bordas, sem precisar recalcular
        // em nenhum evento.
        series
    }, true);

    // Reaproveita a mesma instância entre recálculos (getInstanceByDom acima)
    // — registra o listener de resize só na primeira vez, senão cada novo
    // cálculo acumularia mais um listener chamando .resize() na mesma instância
    if (!container.dataset.resizeListenerRegistrado) {
        container.dataset.resizeListenerRegistrado = '1';
        window.addEventListener('resize', () => chart.resize());
    }
}

// Impressão: gráfico menor (LARGURA_IMPRESSAO_NATURAL_51, independente do
// tamanho de tela) e legenda lateral — igual à tela, e sempre lateral (nunca
// herda a decisão embaixo/lateral tomada pra tela, mesma ideia de
// LARGURA_IMPRESSAO_FASORIAL_67/SEQ). type:'plain' em vez de 'scroll' (que
// paginaria com setas "◀ 1/2 ▶" clicáveis — no papel esconderia itens sem
// jeito de ver a página seguinte, mesmo cuidado já tomado pra impressão da
// Componentes Simétricas, calc_seq_grafico.js) — na prática os 4 itens
// sempre cabem numa coluna vertical só, mas o type certo evita qualquer
// risco se a lista crescer no futuro. O toolbox já foi removido de vez do
// gráfico, não só da impressão — não precisa mais ser alternado aqui. A
// barra de zoom em si já é tratada à parte por alternarBarrasZoomImpressao
// (main.js, sem efeito aqui desde que o dataZoom foi removido). Chamada do
// clique em "Gerar PDF" (antes do print) e do evento afterprint (restaura o
// estado interativo normal da tela) — nunca do beforeprint, mesmo motivo já
// documentado em main.js: setOption ali corrompe o snapshot de impressão.
function ajustarLegendaToolboxImpressao51(paraImpressao) {
    const container = document.getElementById('grafico-curva');
    const chart = echarts.getInstanceByDom(container);
    if (!chart || !container) return;

    // O ECharts só faz merge de propriedades entre chamadas de setOption
    // quando o "type"/"orient" do componente não muda — mudar legend.type
    // ('scroll' <-> 'plain') ou orient faz tratar como um componente novo,
    // descartando "data" (os ícones customizados) em vez de herdá-lo.
    // Captura o data ATUAL antes de trocar essas propriedades, pra reenviar
    // explicitamente nos dois ramos abaixo (testado: sem isso, a legenda
    // ficava sem nenhum item).
    const dadosLegendaAtual = chart.getOption().legend[0].data;

    if (paraImpressao) {
        if (container.dataset.maxWidthOriginal === undefined) {
            container.dataset.maxWidthOriginal = container.style.maxWidth || getComputedStyle(container).maxWidth;
        }
        container.style.maxWidth = (LARGURA_IMPRESSAO_NATURAL_51 + GAP_LEGENDA_LATERAL_51 + LARGURA_LEGENDA_LATERAL_51) + 'px';
        const containerWidth = container.offsetWidth;
        const { gridRight, tituloLeft } = opcoesGridTitulo51(LARGURA_IMPRESSAO_NATURAL_51, containerWidth);

        chart.setOption({
            legend: {
                show: true,
                ...legendOptionTela51(LARGURA_IMPRESSAO_NATURAL_51, true),
                type: 'plain',
                data: dadosLegendaAtual
            },
            title: { left: tituloLeft, textAlign: 'center' },
            grid: { top: 45, right: gridRight, bottom: 55 }
        });
        // O container mudou de tamanho (acima) mas o CANVAS do ECharts
        // continua com a resolução antiga (a da tela) até algo pedir pra
        // remedir — setOption sozinho não faz isso. Sem o resize(), a nova
        // margem valeria contra a largura antiga, e o gráfico "esticaria"
        // visualmente pro espaço sobrando, cortado só pela borda de verdade
        // do container na hora de imprimir de fato. Aqui é seguro chamar
        // (dispara no clique de "Gerar PDF", nunca no beforeprint — mesma
        // regra de sempre).
        chart.resize();
    } else {
        // Restaura o estado de tela recalculando do zero pela mesma função
        // de criarGrafico — inclusive realarga o container se a legenda
        // lateral estiver ativa (a impressão, acima, sempre usa seu próprio
        // tamanho fixo, nunca o de tela).
        const { larguraNatural, containerWidth, lateral } = ajustarLarguraContainer51(container);
        const { gridRight, tituloLeft } = opcoesGridTitulo51(larguraNatural, containerWidth);
        chart.setOption({
            legend: { show: true, ...legendOptionTela51(larguraNatural, lateral), data: dadosLegendaAtual },
            title: { left: tituloLeft, textAlign: 'center' },
            grid: { top: lateral ? 45 : 70, right: gridRight, bottom: 55 }
        });
        // Mesmo motivo do resize() no ramo de impressão, acima, só que
        // devolvendo o canvas pro tamanho de tela (que pode ter alargado).
        chart.resize();
    }
}

// Exporta as funções para uso global
window.calcularFuncao51 = calcularFuncao51;
window.criarGrafico = criarGrafico;
window.formatarEquacaoHTML = formatarEquacaoHTML;
window.ajustarLegendaToolboxImpressao51 = ajustarLegendaToolboxImpressao51;
