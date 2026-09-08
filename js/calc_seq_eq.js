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

// Alinhamento estilo LaTeX \align: separa um valor em "antes do símbolo"
// (alinhado à direita) e "símbolo em diante" (alinhado à esquerda), cada
// metade num <span> próprio. Sozinho isso só alinha o texto DENTRO da célula
// — o efeito de coluna reta (mesma posição em todas as linhas/fases) só
// aparece depois que alinharColunasEquacoes mede a largura real de cada
// ".eq-antes" do mesmo grupo e aplica a maior como largura fixa em todos.
// indiceSimbolo < 0 (símbolo ausente, ex. o "-" da linha N) devolve o texto
// original, sem span.
function alinharPorSimboloHTML(texto, indiceSimbolo, grupo) {
    if (indiceSimbolo < 0) return texto;
    const antes = texto.slice(0, indiceSimbolo);
    const depois = texto.slice(indiceSimbolo);
    return `<span class="eq-alinhada"><span class="eq-antes" data-grupo-align="${grupo}">${antes}</span><span class="eq-depois">${depois}</span></span>`;
}

// Coluna "Seq" (s0/s1/s2, com o multiplicador "a"/"a²" antes quando houver,
// ex. "a² s1", ou "3" na linha N "3s0") — alinha pela letra "s". O espaco
// entre o multiplicador e o "s" (quando existe) vira nbsp (nao colapsa,
// diferente de um espaco comum nessa posicao - testado, largura zero, "a² "
// virava "a²" colado no "s1" seguinte). O nbsp fica DENTRO de "antes", nao
// em "depois": alinharColunasEquacoes so mede a largura de .eq-antes pra
// achar o valor compartilhado do grupo - um nbsp deixado em "depois" soma a
// propria largura por fora dessa conta, e so as linhas COM multiplicador
// ganhavam esse nbsp extra, ficando ~4px deslocadas das linhas sem
// multiplicador (mesmo com todos os .eq-antes ja com a largura "igual").
function alinharSeqHTML(texto) {
    const i = texto.indexOf('s');
    if (i < 0) return alinharPorSimboloHTML(texto, i, 'seq');
    let fimAntes = i;
    while (fimAntes > 0 && texto[fimAntes - 1] === ' ') fimAntes--;
    const antes = texto.slice(0, fimAntes) + (fimAntes < i ? ' ' : '');
    const depois = texto.slice(i);
    return `<span class="eq-alinhada"><span class="eq-antes" data-grupo-align="seq">${antes}</span><span class="eq-depois">${depois}</span></span>`;
}


// Coluna "Polar" (ex. "0.577∠150.000°") — alinha pelo "∠".
function alinharPolarHTML(texto) {
    return alinharPorSimboloHTML(texto, texto.indexOf('∠'), 'polar');
}

// Coluna "Retangular" (ex. "-0.500+j0.289") — alinha pelo sinal que liga ao
// "j" (não pelo "j" em si: a parte real também pode ter seu próprio "-" à
// frente, ex. "-0.500", que não deve entrar na metade alinhada).
function alinharRetangularHTML(texto) {
    return alinharPorSimboloHTML(texto, texto.search(/[+-]j/), 'retangular');
}

// Célula "Fasor" (polar numa linha, retangular embaixo, prefixada com "= ") —
// pedido do usuário: alinhar o "∠" da linha de cima com o sinal de "j" da
// linha de baixo, e isso vale pro grupo "fasor" inteiro (as 2 linhas de A, B
// e C juntas, não só dentro do mesmo fasor) — por isso as duas linhas usam o
// MESMO grupo de alinhamento ('fasor'), incluindo o "= " da 2ª linha dentro
// do próprio ".eq-antes" dela (senão esses 2 caracteres a mais desalinhavam
// a 2ª linha em relação à 1ª, que não tem esse prefixo).
function fasorAlinhadoHTML(fasor) {
    const polar = textoPolar(fasor);
    const retangular = textoRetangular(fasor);
    const linha1 = alinharPorSimboloHTML(polar, polar.indexOf('∠'), 'fasor');
    const iSinal = retangular.search(/[+-]j/);
    const linha2 = iSinal < 0
        ? `= ${retangular}`
        : `<span class="eq-alinhada"><span class="eq-antes" data-grupo-align="fasor">= ${retangular.slice(0, iSinal)}</span><span class="eq-depois">${retangular.slice(iSinal)}</span></span>`;
    return `${linha1}<br>${linha2}`;
}

// Mede a largura de cada ".eq-antes" já inserido no DOM (por grupo, ex.
// "seq"/"polar"/"retangular"/"fasor") e aplica a maior largura do grupo a
// todos os spans dele — é isso que transforma o alinhamento individual de
// cada célula (alinharPorSimboloHTML) num alinhamento reto por toda a coluna,
// olhando as fases A/B/C/N juntas. Precisa rodar DEPOIS do innerHTML ser
// atribuído (só então os spans existem pra medir), a cada vez que a tabela é
// re-renderizada (a página recalcula ao vivo a cada campo editado).
function alinharColunasEquacoes(containerId, grupos) {
    const container = document.getElementById(containerId);
    if (!container) return;
    // Largura em REM, não em px: um valor fixo em pixels (medido na escala
    // de tela, raiz a 16px) fica desproporcional quando a escala de fonte
    // muda depois (impressão redefine html{font-size:10px}, ver ESCALA DE
    // TEXTO em equations.css) — testado com um PDF real: o card de
    // "Substituição Numérica" ficava esticado, ocupando a largura toda do
    // card, com espaços enormes entre os termos (a largura em px continuava
    // a mesma, mas o texto ao redor encolheu). REM é relativo à RAIZ, então
    // o mesmo valor reescala sozinho, proporcionalmente, em qualquer escala
    // de fonte — sem precisar recalcular nada em JS (nem depender de quando
    // um evento como beforeprint dispara, que já se mostrou não confiável
    // pra isso, ver gradeAlinhadaHTML em formula-html.js).
    const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    grupos.forEach(grupo => {
        // .eq-antes (colunas da tabela, alinhamento à direita) e .eq-centro
        // (várias linhas de equação, alinhamento centralizado) usam o mesmo
        // mecanismo de medir-e-aplicar — só o CSS de cada classe muda como o
        // texto se posiciona dentro da largura já fixada.
        const spans = container.querySelectorAll(`.eq-antes[data-grupo-align="${grupo}"], .eq-centro[data-grupo-align="${grupo}"]`);
        if (spans.length === 0) return;
        spans.forEach(el => { el.style.width = 'auto'; });
        const largura = Math.max(...Array.from(spans).map(el => el.getBoundingClientRect().width));
        spans.forEach(el => { el.style.width = (largura / remPx) + 'rem'; });
    });
}

// Generaliza alinharPorSimboloHTML pra MAIS de uma âncora numa mesma linha —
// usado nas equações algébricas "fase = soma de termos" (ex.
// "A = s0 + s1 + s2", "B = s0 + a²·s1 + a·s2"): alinha o "=" e cada "+"
// entre várias linhas irmãs, com o texto de cada trecho ENTRE âncoras
// centralizado (diferente das colunas da tabela: aqui não há uma borda de
// referência natural de cada lado, então centralizar é o que mais se
// aproxima do \begin{align} do LaTeX). ancoras: array de strings na ordem
// em que aparecem na linha (repetição permitida, ex. ['=', '+', '+']).
function dividirPorAncorasHTML(texto, ancoras) {
    const partes = [];
    let pos = 0;
    ancoras.forEach(ancora => {
        const i = texto.indexOf(ancora, pos);
        partes.push(texto.slice(pos, i).trim());
        partes.push(ancora);
        pos = i + ancora.length;
    });
    partes.push(texto.slice(pos).trim());
    return partes; // [trecho0, ancora0, trecho1, ancora1, ..., trechoN]
}

// grupo: nome do grupo de alinhamento — TODOS os trechos (posições pares do
// array de dividirPorAncorasHTML) usam o MESMO grupo, não um por trecho —
// pedido do usuário: em vez de cada trecho ter sua própria largura (curto
// onde o conteúdo é curto, ex. "s0"), todos ficam do tamanho do maior
// trecho entre TODOS eles (pior caso), então a distância entre cada par de
// âncoras vizinhas fica igual.
// prefixoLivre: quando true, o 1º trecho (antes da 1ª âncora) fica de fora
// do alinhamento — usado em equações tipo "s0 = 1/3(A + B + C)": esse
// trecho inclui o rótulo e a fração 1/3, conteúdo bem diferente (e maior)
// dos termos entre parênteses, então não faz sentido forçá-lo à mesma
// largura pequena de "A"/"B"/"C" — fica como já era montado, sem span.
// sufixoLivre: mesma ideia pro ÚLTIMO trecho (depois da última âncora) —
// usado quando esse trecho é sempre vazio (nada depois do ")" final): sem
// isso, um trecho vazio ainda entraria no grupo e seria esticado até a
// largura compartilhada, sobrando um vão em branco depois do ")".
function alinharPorVariasAncorasHTML(texto, ancoras, grupo, prefixoLivre = false, sufixoLivre = false) {
    const partes = dividirPorAncorasHTML(texto, ancoras);
    const ultimoIndice = partes.length - 1;
    return partes.map((parte, i) => {
        if (i % 2 !== 0) return ` ${parte} `;
        if (prefixoLivre && i === 0) return parte;
        if (sufixoLivre && i === ultimoIndice) return parte;
        return `<span class="eq-centro" data-grupo-align="${grupo}">${parte}</span>`;
    }).join('');
}

// Monta uma equação "grande" (substituição numérica) como pares
// [rótulo, termo] — ex. [["A =", term1], ["+", term2], ["+", term3]]. No
// desktop o container é só "inline" (sem efeito: cai tudo numa linha só,
// na ordem normal - "A = term1 + term2 + term3"). No celular (telas
// estreitas, ver .eq-termos-empilhaveis em equations.css), vira uma grid
// de 2 colunas (rótulo | termo): cada par vira uma linha, com o 1º termo
// ao lado do "=" (não sozinho) e os seguintes ao lado do "+" — como a
// coluna do termo é a MESMA em todas as linhas da grid, o próprio CSS
// Grid alinha os termos entre si (2º embaixo do 1º, etc.) sem precisar
// medir nada em JS.
// cadaTermoAlinhado: true quando cada termo já tem seu PRÓPRIO alinhamento
// por largura entre as linhas irmãs (A/B/C ou s0/s1/s2), ex. "subfase" —
// nesse caso cada termo vira um .eq-centro com o grupo; false quando só o
// CONTEXTO inteiro alinha (ex. "subseq", que só alinha o "(" ")" mais
// externos) — nesse caso os termos ficam soltos (.eq-termo, sem grupo) e é
// o container INTEIRO (não cada termo) que vira o .eq-centro medido.
function gradeTermosHTML(pares, grupo, cadaTermoAlinhado) {
    const linhas = pares.map(([rotulo, termo]) => {
        const termoHTML = cadaTermoAlinhado
            ? `<span class="eq-centro" data-grupo-align="${grupo}">${termo}</span>`
            : `<span class="eq-termo">${termo}</span>`;
        return `<span class="eq-termo-rotulo">${rotulo}</span>${termoHTML}`;
    }).join('');
    // Testado empiricamente (versão anterior): aninhar o container
    // empilhável DENTRO de um .eq-centro à parte cria uma dependência
    // circular de tamanho entre os dois (o navegador encolhia a "coluna"
    // bem mais estreita do que qualquer termo precisa). Por isso, quando o
    // alinhamento é do container inteiro (!cadaTermoAlinhado), o grupo vai
    // direto nele — mesmo elemento, não um filho separado.
    const classes = cadaTermoAlinhado ? 'eq-termos-empilhaveis' : 'eq-termos-empilhaveis eq-centro';
    const dataAttr = cadaTermoAlinhado ? '' : ` data-grupo-align="${grupo}"`;
    return `<span class="${classes}"${dataAttr}>${linhas}</span>`;
}

// Decide, PRA CADA equação "empilhável" (ver gradeTermosHTML), se ela
// precisa da classe .eq-empilhado (grid, 1 termo por linha — ver
// equations.css) — não por um breakpoint fixo de largura de tela, mas
// medindo se ESSA equação específica cabe numa linha só no espaço
// realmente disponível. Cobre os dois casos que o usuário pediu junto
// (tela estreita OU equação grande) com o mesmo critério, sem depender de
// nenhum número de pixel — e sem tocar em nenhum outro componente do
// site, que continua nos próprios breakpoints.
//
// Método: força white-space:nowrap por um instante só pra medir a largura
// que a linha PRECISARIA pra caber inteira sem quebrar (scrollWidth), e
// compara com o espaço que ela REALMENTE tem disponível (clientWidth). Se
// precisar de mais do que tem, ativa o grid; a marca de "medir sem
// quebrar" é desfeita antes de continuar (senão a própria medição forçaria
// a linha a nunca quebrar de verdade). O bloco vive dentro de uma célula da
// grade externa (.eq-linha-conteudo, ver gradeAlinhadaHTML em
// formula-html.js) — o pai direto (bloco.parentElement) é a "linha" certa
// a medir.
function ajustarEmpilhamentoEquacoes(containerId) {
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

// Um <tbody> por fase: rowspan="3" nas colunas Fase/Fasor da 1ª linha do
// grupo (mesmo padrão de js/calc_87_pontos_teste.js), com os 3 termos
// rotacionados (s0/s1/s2, já com a anotação "a"/"a²" certa para ABC ou ACB -
// ver calc_seq.js) nas 3 linhas do grupo. Único lugar do site com uma coluna
// "Fase" à parte (nas demais tabelas — 67, 87, 21 — a letra vai embutida no
// rótulo do próprio valor, ex. "I_a = ..."): aqui cada grupo tem 3 linhas
// (não 1), então uma coluna dedicada ajuda a identificar o grupo de relance,
// em vez de depender só do texto dentro da célula de Fasor.
function construirGrupoFase(letra, fasorOriginal, termos) {
    const nomesBase = ['s0', 's1', 's2'];
    let html = '<tbody>';
    termos.forEach((t, i) => {
        const rotulo = t.anotacao ? `${t.anotacao} ${nomesBase[i]}` : nomesBase[i];
        html += `<tr${i === 0 ? ' class="linha-novo-ponto"' : ''}>`;
        if (i === 0) {
            html += `<td class="col-fase" rowspan="3">${letra}</td>` +
                `<td rowspan="3">${fasorAlinhadoHTML(fasorOriginal)}</td>`;
        }
        html += `<td>${alinharSeqHTML(rotulo)}</td><td>${alinharPolarHTML(textoPolar(t.fasor))}</td><td>${alinharRetangularHTML(textoRetangular(t.fasor))}</td></tr>`;
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
    html += '<thead><tr><th class="col-fase">Fase</th><th>Fasor</th><th>Seq</th><th>Polar</th><th>Retangular</th></tr></thead>';
    html += construirGrupoFase('A', dados.A, dados.termosA);
    html += construirGrupoFase('B', dados.B, dados.termosB);
    html += construirGrupoFase('C', dados.C, dados.termosC);

    const tresSeq0 = dados.seq0.escalar(3);
    html += `<tbody><tr class="linha-novo-ponto"><td class="col-fase">N</td><td>-</td><td>${alinharSeqHTML('3s0')}</td><td>${alinharPolarHTML(textoPolar(tresSeq0))}</td><td>${alinharRetangularHTML(textoRetangular(tresSeq0))}</td></tr></tbody>`;
    html += '</table></div>';

    container.innerHTML = html;
    alinharColunasEquacoes('tabela-componentes-container', ['seq', 'polar', 'retangular', 'fasor']);
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
    const linha = alinharPorVariasAncorasHTML(`${letra} = ${alg}`, ['=', '+', '+'], 'algfase');
    return linhaEquacaoHTML(linha);
}

// Idem construirLinhaAlgebricaFase, na direção "seq = 1/3 x soma de termos
// de fase" - a base (rotulo: 'A'/'B'/'C') de dados.termosSeq0/1/2 já varia
// corretamente com ABC/ACB.
function construirLinhaAlgebricaSeq(indice, dados) {
    const nome = NOMES_SEQ[indice];
    const termos = [dados.termosSeq0, dados.termosSeq1, dados.termosSeq2][indice];
    const alg = termos.map(t => t.anotacao ? `${t.anotacao}·${t.rotulo}` : t.rotulo).join(' + ');
    // Diferente da versão numérica (construirLinhasSeq): aqui os termos são
    // só letras/multiplicador curtos ("A", "a²·B"), sem parênteses próprios
    // — a busca sequencial de âncoras (alinharPorVariasAncorasHTML) não se
    // confunde como se confundia lá, então dá pra alinhar cada "+"
    // individualmente sem o risco de vão grande (a variação de largura
    // entre os termos é pequena o bastante pra não incomodar, como já
    // acontece em construirLinhaAlgebricaFase).
    const texto = `${nome} = ${fracaoHTML('1', '3')}(${alg})`;
    const linha = alinharPorVariasAncorasHTML(texto, ['(', '+', '+', ')'], 'algseq', true, true);
    return linhaEquacaoHTML(linha);
}

// Linha substituída + resultado (com a igualdade repetida, ex:
// "A = 3.000∠120.000°") de "fase = soma de termos de seq" (ex:
// B = s0 + a²·s1 + a·s2) - termos vem de dados.termosA/B/C, cuja base é
// sempre s0/s1/s2 nessa ordem fixa (não depende de ABC/ACB). Só a forma
// numérica - a algébrica já está na equação matricial acima.
function construirLinhasFase(letra, dados) {
    const termos = dados['termos' + letra];
    const basesCruas = [dados.seq0, dados.seq1, dados.seq2];
    const termosTexto = termos.map((t, i) => {
        const valor = `(${textoPolar(basesCruas[i])})`;
        return t.anotacao ? `${t.anotacao}·${valor}` : valor;
    });

    // 1º termo ao lado do "=", os demais ao lado do "+" — cada um alinhado
    // com o termo de cima (grupo "subfase") via grid no celular (ver
    // gradeTermosHTML). O rótulo "A =" não entra no 1º par aqui (fica
    // vazio): quem fornece "A =" é a grade externa (gradeAlinhadaHTML, em
    // formula-html.js), compartilhada com a linha de resposta logo abaixo —
    // assim as duas ficam com o "=" garantidamente na mesma coluna,
    // resolvido só por CSS Grid, sem depender de nenhuma medição em JS (ver
    // .eq-grade-igual em equations.css pro motivo).
    const pares = [['', termosTexto[0]], ['+', termosTexto[1]], ['+', termosTexto[2]]];
    const linhaLonga = gradeTermosHTML(pares, 'subfase', true);

    return [gradeAlinhadaHTML([
        { rotulo: `${letra} =`, conteudo: linhaLonga },
        { rotulo: `${letra} =`, conteudo: textoPolar(dados[letra]), resultado: true }
    ])];
}

// Mesma ideia de construirLinhasFase, na direção "seq = 1/3 x soma de termos
// de fase" (ex: s1 = 1/3(A + a·C + a²·B) para ACB) - termos vem de
// dados.termosSeq0/1/2, cuja base (rotulo: 'A'/'B'/'C') varia com ABC/ACB.
function construirLinhasSeq(indice, dados) {
    const nome = NOMES_SEQ[indice];
    const resultado = [dados.seq0, dados.seq1, dados.seq2][indice];
    const termos = [dados.termosSeq0, dados.termosSeq1, dados.termosSeq2][indice];
    const mapaFases = { A: dados.A, B: dados.B, C: dados.C };
    const termosTexto = termos.map(t => {
        const valor = `(${textoPolar(mapaFases[t.rotulo])})`;
        return t.anotacao ? `${t.anotacao}·${valor}` : valor;
    });

    // Só o "(" e o ")" mais externos alinham entre s0/s1/s2 (grupo próprio
    // "subseq" — termos numéricos bem mais largos que os da versão
    // simbólica, "algseq"): o "(" vai junto do rótulo da 1ª linha (com a
    // fração 1/3), o ")" junto do último termo — o conteúdo entre eles fica
    // solto (sem alinhamento por "+" individual), só o container inteiro
    // (não cada termo) que alinha entre s0/s1/s2. O rótulo "s0 =" também
    // não entra no 1º par aqui (só a fração e o "("): quem fornece "s0 =" é
    // a grade externa (gradeAlinhadaHTML), compartilhada com a linha de
    // resposta logo abaixo — mesmo motivo de construirLinhasFase.
    const pares = [
        [`${fracaoHTML('1', '3')} (`, termosTexto[0]],
        ['+', termosTexto[1]],
        ['+', `${termosTexto[2]})`]
    ];
    const linhaLonga = gradeTermosHTML(pares, 'subseq', false);

    return [gradeAlinhadaHTML([
        { rotulo: `${nome} =`, conteudo: linhaLonga },
        { rotulo: `${nome} =`, conteudo: textoPolar(resultado), resultado: true }
    ])];
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
    const vetorAbc = vetorColuna(['A', 'B', 'C']);
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
    alinharColunasEquacoes('equacoes-container', ['algfase', 'algseq', 'subfase', 'subseq']);
    reajustarEquacoesImpressaoSeq();
}

function reajustarEquacoesImpressaoSeq() {
    if (!document.getElementById('equacoes-container')) return;
    ajustarEmpilhamentoEquacoes('equacoes-container');
}

// Reagir a redimensionamento/rotação: o critério de empilhar (ver
// ajustarEmpilhamentoEquacoes) depende do espaço realmente disponível, não
// de um breakpoint fixo — se a janela mudar de tamanho, a decisão pode
// mudar também. Só reajusta o que já está na tela (não recalcula os
// valores do zero, não precisa dos dados de novo) — as larguras fixas de
// alinharColunasEquacoes não precisam ser remedidas: dependem do TEXTO de
// cada termo, que não muda com o redimensionamento, só ficam ocultas atrás
// do "width:auto !important" de .eq-empilhado enquanto ele estiver ativo.
// Não precisa de listener de beforeprint/afterprint aqui: o alinhamento do
// "=" da resposta (equação numérica → resultado) é resolvido só por CSS
// Grid (gradeAlinhadaHTML, formula-html.js — ver .eq-grade-igual em
// equations.css), que não depende de JS nem de quando um evento dispara —
// só essa decisão de empilhar os termos por falta de espaço depende de
// medir a largura disponível, e reagir ao resize já cobre isso.
let resizeEquacoesTimeoutId = null;
window.addEventListener('resize', function() {
    clearTimeout(resizeEquacoesTimeoutId);
    resizeEquacoesTimeoutId = setTimeout(reajustarEquacoesImpressaoSeq, 150);
});

window.renderizarSequenciaAtiva = renderizarSequenciaAtiva;
window.renderizarTabelaComponentes = renderizarTabelaComponentes;
window.renderizarEquacoes = renderizarEquacoes;
