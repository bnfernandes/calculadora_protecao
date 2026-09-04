// calc_seq.js - Componentes Simétricas: transformada de Fortescue (ABC <-> 012)
// com edição bidirecional ao vivo - tabela e gráficos recalculam a cada
// tecla/blur, sem esperar o botão "Calcular" (única página do site com esse
// comportamento). O botão "Calcular" existe mesmo assim, igual às outras
// páginas, mas só controla a seção de equações (mais pesada) - ver
// renderizarEquacoes em calc_seq_eq.js.

// Fasor como número complexo (real, imag), com ângulo em valor principal
// (-180°, 180°] - diferente do Complexo de calc_67_echarts.js (que normaliza
// para [0°, 360°)) porque o mockup da tabela de resultados usa ângulos
// negativos (ex: "0.577∠-150.000°"), não o equivalente em [0,360).
class Fasor {
    constructor(real, imag) {
        this.real = real;
        this.imag = imag;
    }

    static fromPolar(magnitude, anguloDeg) {
        const rad = anguloDeg * Math.PI / 180;
        return new Fasor(magnitude * Math.cos(rad), magnitude * Math.sin(rad));
    }

    magnitude() {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }

    angulo() {
        // Ângulo de um fasor com magnitude ~0 não tem significado físico -
        // atan2(~0,~0) devolve um valor ruidoso (erro de ponto flutuante nos
        // componentes real/imag), não uma direção real. Centralizado aqui
        // (em vez de repetido em cada lugar que exibe um fasor) pra valer em
        // toda a página: tabela, legenda dos gráficos, campos do formulário
        // e equações.
        if (this.magnitude() < 1e-9) return 0;
        return Math.atan2(this.imag, this.real) * 180 / Math.PI;
    }

    somar(outro) {
        return new Fasor(this.real + outro.real, this.imag + outro.imag);
    }

    multiplicar(outro) {
        return new Fasor(
            this.real * outro.real - this.imag * outro.imag,
            this.real * outro.imag + this.imag * outro.real
        );
    }

    escalar(k) {
        return new Fasor(this.real * k, this.imag * k);
    }

    toString() {
        return `${this.magnitude().toFixed(3)}∠${this.angulo().toFixed(3)}°`;
    }
}

function somarFasores(lista) {
    return lista.reduce((acc, f) => acc.somar(f), new Fasor(0, 0));
}

// Operador de rotação a = 1∠120°
const A_OP = Fasor.fromPolar(1, 120);
const A_OP2 = A_OP.multiplicar(A_OP);

// anotacao: '' | 'a' | 'a²' (operador de rotação aplicado). rotulo: nome da
// grandeza de origem do termo ('A'/'B'/'C' ou 's0'/'s1'/'s2') - só é usado
// pelos termos "componentes a partir das fases" (rotulo varia com ABC/ACB);
// os termos "fases a partir das componentes" têm base fixa (s0/s1/s2 nessa
// ordem), então ficam com rotulo omitido e a tabela/equações usam a posição.
function termo(fasor, anotacao, rotulo) {
    return { fasor, anotacao, rotulo };
}

// Devolve A/B/C junto com os 3 termos rotacionados que somam cada fase
// (ex: B = seq0 + a²·seq1 + a·seq2) - usados pela tabela de resultados e
// pela seção de equações (calc_seq_eq.js), sem re-derivar a mesma física.
function seqParaAbc(seq0, seq1, seq2) {
    const termosA = [termo(seq0, ''), termo(seq1, ''), termo(seq2, '')];
    const termosB = [termo(seq0, ''), termo(A_OP2.multiplicar(seq1), 'a²'), termo(A_OP.multiplicar(seq2), 'a')];
    const termosC = [termo(seq0, ''), termo(A_OP.multiplicar(seq1), 'a'), termo(A_OP2.multiplicar(seq2), 'a²')];
    return {
        A: somarFasores(termosA.map(t => t.fasor)), termosA,
        B: somarFasores(termosB.map(t => t.fasor)), termosB,
        C: somarFasores(termosC.map(t => t.fasor)), termosC
    };
}

function transformarSeqParaABC(seq0, seq1, seq2, sequencia) {
    const r = seqParaAbc(seq0, seq1, seq2);
    if (sequencia === 'ACB') {
        return { A: r.A, termosA: r.termosA, B: r.C, termosB: r.termosC, C: r.B, termosC: r.termosB };
    }
    return r;
}

// Componentes simétricas a partir das fases, com os termos rotulados pela
// letra da fase de origem (usados pelos gráficos de Seq1/Seq2 - que agora
// mostram a contribuição das 3 fases - e pela seção de equações). Para ACB
// (sequência de fases invertida), em vez de trocar o operador `a` em todo o
// resto do código, troca os papéis físicos de B e C - fisicamente
// equivalente (inverter o sentido de rotação troca qual fase é "positiva" e
// qual é "negativa") e mais simples de implementar.
function abcParaSeqComTermos(A, B, C, sequencia) {
    const acb = sequencia === 'ACB';
    const segB = acb ? C : B, letraB = acb ? 'C' : 'B';
    const segC = acb ? B : C, letraC = acb ? 'B' : 'C';
    const termosSeq0 = [termo(A, '', 'A'), termo(segB, '', letraB), termo(segC, '', letraC)];
    const termosSeq1 = [termo(A, '', 'A'), termo(A_OP.multiplicar(segB), 'a', letraB), termo(A_OP2.multiplicar(segC), 'a²', letraC)];
    const termosSeq2 = [termo(A, '', 'A'), termo(A_OP2.multiplicar(segB), 'a²', letraB), termo(A_OP.multiplicar(segC), 'a', letraC)];
    return {
        seq0: somarFasores(termosSeq0.map(t => t.fasor)).escalar(1 / 3), termosSeq0,
        seq1: somarFasores(termosSeq1.map(t => t.fasor)).escalar(1 / 3), termosSeq1,
        seq2: somarFasores(termosSeq2.map(t => t.fasor)).escalar(1 / 3), termosSeq2
    };
}

// Ponto único de montagem dos dados usados por tabela, gráficos e equações -
// sempre calcula as duas direções (fases->seq e seq->fases), a partir do
// valor efetivamente usado como origem, para que tudo exibido na tela seja
// sempre consistente entre si (mesma fonte, nunca re-derivada em paralelo).
function montarDadosAPartirDeSeq(seq0, seq1, seq2, sequencia) {
    const r = transformarSeqParaABC(seq0, seq1, seq2, sequencia);
    const t = abcParaSeqComTermos(r.A, r.B, r.C, sequencia);
    return {
        sequencia, A: r.A, B: r.B, C: r.C,
        seq0: t.seq0, seq1: t.seq1, seq2: t.seq2,
        termosA: r.termosA, termosB: r.termosB, termosC: r.termosC,
        termosSeq0: t.termosSeq0, termosSeq1: t.termosSeq1, termosSeq2: t.termosSeq2
    };
}

function montarDadosAPartirDeFases(A, B, C, sequencia) {
    const t = abcParaSeqComTermos(A, B, C, sequencia);
    const r = transformarSeqParaABC(t.seq0, t.seq1, t.seq2, sequencia);
    return {
        sequencia, A: r.A, B: r.B, C: r.C,
        seq0: t.seq0, seq1: t.seq1, seq2: t.seq2,
        termosA: r.termosA, termosB: r.termosB, termosC: r.termosC,
        termosSeq0: t.termosSeq0, termosSeq1: t.termosSeq1, termosSeq2: t.termosSeq2
    };
}

// --- Wiring da página ---

const PREFIXOS_FASE = ['a', 'b', 'c'];
const PREFIXOS_SEQ = ['seq0', 'seq1', 'seq2'];

// Evita loop: enquanto o próprio código está escrevendo um valor calculado
// num campo, o listener de 'input' desse campo não deve disparar um novo
// recálculo.
let atualizandoProgramaticamente = false;

function lerFasorCampo(prefixo) {
    const mag = parseFloat(document.getElementById(`${prefixo}Magnitude`).value);
    const ang = parseFloat(document.getElementById(`${prefixo}Angulo`).value);
    if (Number.isNaN(mag) || Number.isNaN(ang)) return null;
    return Fasor.fromPolar(mag, ang);
}

function arredondar(v) {
    return Math.round(v * 1000) / 1000;
}

function escreverFasorCampo(prefixo, fasor) {
    document.getElementById(`${prefixo}Magnitude`).value = arredondar(fasor.magnitude());
    document.getElementById(`${prefixo}Angulo`).value = arredondar(fasor.angulo());
}

function escreverFasesNosCampos(dados) {
    atualizandoProgramaticamente = true;
    escreverFasorCampo('a', dados.A);
    escreverFasorCampo('b', dados.B);
    escreverFasorCampo('c', dados.C);
    atualizandoProgramaticamente = false;
}

function escreverSeqNosCampos(dados) {
    atualizandoProgramaticamente = true;
    escreverFasorCampo('seq0', dados.seq0);
    escreverFasorCampo('seq1', dados.seq1);
    escreverFasorCampo('seq2', dados.seq2);
    atualizandoProgramaticamente = false;
}

// Último cálculo, para o botão "Calcular" reaproveitar sem precisar reler os
// campos - tabela e gráficos já ficam em dia a cada tecla/blur; a seção de
// equações (mais pesada) só é (re)desenhada quando o usuário pede.
let ultimoDados = null;

function renderizarTudo(dados) {
    ultimoDados = dados;
    if (window.renderizarSequenciaAtiva) window.renderizarSequenciaAtiva(dados);
    if (window.renderizarTabelaComponentes) window.renderizarTabelaComponentes(dados);
    if (window.atualizarGraficosSeq) window.atualizarGraficosSeq(dados);
}

function recalcularAPartirDasFases() {
    const A = lerFasorCampo('a'), B = lerFasorCampo('b'), C = lerFasorCampo('c');
    if (!A || !B || !C) return;
    const sequencia = document.getElementById('sequenciaFases').value;
    const dados = montarDadosAPartirDeFases(A, B, C, sequencia);
    escreverSeqNosCampos(dados);
    renderizarTudo(dados);
}

function recalcularAPartirDasSequencias() {
    const seq0 = lerFasorCampo('seq0'), seq1 = lerFasorCampo('seq1'), seq2 = lerFasorCampo('seq2');
    if (!seq0 || !seq1 || !seq2) return;
    const sequencia = document.getElementById('sequenciaFases').value;
    const dados = montarDadosAPartirDeSeq(seq0, seq1, seq2, sequencia);
    escreverFasesNosCampos(dados);
    renderizarTudo(dados);
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-seq');
    if (!form) return;

    // main.js sobrescreve TODO o innerHTML de .results-area (não só o
    // conteúdo) com o texto placeholder ao clicar em "Limpar" - inclusive os
    // <div> que servem de contêiner fixo pra tabela/matriz/gráficos. Guarda o
    // esqueleto original aqui para poder restaurá-lo antes de recalcular
    // (ver listener de 'reset' abaixo), senão a recalculação não teria mais
    // onde renderizar.
    const resultadosEl = document.getElementById('resultados');
    const esqueletoResultadosHTML = resultadosEl ? resultadosEl.innerHTML : '';

    ativarSanitizacaoFormulario(form);

    const todosPrefixosFase = PREFIXOS_FASE;
    const todosPrefixosSeq = PREFIXOS_SEQ;

    function ligarCampo(prefixo, handler) {
        ['Magnitude', 'Angulo'].forEach(sufixo => {
            const el = document.getElementById(`${prefixo}${sufixo}`);
            if (!el) return;
            el.addEventListener('input', () => { if (!atualizandoProgramaticamente) handler(); });
            el.addEventListener('blur', () => { if (!atualizandoProgramaticamente) handler(); });
        });
    }

    todosPrefixosFase.forEach(p => ligarCampo(p, recalcularAPartirDasFases));
    todosPrefixosSeq.forEach(p => ligarCampo(p, recalcularAPartirDasSequencias));

    // Trocar ABC/ACB reinterpreta as fases físicas atuais sob a nova
    // convenção de rotação - refaz o cálculo a partir das fases (não das
    // sequências), que são a grandeza "medida"/primária aqui.
    document.getElementById('sequenciaFases').addEventListener('change', recalcularAPartirDasFases);

    // "Limpar" é tratado de forma genérica por main.js (form.reset() +
    // sobrescreve .results-area com o texto placeholder) - pensado para o
    // padrão "só recalcula ao apertar Calcular" das outras páginas. Tabela e
    // gráficos daqui são ao vivo (não esperam o Calcular), então ficariam
    // presos no placeholder até a próxima edição de campo - escutamos o
    // evento nativo 'reset' e recalculamos logo depois, via setTimeout(0)
    // para rodar depois que o handler do main.js (síncrono, dentro do mesmo
    // clique) já tiver sobrescrito .results-area.
    form.addEventListener('reset', function() {
        setTimeout(() => {
            if (resultadosEl) resultadosEl.innerHTML = esqueletoResultadosHTML;
            recalcularAPartirDasFases();
        }, 0);
    });

    // "Calcular": tabela/gráficos já estão em dia (ao vivo) a qualquer
    // momento - este botão só (re)desenha a seção de equações (mais pesada:
    // as duas equações matriciais em forma de coluna + a substituição
    // numérica termo a termo), igual ao padrão "resultado só aparece ao
    // apertar Calcular" das outras páginas do site.
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        // sanitizarTodosCampos ainda roda aqui (rede de segurança de
        // min/max) - mas os 12 campos de fase/seq têm data-ignorar-passo no
        // HTML, então não arredondam pro step. Sem essa marcação, arredondar
        // os 12 campos pro step (ex: passo=1) de uma vez quebrava a relação
        // matemática entre fase e sequência: o lado que o usuário NÃO tinha
        // acabado de editar (arredondado ao acaso) virava a origem
        // "canônica" no recálculo abaixo, sobrescrevendo o valor preciso que
        // o usuário tinha acabado de digitar do outro lado.
        sanitizarTodosCampos(form);
        recalcularAPartirDasFases();
        if (window.renderizarEquacoes && ultimoDados) window.renderizarEquacoes(ultimoDados);
    });

    // Estado inicial: a página já nasce com resultados calculados a partir
    // dos valores-exemplo do HTML, sem precisar de nenhuma interação.
    recalcularAPartirDasFases();
});

window.Fasor = Fasor;
window.somarFasores = somarFasores;
window.montarDadosAPartirDeFases = montarDadosAPartirDeFases;
window.montarDadosAPartirDeSeq = montarDadosAPartirDeSeq;
