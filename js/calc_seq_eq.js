// calc_seq_eq.js - Componentes Simétricas: tabela de decomposição por fase
// (ao vivo) e seção de equações (matricial + numérica, só ao clicar em
// "Calcular" - ver calc_seq.js), usando os helpers de formula-html.js.

function textoPolar(fasor) {
    return `${fasor.magnitude().toFixed(3)}∠${fasor.angulo().toFixed(3)}°`;
}

function textoRetangular(fasor) {
    const sinal = fasor.imag >= 0 ? '+' : '-';
    return `${fasor.real.toFixed(3)}${sinal}j${Math.abs(fasor.imag).toFixed(3)}`;
}

// Um <tbody> por fase: rowspan="3" nas colunas Fase/Fasor da 1ª linha do
// grupo (mesmo padrão de js/calc_87_pontos_teste.js), com os 3 termos
// rotacionados (s0/s1/s2, já com a anotação "a"/"a²" certa para ABC ou ACB -
// ver calc_seq.js) nas 3 linhas do grupo.
function construirGrupoFase(letra, fasorOriginal, termos) {
    const nomesBase = ['s0', 's1', 's2'];
    let html = '<tbody>';
    termos.forEach((t, i) => {
        const rotulo = t.anotacao ? `${nomesBase[i]} ${t.anotacao}` : nomesBase[i];
        html += `<tr${i === 0 ? ' class="linha-novo-ponto"' : ''}>`;
        if (i === 0) {
            html += `<td rowspan="3">${letra}</td>` +
                `<td rowspan="3">${textoPolar(fasorOriginal)}<br>= ${textoRetangular(fasorOriginal)}</td>`;
        }
        html += `<td>${rotulo}</td><td>${textoPolar(t.fasor)}</td><td>${textoRetangular(t.fasor)}</td></tr>`;
    });
    html += '</tbody>';
    return html;
}

// Mostrado nos resultados (tela e impressão) porque a sequência de fases
// (ABC/ACB) muda a matriz de transformação A - com o card "Parâmetros de
// Entrada" oculto na impressão, essa é a única indicação de qual convenção
// gerou a matriz/tabela exibidas.
function renderizarSequenciaAtiva(dados) {
    const container = document.getElementById('sequencia-ativa');
    if (!container) return;
    container.innerHTML = `<strong>Sequência de Fases: ${dados.sequencia}</strong>`;
}

function renderizarTabelaComponentes(dados) {
    const container = document.getElementById('tabela-componentes-container');
    if (!container) return;

    let html = '<div class="table-responsive"><table class="tabela-pontos-teste">';
    html += '<thead><tr><th>Fase</th><th>Fasor</th><th>Seq</th><th>Polar</th><th>Retangular</th></tr></thead>';
    html += construirGrupoFase('A', dados.A, dados.termosA);
    html += construirGrupoFase('B', dados.B, dados.termosB);
    html += construirGrupoFase('C', dados.C, dados.termosC);

    const tresSeq0 = dados.seq0.escalar(3);
    html += `<tbody><tr class="linha-novo-ponto"><td>N</td><td>-</td><td>3s0</td><td>${textoPolar(tresSeq0)}</td><td>${textoRetangular(tresSeq0)}</td></tr></tbody>`;
    html += '</table></div>';

    container.innerHTML = html;
}

// --- Seção de equações (botão "Calcular") ---

const NOMES_SEQ = ['s0', 's1', 's2'];

function vetorColuna(nomes) {
    return matrizHTML(nomes.map(n => [n]));
}

// Linha algébrica "fase = soma de termos de seq" (ex: B = s0 + a²·s1 + a·s2)
// - só a estrutura/anotação de dados.termosA/B/C importa aqui, não os
// valores; usada pra expandir a matriz em 3 equações escalares, dentro do
// próprio card "Equação Matricial".
function construirLinhaAlgebricaFase(letra, dados) {
    const termos = dados['termos' + letra];
    const alg = termos.map((t, i) => t.anotacao ? `${t.anotacao}·${NOMES_SEQ[i]}` : NOMES_SEQ[i]).join(' + ');
    return linhaEquacaoHTML(`${letra} = ${alg}`);
}

// Idem construirLinhaAlgebricaFase, na direção "seq = 1/3 x soma de termos
// de fase" - a base (rotulo: 'A'/'B'/'C') de dados.termosSeq0/1/2 já varia
// corretamente com ABC/ACB.
function construirLinhaAlgebricaSeq(indice, dados) {
    const nome = NOMES_SEQ[indice];
    const termos = [dados.termosSeq0, dados.termosSeq1, dados.termosSeq2][indice];
    const alg = termos.map(t => t.anotacao ? `${t.anotacao}·${t.rotulo}` : t.rotulo).join(' + ');
    return linhaEquacaoHTML(`${nome} = ${fracaoHTML('1', '3')}(${alg})`);
}

// Linha substituída + resultado (com a igualdade repetida, ex:
// "A = 3.000∠120.000°") de "fase = soma de termos de seq" (ex:
// B = s0 + a²·s1 + a·s2) - termos vem de dados.termosA/B/C, cuja base é
// sempre s0/s1/s2 nessa ordem fixa (não depende de ABC/ACB). Só a forma
// numérica - a algébrica já está na equação matricial acima.
function construirLinhasFase(letra, dados) {
    const termos = dados['termos' + letra];
    const basesCruas = [dados.seq0, dados.seq1, dados.seq2];
    const sub = termos.map((t, i) => {
        const valor = `(${textoPolar(basesCruas[i])})`;
        return t.anotacao ? `${t.anotacao}·${valor}` : valor;
    }).join(' + ');

    return [
        linhaEquacaoHTML(`${letra} = ${sub}`),
        `<p class="resultado-valor text-center">${letra} = ${textoPolar(dados[letra])}</p>`
    ];
}

// Mesma ideia de construirLinhasFase, na direção "seq = 1/3 x soma de termos
// de fase" (ex: s1 = 1/3(A + a·C + a²·B) para ACB) - termos vem de
// dados.termosSeq0/1/2, cuja base (rotulo: 'A'/'B'/'C') varia com ABC/ACB.
function construirLinhasSeq(indice, dados) {
    const nome = NOMES_SEQ[indice];
    const resultado = [dados.seq0, dados.seq1, dados.seq2][indice];
    const termos = [dados.termosSeq0, dados.termosSeq1, dados.termosSeq2][indice];
    const mapaFases = { A: dados.A, B: dados.B, C: dados.C };
    const sub = termos.map(t => {
        const valor = `(${textoPolar(mapaFases[t.rotulo])})`;
        return t.anotacao ? `${t.anotacao}·${valor}` : valor;
    }).join(' + ');

    return [
        linhaEquacaoHTML(`${nome} = ${fracaoHTML('1', '3')}(${sub})`),
        `<p class="resultado-valor text-center">${nome} = ${textoPolar(resultado)}</p>`
    ];
}

function renderizarEquacoes(dados) {
    const container = document.getElementById('equacoes-container');
    if (!container) return;

    const acb = dados.sequencia === 'ACB';
    const matrizA = matrizHTML(acb
        ? [['1', '1', '1'], ['1', 'a', 'a²'], ['1', 'a²', 'a']]
        : [['1', '1', '1'], ['1', 'a²', 'a'], ['1', 'a', 'a²']]);
    const matrizInv = matrizHTML(acb
        ? [['1', '1', '1'], ['1', 'a²', 'a'], ['1', 'a', 'a²']]
        : [['1', '1', '1'], ['1', 'a', 'a²'], ['1', 'a²', 'a']]);
    const vetorAbc = vetorColuna(['a', 'b', 'c']);
    const vetorSeq = vetorColuna(['s0', 's1', 's2']);

    let html = '';

    html += secaoResultadoHTML('Fases em Função das Componentes Simétricas',
        formulaBoxHTML({
            titulo: 'Equação Matricial',
            linhas: [
                linhaEquacaoHTML(`${vetorAbc} = ${matrizA} · ${vetorSeq}`),
                linhaEquacaoHTML('a = 1∠120° = -0.500 + j0.866'),
                construirLinhaAlgebricaFase('A', dados),
                construirLinhaAlgebricaFase('B', dados),
                construirLinhaAlgebricaFase('C', dados)
            ]
        }) +
        formulaBoxHTML({
            titulo: 'Substituição Numérica',
            linhas: [
                ...construirLinhasFase('A', dados),
                ...construirLinhasFase('B', dados),
                ...construirLinhasFase('C', dados)
            ]
        })
    );

    html += secaoResultadoHTML('Componentes Simétricas em Função das Fases',
        formulaBoxHTML({
            titulo: 'Equação Matricial',
            linhas: [
                linhaEquacaoHTML(`${vetorSeq} = ${fracaoHTML('1', '3')} ${matrizInv} · ${vetorAbc}`),
                construirLinhaAlgebricaSeq(0, dados),
                construirLinhaAlgebricaSeq(1, dados),
                construirLinhaAlgebricaSeq(2, dados)
            ]
        }) +
        formulaBoxHTML({
            titulo: 'Substituição Numérica',
            linhas: [
                ...construirLinhasSeq(0, dados),
                ...construirLinhasSeq(1, dados),
                ...construirLinhasSeq(2, dados)
            ]
        })
    );

    container.innerHTML = html;
}

window.renderizarSequenciaAtiva = renderizarSequenciaAtiva;
window.renderizarTabelaComponentes = renderizarTabelaComponentes;
window.renderizarEquacoes = renderizarEquacoes;
