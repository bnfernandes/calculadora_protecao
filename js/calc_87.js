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

// Função principal de cálculo
function calcularDiferencial87() {
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
    
    for (let devIdx = 0; devIdx < 3; devIdx++) {
        if (enrolamentos[devIdx].filtro === 'Ativo') {
            // Calcular componente de sequência zero
            let somaReal = 0;
            let somaImag = 0;
            for (let faseIdx = 0; faseIdx < 3; faseIdx++) {
                somaReal += I_a[faseIdx][devIdx];
                somaImag += I_jb[faseIdx][devIdx];
            }
            
            // Subtrair sequência zero de cada fase
            for (let faseIdx = 0; faseIdx < 3; faseIdx++) {
                Ih_a[faseIdx][devIdx] = I_a[faseIdx][devIdx] - somaReal / 3;
                Ih_jb[faseIdx][devIdx] = I_jb[faseIdx][devIdx] - somaImag / 3;
            }
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
    const taps = enrolamentos.map(enrol => {
        if (config.potencia === 0) {
            return enrol.eTap;
        } else {
            return (config.potencia * 1000) / (enrol.rtc * enrol.kv * Math.sqrt(3));
        }
    });

    // Passo 5: Calcular constante C (TD_C do VBA)
    const constantesC = calcularConstantesC_VBA(enrolamentos, config);

    // Passo 6: Calcular códigos horários relativos
    const codigos = calcularCodigosHorarios(enrolamentos, config);

    // Passo 7: Aplicar giro para IDIF (Giro do VBA)
    const If_a_dif = [[], [], []];   // [Fase][Dev]
    const If_jb_dif = [[], [], []];  // [Fase][Dev]
    aplicarGiro_VBA(Im_a, Im_jb, If_a_dif, If_jb_dif, codigos, config);

    // Passo 8: Calcular corrente diferencial
    const resultadosDif = calcularDiferencial_VBA(If_a_dif, If_jb_dif, taps, constantesC, enrolamentos, config);

    // Passo 9: Recalcular sem filtro para Ifren (Mod_Im do VBA)
    const Im_a_SF = I_a.map(fase => [...fase]);
    const Im_jb_SF = I_jb.map(fase => [...fase]);

    // Passo 10: Aplicar giro para IFREN (sem filtro)
    const If_a_fren = [[], [], []];   // [Fase][Dev]
    const If_jb_fren = [[], [], []];  // [Fase][Dev]
    aplicarGiro_VBA(Im_a_SF, Im_jb_SF, If_a_fren, If_jb_fren, codigos, config);

    // Passo 11: Calcular corrente de frenagem
    const resultadosFren = calcularFrenagem_VBA(If_a_fren, If_jb_fren, taps, constantesC, enrolamentos, config);

    // Combinar resultados
    const resultados = {
        faseA: { idif: resultadosDif.faseA, ifren: resultadosFren.faseA },
        faseB: { idif: resultadosDif.faseB, ifren: resultadosFren.faseB },
        faseC: { idif: resultadosDif.faseC, ifren: resultadosFren.faseC }
    };

    // Exibir resultados (função em calc_87_eq.js)
    exibirResultados(config, enrolamentos, taps, constantesC, resultados);

    // Criar gráfico (função em calc_87_grafico.js)
    criarGraficoDiferencial(resultados, config);
}

// Função para calcular as constantes C (completa do VBA)
function calcularConstantesC_VBA(enrolamentos, config) {
    const C = [1, 1, 1];
    
    // Mapear conexões: Y=1, D=2, Z=3
    const conexoes = enrolamentos.map(e => {
        if (e.conexao === 'Y') return 1;
        if (e.conexao === 'D') return 2;
        if (e.conexao === 'Z') return 3;
        return 1;
    });

    const c1 = conexoes[0];
    const c2 = conexoes[1];
    const c3 = conexoes[2];
    const devRef = config.enrolRef;
    const sqrt3 = Math.sqrt(3);

    // Para 2 enrolamentos
    if (config.numEnrolamentos === 2) {
        if (devRef === 1) { // Primário como referência
            C[0] = 1;
            
            // Yy
            if (c1 === 1 && c2 === 1) C[1] = 1;
            // Yd
            else if (c1 === 1 && c2 === 2) C[1] = 1 / sqrt3;
            // Yz
            else if (c1 === 1 && c2 === 3) C[1] = 1 / sqrt3;
            // Dy
            else if (c1 === 2 && c2 === 1) C[1] = 1 / sqrt3;
            // Dd
            else if (c1 === 2 && c2 === 2) C[1] = 1;
            // Dz
            else if (c1 === 2 && c2 === 3) C[1] = 1;
            // Zy
            else if (c1 === 3 && c2 === 1) C[1] = 1 / sqrt3;
            // Zd
            else if (c1 === 3 && c2 === 2) C[1] = 1;
            // Zz
            else if (c1 === 3 && c2 === 3) C[1] = 1;
            
        } else if (devRef === 2) { // Secundário como referência
            C[1] = 1;
            
            // Yy
            if (c1 === 1 && c2 === 1) C[0] = 1;
            // Yd
            else if (c1 === 1 && c2 === 2) C[0] = 1 / sqrt3;
            // Yz
            else if (c1 === 1 && c2 === 3) C[0] = 1 / sqrt3;
            // Dy
            else if (c1 === 2 && c2 === 1) C[0] = 1 / sqrt3;
            // Dd
            else if (c1 === 2 && c2 === 2) C[0] = 1;
            // Dz
            else if (c1 === 2 && c2 === 3) C[0] = 1;
            // Zy
            else if (c1 === 3 && c2 === 1) C[0] = 1 / sqrt3;
            // Zd
            else if (c1 === 3 && c2 === 2) C[0] = 1;
            // Zz
            else if (c1 === 3 && c2 === 3) C[0] = 1;
        }
    }

    // Para 3 enrolamentos
    if (config.numEnrolamentos === 3) {
        if (devRef === 1) { // Primário como referência
            C[0] = 1;
            
            // Yyy
            if (c1 === 1 && c2 === 1 && c3 === 1) { C[1] = 1; C[2] = 1; }
            // Yyd
            else if (c1 === 1 && c2 === 1 && c3 === 2) { C[1] = 1; C[2] = 1 / sqrt3; }
            // Ydy
            else if (c1 === 1 && c2 === 2 && c3 === 1) { C[1] = 1 / sqrt3; C[2] = 1; }
            // Ydd
            else if (c1 === 1 && c2 === 2 && c3 === 2) { C[1] = 1 / sqrt3; C[2] = 1 / sqrt3; }
            // Dyy
            else if (c1 === 2 && c2 === 1 && c3 === 1) { C[1] = 1 / sqrt3; C[2] = 1 / sqrt3; }
            // Dyd
            else if (c1 === 2 && c2 === 1 && c3 === 2) { C[1] = 1 / sqrt3; C[2] = 1; }
            // Ddy
            else if (c1 === 2 && c2 === 2 && c3 === 1) { C[1] = 1; C[2] = 1 / sqrt3; }
            // Ddd
            else if (c1 === 2 && c2 === 2 && c3 === 2) { C[1] = 1; C[2] = 1; }
            // Casos com Z
            else if (c1 === 3 || c2 === 3 || c3 === 3) {
                if (c2 === 1) C[1] = 1 / sqrt3; else C[1] = 1;
                if (c3 === 1) C[2] = 1 / sqrt3; else C[2] = 1;
            }
            
        } else if (devRef === 2) { // Secundário como referência
            C[1] = 1;
            
            if (c1 === 1 && c2 === 1 && c3 === 1) { C[0] = 1; C[2] = 1; }
            else if (c1 === 1 && c2 === 1 && c3 === 2) { C[0] = 1; C[2] = 1 / sqrt3; }
            else if (c1 === 1 && c2 === 2 && c3 === 1) { C[0] = 1 / sqrt3; C[2] = 1 / sqrt3; }
            else if (c1 === 1 && c2 === 2 && c3 === 2) { C[0] = 1 / sqrt3; C[2] = 1; }
            else if (c1 === 2 && c2 === 1 && c3 === 1) { C[0] = 1 / sqrt3; C[2] = 1; }
            else if (c1 === 2 && c2 === 1 && c3 === 2) { C[0] = 1 / sqrt3; C[2] = 1 / sqrt3; }
            else if (c1 === 2 && c2 === 2 && c3 === 1) { C[0] = 1; C[2] = 1 / sqrt3; }
            else if (c1 === 2 && c2 === 2 && c3 === 2) { C[0] = 1; C[2] = 1; }
            else if (c1 === 3 || c2 === 3 || c3 === 3) {
                if (c1 === 1) C[0] = 1 / sqrt3; else C[0] = 1;
                if (c3 === 1) C[2] = 1 / sqrt3; else C[2] = 1;
            }
            
        } else if (devRef === 3) { // Terciário como referência
            C[2] = 1;
            
            if (c1 === 1 && c2 === 1 && c3 === 1) { C[0] = 1; C[1] = 1; }
            else if (c1 === 1 && c2 === 1 && c3 === 2) { C[0] = 1 / sqrt3; C[1] = 1 / sqrt3; }
            else if (c1 === 1 && c2 === 2 && c3 === 1) { C[0] = 1; C[1] = 1 / sqrt3; }
            else if (c1 === 1 && c2 === 2 && c3 === 2) { C[0] = 1 / sqrt3; C[1] = 1; }
            else if (c1 === 2 && c2 === 1 && c3 === 1) { C[0] = 1 / sqrt3; C[1] = 1; }
            else if (c1 === 2 && c2 === 1 && c3 === 2) { C[0] = 1; C[1] = 1 / sqrt3; }
            else if (c1 === 2 && c2 === 2 && c3 === 1) { C[0] = 1 / sqrt3; C[1] = 1 / sqrt3; }
            else if (c1 === 2 && c2 === 2 && c3 === 2) { C[0] = 1; C[1] = 1; }
            else if (c1 === 3 || c2 === 3 || c3 === 3) {
                if (c1 === 1) C[0] = 1 / sqrt3; else C[0] = 1;
                if (c2 === 1) C[1] = 1 / sqrt3; else C[1] = 1;
            }
        }
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

// Função para aplicar giro (Giro + Modif do VBA)
function aplicarGiro_VBA(Im_a, Im_jb, If_a, If_jb, codigos, config) {
    const numEnrol = config.numEnrolamentos;
    const devRef = config.enrolRef;

    if (numEnrol === 2) {
        if (devRef === 1) {
            // Mantem(1)
            mantem(Im_a, Im_jb, If_a, If_jb, 0);
            // Modif(2, Codigo(2))
            modif(Im_a, Im_jb, If_a, If_jb, 1, codigos.codigo2);
        } else if (devRef === 2) {
            // Modif(1, 12 - Codigo(2))
            modif(Im_a, Im_jb, If_a, If_jb, 0, codigos.codigo12);
            // Mantem(2)
            mantem(Im_a, Im_jb, If_a, If_jb, 1);
        }
    } else if (numEnrol === 3) {
        if (devRef === 1) {
            mantem(Im_a, Im_jb, If_a, If_jb, 0);
            modif(Im_a, Im_jb, If_a, If_jb, 1, codigos.codigo2);
            modif(Im_a, Im_jb, If_a, If_jb, 2, codigos.codigo3);
        } else if (devRef === 2) {
            modif(Im_a, Im_jb, If_a, If_jb, 0, codigos.codigo12);
            mantem(Im_a, Im_jb, If_a, If_jb, 1);
            modif(Im_a, Im_jb, If_a, If_jb, 2, codigos.codigo32);
        } else if (devRef === 3) {
            modif(Im_a, Im_jb, If_a, If_jb, 0, codigos.codigo13);
            modif(Im_a, Im_jb, If_a, If_jb, 1, codigos.codigo23);
            mantem(Im_a, Im_jb, If_a, If_jb, 2);
        }
    }
}

// Função Mantem (do VBA)
// Indexação: [Fase][Dev]
function mantem(Im_a, Im_jb, If_a, If_jb, dev) {
    for (let fase = 0; fase < 3; fase++) {
        If_a[fase][dev] = Im_a[fase][dev];
        If_jb[fase][dev] = Im_jb[fase][dev];
    }
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
function calcularDiferencial_VBA(If_a, If_jb, taps, C, enrolamentos, config) {
    const resultados = {
        faseA: 0,
        faseB: 0,
        faseC: 0
    };

    const numEnrol = config.numEnrolamentos;

    for (let fase = 0; fase < 3; fase++) {
        let idif_a = 0;
        let idif_jb = 0;

        if (config.modeloRele === 1) { // TD
            // VBA: I_dif_a = (If_a(fase, 1) * C(1) / Tap(1)) + ...
            for (let dev = 0; dev < numEnrol; dev++) {
                idif_a += (If_a[fase][dev] * C[dev]) / taps[dev];
                idif_jb += (If_jb[fase][dev] * C[dev]) / taps[dev];
            }
        } else { // LD
            // VBA: I_dif_a = (If_a(fase, 1) * C(1)) + (RTC(2)/RTC(1)) * (If_a(fase, 2) * C(2)) + ...
            const rtc = enrolamentos.map(e => e.rtc);
            const eTap1 = enrolamentos[0].eTap;

            for (let dev = 0; dev < numEnrol; dev++) {
                const fatorRTC = rtc[dev] / rtc[0];
                idif_a += If_a[fase][dev] * C[dev] * fatorRTC;
                idif_jb += If_jb[fase][dev] * C[dev] * fatorRTC;
            }

            idif_a /= eTap1;
            idif_jb /= eTap1;
        }

        const idif = Math.sqrt(idif_a * idif_a + idif_jb * idif_jb);
        
        if (fase === 0) resultados.faseA = idif;
        else if (fase === 1) resultados.faseB = idif;
        else if (fase === 2) resultados.faseC = idif;
    }

    return resultados;
}

// Função para calcular corrente de frenagem (baseada no VBA)
// VBA: I_fren(fase) = (Abs(If_mod(fase, 1) * C(1) / Tap(1)) + ...) / 2
// Indexação: If_a[Fase][Dev]
function calcularFrenagem_VBA(If_a, If_jb, taps, C, enrolamentos, config) {
    const resultados = {
        faseA: 0,
        faseB: 0,
        faseC: 0
    };

    const numEnrol = config.numEnrolamentos;

    for (let fase = 0; fase < 3; fase++) {
        let ifren = 0;

        if (config.modeloRele === 1) { // TD
            // VBA: I_fren(fase) = (Abs(If_mod(fase, 1) * C(1) / Tap(1)) + ...) / 2
            for (let dev = 0; dev < numEnrol; dev++) {
                const a = If_a[fase][dev];
                const b = If_jb[fase][dev];
                const modulo = Math.sqrt(a * a + b * b);
                ifren += Math.abs((modulo * C[dev]) / taps[dev]);
            }
            ifren /= 2;
            
        } else { // LD
            // VBA: I_fren(fase) = (Abs(If_mod(fase, 1) * C(1)) + (RTC(2)/RTC(1)) * Abs(If_mod(fase, 2) * C(2)) + ...) / (2 * eTap(1))
            const rtc = enrolamentos.map(e => e.rtc);
            const eTap1 = enrolamentos[0].eTap;

            for (let dev = 0; dev < numEnrol; dev++) {
                const a = If_a[fase][dev];
                const b = If_jb[fase][dev];
                const modulo = Math.sqrt(a * a + b * b);
                const fatorRTC = rtc[dev] / rtc[0];
                ifren += Math.abs(modulo * C[dev] * fatorRTC);
            }
            ifren /= (2 * eTap1);
        }

        if (fase === 0) resultados.faseA = ifren;
        else if (fase === 1) resultados.faseB = ifren;
        else if (fase === 2) resultados.faseC = ifren;
    }

    return resultados;
}

// Event listeners
document.getElementById('form-87').addEventListener('submit', function(e) {
    e.preventDefault();
    calcularDiferencial87();
});

document.getElementById('btnLimpar').addEventListener('click', function() {
    document.getElementById('form-87').reset();
    document.getElementById('resultados').innerHTML = '<p class="text-center text-muted">Os resultados do cálculo aparecerão aqui após o processamento.</p>';
});

