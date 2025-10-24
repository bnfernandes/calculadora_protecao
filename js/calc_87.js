// calc_87.js - Calculadora de Proteção Diferencial (Função 87)

// Classe para números complexos
class Complexo {
    constructor(real, imag) {
        this.real = real;
        this.imag = imag;
    }

    // Criar a partir de magnitude e ângulo (graus)
    static fromPolar(magnitude, anguloDeg) {
        const anguloRad = anguloDeg * Math.PI / 180;
        return new Complexo(
            magnitude * Math.cos(anguloRad),
            magnitude * Math.sin(anguloRad)
        );
    }

    // Obter magnitude
    magnitude() {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }

    // Obter ângulo em graus
    angulo() {
        let ang = Math.atan2(this.imag, this.real) * 180 / Math.PI;
        return ang;
    }

    // Somar dois complexos
    somar(outro) {
        return new Complexo(this.real + outro.real, this.imag + outro.imag);
    }

    // Multiplicar por escalar
    multiplicar(escalar) {
        return new Complexo(this.real * escalar, this.imag * escalar);
    }

    // Rotacionar por ângulo (graus)
    rotacionar(anguloDeg) {
        const anguloRad = anguloDeg * Math.PI / 180;
        const cos = Math.cos(anguloRad);
        const sin = Math.sin(anguloRad);
        return new Complexo(
            this.real * cos - this.imag * sin,
            this.real * sin + this.imag * cos
        );
    }
}

// Função principal de cálculo
function calcularDiferencial87() {
    // Ler parâmetros de entrada
    const config = {
        modeloRele: document.getElementById('modeloRele').value,
        numEnrolamentos: parseInt(document.getElementById('numEnrolamentos').value),
        enrolRef: parseInt(document.getElementById('enrolRef').value),
        seqFases: document.getElementById('sequenciaFases').value,
        potencia: parseFloat(document.getElementById('potencia').value) || 0,
        // Parâmetros da curva
        sensibilidade: parseFloat(document.getElementById('sensibilidade').value) || 0.3,
        pontoInflexao1: parseFloat(document.getElementById('pontoInflexao1').value) || 1.5,
        pontoInflexao2: parseFloat(document.getElementById('pontoInflexao2').value) || 5.0,
        inclinacao1: parseFloat(document.getElementById('inclinacao1').value) || 25,
        inclinacao2: parseFloat(document.getElementById('inclinacao2').value) || 50
    };

    // Dados dos enrolamentos
    const enrolamentos = [
        {
            nome: 'Enrolamento 1',
            rtc: parseFloat(document.getElementById('rtc1').value),
            kv: parseFloat(document.getElementById('kv1').value),
            conexao: document.getElementById('conexao1').value,
            tap: parseFloat(document.getElementById('tap1').value),
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

    // Se 2 enrolamentos, zerar terciário
    if (config.numEnrolamentos === 2) {
        enrolamentos[2].correntes = [
            { mag: 0, ang: 0 },
            { mag: 0, ang: 0 },
            { mag: 0, ang: 0 }
        ];
    }

    // Passo 1: Converter correntes para retangular e aplicar polaridade
    const correntesRetangulares = enrolamentos.map((enrol, devIdx) => {
        return enrol.correntes.map(corrente => {
            let angulo = corrente.ang;
            // Aplicar polaridade (saliente adiciona 180°)
            if (enrol.polaridade === 'Saliente') {
                angulo += 180;
            }
            return Complexo.fromPolar(corrente.mag, angulo);
        });
    });

    // Passo 2: Aplicar filtro homopolar (se ativado)
    const correntesFiltradas = correntesRetangulares.map((fases, devIdx) => {
        if (enrolamentos[devIdx].filtro === 'Ativo') {
            // Calcular componente de sequência zero
            const somaReal = fases[0].real + fases[1].real + fases[2].real;
            const somaImag = fases[0].imag + fases[1].imag + fases[2].imag;
            const seq0 = new Complexo(somaReal / 3, somaImag / 3);
            
            // Subtrair sequência zero de cada fase
            return fases.map(fase => new Complexo(
                fase.real - seq0.real,
                fase.imag - seq0.imag
            ));
        }
        return fases;
    });

    // Passo 3: Calcular TAP
    const taps = enrolamentos.map(enrol => {
        if (config.potencia === 0) {
            return enrol.tap;
        } else {
            return (config.potencia * 1000) / (enrol.rtc * enrol.kv * Math.sqrt(3));
        }
    });

    // Passo 4: Calcular constante C
    const constantesC = calcularConstantesC(enrolamentos, config);

    // Passo 5: Aplicar giro (código horário)
    const correntesGiradas = aplicarGiro(correntesFiltradas, enrolamentos, config);

    // Passo 6: Calcular corrente diferencial e de frenagem
    const resultados = calcularDiferencialFrenagem(correntesGiradas, taps, constantesC, enrolamentos, config);

    // Exibir resultados
    exibirResultados(config, enrolamentos, taps, constantesC, resultados);

    // Criar gráfico
    criarGraficoDiferencial(resultados, config);
}

// Função para calcular as constantes C
function calcularConstantesC(enrolamentos, config) {
    const C = [1, 1, 1];
    
    // Mapear conexões: Y=1, D=2, Z=3
    const conexoes = enrolamentos.map(e => {
        if (e.conexao === 'Y') return 1;
        if (e.conexao === 'D') return 2;
        if (e.conexao === 'Z') return 3;
        return 1;
    });

    // Lógica simplificada baseada no VBA
    // Para 2 enrolamentos
    if (config.numEnrolamentos === 2) {
        const c1 = conexoes[0];
        const c2 = conexoes[1];

        if (config.enrolRef === 1) { // Primário como referência
            C[0] = 1;
            // Se secundário é D ou Z e primário é Y
            if ((c2 === 2 || c2 === 3) && c1 === 1) {
                C[1] = 1 / Math.sqrt(3);
            } else if ((c1 === 2 || c1 === 3) && c2 === 1) {
                C[1] = 1 / Math.sqrt(3);
            } else {
                C[1] = 1;
            }
        } else if (config.enrolRef === 2) { // Secundário como referência
            C[1] = 1;
            if ((c1 === 2 || c1 === 3) && c2 === 1) {
                C[0] = 1 / Math.sqrt(3);
            } else if ((c2 === 2 || c2 === 3) && c1 === 1) {
                C[0] = 1 / Math.sqrt(3);
            } else {
                C[0] = 1;
            }
        }
    }

    // Para 3 enrolamentos (lógica similar, expandida)
    if (config.numEnrolamentos === 3) {
        const c1 = conexoes[0];
        const c2 = conexoes[1];
        const c3 = conexoes[2];

        if (config.enrolRef === 1) {
            C[0] = 1;
            C[1] = ((c2 === 2 || c2 === 3) && c1 === 1) || ((c1 === 2 || c1 === 3) && c2 === 1) ? 1 / Math.sqrt(3) : 1;
            C[2] = ((c3 === 2 || c3 === 3) && c1 === 1) || ((c1 === 2 || c1 === 3) && c3 === 1) ? 1 / Math.sqrt(3) : 1;
        } else if (config.enrolRef === 2) {
            C[1] = 1;
            C[0] = ((c1 === 2 || c1 === 3) && c2 === 1) || ((c2 === 2 || c2 === 3) && c1 === 1) ? 1 / Math.sqrt(3) : 1;
            C[2] = ((c3 === 2 || c3 === 3) && c2 === 1) || ((c2 === 2 || c2 === 3) && c3 === 1) ? 1 / Math.sqrt(3) : 1;
        } else if (config.enrolRef === 3) {
            C[2] = 1;
            C[0] = ((c1 === 2 || c1 === 3) && c3 === 1) || ((c3 === 2 || c3 === 3) && c1 === 1) ? 1 / Math.sqrt(3) : 1;
            C[1] = ((c2 === 2 || c2 === 3) && c3 === 1) || ((c3 === 2 || c3 === 3) && c2 === 1) ? 1 / Math.sqrt(3) : 1;
        }
    }

    return C;
}

// Função para aplicar giro (código horário)
function aplicarGiro(correntes, enrolamentos, config) {
    return correntes.map((fases, devIdx) => {
        const codHorario = enrolamentos[devIdx].codHorario;
        let anguloGiro = codHorario * 30; // Cada código horário = 30°

        // Ajustar para sequência ACB
        if (config.seqFases === 'ACB' && codHorario !== 0) {
            anguloGiro = (12 - codHorario) * 30;
        }

        // Aplicar giro baseado no código horário
        if (codHorario === 0) {
            return fases; // Sem giro
        }

        // Giro para cada fase baseado no código horário
        return fases.map((fase, faseIdx) => {
            let anguloFase = anguloGiro;
            
            // Ajustar ângulo para cada fase (A, B, C)
            if (config.seqFases === 'ABC') { // ABC
                if (faseIdx === 1) anguloFase += 0; // Fase B
                if (faseIdx === 2) anguloFase += 0; // Fase C
            } else { // ACB
                if (faseIdx === 1) anguloFase += 0; // Fase B
                if (faseIdx === 2) anguloFase += 0; // Fase C
            }

            return fase.rotacionar(anguloGiro);
        });
    });
}

// Função para calcular corrente diferencial e de frenagem
function calcularDiferencialFrenagem(correntes, taps, C, enrolamentos, config) {
    const resultados = {
        faseA: { idif: 0, ifren: 0 },
        faseB: { idif: 0, ifren: 0 },
        faseC: { idif: 0, ifren: 0 }
    };

    const fases = ['faseA', 'faseB', 'faseC'];

    for (let faseIdx = 0; faseIdx < 3; faseIdx++) {
        // Corrente diferencial (soma vetorial)
        let idif_real = 0;
        let idif_imag = 0;

        // Corrente de frenagem (média dos módulos)
        let ifren_soma = 0;

        const numEnrol = config.numEnrolamentos;

        if (config.modeloRele === 1) { // TD
            for (let devIdx = 0; devIdx < numEnrol; devIdx++) {
                const corrente = correntes[devIdx][faseIdx];
                const fator = C[devIdx] / taps[devIdx];
                
                idif_real += corrente.real * fator;
                idif_imag += corrente.imag * fator;
                
                ifren_soma += Math.abs(corrente.magnitude() * fator);
            }
        } else { // LD
            const rtc = enrolamentos.map(e => e.rtc);
            const etap = enrolamentos[0].tap; // Usar eTap do primário

            for (let devIdx = 0; devIdx < numEnrol; devIdx++) {
                const corrente = correntes[devIdx][faseIdx];
                const fatorRTC = devIdx === 0 ? 1 : rtc[devIdx] / rtc[0];
                const fator = C[devIdx] * fatorRTC;
                
                idif_real += corrente.real * fator;
                idif_imag += corrente.imag * fator;
                
                ifren_soma += Math.abs(corrente.magnitude() * fator);
            }

            // Dividir por eTap
            idif_real /= etap;
            idif_imag /= etap;
            ifren_soma /= (2 * etap);
        }

        // Calcular módulo da corrente diferencial
        const idif = Math.sqrt(idif_real * idif_real + idif_imag * idif_imag);
        
        // Calcular corrente de frenagem (média)
        const ifren = config.modeloRele === 1 ? ifren_soma / 2 : ifren_soma;

        resultados[fases[faseIdx]] = { idif, ifren };
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

