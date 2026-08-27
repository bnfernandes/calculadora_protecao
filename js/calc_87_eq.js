// calc_87_eq.js - Exibição de Resultados e Fórmulas (Função 87)
// Fórmulas em HTML puro (sem LaTeX), com divisões sempre exibidas como frações
// em duas linhas — mesmo padrão visual usado nas Funções 51 e 67
// (ver js/formula-html.js e css/equations.css).

function fmt(x, dec = 3) {
    return x.toFixed(dec);
}

function fmtPolar(mag, ang) {
    return `${fmt(mag)}∠${fmt(ang, 1)}°`;
}

// C só assume dois valores possíveis (ver calcularConstantesC): 1, ou 1/√3.
// Mostrar a forma exata em vez de "0.5774" deixa claro de onde ela vem.
// Dentro de uma soma de termos (fórmulas de Idif/Ifren) usa-se a forma em
// linha única "1/√3": como o numerador de cada termo vira uma fração própria,
// empilhar o 1/√3 deixaria o numerador desse termo mais alto que o dos
// vizinhos e desalinharia as barras de fração entre eles. Em destaque isolado
// (seção "Constantes C") não há esse problema, então usa-se a forma empilhada.
function fmtC(valor) {
    return Math.abs(valor - 1) < 1e-6 ? '1' : '1/√3';
}

function fmtCDestaque(valor) {
    return Math.abs(valor - 1) < 1e-6 ? '1' : fracaoHTML('1', '√3');
}

// Símbolo do enrolamento na fórmula: I₂ normalmente, ou I₂′ ("linha") quando
// o código horário faz essa corrente ser uma combinação de outras fases —
// sinaliza que não é simplesmente a corrente injetada naquela fase.
function nomeI(t) {
    return t.giro ? `I<sub>${t.dev + 1}</sub>′` : `I<sub>${t.dev + 1}</sub>`;
}

// Linha que mostra a compensação por código horário de um termo, quando houver
// (Modif do VBA: a corrente do enrolamento não é sempre a da própria fase —
// pode ser a negativa de outra fase, ou a diferença entre duas outras fases).
// Retorna '' quando o código horário é 0 (sem compensação).
function giroExplicacaoHTML(t) {
    if (!t.giro) return '';
    const nomeFonte = f => `I<sub>${f.letra}${t.dev + 1}</sub>`;
    // Idif usa o fasor (mag∠ang); Ifren usa só o módulo da corrente resultante
    const resultado = t.mag !== undefined ? fmtPolar(t.mag, t.ang) : fmt(t.mod);

    if (t.giro.tipo === 'neg') {
        const f1 = t.giro.fonte1;
        return linhaEquacaoHTML(
            `${nomeI(t)} = -${nomeFonte(f1)} = -(${fmtPolar(f1.mag, f1.ang)}) = ${resultado}` +
            ' <span class="formula-nota">(compensação por código horário)</span>'
        );
    }
    const f1 = t.giro.fonte1;
    const f2 = t.giro.fonte2;
    return linhaEquacaoHTML(
        `${nomeI(t)} = ${nomeFonte(f1)} - ${nomeFonte(f2)} = (${fmtPolar(f1.mag, f1.ang)}) - (${fmtPolar(f2.mag, f2.ang)}) = ${resultado}` +
        ' <span class="formula-nota">(compensação por código horário)</span>'
    );
}

function giroExplicacoesHTML(termos) {
    return termos.map(giroExplicacaoHTML).join('');
}

// --- Fórmula algébrica (símbolos) ---------------------------------------

function idifAlgebricaHTML(config, termos) {
    if (config.modeloRele === 1) { // TD: (I × C) / TAP
        const partes = termos.map(t => fracaoHTML(`${nomeI(t)} × C<sub>${t.dev + 1}</sub>`, `TAP<sub>${t.dev + 1}</sub>`));
        return `I<sub>dif</sub> = ${absHTML(somaHTML(partes))}`;
    }
    // LD: I×C no enrolamento 1, (RTCdev/RTC1)×(I×C) nos demais, tudo / εTAP1
    const partes = [`${nomeI(termos[0])} × C<sub>1</sub>`];
    for (let i = 1; i < termos.length; i++) {
        const t = termos[i];
        partes.push(`${fracaoHTML(`RTC<sub>${t.dev + 1}</sub>`, 'RTC<sub>1</sub>')} × (${nomeI(t)} × C<sub>${t.dev + 1}</sub>)`);
    }
    return `I<sub>dif</sub> = ${fracaoHTML(absHTML(somaHTML(partes)), 'εTAP<sub>1</sub>')}`;
}

function ifrenAlgebricaHTML(config, termos) {
    if (config.modeloRele === 1) { // TD: |I × C / TAP|
        const partes = termos.map(t => absHTML(fracaoHTML(`${nomeI(t)} × C<sub>${t.dev + 1}</sub>`, `TAP<sub>${t.dev + 1}</sub>`)));
        return `I<sub>fren</sub> = ${fracaoHTML(somaHTML(partes), '2')}`;
    }
    // LD: |I×C| no enrolamento 1, (RTCdev/RTC1)×|I×C| nos demais, tudo / (2×εTAP1)
    const partes = [absHTML(`${nomeI(termos[0])} × C<sub>1</sub>`)];
    for (let i = 1; i < termos.length; i++) {
        const t = termos[i];
        partes.push(`${fracaoHTML(`RTC<sub>${t.dev + 1}</sub>`, 'RTC<sub>1</sub>')} × ${absHTML(`${nomeI(t)} × C<sub>${t.dev + 1}</sub>`)}`);
    }
    return `I<sub>fren</sub> = ${fracaoHTML(somaHTML(partes), '2 × εTAP<sub>1</sub>')}`;
}

// --- Fórmula substituída (valores numéricos) ----------------------------

function idifSubstituidaHTML(config, termos, enrolamentos, eTap1) {
    if (config.modeloRele === 1) { // TD
        const partes = termos.map(t => fracaoHTML(`${fmtPolar(t.mag, t.ang)} × ${fmtC(t.C)}`, fmt(t.tap)));
        return `I<sub>dif</sub> = ${absHTML(somaHTML(partes))}`;
    }
    // LD
    const partes = termos.map(t => t.dev === 0
        ? `(${fmtPolar(t.mag, t.ang)} × ${fmtC(t.C)})`
        : `${fracaoHTML(enrolamentos[t.dev].rtc, enrolamentos[0].rtc)} × (${fmtPolar(t.mag, t.ang)} × ${fmtC(t.C)})`);
    return `I<sub>dif</sub> = ${fracaoHTML(absHTML(somaHTML(partes)), fmt(eTap1))}`;
}

function ifrenSubstituidaHTML(config, termos, enrolamentos, eTap1) {
    if (config.modeloRele === 1) { // TD
        const partes = termos.map(t => absHTML(fracaoHTML(`${fmt(t.mod)} × ${fmtC(t.C)}`, fmt(t.tap))));
        return `I<sub>fren</sub> = ${fracaoHTML(somaHTML(partes), '2')}`;
    }
    // LD
    const partes = termos.map(t => t.dev === 0
        ? absHTML(`${fmt(t.mod)} × ${fmtC(t.C)}`)
        : `${fracaoHTML(enrolamentos[t.dev].rtc, enrolamentos[0].rtc)} × ${absHTML(`${fmt(t.mod)} × ${fmtC(t.C)}`)}`);
    return `I<sub>fren</sub> = ${fracaoHTML(somaHTML(partes), `2 × ${fmt(eTap1)}`)}`;
}

// Explica o filtro homopolar de um enrolamento: I0 = (Ia+Ib+Ic)/3 e, para cada
// fase, I' = I - I0. Mostrado só quando o filtro está ativo — é o que deixa
// claro por que, com as 3 correntes em fase (sequência zero pura), o termo
// vira "0∠0 - 0∠0" na explicação de compensação por código horário (a corrente
// usada ali já é a pós-filtro, que zerou antes de chegar no giro).
function filtroHomopolarHTML(info, nomeEnrol) {
    const i0 = fmtPolar(info.i0Mag, info.i0Ang);
    const linhas = [
        linhaEquacaoHTML(`I<sub>0</sub> = ${fracaoHTML('I<sub>a</sub> + I<sub>b</sub> + I<sub>c</sub>', '3')} = ${i0}`)
    ];
    info.fases.forEach(f => {
        linhas.push(linhaEquacaoHTML(
            `I<sub>${f.letra}</sub>′ = I<sub>${f.letra}</sub> - I<sub>0</sub> = ` +
            `(${fmtPolar(f.antesMag, f.antesAng)}) - (${i0}) = ${fmtPolar(f.depoisMag, f.depoisAng)}`
        ));
    });
    return formulaBoxHTML({ titulo: `Filtro Homopolar — ${nomeEnrol}`, linhas });
}

// --- Montagem dos resultados ---------------------------------------------

function exibirResultados(config, enrolamentos, taps, C, resultados, filtroHomopolarInfo = []) {
    let html = '<div class="resultados-87">';

    // Seção de TAPs calculados — a fórmula genérica entra na mesma fileira dos
    // cards por enrolamento (cards-lado-a-lado estica todos pra mesma altura)
    let tapSecao = '<div class="cards-lado-a-lado">';
    if (config.potencia === 0) {
        tapSecao += formulaBoxHTML({ linhas: ['<p><strong>TAP = Valor inserido pelo usuário</strong></p>'] });
    } else {
        tapSecao += formulaBoxHTML({ linhas: [linhaEquacaoHTML(`TAP = ${fracaoHTML('Potência × 1000', 'RTC × kV × √3')}`)] });
    }
    for (let i = 0; i < config.numEnrolamentos; i++) {
        let conteudo = `<p><strong>${enrolamentos[i].nome}:</strong></p>`;
        if (config.potencia !== 0) {
            conteudo += linhaEquacaoHTML(`TAP = ${fracaoHTML(`${config.potencia} × 1000`, `${enrolamentos[i].rtc} × ${enrolamentos[i].kv} × √3`)}`);
        }
        conteudo += `<p class="resultado-valor">TAP = ${taps[i].toFixed(3)} A</p>`;
        tapSecao += boxResultadoHTML(conteudo);
    }
    tapSecao += '</div>';
    html += secaoResultadoHTML('Cálculo dos TAPs', tapSecao);

    // Seção de Filtro Homopolar (só enrolamentos com o filtro ativo)
    if (filtroHomopolarInfo.length > 0) {
        let filtroSecao = '';
        filtroHomopolarInfo.forEach(info => {
            filtroSecao += boxResultadoHTML(filtroHomopolarHTML(info, enrolamentos[info.dev].nome));
        });
        html += secaoResultadoHTML('Filtro Homopolar', filtroSecao);
    }

    // Seção de Constantes C
    html += '<div class="resultado-secao">';
    html += '<h6 class="resultado-titulo">Constantes C (Fator de Correção)</h6>';
    html += '<div class="cards-lado-a-lado">';
    for (let i = 0; i < config.numEnrolamentos; i++) {
        let conexaoNome = '';
        if (enrolamentos[i].conexao === 'Y') conexaoNome = 'Y (Estrela)';
        else if (enrolamentos[i].conexao === 'D') conexaoNome = 'D (Delta)';
        else if (enrolamentos[i].conexao === 'Z') conexaoNome = 'Z (Zigzag)';

        html += boxResultadoHTML(
            `<p><strong>${enrolamentos[i].nome}</strong> (${conexaoNome}):</p>` +
            `<p class="resultado-valor">C = ${fmtCDestaque(C[i])}</p>`
        );
    }
    html += '</div>';
    html += '</div>';

    // Seção de Correntes Diferencial e Frenagem
    html += '<div class="resultado-secao">';
    html += '<h6 class="resultado-titulo">Correntes Diferencial e de Frenagem</h6>';

    const modeloNome = config.modeloRele === 1 ? 'EF TD' : 'EF LD';
    html += `<p><strong>Modelo de Relé:</strong> ${modeloNome}</p>`;

    ['A', 'B', 'C'].forEach(fase => {
        const faseKey = `fase${fase}`;
        const atua = resultados[faseKey].atua;
        const dif = resultados[faseKey].dif;
        const fren = resultados[faseKey].fren;

        let conteudo = `<h6>Fase ${fase} ` +
            `<span class="badge-atuacao ${atua ? 'badge-atua' : 'badge-nao-atua'}">${atua ? 'ATUA' : 'NÃO ATUA'}</span></h6>`;

        conteudo += '<div class="resumo-idif-ifren">';
        conteudo += `<span><strong>I<sub>dif</sub>:</strong> ${dif.valor.toFixed(4)} A</span>`;
        conteudo += `<span><strong>I<sub>fren</sub>:</strong> ${fren.valor.toFixed(4)} A</span>`;
        conteudo += '</div>';

        conteudo += '<div class="cards-lado-a-lado">';

        conteudo += formulaBoxHTML({
            titulo: 'Corrente Diferencial (I<sub>dif</sub>)',
            linhas: [
                linhaEquacaoHTML(idifAlgebricaHTML(config, dif.termos)),
                giroExplicacoesHTML(dif.termos),
                linhaEquacaoHTML(idifSubstituidaHTML(config, dif.termos, enrolamentos, dif.eTap1))
            ],
            resultado: `I<sub>dif</sub> = ${dif.valor.toFixed(4)} A`
        });

        conteudo += formulaBoxHTML({
            titulo: 'Corrente de Frenagem (I<sub>fren</sub>)',
            linhas: [
                linhaEquacaoHTML(ifrenAlgebricaHTML(config, fren.termos)),
                giroExplicacoesHTML(fren.termos),
                linhaEquacaoHTML(ifrenSubstituidaHTML(config, fren.termos, enrolamentos, fren.eTap1))
            ],
            resultado: `I<sub>fren</sub> = ${fren.valor.toFixed(4)} A`
        });

        conteudo += '</div>';

        html += boxResultadoHTML(conteudo, 'fase-box');
    });

    html += '</div>';

    html += '</div>';

    document.getElementById('resultados').innerHTML = html;
}
