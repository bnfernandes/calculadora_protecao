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
            const resultsArea = form.closest('.card').nextElementSibling.querySelector('.results-area');
            resultsArea.innerHTML = '<p class="text-center">Cálculo em desenvolvimento. Esta funcionalidade será implementada em breve.</p>';
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
});
