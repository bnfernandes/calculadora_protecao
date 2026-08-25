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
            window.print();
        });
    }
});

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
    if (campo.tagName === 'SELECT') {
        return campo.options[campo.selectedIndex] ? campo.options[campo.selectedIndex].text : '';
    }
    return campo.value !== '' ? campo.value : '—';
}

function construirTabelaParametrosHTML(form) {
    const grupos = [{ titulo: '', linhas: [] }];

    form.querySelectorAll('h4, h5, h6, .form-group').forEach(function(el) {
        if (el.tagName === 'H4' || el.tagName === 'H5' || el.tagName === 'H6') {
            grupos.push({ titulo: el.textContent.trim(), linhas: [] });
            return;
        }
        if (el.offsetParent === null) return; // campo oculto no momento (ex: seção condicional)

        const campo = el.querySelector('input, select');
        if (!campo) return;

        const labelEl = el.querySelector('label');
        const unidadeEl = el.querySelector('.input-group-text');
        grupos[grupos.length - 1].linhas.push({
            label: labelEl ? labelEl.innerHTML : '',
            valor: valorCampoImpressao(campo),
            unidade: unidadeEl ? unidadeEl.textContent.trim() : ''
        });
    });

    let html = '<table class="tabela-parametros-print">' +
        '<thead><tr><th>Ajuste</th><th>Valor</th><th>Unidade</th></tr></thead><tbody>';

    grupos.forEach(function(grupo) {
        if (grupo.linhas.length === 0) return;
        if (grupo.titulo) {
            html += '<tr class="tp-subtitulo"><td colspan="3">' + grupo.titulo + '</td></tr>';
        }
        grupo.linhas.forEach(function(l) {
            html += '<tr><td>' + l.label + '</td><td>' + l.valor + '</td><td>' + l.unidade + '</td></tr>';
        });
    });

    html += '</tbody></table>';
    return html;
}

function atualizarTabelasParametrosImpressao() {
    // Só nas páginas com o botão "Gerar PDF" (evita mexer na 21, em manutenção)
    if (!document.getElementById('btnGerarPdf')) return;

    document.querySelectorAll('.calc-form').forEach(function(form) {
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
