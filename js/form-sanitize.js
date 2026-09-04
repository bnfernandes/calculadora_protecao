// form-sanitize.js - Em vez de bloquear o envio quando um campo numérico foge
// do mínimo/máximo/passo (restrições do IED), ajusta o valor automaticamente
// para o mais próximo permitido. Usado pelas Funções 51, 67 e 87.

// Ajusta um único campo: limita a [min, max] e arredonda para o degrau (step)
// mais próximo, alinhado a partir do mínimo (ou de 0, se não houver mínimo).
// Campos com o atributo data-ignorar-passo pulam só a parte do step - usado
// pela página de Componentes Simétricas, onde fase e sequência são
// matematicamente amarradas (editar uma recalcula a outra ao vivo); arredondar
// pro step no blur de QUALQUER um dos dois lados sobrescrevia silenciosamente
// o valor preciso que o usuário acabou de digitar no outro lado.
function sanitizarCampoNumerico(input) {
    if (input.value === '' || input.value === null) return;

    let valor = parseFloat(input.value);
    if (Number.isNaN(valor)) return;

    const min = input.min !== '' ? parseFloat(input.min) : null;
    const max = input.max !== '' ? parseFloat(input.max) : null;
    const step = input.step && input.step !== 'any' ? parseFloat(input.step) : null;
    const ignorarStep = input.hasAttribute('data-ignorar-passo');

    if (min !== null && valor < min) valor = min;
    if (max !== null && valor > max) valor = max;

    if (!ignorarStep && step !== null && step > 0) {
        const base = min !== null ? min : 0;
        valor = base + Math.round((valor - base) / step) * step;
        if (min !== null && valor < min) valor = min;
        if (max !== null && valor > max) valor = max;
    }

    // Evita ruído de ponto flutuante (ex: 5.130000000000001)
    valor = Math.round(valor * 1e6) / 1e6;

    if (valor !== parseFloat(input.value)) {
        input.value = valor;
    }
}

function sanitizarTodosCampos(formOuSeletor) {
    const form = typeof formOuSeletor === 'string' ? document.querySelector(formOuSeletor) : formOuSeletor;
    if (!form) return;
    form.querySelectorAll('input[type="number"]').forEach(sanitizarCampoNumerico);
}

// Corrige cada campo assim que o usuário sai dele (blur), além de desativar
// a validação nativa do navegador (que bloquearia o envio em vez de corrigir)
function ativarSanitizacaoFormulario(formOuSeletor) {
    const form = typeof formOuSeletor === 'string' ? document.querySelector(formOuSeletor) : formOuSeletor;
    if (!form) return;

    form.setAttribute('novalidate', '');
    form.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('blur', () => sanitizarCampoNumerico(input));
    });
}

window.sanitizarCampoNumerico = sanitizarCampoNumerico;
window.sanitizarTodosCampos = sanitizarTodosCampos;
window.ativarSanitizacaoFormulario = ativarSanitizacaoFormulario;
