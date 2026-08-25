// calc_87_pontos_teste.js - Sugestão de Pontos de Teste (comissionamento) para a Função 87
// Equivalente às células W4/W5/W6 (pontos por trecho), W9 (fator) e à tabela de
// correntes de teste da planilha Excel/VBA (Define_Pontos). A correntes de injeção
// só são calculadas para relé de 2 enrolamentos, mesma limitação da planilha original.

// Gera os pontos (Ifren, Idif) ao longo da curva: extremos A/B/C/D dos 3 trechos
// mais os pontos interiores pedidos em cada trecho (Qtd_Trecho_01/02/03 do VBA)
function gerarPontosCurva(config, qtd1, qtd2, qtd3, ifrenD) {
    const p1 = config.pontoInflexao1;
    const p2 = config.pontoInflexao2;
    const pontos = [];

    function ponto(ifren, marco) {
        pontos.push({ ifren, idif: curvaOperacaoY(ifren, config), marco });
    }
    function interiores(de, ate, qtd) {
        if (qtd <= 0) return;
        const passo = (ate - de) / (qtd + 1);
        for (let i = 1; i <= qtd; i++) ponto(de + passo * i, '');
    }

    ponto(0, 'A');
    interiores(0, p1, qtd1);
    ponto(p1, 'B');
    interiores(p1, p2, qtd2);
    ponto(p2, 'C');
    interiores(p2, ifrenD, qtd3);
    ponto(ifrenD, 'D');

    return pontos;
}

// Ângulo (graus, sem normalizar) da corrente de teste para um enrolamento/fase,
// assumindo injeção trifásica equilibrada (Preencher_Ang_Trif do VBA)
function anguloTesteBase(dev, faseIdx, mp1, mp2, msf, codigoRaw2) {
    const baseFase = [0, 240, 120][faseIdx];
    const msfAdd = baseFase * msf;
    if (dev === 0) return baseFase + mp1 * 180 + msfAdd;
    return baseFase + 180 + mp2 * 180 + msfAdd - codigoRaw2 * 30;
}

function normalizarAngulo(ang) {
    return ((ang % 360) + 360) % 360;
}

// Um valor de corrente pode sair negativo da fórmula da planilha; convertido aqui
// para magnitude positiva + 180° no ângulo, mais fácil de configurar numa caixa de teste
function normalizarMagAng(valor, anguloBase) {
    return valor < 0
        ? { mag: -valor, ang: normalizarAngulo(anguloBase + 180) }
        : { mag: valor, ang: normalizarAngulo(anguloBase) };
}

// Correntes a injetar nos enrolamentos 1 e 2 para atingir o ponto (Ifren, Idif alvo)
// (trecho "Calcular Correntes a Serem Aplicadas" do VBA, só para 2 enrolamentos)
function correntesInjecao(idifAlvo, ifrenPt, taps, enrolamentos, config) {
    const tap1 = taps[0];
    const tap2 = taps[1];
    const i1 = tap1 * (idifAlvo / 2 + ifrenPt);
    const i2 = config.modeloRele === 1 // TD
        ? tap2 * (-idifAlvo / 2 + ifrenPt)
        : (enrolamentos[0].rtc / enrolamentos[1].rtc) * tap1 * (-idifAlvo / 2 + ifrenPt); // LD
    return { i1, i2 };
}

function gerarSugestaoPontosTeste() {
    const { config, enrolamentos } = lerFormulario87();
    const taps = calcularTaps(enrolamentos, config);

    const qtd1 = parseInt(document.getElementById('qtdTrecho1').value) || 0;
    const qtd2 = parseInt(document.getElementById('qtdTrecho2').value) || 0;
    const qtd3 = parseInt(document.getElementById('qtdTrecho3').value) || 0;
    const fator = parseFloat(document.getElementById('fatorTeste').value) || 1;
    const ifrenDInput = document.getElementById('ifrenFinalD').value;
    const ifrenD = ifrenDInput !== '' ? parseFloat(ifrenDInput) : config.pontoInflexao2 * 2;

    const suportaInjecao = config.numEnrolamentos === 2;
    const codigoRaw2 = parseInt(document.getElementById('codHor2').value) || 0;
    const mp1 = enrolamentos[0].polaridade === 'Saliente' ? 1 : 0;
    const mp2 = enrolamentos[1].polaridade === 'Saliente' ? 1 : 0;
    const msf = config.seqFases === 'ACB' ? 1 : 0;

    const linhas = gerarPontosCurva(config, qtd1, qtd2, qtd3, ifrenD).map((p, idx) => {
        const idifAlvo = p.idif * fator;
        const linha = { ...p, idifAlvo, ponto: idx + 1 };

        if (suportaInjecao) {
            const { i1, i2 } = correntesInjecao(idifAlvo, p.ifren, taps, enrolamentos, config);
            linha.injecao = ['A', 'B', 'C'].map((letra, faseIdx) => ({
                fase: letra,
                i1: normalizarMagAng(i1, anguloTesteBase(0, faseIdx, mp1, mp2, msf, codigoRaw2)),
                i2: normalizarMagAng(i2, anguloTesteBase(1, faseIdx, mp1, mp2, msf, codigoRaw2))
            }));
        }
        return linha;
    });

    exibirPontosTeste(config, fator, ifrenD, suportaInjecao, linhas);
}

function exibirPontosTeste(config, fator, ifrenD, suportaInjecao, linhas) {
    const regiao = fator > 1 ? 'região de disparo' : (fator < 1 ? 'região de restrição' : 'exatamente sobre a curva');
    let html = '<div class="resultados-87">';

    html += `<p><strong>Fator aplicado:</strong> ${fator.toFixed(3)} — pontos deslocados para a <strong>${regiao}</strong>.</p>`;
    html += `<p><strong>Ponto D (Ifren final):</strong> ${ifrenD.toFixed(3)} xTAP</p>`;

    if (!suportaInjecao) {
        html += '<p class="text-muted">Sugestão de correntes de injeção disponível apenas para relé de 2 enrolamentos (mesma limitação da planilha original). Abaixo, somente os pontos da curva.</p>';
    }

    html += '<div class="table-responsive"><table class="tabela-pontos-teste">';
    html += '<thead><tr>' +
        '<th>Ponto</th><th>Marco</th><th>I<sub>fren</sub> (xTAP)</th>' +
        '<th>I<sub>dif</sub> curva (xTAP)</th><th>I<sub>dif</sub> alvo (xTAP)</th>';
    if (suportaInjecao) {
        html += '<th>Fase A</th><th>Fase B</th><th>Fase C</th>';
    }
    html += '</tr></thead><tbody>';

    linhas.forEach(l => {
        html += '<tr>';
        html += `<td>${l.ponto}</td><td>${l.marco || '—'}</td>`;
        html += `<td>${l.ifren.toFixed(3)}</td><td>${l.idif.toFixed(3)}</td><td>${l.idifAlvo.toFixed(3)}</td>`;
        if (suportaInjecao) {
            l.injecao.forEach(inj => {
                html += `<td>I<sub>1</sub> = ${inj.i1.mag.toFixed(3)}∠${inj.i1.ang.toFixed(1)}° A<br>` +
                    `I<sub>2</sub> = ${inj.i2.mag.toFixed(3)}∠${inj.i2.ang.toFixed(1)}° A</td>`;
            });
        }
        html += '</tr>';
    });

    html += '</tbody></table></div></div>';

    document.getElementById('pontosTesteResultado').innerHTML = html;
}

document.getElementById('btnGerarPontos').addEventListener('click', gerarSugestaoPontosTeste);
