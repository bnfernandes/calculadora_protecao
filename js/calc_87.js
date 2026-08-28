// calc_87.js - Calculadora de Proteção Diferencial (Função 87)
// Versão FINAL Corrigida - Indexação [Fase][Dev] como no VBA
// Funções de exibição e gráfico estão em calc_87_eq.js e calc_87_grafico.js

// Classe para números complexos (mantida para compatibilidade)
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
        return Math.atan2(this.imag, this.real) * 180 / Math.PI;
    }
}

// Lê os campos comuns do formulário (config + enrolamentos), usados tanto pelo
// cálculo a partir das correntes de falta quanto pelo gerador de pontos de teste
function lerFormulario87() {
    const config = {
        modeloRele: parseInt(document.getElementById('modeloRele').value),
        numEnrolamentos: parseInt(document.getElementById('numEnrolamentos').value),
        enrolRef: parseInt(document.getElementById('enrolRef').value),
        seqFases: document.getElementById('sequenciaFases').value,
        potencia: parseFloat(document.getElementById('potencia').value) || 0,
        sensibilidade: parseFloat(document.getElementById('sensibilidade').value) || 0.3,
        pontoInflexao1: parseFloat(document.getElementById('pontoInflexao1').value) || 1.5,
        pontoInflexao2: parseFloat(document.getElementById('pontoInflexao2').value) || 5.0,
        inclinacao1: parseFloat(document.getElementById('inclinacao1').value) || 25,
        inclinacao2: parseFloat(document.getElementById('inclinacao2').value) || 50
    };

    const enrolamentos = [
        {
            nome: 'Enrolamento 1',
            rtc: parseFloat(document.getElementById('rtc1').value),
            kv: parseFloat(document.getElementById('kv1').value),
            conexao: document.getElementById('conexao1').value,
            tap: parseFloat(document.getElementById('tap1').value),
            eTap: parseFloat(document.getElementById('tap1').value),
            polaridade: document.getElementById('polaridade1').value,
            filtro: document.getElementById('filtroHom1').value,
            codHorario: 0,
            correntes: [
                { mag: parseFloat(document.getElementById('ia1Mag').value) || 0, ang: parseFloat(document.getElementById('ia1Ang').value) || 0 },
                { mag: parseFloat(document.getElementById('ib1Mag').value) || 0, ang: parseFloat(document.getElementById('ib1Ang').value) || 0 },
                { mag: parseFloat(document.getElementById('ic1Mag').value) || 0, ang: parseFloat(document.getElementById('ic1Ang').value) || 0 }
            ]
        },
        {
            nome: 'Enrolamento 2',
            rtc: parseFloat(document.getElementById('rtc2').value),
            kv: parseFloat(document.getElementById('kv2').value),
            conexao: document.getElementById('conexao2').value,
            tap: parseFloat(document.getElementById('tap2').value),
            eTap: parseFloat(document.getElementById('tap2').value),
            polaridade: document.getElementById('polaridade2').value,
            filtro: document.getElementById('filtroHom2').value,
            codHorario: parseInt(document.getElementById('codHor2').value) || 0,
            correntes: [
                { mag: parseFloat(document.getElementById('ia2Mag').value) || 0, ang: parseFloat(document.getElementById('ia2Ang').value) || 0 },
                { mag: parseFloat(document.getElementById('ib2Mag').value) || 0, ang: parseFloat(document.getElementById('ib2Ang').value) || 0 },
                { mag: parseFloat(document.getElementById('ic2Mag').value) || 0, ang: parseFloat(document.getElementById('ic2Ang').value) || 0 }
            ]
        },
        {
            nome: 'Enrolamento 3',
            rtc: parseFloat(document.getElementById('rtc3').value) || 1,
            kv: parseFloat(document.getElementById('kv3').value) || 1,
            conexao: document.getElementById('conexao3').value,
            tap: parseFloat(document.getElementById('tap3').value) || 1,
            eTap: parseFloat(document.getElementById('tap3').value) || 1,
            polaridade: document.getElementById('polaridade3').value,
            filtro: document.getElementById('filtroHom3').value,
            codHorario: parseInt(document.getElementById('codHor3').value) || 0,
            correntes: [
                { mag: parseFloat(document.getElementById('ia3Mag').value) || 0, ang: parseFloat(document.getElementById('ia3Ang').value) || 0 },
                { mag: parseFloat(document.getElementById('ib3Mag').value) || 0, ang: parseFloat(document.getElementById('ib3Ang').value) || 0 },
                { mag: parseFloat(document.getElementById('ic3Mag').value) || 0, ang: parseFloat(document.getElementById('ic3Ang').value) || 0 }
            ]
        }
    ];

    if (config.numEnrolamentos === 2) {
        enrolamentos[2].correntes = [
            { mag: 0, ang: 0 },
            { mag: 0, ang: 0 },
            { mag: 0, ang: 0 }
        ];
    }

    return { config, enrolamentos };
}

// Função principal de cálculo
function calcularDiferencial87() {
    const { config, enrolamentos } = lerFormulario87();

    // CORREÇÃO CRÍTICA: Usar indexação [Fase][Dev] como no VBA
    // VBA: Dim I_a(3, 3) '(Fase, Dev)
    
    // Passo 1: Converter para retangular e aplicar polaridade (Real_Imag do VBA)
    const I_a = [[], [], []];    // [Fase][Dev]
    const I_jb = [[], [], []];   // [Fase][Dev]
    
    for (let faseIdx = 0; faseIdx < 3; faseIdx++) {
        for (let devIdx = 0; devIdx < 3; devIdx++) {
            let angulo = enrolamentos[devIdx].correntes[faseIdx].ang;
            const magnitude = enrolamentos[devIdx].correntes[faseIdx].mag;
            
            // Aplicar polaridade
            if (enrolamentos[devIdx].polaridade === 'Saliente') {
                angulo += 180;
            }
            
            const anguloRad = angulo * Math.PI / 180;
            I_a[faseIdx][devIdx] = magnitude * Math.cos(anguloRad);
            I_jb[faseIdx][devIdx] = magnitude * Math.sin(anguloRad);
        }
    }

    // Passo 2: Filtro homopolar (Filtro_Homopolar do VBA)
    const Ih_a = [[], [], []];   // [Fase][Dev]
    const Ih_jb = [[], [], []];  // [Fase][Dev]

    // Registra, por enrolamento com filtro ativo, a sequência zero calculada e o
    // antes/depois de cada fase — só assim dá pra explicar na tela por que, com
    // as 3 correntes em fase (sequência zero pura), o filtro zera tudo: a
    // corrente "antes" some no cálculo se só o resultado final for mostrado.
    const filtroHomopolarInfo = [];

    for (let devIdx = 0; devIdx < 3; devIdx++) {
        if (enrolamentos[devIdx].filtro === 'Ativo') {
            // Calcular componente de sequência zero
            let somaReal = 0;
            let somaImag = 0;
            for (let faseIdx = 0; faseIdx < 3; faseIdx++) {
                somaReal += I_a[faseIdx][devIdx];
                somaImag += I_jb[faseIdx][devIdx];
            }
            const i0Real = somaReal / 3;
            const i0Imag = somaImag / 3;

            // Subtrair sequência zero de cada fase
            const fases = [];
            for (let faseIdx = 0; faseIdx < 3; faseIdx++) {
                Ih_a[faseIdx][devIdx] = I_a[faseIdx][devIdx] - i0Real;
                Ih_jb[faseIdx][devIdx] = I_jb[faseIdx][devIdx] - i0Imag;

                fases.push({
                    letra: ['a', 'b', 'c'][faseIdx],
                    antesMag: Math.sqrt(I_a[faseIdx][devIdx] ** 2 + I_jb[faseIdx][devIdx] ** 2),
                    antesAng: Math.atan2(I_jb[faseIdx][devIdx], I_a[faseIdx][devIdx]) * 180 / Math.PI,
                    depoisMag: Math.sqrt(Ih_a[faseIdx][devIdx] ** 2 + Ih_jb[faseIdx][devIdx] ** 2),
                    depoisAng: Math.atan2(Ih_jb[faseIdx][devIdx], Ih_a[faseIdx][devIdx]) * 180 / Math.PI
                });
            }

            filtroHomopolarInfo.push({
                dev: devIdx,
                i0Mag: Math.sqrt(i0Real ** 2 + i0Imag ** 2),
                i0Ang: Math.atan2(i0Imag, i0Real) * 180 / Math.PI,
                fases
            });
        } else {
            // Sem filtro, copiar valores originais
            for (let faseIdx = 0; faseIdx < 3; faseIdx++) {
                Ih_a[faseIdx][devIdx] = I_a[faseIdx][devIdx];
                Ih_jb[faseIdx][devIdx] = I_jb[faseIdx][devIdx];
            }
        }
    }

    // Passo 3: Atribuição (Atribuicao do VBA)
    const Im_a = Ih_a.map(fase => [...fase]);
    const Im_jb = Ih_jb.map(fase => [...fase]);

    // Passo 4: Calcular TAP (TD_Tap do VBA)
    const taps = calcularTaps(enrolamentos, config);

    // Passo 5: Calcular constante C (TD_C do VBA)
    const constantesC = calcularConstantesC(enrolamentos, config);

    // Passo 6: Calcular códigos horários relativos
    const codigos = calcularCodigosHorarios(enrolamentos, config);
    const cod = codigosPorDev(codigos, config);

    // Passo 7: Aplicar giro para IDIF (Giro do VBA)
    const If_a_dif = [[], [], []];   // [Fase][Dev]
    const If_jb_dif = [[], [], []];  // [Fase][Dev]
    aplicarGiro_VBA(Im_a, Im_jb, If_a_dif, If_jb_dif, codigos, config);

    // Passo 8: Calcular corrente diferencial
    const resultadosDif = calcularDiferencial_VBA(If_a_dif, If_jb_dif, taps, constantesC, enrolamentos, config, Im_a, Im_jb, cod);

    // Passo 9: Recalcular sem filtro para Ifren (Mod_Im do VBA)
    const Im_a_SF = I_a.map(fase => [...fase]);
    const Im_jb_SF = I_jb.map(fase => [...fase]);

    // Passo 10: Aplicar giro para IFREN (sem filtro)
    const If_a_fren = [[], [], []];   // [Fase][Dev]
    const If_jb_fren = [[], [], []];  // [Fase][Dev]
    aplicarGiro_VBA(Im_a_SF, Im_jb_SF, If_a_fren, If_jb_fren, codigos, config);

    // Passo 11: Calcular corrente de frenagem
    const resultadosFren = calcularFrenagem_VBA(If_a_fren, If_jb_fren, taps, constantesC, enrolamentos, config, Im_a_SF, Im_jb_SF, cod);

    // Combinar resultados e indicar atuação por fase (Indica_Falta do VBA)
    const resultados = {
        faseA: { idif: resultadosDif.faseA.valor, ifren: resultadosFren.faseA.valor, dif: resultadosDif.faseA, fren: resultadosFren.faseA },
        faseB: { idif: resultadosDif.faseB.valor, ifren: resultadosFren.faseB.valor, dif: resultadosDif.faseB, fren: resultadosFren.faseB },
        faseC: { idif: resultadosDif.faseC.valor, ifren: resultadosFren.faseC.valor, dif: resultadosDif.faseC, fren: resultadosFren.faseC }
    };
    for (const fase of Object.values(resultados)) {
        fase.atua = fase.idif >= curvaOperacaoY(fase.ifren, config);
    }

    // Exibir resultados (função em calc_87_eq.js)
    exibirResultados(config, enrolamentos, taps, constantesC, resultados, filtroHomopolarInfo);

    // Criar gráfico (função em calc_87_grafico.js)
    criarGraficoDiferencial(resultados, config);
}

// Calcula o TAP de cada enrolamento (TD_Tap do VBA)
function calcularTaps(enrolamentos, config) {
    return enrolamentos.map(enrol => config.potencia === 0
        ? enrol.eTap
        : (config.potencia * 1000) / (enrol.rtc * enrol.kv * Math.sqrt(3)));
}

// Altura (Idif) da curva característica em um dado Ifren (Indica_Falta do VBA)
// Três trechos: patamar de sensibilidade, inclinação 1, inclinação 2
function curvaOperacaoY(ifren, config) {
    const sens = config.sensibilidade;
    const p1 = config.pontoInflexao1;
    const p2 = config.pontoInflexao2;
    const alfa1 = config.inclinacao1 / 100;
    const alfa2 = config.inclinacao2 / 100;

    if (ifren <= p1) return sens;
    if (ifren <= p2) return sens + alfa1 * (ifren - p1);
    return sens + alfa1 * (p2 - p1) + alfa2 * (ifren - p2);
}

// Limites dos eixos (Ifren x Idif) dos três gráficos da curva característica
// (calc_87_grafico.js e calc_87_pontos_teste.js). A borda direita usa como
// referência o fim do Trecho 3 (Inclinação 2) com a mesma largura do Trecho 2
// (Inflexão2 - Inflexão1), repetida a partir da Inflexão 2 — dá pra enxergar os
// três trechos sem desperdiçar área de plotagem com uma cauda arbitrariamente
// longa — arredondada para baixo + 2 xTAP de folga. `pontosExtras` (pares
// [ifren, idif] já plotados — correntes de falta, ponto de teste, pontos da
// lista/Ponto D) esticam essa borda além do fim natural quando algum ponto cai
// fora dele. A curva/área de trip é sempre recalculada até essa borda (nunca
// só até o fim "natural") — curvaOperacaoY já extrapola o trecho 3 (reta) pra
// qualquer Ifren, então isso não deixa faixa em branco sem curva/vermelho entre
// o fim do trecho e a margem. Sem margem à esquerda (min sempre 0 — corrente de
// frenagem/diferencial negativa não faz sentido).
function calcularLimitesCurva87(config, pontosExtras) {
    const p1 = config.pontoInflexao1;
    const p2 = config.pontoInflexao2;

    let ifrenNatural = 2 * p2 - p1;
    (pontosExtras || []).forEach(function(pt) {
        if (pt[0] > ifrenNatural) ifrenNatural = pt[0];
    });

    const xMax = Math.floor(ifrenNatural) + 2;

    let idifFinal = curvaOperacaoY(xMax, config);
    (pontosExtras || []).forEach(function(pt) {
        if (pt[1] > idifFinal) idifFinal = pt[1];
    });

    return {
        ifrenFinal: xMax,
        xMax: xMax,
        yMax: Math.floor(idifFinal) + 2
    };
}

// Função para calcular as constantes C
// A tabela exaustiva do VBA (todas as combinações Y/D/Z x enrolamento de referência)
// se reduz a uma regra única: o fator 1/√3 aparece exatamente quando a conexão do
// enrolamento e a do enrolamento de referência diferem em relação à conexão Y
// (uma delas é Y e a outra não) — Z se comporta como D para esse propósito.
// Regra validada linha a linha contra as ~150 combinações da planilha VBA.
function calcularConstantesC(enrolamentos, config) {
    const numEnrol = config.numEnrolamentos;
    const ref = config.enrolRef - 1;
    const sqrt3 = Math.sqrt(3);
    const conexaoRef = enrolamentos[ref].conexao;

    const C = [1, 1, 1];
    for (let dev = 0; dev < numEnrol; dev++) {
        if (dev === ref) continue;
        const mesmoGrupo = (enrolamentos[dev].conexao === 'Y') === (conexaoRef === 'Y');
        C[dev] = mesmoGrupo ? 1 : 1 / sqrt3;
    }
    return C;
}

// Função para calcular códigos horários relativos
function calcularCodigosHorarios(enrolamentos, config) {
    const codigos = {
        codigo2: enrolamentos[1].codHorario,
        codigo3: enrolamentos[2].codHorario,
        codigo12: 0,
        codigo13: 0,
        codigo23: 0,
        codigo32: 0
    };

    // Ajustar para sequência ACB
    if (config.seqFases === 'ACB') {
        codigos.codigo2 = 12 - enrolamentos[1].codHorario;
        codigos.codigo3 = 12 - enrolamentos[2].codHorario;
    }

    // Calcular códigos relativos
    codigos.codigo13 = 12 - codigos.codigo3;
    codigos.codigo12 = 12 - codigos.codigo2;

    codigos.codigo23 = codigos.codigo2 - codigos.codigo3;
    if (codigos.codigo23 < 0) codigos.codigo23 += 12;

    codigos.codigo32 = codigos.codigo3 - codigos.codigo2;
    if (codigos.codigo32 < 0) codigos.codigo32 += 12;

    return codigos;
}

// Código horário aplicado a cada enrolamento (0 = mantém, sem giro) — depende
// só de numEnrolamentos/enrolRef, então é a mesma tabela usada pelo Giro do VBA
// (Mantem(dev) é idêntico a Modif(dev, 0), por isso não precisa de função própria)
function codigosPorDev(codigos, config) {
    const numEnrol = config.numEnrolamentos;
    const devRef = config.enrolRef;
    const cod = [0, 0, 0];

    if (numEnrol === 2) {
        if (devRef === 1) cod[1] = codigos.codigo2;
        else if (devRef === 2) cod[0] = codigos.codigo12;
    } else if (numEnrol === 3) {
        if (devRef === 1) {
            cod[1] = codigos.codigo2;
            cod[2] = codigos.codigo3;
        } else if (devRef === 2) {
            cod[0] = codigos.codigo12;
            cod[2] = codigos.codigo32;
        } else if (devRef === 3) {
            cod[0] = codigos.codigo13;
            cod[1] = codigos.codigo23;
        }
    }
    return cod;
}

// Função para aplicar giro (Giro + Modif do VBA)
function aplicarGiro_VBA(Im_a, Im_jb, If_a, If_jb, codigos, config) {
    const cod = codigosPorDev(codigos, config);
    for (let dev = 0; dev < config.numEnrolamentos; dev++) {
        modif(Im_a, Im_jb, If_a, If_jb, dev, cod[dev]);
    }
}

// Para uma fase-alvo (0=A,1=B,2=C) e um código horário, indica como a corrente
// usada nas fórmulas de Idif/Ifren se relaciona com as 3 fases originais do
// enrolamento: é a própria fase (identity), a negativa de outra fase (neg), ou
// a diferença entre duas outras fases (diff) — essa última é a "compensação
// angular" citada no VBA (Modif), equivalente à soma de uma fase com a
// negativa de outra.
function giroInfo(codigo, faseAlvo) {
    codigo = codigo % 12;
    const prox = (faseAlvo + 1) % 3;
    const ant = (faseAlvo + 2) % 3;

    switch (codigo) {
        case 0: case 12: return { tipo: 'identity', src1: faseAlvo };
        case 1: return { tipo: 'diff', src1: faseAlvo, src2: prox };
        case 2: return { tipo: 'neg', src1: prox };
        case 3: return { tipo: 'diff', src1: ant, src2: prox };
        case 4: return { tipo: 'identity', src1: ant };
        case 5: return { tipo: 'diff', src1: ant, src2: faseAlvo };
        case 6: return { tipo: 'neg', src1: faseAlvo };
        case 7: return { tipo: 'diff', src1: prox, src2: faseAlvo };
        case 8: return { tipo: 'identity', src1: prox };
        case 9: return { tipo: 'diff', src1: prox, src2: ant };
        case 10: return { tipo: 'neg', src1: ant };
        case 11: return { tipo: 'diff', src1: faseAlvo, src2: ant };
    }
}

// Monta a descrição da compensação por código horário para um termo (dev,
// fase-alvo), com magnitude/ângulo das fases originais já substituídos —
// null quando não há compensação (código 0, corrente própria da fase)
function descreverGiro(Im_a, Im_jb, dev, codigo, faseAlvo) {
    const info = giroInfo(codigo, faseAlvo);
    if (info.tipo === 'identity') return null;

    const letras = ['a', 'b', 'c'];
    function fasor(idxFase) {
        const a = Im_a[idxFase][dev];
        const b = Im_jb[idxFase][dev];
        return { letra: letras[idxFase], mag: Math.sqrt(a * a + b * b), ang: Math.atan2(b, a) * 180 / Math.PI };
    }

    if (info.tipo === 'neg') {
        return { tipo: 'neg', fonte1: fasor(info.src1) };
    }
    return { tipo: 'diff', fonte1: fasor(info.src1), fonte2: fasor(info.src2) };
}

// Função Modif (do VBA) - Implementação completa dos 12 códigos horários
// Indexação: [Fase][Dev]
function modif(Im_a, Im_jb, If_a, If_jb, dev, codigo) {
    // Normalizar código para 0-11
    codigo = codigo % 12;
    
    // Ler correntes do enrolamento dev (3 fases)
    const a1 = Im_a[0][dev];  // Fase A
    const a2 = Im_a[1][dev];  // Fase B
    const a3 = Im_a[2][dev];  // Fase C
    const b1 = Im_jb[0][dev];
    const b2 = Im_jb[1][dev];
    const b3 = Im_jb[2][dev];

    switch(codigo) {
        case 0:
        case 12:
            If_a[0][dev] = a1;
            If_a[1][dev] = a2;
            If_a[2][dev] = a3;
            If_jb[0][dev] = b1;
            If_jb[1][dev] = b2;
            If_jb[2][dev] = b3;
            break;
            
        case 1:
            If_a[0][dev] = a1 - a2;
            If_a[1][dev] = a2 - a3;
            If_a[2][dev] = a3 - a1;
            If_jb[0][dev] = b1 - b2;
            If_jb[1][dev] = b2 - b3;
            If_jb[2][dev] = b3 - b1;
            break;
            
        case 2:
            If_a[0][dev] = -a2;
            If_a[1][dev] = -a3;
            If_a[2][dev] = -a1;
            If_jb[0][dev] = -b2;
            If_jb[1][dev] = -b3;
            If_jb[2][dev] = -b1;
            break;
            
        case 3:
            If_a[0][dev] = a3 - a2;
            If_a[1][dev] = a1 - a3;
            If_a[2][dev] = a2 - a1;
            If_jb[0][dev] = b3 - b2;
            If_jb[1][dev] = b1 - b3;
            If_jb[2][dev] = b2 - b1;
            break;
            
        case 4:
            If_a[0][dev] = a3;
            If_a[1][dev] = a1;
            If_a[2][dev] = a2;
            If_jb[0][dev] = b3;
            If_jb[1][dev] = b1;
            If_jb[2][dev] = b2;
            break;
            
        case 5:
            If_a[0][dev] = a3 - a1;
            If_a[1][dev] = a1 - a2;
            If_a[2][dev] = a2 - a3;
            If_jb[0][dev] = b3 - b1;
            If_jb[1][dev] = b1 - b2;
            If_jb[2][dev] = b2 - b3;
            break;
            
        case 6:
            If_a[0][dev] = -a1;
            If_a[1][dev] = -a2;
            If_a[2][dev] = -a3;
            If_jb[0][dev] = -b1;
            If_jb[1][dev] = -b2;
            If_jb[2][dev] = -b3;
            break;
            
        case 7:
            If_a[0][dev] = a2 - a1;
            If_a[1][dev] = a3 - a2;
            If_a[2][dev] = a1 - a3;
            If_jb[0][dev] = b2 - b1;
            If_jb[1][dev] = b3 - b2;
            If_jb[2][dev] = b1 - b3;
            break;
            
        case 8:
            If_a[0][dev] = a2;
            If_a[1][dev] = a3;
            If_a[2][dev] = a1;
            If_jb[0][dev] = b2;
            If_jb[1][dev] = b3;
            If_jb[2][dev] = b1;
            break;
            
        case 9:
            If_a[0][dev] = a2 - a3;
            If_a[1][dev] = a3 - a1;
            If_a[2][dev] = a1 - a2;
            If_jb[0][dev] = b2 - b3;
            If_jb[1][dev] = b3 - b1;
            If_jb[2][dev] = b1 - b2;
            break;
            
        case 10:
            If_a[0][dev] = -a3;
            If_a[1][dev] = -a1;
            If_a[2][dev] = -a2;
            If_jb[0][dev] = -b3;
            If_jb[1][dev] = -b1;
            If_jb[2][dev] = -b2;
            break;
            
        case 11:
            If_a[0][dev] = a1 - a3;
            If_a[1][dev] = a2 - a1;
            If_a[2][dev] = a3 - a2;
            If_jb[0][dev] = b1 - b3;
            If_jb[1][dev] = b2 - b1;
            If_jb[2][dev] = b3 - b2;
            break;
    }
}

// Função para calcular corrente diferencial (baseada no VBA)
// VBA: I_dif_a = (If_a(fase, 1) * C(1) / Tap(1)) + (If_a(fase, 2) * C(2) / Tap(2)) + ...
// Indexação: If_a[Fase][Dev]
// Cada fase retorna também "termos" (um por enrolamento) para permitir exibir a
// equação com os valores numéricos substituídos, além do resultado final.
// Im_a/Im_jb (correntes antes do giro) e cod (código horário por enrolamento)
// permitem descrever a compensação angular de cada termo, quando houver.
function calcularDiferencial_VBA(If_a, If_jb, taps, C, enrolamentos, config, Im_a, Im_jb, cod) {
    const resultados = { faseA: null, faseB: null, faseC: null };
    const numEnrol = config.numEnrolamentos;
    const rtc = enrolamentos.map(e => e.rtc);
    const eTap1 = enrolamentos[0].eTap;

    for (let fase = 0; fase < 3; fase++) {
        let idif_a = 0;
        let idif_jb = 0;
        const termos = [];

        for (let dev = 0; dev < numEnrol; dev++) {
            const mag = Math.sqrt(If_a[fase][dev] ** 2 + If_jb[fase][dev] ** 2);
            const ang = Math.atan2(If_jb[fase][dev], If_a[fase][dev]) * 180 / Math.PI;
            const rtcFactor = rtc[dev] / rtc[0];

            let contrib_a, contrib_jb;
            if (config.modeloRele === 1) { // TD: (I × C) / TAP
                contrib_a = (If_a[fase][dev] * C[dev]) / taps[dev];
                contrib_jb = (If_jb[fase][dev] * C[dev]) / taps[dev];
            } else { // LD: I × C × (RTCdev/RTC1), soma dividida por εTAP1 no final
                contrib_a = If_a[fase][dev] * C[dev] * rtcFactor;
                contrib_jb = If_jb[fase][dev] * C[dev] * rtcFactor;
            }
            idif_a += contrib_a;
            idif_jb += contrib_jb;

            const giro = descreverGiro(Im_a, Im_jb, dev, cod[dev], fase);
            termos.push({ dev, mag, ang, C: C[dev], tap: taps[dev], rtcFactor, giro });
        }

        if (config.modeloRele === 2) { // LD
            idif_a /= eTap1;
            idif_jb /= eTap1;
        }

        const idif = Math.sqrt(idif_a * idif_a + idif_jb * idif_jb);
        const resultado = { valor: idif, termos, eTap1 };

        if (fase === 0) resultados.faseA = resultado;
        else if (fase === 1) resultados.faseB = resultado;
        else if (fase === 2) resultados.faseC = resultado;
    }

    return resultados;
}

// Função para calcular corrente de frenagem (baseada no VBA)
// VBA: I_fren(fase) = (Abs(If_mod(fase, 1) * C(1) / Tap(1)) + ...) / 2
// Indexação: If_a[Fase][Dev]
function calcularFrenagem_VBA(If_a, If_jb, taps, C, enrolamentos, config, Im_a, Im_jb, cod) {
    const resultados = { faseA: null, faseB: null, faseC: null };
    const numEnrol = config.numEnrolamentos;
    const rtc = enrolamentos.map(e => e.rtc);
    const eTap1 = enrolamentos[0].eTap;

    for (let fase = 0; fase < 3; fase++) {
        let ifren = 0;
        const termos = [];

        for (let dev = 0; dev < numEnrol; dev++) {
            const modulo = Math.sqrt(If_a[fase][dev] ** 2 + If_jb[fase][dev] ** 2);
            const rtcFactor = rtc[dev] / rtc[0];

            const contrib = config.modeloRele === 1 // TD: |I × C / TAP|
                ? Math.abs((modulo * C[dev]) / taps[dev])
                : Math.abs(modulo * C[dev] * rtcFactor); // LD: soma dividida por (2×εTAP1) no final
            ifren += contrib;

            const giro = descreverGiro(Im_a, Im_jb, dev, cod[dev], fase);
            termos.push({ dev, mod: modulo, C: C[dev], tap: taps[dev], rtcFactor, contrib, giro });
        }

        ifren = config.modeloRele === 1 ? ifren / 2 : ifren / (2 * eTap1);

        const resultado = { valor: ifren, termos, eTap1 };
        if (fase === 0) resultados.faseA = resultado;
        else if (fase === 1) resultados.faseB = resultado;
        else if (fase === 2) resultados.faseC = resultado;
    }

    return resultados;
}

// Event listeners
document.getElementById('form-87').addEventListener('submit', function(e) {
    e.preventDefault();
    sanitizarTodosCampos('#form-87');
    calcularDiferencial87();
});

document.getElementById('btnLimpar').addEventListener('click', function() {
    document.getElementById('form-87').reset();
    document.getElementById('resultados').innerHTML = '<p class="text-center text-muted">Os resultados do cálculo aparecerão aqui após o processamento.</p>';
});

// Botões "E" (Equilibrar): a partir da fase clicada de um enrolamento,
// aplica a mesma magnitude e reproduz o espaçamento de 120° nas outras duas
// fases do MESMO enrolamento, na direção definida pela Sequência de Fases —
// a fase clicada não muda, serve de referência. Funciona igual para cada um
// dos até 3 enrolamentos, já que os ids dos campos seguem o mesmo padrão
// (ia1Mag/ia1Ang, ia2Mag/ia2Ang, ia3Mag/ia3Ang...).
function equilibrarFaseEnrolamento(enrolamento, faseClicada) {
    const fases = ['ia', 'ib', 'ic'];
    const idx = fases.indexOf(faseClicada);
    if (idx === -1) return;

    const campo = (fase, sufixo) => document.getElementById(`${fase}${enrolamento}${sufixo}`);

    const magnitudePivo = parseFloat(campo(faseClicada, 'Mag').value) || 0;
    const anguloPivo = parseFloat(campo(faseClicada, 'Ang').value) || 0;

    const sequencia = document.getElementById('sequenciaFases').value;
    const delta = sequencia === 'ABC' ? -120 : 120;

    const faseSeguinte = fases[(idx + 1) % 3];
    const faseAnterior = fases[(idx + 2) % 3];

    campo(faseSeguinte, 'Mag').value = magnitudePivo;
    campo(faseSeguinte, 'Ang').value = normalizarAngulo(anguloPivo + delta);

    campo(faseAnterior, 'Mag').value = magnitudePivo;
    campo(faseAnterior, 'Ang').value = normalizarAngulo(anguloPivo - delta);
}

document.querySelectorAll('.btn-equilibrar').forEach(function(btn) {
    btn.addEventListener('click', function() {
        equilibrarFaseEnrolamento(btn.dataset.enrolamento, btn.dataset.fase);
    });
});

// Preenche um campo automaticamente, mas só se ele estiver vazio ou ainda
// tiver exatamente o último valor que UM AUTO-PREENCHIMENTO colocou ali —
// ou seja, nunca sobrescreve um valor que o usuário digitou (ou aplicou via
// botão "Equilibrar") por conta própria.
const ultimoAutoPreenchido = {};

function autoPreencherCampo(id, novoValor) {
    const campo = document.getElementById(id);
    if (!campo) return;

    const atual = campo.value;
    if (atual === '' || atual === ultimoAutoPreenchido[id]) {
        campo.value = novoValor;
        ultimoAutoPreenchido[id] = novoValor;
    }
}

// Preenche TAP1/TAP2/TAP3 (e as magnitudes de corrente do enrolamento
// correspondente, com o próprio valor de TAP — carga nominal equilibrada
// como ponto de partida) a partir da Potência do Transformador, com a mesma
// fórmula de calcularTaps (TAP = Potência×1000 / (RTC × kV × √3)) — só para
// enrolamentos com kV e RTC já preenchidos (sem isso não dá pra calcular) e
// só quando a potência não é 0 (0 significa "usar o TAP inserido
// manualmente", conforme o rótulo do campo). O TAP em si é sempre
// recalculado (não é usado pelo cálculo quando a potência é diferente de 0,
// então não há valor "do usuário" para preservar ali); só as magnitudes de
// corrente passam pela proteção de autoPreencherCampo.
function autoPreencherTaps() {
    const potencia = parseFloat(document.getElementById('potencia').value) || 0;
    if (potencia <= 0) return;

    const numEnrolamentos = parseInt(document.getElementById('numEnrolamentos').value) || 2;
    for (let i = 1; i <= numEnrolamentos; i++) {
        const kv = parseFloat(document.getElementById(`kv${i}`).value);
        const rtc = parseFloat(document.getElementById(`rtc${i}`).value);
        if (!kv || !rtc) continue;

        const tap = (potencia * 1000) / (rtc * kv * Math.sqrt(3));
        const tapFormatado = tap.toFixed(3);
        document.getElementById(`tap${i}`).value = tapFormatado;

        ['ia', 'ib', 'ic'].forEach(fase => autoPreencherCampo(`${fase}${i}Mag`, tapFormatado));
    }
}

['potencia', 'kv1', 'kv2', 'kv3', 'rtc1', 'rtc2', 'rtc3'].forEach(id => {
    const campo = document.getElementById(id);
    if (campo) campo.addEventListener('input', autoPreencherTaps);
});

// Ângulo padrão (sem falta, carga equilibrada) de uma fase de um enrolamento
// — mesma convenção já usada na sugestão de correntes de injeção
// (anguloTesteBase em calc_87_pontos_teste.js): o Enrolamento 1 segue a
// Sequência de Fases; os demais seguem o código horário RELATIVO ao
// Enrolamento 1 (convenção usual de placa de transformador, ex: Dyn11), com
// os 180° de defasagem esperados entre entrada e saída num transformador
// saudável. Todos consideram a polaridade do TC (Entrante/Saliente).
function anguloPadraoCorrente(enrolamento, faseIdx, sequencia, polaridade, codHor) {
    const baseFase = [0, 240, 120][faseIdx];
    const msf = sequencia === 'ACB' ? 1 : 0;
    const msfAdd = baseFase * msf;
    const mp = polaridade === 'Saliente' ? 1 : 0;

    if (enrolamento === 1) return normalizarAngulo(baseFase + mp * 180 + msfAdd);
    return normalizarAngulo(baseFase + 180 + mp * 180 + msfAdd - codHor * 30);
}

function autoPreencherAngulosEnrolamento(enrolamento) {
    const sequencia = document.getElementById('sequenciaFases').value;
    const polaridade = document.getElementById(`polaridade${enrolamento}`).value;
    const campoCodHor = document.getElementById(`codHor${enrolamento}`);
    const codHor = campoCodHor ? (parseInt(campoCodHor.value) || 0) : 0;

    ['ia', 'ib', 'ic'].forEach((fase, faseIdx) => {
        const angulo = anguloPadraoCorrente(enrolamento, faseIdx, sequencia, polaridade, codHor);
        autoPreencherCampo(`${fase}${enrolamento}Ang`, angulo.toFixed(0));
    });
}

function autoPreencherTodosAngulos() {
    const numEnrolamentos = parseInt(document.getElementById('numEnrolamentos').value) || 2;
    for (let i = 1; i <= numEnrolamentos; i++) autoPreencherAngulosEnrolamento(i);
}

document.getElementById('sequenciaFases').addEventListener('change', autoPreencherTodosAngulos);
[1, 2, 3].forEach(i => {
    const campoPolaridade = document.getElementById(`polaridade${i}`);
    if (campoPolaridade) campoPolaridade.addEventListener('change', () => autoPreencherAngulosEnrolamento(i));

    const campoCodHor = document.getElementById(`codHor${i}`);
    if (campoCodHor) campoCodHor.addEventListener('input', () => autoPreencherAngulosEnrolamento(i));
});

// Preenchimento inicial (Sequência = ABC, TCs Entrante por padrão) assim que
// a página carrega, para os enrolamentos visíveis no momento
document.addEventListener('DOMContentLoaded', autoPreencherTodosAngulos);

// Botões "N" (Nominal): editar um campo manualmente faz o preenchimento
// automático "esquecer" dele (autoPreencherCampo passa a ignorá-lo, pra não
// sobrescrever o que o usuário digitou). O "N" é a forma de voltar atrás —
// recalcula magnitude (= TAP, se der pra calcular) e ângulo (padrão da
// Sequência/código horário) dessa fase e escreve direto, ignorando a
// proteção — e também atualiza o rastreamento, pra ela voltar a acompanhar
// futuras mudanças de potência/RTC/kV/sequência normalmente.
function restaurarNominalFase(enrolamento, fase) {
    const faseIdx = ['ia', 'ib', 'ic'].indexOf(fase);
    if (faseIdx === -1) return;

    const sequencia = document.getElementById('sequenciaFases').value;
    const polaridade = document.getElementById(`polaridade${enrolamento}`).value;
    const campoCodHor = document.getElementById(`codHor${enrolamento}`);
    const codHor = campoCodHor ? (parseInt(campoCodHor.value) || 0) : 0;
    const angulo = anguloPadraoCorrente(enrolamento, faseIdx, sequencia, polaridade, codHor).toFixed(0);

    const idAng = `${fase}${enrolamento}Ang`;
    document.getElementById(idAng).value = angulo;
    ultimoAutoPreenchido[idAng] = angulo;

    const potencia = parseFloat(document.getElementById('potencia').value) || 0;
    const kv = parseFloat(document.getElementById(`kv${enrolamento}`).value);
    const rtc = parseFloat(document.getElementById(`rtc${enrolamento}`).value);
    if (potencia > 0 && kv && rtc) {
        const tapFormatado = ((potencia * 1000) / (rtc * kv * Math.sqrt(3))).toFixed(3);
        const idMag = `${fase}${enrolamento}Mag`;
        document.getElementById(idMag).value = tapFormatado;
        ultimoAutoPreenchido[idMag] = tapFormatado;
    }
}

document.querySelectorAll('.btn-nominal').forEach(function(btn) {
    btn.addEventListener('click', function() {
        // dataset.enrolamento é string ("1") — precisa virar Number aqui,
        // já que anguloPadraoCorrente compara enrolamento === 1 (===
        // estrito falha silenciosamente contra a string e cai no ramo
        // errado, gerando um ângulo com +180° a mais que o esperado)
        restaurarNominalFase(parseInt(btn.dataset.enrolamento, 10), btn.dataset.fase);
    });
});

