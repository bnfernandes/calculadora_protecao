// calc_87_eq.js - Exibição de Resultados e Fórmulas (Função 87)

function exibirResultados(config, enrolamentos, taps, C, resultados) {
    let html = '<div class="resultados-87">';

    // Seção de TAPs calculados
    html += '<div class="resultado-secao">';
    html += '<h6 class="resultado-titulo">Cálculo dos TAPs</h6>';
    
    if (config.potencia === 0) {
        html += '<div class="formula-box">';
        html += '<p><strong>TAP = Valor inserido pelo usuário</strong></p>';
        html += '</div>';
    } else {
        html += '<div class="formula-box">';
        html += '<p><strong>Fórmula:</strong> TAP = (Potência × 1000) / (RTC × kV × √3)</p>';
        html += '</div>';
    }

    for (let i = 0; i < config.numEnrolamentos; i++) {
        html += '<div class="resultado-box">';
        html += `<p><strong>${enrolamentos[i].nome}:</strong></p>`;
        if (config.potencia !== 0) {
            html += `<p class="formula-detalhe">TAP = (${config.potencia} × 1000) / (${enrolamentos[i].rtc} × ${enrolamentos[i].kv} × √3)</p>`;
        }
        html += `<p class="resultado-valor">TAP = ${taps[i].toFixed(3)} A</p>`;
        html += '</div>';
    }
    html += '</div>';

    // Seção de Constantes C
    html += '<div class="resultado-secao">';
    html += '<h6 class="resultado-titulo">Constantes C (Fator de Correção)</h6>';
    for (let i = 0; i < config.numEnrolamentos; i++) {
        const conexaoNome = ['', 'Y (Estrela)', 'D (Delta)', 'Z (Zigzag)'][enrolamentos[i].conexao];
        html += '<div class="resultado-box">';
        html += `<p><strong>${enrolamentos[i].nome}</strong> (${conexaoNome}):</p>`;
        html += `<p class="resultado-valor">C = ${C[i].toFixed(4)}</p>`;
        html += '</div>';
    }
    html += '</div>';

    // Seção de Correntes Diferencial e Frenagem
    html += '<div class="resultado-secao">';
    html += '<h6 class="resultado-titulo">Correntes Diferencial e de Frenagem</h6>';
    
    const modeloNome = config.modeloRele === 1 ? 'EF TD' : 'EF LD';
    html += `<p><strong>Modelo de Relé:</strong> ${modeloNome}</p>`;

    ['A', 'B', 'C'].forEach((fase, idx) => {
        const faseKey = `fase${fase}`;
        html += '<div class="resultado-box fase-box">';
        html += `<h6>Fase ${fase}</h6>`;
        
        // Fórmula da Corrente Diferencial
        html += '<div class="formula-box mt-3">';
        html += '<p><strong>Corrente Diferencial (I<sub>dif</sub>):</strong></p>';
        if (config.modeloRele === 'TD') {
            html += '<p class="formula-detalhe">I<sub>dif</sub> = |(Σ I<sub>enrol</sub> × C / TAP)|</p>';
            html += '<p class="formula-detalhe">I<sub>dif</sub> = |(I<sub>1</sub> × C<sub>1</sub> / TAP<sub>1</sub>) + (I<sub>2</sub> × C<sub>2</sub> / TAP<sub>2</sub>)';
            if (config.numEnrolamentos === 3) {
                html += ' + (I<sub>3</sub> × C<sub>3</sub> / TAP<sub>3</sub>)';
            }
            html += '|</p>';
        } else {
            html += '<p class="formula-detalhe">I<sub>dif</sub> = |(I<sub>1</sub> × C<sub>1</sub>) + (RTC<sub>2</sub>/RTC<sub>1</sub>) × (I<sub>2</sub> × C<sub>2</sub>)';
            if (config.numEnrolamentos === 3) {
                html += ' + (RTC<sub>3</sub>/RTC<sub>1</sub>) × (I<sub>3</sub> × C<sub>3</sub>)';
            }
            html += '| / εTAP<sub>1</sub></p>';
        }
        html += `<p class="resultado-valor">I<sub>dif</sub> = ${resultados[faseKey].idif.toFixed(4)} A</p>`;
        html += '</div>';
        
        // Fórmula da Corrente de Frenagem
        html += '<div class="formula-box mt-3">';
        html += '<p><strong>Corrente de Frenagem (I<sub>fren</sub>):</strong></p>';
        if (config.modeloRele === 'TD') {
            html += '<p class="formula-detalhe">I<sub>fren</sub> = (Σ |I<sub>enrol</sub> × C / TAP|) / 2</p>';
            html += '<p class="formula-detalhe">I<sub>fren</sub> = (|I<sub>1</sub> × C<sub>1</sub> / TAP<sub>1</sub>| + |I<sub>2</sub> × C<sub>2</sub> / TAP<sub>2</sub>|';
            if (config.numEnrolamentos === 3) {
                html += ' + |I<sub>3</sub> × C<sub>3</sub> / TAP<sub>3</sub>|';
            }
            html += ') / 2</p>';
        } else {
            html += '<p class="formula-detalhe">I<sub>fren</sub> = (|I<sub>1</sub> × C<sub>1</sub>| + (RTC<sub>2</sub>/RTC<sub>1</sub>) × |I<sub>2</sub> × C<sub>2</sub>|';
            if (config.numEnrolamentos === 3) {
                html += ' + (RTC<sub>3</sub>/RTC<sub>1</sub>) × |I<sub>3</sub> × C<sub>3</sub>|';
            }
            html += ') / (2 × εTAP<sub>1</sub>)</p>';
        }
        html += `<p class="resultado-valor">I<sub>fren</sub> = ${resultados[faseKey].ifren.toFixed(4)} A</p>`;
        html += '</div>';
        
        html += '</div>';
    });

    html += '</div>';

    // Seção do Gráfico
    html += '<div class="resultado-secao">';
    html += '<h6 class="resultado-titulo">Gráfico Diferencial</h6>';
    html += '<div id="grafico-diferencial" style="width: 100%; max-width: 800px; height: 600px; margin: 0 auto;"></div>';
    html += '</div>';

    html += '</div>';

    document.getElementById('resultados').innerHTML = html;
}