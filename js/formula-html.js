// formula-html.js - Helpers compartilhados para exibir resultados e fórmulas
// em HTML puro (sem LaTeX), com frações em duas linhas, reaproveitados pelas
// funções 51, 67 e 87 para manter a mesma aparência em todas as páginas.

// Fração em duas linhas: numerador em cima, traço, denominador embaixo.
// Aceita HTML como numerador/denominador (ex: com <sub>, ∠, etc.)
function fracaoHTML(numeradorHTML, denominadorHTML) {
    return `<span class="fraction"><span class="numerator">${numeradorHTML}</span><span class="denominator">${denominadorHTML}</span></span>`;
}

// Junta vários termos (texto ou frações) com " + " entre eles
function somaHTML(termosHTML) {
    return termosHTML.join(' + ');
}

// Envolve uma expressão com barras de valor absoluto que esticam até a altura
// total do conteúdo (como o |...| grande do LaTeX) — em vez de dois caracteres
// "|" na altura do texto, que ficam baixos demais quando o conteúdo tem uma
// fração em duas linhas
function absHTML(conteudoHTML) {
    return `<span class="abs"><span class="abs-barra"></span><span class="abs-conteudo">${conteudoHTML}</span><span class="abs-barra"></span></span>`;
}

// Uma linha de equação centralizada (algébrica ou substituída)
function linhaEquacaoHTML(conteudoHTML) {
    return `<div class="formula-equation">${conteudoHTML}</div>`;
}

// Monta o bloco de fórmula padrão: título opcional + linhas de equação
// (algébrica, substituída, ...) + resultado numérico final em destaque.
// linhas: array de strings HTML (cada uma já passada por linhaEquacaoHTML ou texto simples)
function formulaBoxHTML({ titulo, linhas = [], resultado }) {
    let html = '<div class="formula">';
    if (titulo) {
        html += `<div class="formula-title">${titulo}</div>`;
    }
    linhas.forEach(linha => {
        html += linha;
    });
    if (resultado) {
        html += `<p class="resultado-valor text-center">${resultado}</p>`;
    }
    html += '</div>';
    return html;
}

// Agrupa um bloco de resultados sob um título de seção
function secaoResultadoHTML(titulo, conteudoHTML) {
    return `<div class="resultado-secao"><h6 class="resultado-titulo">${titulo}</h6>${conteudoHTML}</div>`;
}

// Caixa simples de resultado (com destaque de borda opcional via classe extra)
function boxResultadoHTML(conteudoHTML, classeExtra = '') {
    return `<div class="resultado-box ${classeExtra}">${conteudoHTML}</div>`;
}

// Matriz com colchetes (usada pela página de Componentes Simétricas).
// linhas: array de arrays de células HTML, ex: [['1','1','1'],['1','a²','a'],['1','a','a²']]
function matrizHTML(linhas) {
    const linhasHTML = linhas.map(linha =>
        `<span class="matriz-linha">${linha.map(celula => `<span class="matriz-celula">${celula}</span>`).join('')}</span>`
    ).join('');
    return `<span class="matriz"><span class="matriz-colchete matriz-colchete-esq"></span><span class="matriz-corpo">${linhasHTML}</span><span class="matriz-colchete matriz-colchete-dir"></span></span>`;
}

window.fracaoHTML = fracaoHTML;
window.somaHTML = somaHTML;
window.absHTML = absHTML;
window.linhaEquacaoHTML = linhaEquacaoHTML;
window.formulaBoxHTML = formulaBoxHTML;
window.secaoResultadoHTML = secaoResultadoHTML;
window.boxResultadoHTML = boxResultadoHTML;
window.matrizHTML = matrizHTML;
