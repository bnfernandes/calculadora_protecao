// Funções de navegação
document.addEventListener('DOMContentLoaded', function() {
    // Manipulação do menu dropdown
    const dropdowns = document.querySelectorAll('.dropdown');
    
    // Adiciona funcionalidade de dropdown para dispositivos móveis
    if (window.innerWidth <= 768) {
        dropdowns.forEach(dropdown => {
            const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
            const dropdownContent = dropdown.querySelector('.dropdown-content');
            
            dropdownToggle.addEventListener('click', function(e) {
                e.preventDefault();
                dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
            });
        });
    }
    
    // Funções para os formulários de cálculo
    const calcForms = document.querySelectorAll('.calc-form');
    calcForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // A mensagem de cálculo em desenvolvimento será removida, pois a função 51 já está implementada.
        });
        
        const clearBtn = form.querySelector('.btn-secondary');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                form.reset();
                const resultsArea = form.closest('.card').nextElementSibling.querySelector('.results-area');
                resultsArea.innerHTML = '<p class="text-center text-muted">Os resultados do cálculo aparecerão aqui após o processamento.</p>';
            });
        }
    });

    // Botão "Gerar PDF": abre o diálogo de impressão do navegador (Salvar como PDF),
    // usando a folha de estilo @media print de css/styles.css
    const btnPdf = document.getElementById('btnGerarPdf');
    if (btnPdf) {
        btnPdf.addEventListener('click', function() {
            // Esconde as barras de zoom ANTES do print (nunca durante o
            // beforeprint — ver nota logo abaixo) e dá tempo do gráfico
            // redesenhar sem elas antes de abrir o diálogo de impressão
            alternarBarrasZoomImpressao(false);
            ajustarProporcaoGraficosImpressao();
            setTimeout(function() { window.print(); }, 250);
        });
    }

    criarBotaoVoltarAoTopo();
});

// Botão "voltar ao topo" ---------------------------------------------------
// Flutuante, injetado uma vez em toda página que carrega main.js (todas
// carregam) — em páginas de resultado longas (ex: 87 depois de calcular), o
// botão "Gerar PDF" fica lá no topo, longe de rolar de volta manualmente.
// Só aparece depois de rolar um pouco (fica fora do caminho perto do topo,
// onde o "Gerar PDF" de verdade já está à mão) e nunca aparece na impressão
// (ver @media print em styles.css).
function criarBotaoVoltarAoTopo() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'btnVoltarTopo';
    btn.className = 'btn-voltar-topo';
    btn.setAttribute('aria-label', 'Voltar ao topo');
    btn.textContent = '↑';
    document.body.appendChild(btn);

    btn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', function() {
        btn.classList.toggle('visivel', window.scrollY > 300);
    });
}

// Proporção dos gráficos na impressão -------------------------------------
// O CSS de impressão força os containers dos gráficos (ver styles.css) a
// width:100%/height:auto, pra caber na página impressa (mais estreita que a
// tela). Sem mais nada, isso deixaria a altura colapsar/ficar indefinida —
// dá pra calcular a proporção real de CADA gráfico (varia com a largura da
// tela de quem imprime) e fixá-la via aspect-ratio, aqui, uma única vez.
// chart.getWidth()/getHeight() são apenas leitura (ao contrário de
// setOption/resize, nunca tocam no gráfico), então não têm o risco de
// corromper o snapshot de impressão — mas por consistência com o resto do
// fluxo do botão "Gerar PDF", roda no click, nunca no beforeprint.
function ajustarProporcaoGraficosImpressao() {
    if (typeof echarts === 'undefined') return;
    document.querySelectorAll('[id]').forEach(function(el) {
        const chart = echarts.getInstanceByDom(el);
        if (!chart) return;
        const proporcao = chart.getWidth() + ' / ' + chart.getHeight();
        el.style.aspectRatio = proporcao;
        const wrapper = el.querySelector(':scope > div');
        if (wrapper) wrapper.style.aspectRatio = proporcao;
    });
}

// Nota: NÃO chamar chart.resize() em 'beforeprint'. Os containers dos gráficos
// têm max-width fixo e já ficam com o mesmo tamanho na tela e no papel, então o
// resize não muda nada de útil — mas force um redraw bem na hora do print e, em
// gráficos com imagem de fundo (ex: fasorial do 67, que carrega coordpolar.png),
// o canvas fica em branco no PDF porque o redraw não termina a tempo do
// snapshot de impressão. Testado empiricamente: sem o resize, os gráficos saem
// corretos no PDF; com ele, alguns saem em branco.

// Tabela de parâmetros para impressão -----------------------------------
// Em vez de imprimir o formulário interativo (inputs/selects grandes, um por
// linha), monta uma tabela compacta Ajuste/Valor/Unidade a partir dos campos
// atualmente visíveis do form — assim ela nunca fica desatualizada em relação
// aos campos reais de cada página, e respeita o que está oculto no momento
// (ex: Enrolamento 3 quando numEnrolamentos = 2).

function valorCampoImpressao(campo) {
    if (campo.type === 'checkbox') {
        return campo.checked ? 'Sim' : 'Não';
    }
    if (campo.tagName === 'SELECT') {
        return campo.options[campo.selectedIndex] ? campo.options[campo.selectedIndex].text : '';
    }
    return campo.value !== '' ? campo.value : '—';
}

function construirTabelaParametrosHTML(container) {
    // data-sem-coluna-unidade omite a coluna Unidade (usado onde a unidade já
    // está embutida na própria descrição do ajuste, ex: "TAP Enrol. 1 [A]") —
    // opt-in por container pra não afetar páginas que ainda dependem da coluna
    const semUnidade = container.hasAttribute('data-sem-coluna-unidade');
    const grupos = [{ titulo: '', linhas: [] }];

    container.querySelectorAll('h4, h5, h6, .form-group').forEach(function(el) {
        if (el.tagName === 'H4' || el.tagName === 'H5' || el.tagName === 'H6') {
            grupos.push({ titulo: el.textContent.trim(), linhas: [] });
            return;
        }
        if (el.offsetParent === null) return; // campo oculto no momento (ex: seção condicional)
        if (el.closest('[data-omitir-impressao]')) return; // opt-in: fora da tabela impressa (valor já mostrado nos Resultados)

        const campo = el.querySelector('input, select');
        if (!campo) return;

        const labelEl = el.querySelector('label');
        const unidadeEl = el.querySelector('.input-group-text');
        // data-label-impressao permite um texto mais curto só na tabela impressa
        // (ex: "Enrolamento" -> "Enrol."), sem mudar o label do formulário na tela
        grupos[grupos.length - 1].linhas.push({
            label: labelEl ? (labelEl.getAttribute('data-label-impressao') || labelEl.innerHTML) : '',
            valor: valorCampoImpressao(campo),
            unidade: unidadeEl ? unidadeEl.textContent.trim() : ''
        });
    });

    let html = '<table class="tabela-parametros-print">' +
        '<thead><tr><th>Ajuste</th><th>Valor</th>' + (semUnidade ? '' : '<th>Unidade</th>') + '</tr></thead><tbody>';

    grupos.forEach(function(grupo) {
        if (grupo.linhas.length === 0) return;
        if (grupo.titulo) {
            html += '<tr class="tp-subtitulo"><td colspan="' + (semUnidade ? 2 : 3) + '">' + grupo.titulo + '</td></tr>';
        }
        grupo.linhas.forEach(function(l) {
            html += '<tr><td>' + l.label + '</td><td>' + l.valor + '</td>' + (semUnidade ? '' : '<td>' + l.unidade + '</td>') + '</tr>';
        });
    });

    html += '</tbody></table>';
    return html;
}

function atualizarTabelasParametrosImpressao() {
    // Só nas páginas com o botão "Gerar PDF" (evita mexer na 21, em manutenção)
    if (!document.getElementById('btnGerarPdf')) return;

    // .calc-form (o formulário principal de cada página) e .grupo-impressao
    // (grupos de campos avulsos fora do formulário principal, como os da
    // Sugestão de Pontos de Teste na 87) recebem o mesmo tratamento — vira
    // uma tabela compacta na impressão, escondendo o original (ver CSS).
    document.querySelectorAll('.calc-form, .grupo-impressao').forEach(function(form) {
        const existente = form.nextElementSibling;
        if (existente && existente.classList.contains('tabela-parametros-print')) {
            existente.remove();
        }
        const wrapper = document.createElement('div');
        wrapper.innerHTML = construirTabelaParametrosHTML(form);
        form.insertAdjacentElement('afterend', wrapper.firstElementChild);
    });
}

window.addEventListener('beforeprint', atualizarTabelasParametrosImpressao);

// Barras de zoom (dataZoom tipo 'slider') na impressão -------------------
// No papel elas não servem pra nada (não dá pra arrastar), só ocupam espaço
// e confundem. Como fazem parte do canvas do ECharts, não dá pra esconder por
// CSS — precisa de um chart.setOption(). MAS: igual ao chart.resize(), fazer
// isso durante o 'beforeprint' quebra o snapshot de impressão (testado: o
// gráfico perde eixo, grade e título no PDF). Por isso só é chamado a partir
// do clique no botão "Gerar PDF" (com um pequeno atraso antes do print, pra
// dar tempo do redesenho terminar), nunca no evento beforeprint. No Ctrl+P
// manual (sem passar pelo botão) as barras continuam aparecendo — limitação
// aceitável frente ao risco de quebrar o PDF gerado pelo botão.
function alternarBarrasZoomImpressao(mostrar) {
    if (typeof echarts === 'undefined') return;
    document.querySelectorAll('[id]').forEach(function(el) {
        const chart = echarts.getInstanceByDom(el);
        if (!chart) return;
        const dataZoom = chart.getOption().dataZoom;
        if (!dataZoom || !dataZoom.some(function(dz) { return dz.type === 'slider'; })) return;
        chart.setOption({
            dataZoom: dataZoom.map(function(dz) { return dz.type === 'slider' ? { show: mostrar } : {}; })
        });
    });
}

window.addEventListener('afterprint', function() { alternarBarrasZoomImpressao(true); });
