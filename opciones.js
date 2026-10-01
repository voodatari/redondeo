/* =========================================================
   Opciones de partida · ventana «Más opciones» de la selección de tiempo
   - Dificultad:
       Estándar   números de 2 a 6 cifras, como siempre. Tiene ranking.
       A medida   de x a y cifras (de 2 a 7). Sin ranking.
       Progresiva empieza con 2 cifras y cada 5 aciertos suma una, hasta 7.
                  Tiene ranking propio.
   - Extras: a qué se redondea, opciones trampa, más casos con el 5 y sin
     cifra resaltada. Cambian la dificultad, así que con cualquiera de
     ellos cambiado la partida pasa a ser «A medida» (sin ranking): así
     los rankings solo comparan partidas con las mismas reglas.
   Se guardan en este dispositivo y valen también para la práctica libre.
   ========================================================= */
window.Opciones = (function () {

    var K_OPCIONES = 'redondeo.opciones';
    var MIN_CIFRAS = 2, MAX_CIFRAS = 7, ACIERTOS_POR_NIVEL = 5;

    /* exponente de la unidad: 1 = decena … 6 = unidad de millón */
    var UNIDADES = {
        1: { nombre: 'la decena', corto: 'Decena', abrev: 'D' },
        2: { nombre: 'la centena', corto: 'Centena', abrev: 'C' },
        3: { nombre: 'la unidad de millar', corto: 'U. de millar', abrev: 'UM' },
        4: { nombre: 'la decena de millar', corto: 'D. de millar', abrev: 'DM' },
        5: { nombre: 'la centena de millar', corto: 'C. de millar', abrev: 'CM' },
        6: { nombre: 'la unidad de millón', corto: 'U. de millón', abrev: 'UMM' }
    };
    var TODAS = [1, 2, 3, 4, 5, 6];

    var FABRICA = { dificultad: 'estandar', min: 2, max: 5, unidades: TODAS.slice(), trampa: false, cinco: false, sinResaltar: false };

    function leer() {
        try {
            var o = JSON.parse(localStorage.getItem(K_OPCIONES) || 'null');
            if (!o) return copia(FABRICA);
            var r = copia(FABRICA);
            if (['estandar', 'medida', 'progresiva'].indexOf(o.dificultad) >= 0) r.dificultad = o.dificultad;
            if (o.min >= MIN_CIFRAS && o.min <= MAX_CIFRAS) r.min = o.min;
            if (o.max >= r.min && o.max <= MAX_CIFRAS) r.max = o.max;
            if (Array.isArray(o.unidades)) {
                var u = o.unidades.filter(function (e) { return TODAS.indexOf(e) >= 0; });
                if (u.length) r.unidades = u.sort();
            }
            r.trampa = !!o.trampa; r.cinco = !!o.cinco; r.sinResaltar = !!o.sinResaltar;
            return r;
        } catch (e) { return copia(FABRICA); }
    }
    function guardar() { try { localStorage.setItem(K_OPCIONES, JSON.stringify(op)); } catch (e) {} }
    function copia(o) { return JSON.parse(JSON.stringify(o)); }

    var op = leer();

    /* Órdenes de unidad que caben con las cifras elegidas: con n cifras como
       mucho se redondea a 10^(n-1). Estándar llega a 6 cifras; Progresiva, a 7. */
    function maxExponente() {
        var cifras = op.dificultad === 'medida' ? op.max : op.dificultad === 'progresiva' ? MAX_CIFRAS : 6;
        return cifras - 1;
    }
    function disponibles() { return TODAS.filter(function (e) { return e <= maxExponente(); }); }
    /* Las elegidas que caben (las que no caben se quedan guardadas por si
       luego se suben las cifras). Si no queda ninguna, todas las que caben. */
    function efectivas() {
        var u = op.unidades.filter(function (e) { return e <= maxExponente(); });
        return u.length ? u : disponibles();
    }

    /* ---------- clasificación (rankings) ---------- */
    function extrasDeFabrica() {
        return efectivas().length === disponibles().length && !op.trampa && !op.cinco && !op.sinResaltar;
    }
    /* 'estandar' | 'progresiva' | 'medida' */
    function clave() {
        if (op.dificultad === 'medida' || !extrasDeFabrica()) return 'medida';
        return op.dificultad;
    }
    function puntua() { return clave() !== 'medida'; }

    function rangoTexto() { return op.min === op.max ? op.min + ' cifras' : op.min + '–' + op.max + ' cifras'; }

    /* Etiqueta corta para la interfaz */
    function etiqueta() {
        var c = clave();
        if (c === 'estandar') return 'Estándar';
        if (c === 'progresiva') return 'Progresiva';
        return 'A medida';
    }

    /* Lo que se guarda en la base de datos (columna variant): null = estándar.
       En «A medida» se apunta también cómo era, para verlo en el historial. */
    function variante() {
        var c = clave();
        if (c === 'estandar') return null;
        if (c === 'progresiva') return 'progresiva';
        var partes = ['A medida'];
        partes.push(op.dificultad === 'medida' ? rangoTexto() : op.dificultad === 'progresiva' ? 'progresiva' : '2–6 cifras');
        if (efectivas().length !== disponibles().length) partes.push('a ' + efectivas().map(function (e) { return UNIDADES[e].abrev; }).join(', '));
        if (op.trampa) partes.push('trampa');
        if (op.cinco) partes.push('más 5');
        if (op.sinResaltar) partes.push('sin resaltar');
        return partes.join(' · ').slice(0, 80);
    }

    /* ---------- preguntas ---------- */
    function cifrasProgresiva(aciertos) {
        return Math.min(MAX_CIFRAS, MIN_CIFRAS + Math.floor((aciertos || 0) / ACIERTOS_POR_NIVEL));
    }
    function azar(lista) { return lista[Math.floor(Math.random() * lista.length)]; }
    function entero(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    /* Cifras posibles (con al menos una unidad elegida que quepa: con n
       cifras se puede redondear como mucho a 10^(n-1)) */
    function cifrasPosibles(min, max, unidades) {
        var r = [];
        for (var n = min; n <= max; n++) {
            if (unidades.some(function (e) { return e <= n - 1; })) r.push(n);
        }
        return r;
    }

    /* {numero, unidad, exponente, cifras, nombreUnidad} */
    function pregunta(aciertos) {
        var numero, e;
        if (op.dificultad === 'estandar' && extrasDeFabrica()) {
            /* exactamente como siempre: así el ranking estándar sigue valiendo */
            e = entero(1, 4);
            var unidad = Math.pow(10, e);
            numero = entero(unidad * 5, 100000);
        } else {
            var min, max;
            if (op.dificultad === 'progresiva') min = max = cifrasProgresiva(aciertos);
            else if (op.dificultad === 'medida') { min = op.min; max = op.max; }
            else { min = 2; max = 6; }
            var unidades = efectivas();
            var posibles = cifrasPosibles(min, max, unidades);
            /* progresiva con unidades que aún no caben: se sube hasta la primera que sí */
            if (!posibles.length) posibles = cifrasPosibles(min, MAX_CIFRAS, unidades).slice(0, 1);
            if (!posibles.length) posibles = [MAX_CIFRAS];
            var n = azar(posibles);
            var validas = unidades.filter(function (x) { return x <= n - 1; });
            e = validas.length ? azar(validas) : 1;
            numero = entero(Math.pow(10, n - 1), Math.pow(10, n) - 1);
            /* más casos con el 5: la cifra que decide (la de la derecha de la marcada) vale 5 */
            if (op.cinco && Math.random() < 0.45) {
                var pos = Math.pow(10, e - 1);
                var cifra = Math.floor(numero / pos) % 10;
                numero += (5 - cifra) * pos;
            }
        }
        return { numero: numero, unidad: Math.pow(10, e), exponente: e, cifras: String(numero).length, nombreUnidad: UNIDADES[e].nombre };
    }

    /* Dos respuestas incorrectas. Normal: la correcta ± una unidad.
       Trampa: los errores típicos (redondear hacia el otro lado, redondear
       a la unidad de al lado o no redondear). */
    function distractores(numero, correcta, unidad) {
        var set = [];
        function meter(v) { if (v > 0 && v !== correcta && set.indexOf(v) < 0) set.push(v); }
        if (op.trampa) {
            var otroLado = correcta >= numero ? correcta - unidad : correcta + unidad;
            var trampas = [
                Math.round(numero / (unidad / 10)) * (unidad / 10),   // a la unidad de la derecha (o sin redondear)
                Math.round(numero / (unidad * 10)) * (unidad * 10)    // a la unidad de la izquierda
            ];
            meter(otroLado);
            meter(azar(trampas));
            trampas.forEach(meter);
        }
        var intentos = 0;
        while (set.length < 2 && intentos++ < 20) meter(correcta + (Math.random() < 0.5 ? -1 : 1) * unidad);
        if (set.length < 2) meter(correcta + 2 * unidad);
        return set.slice(0, 2);
    }

    /* ---------- ventana «Más opciones» ---------- */
    var modal = document.getElementById('options-modal');
    var alCerrar = null;

    function pintar() {
        var area = document.getElementById('options-area');
        var cifras = [];
        for (var n = MIN_CIFRAS; n <= MAX_CIFRAS; n++) cifras.push(n);
        function selector(id, valor, desde) {
            return '<select id="' + id + '">' + cifras.filter(function (n) { return n >= desde; }).map(function (n) {
                return '<option value="' + n + '"' + (n === valor ? ' selected' : '') + '>' + n + '</option>';
            }).join('') + '</select>';
        }
        var imposible = op.dificultad === 'medida' && !cifrasPosibles(op.min, op.max, efectivas()).length;
        var activas = efectivas(), tope = maxExponente();
        var cuenta = puntua();

        area.innerHTML =
            '<button class="close-x" type="button" data-acc="cerrar" aria-label="Cerrar">✕</button>' +
            '<h2>⚙️ Más opciones</h2>' +

            '<div class="op-bloque"><h3>Dificultad</h3>' +
            '<div class="segmented op-dificultad">' +
                [['estandar', 'Estándar'], ['medida', 'A medida'], ['progresiva', 'Progresiva']].map(function (d) {
                    return '<button type="button" data-dif="' + d[0] + '" class="' + (op.dificultad === d[0] ? 'active' : '') + '">' + d[1] + '</button>';
                }).join('') +
            '</div>' +
            '<p class="op-explica">' + ({
                estandar: 'Números de 2 a 6 cifras, como siempre.',
                medida: 'Números de <label class="op-cifras">' + selector('op-min', op.min, MIN_CIFRAS) + '</label> a ' +
                        '<label class="op-cifras">' + selector('op-max', op.max, op.min) + '</label> cifras.',
                progresiva: 'Empieza con 2 cifras y cada ' + ACIERTOS_POR_NIVEL + ' aciertos suma una más, hasta ' + MAX_CIFRAS + '.'
            })[op.dificultad] + '</p></div>' +

            '<div class="op-bloque"><h3>Redondear a</h3>' +
            '<div class="chips op-unidades">' + TODAS.map(function (e) {
                var cabe = e <= tope;
                return '<button type="button" data-unidad="' + e + '" class="' + (cabe && activas.indexOf(e) >= 0 ? 'active' : '') + '"' +
                    (cabe ? ' title="' + UNIDADES[e].corto + '"' : ' disabled title="' + UNIDADES[e].corto + ': necesita números de ' + (e + 1) + ' cifras o más"') +
                    '>' + UNIDADES[e].abrev + '</button>';
            }).join('') + '</div>' +
            (imposible ? '<p class="op-aviso">Con ' + rangoTexto() + ' no se puede redondear a lo elegido: amplía las cifras o elige otra unidad.</p>' : '') +
            '</div>' +

            '<div class="settings-list op-extras">' +
                fila('trampa', '🪤 Opciones trampa', 'Las respuestas incorrectas son los errores típicos: redondear hacia el otro lado o a la cifra de al lado.') +
                fila('cinco', '5️⃣ Más casos con el 5', 'Salen más números en los que la cifra que decide es un 5.') +
                fila('sinResaltar', '🔍 Sin cifra resaltada', 'No se marca la cifra a la que se redondea: hay que localizarla.') +
            '</div>' +

            '<p class="op-ranking ' + (cuenta ? 'si' : 'no') + '">' + (cuenta
                ? '🏆 Estas partidas cuentan para el ranking <b>' + etiqueta() + '</b>.'
                : '📝 Partida <b>A medida</b>: se guarda en el historial, pero no cuenta para ningún ranking. ' +
                  'Solo Estándar y Progresiva sin cambios en los extras tienen ranking.') + '</p>' +

            '<div class="panel-actions">' +
                '<button type="button" class="chip-button ghost-dark" data-acc="fabrica">Restablecer</button>' +
                '<button type="button" class="mode-button btn-free" data-acc="cerrar"' + (imposible ? ' disabled' : '') + '>Listo</button>' +
            '</div>';
    }

    function fila(clave, titulo, texto) {
        return '<button type="button" class="setting-row" data-extra="' + clave + '" aria-pressed="' + !!op[clave] + '">' +
            '<span class="setting-text"><strong>' + titulo + '</strong><small>' + texto + '</small></span>' +
            '<span class="perf-switch" aria-hidden="true"></span></button>';
    }

    function sonar() { if (typeof playSound === 'function' && typeof clickSound !== 'undefined') playSound(clickSound); }

    function abrir(fn) {
        alCerrar = fn || null;
        pintar();
        modal.style.display = 'flex';
    }
    function cerrar() {
        if (op.dificultad === 'medida' && !cifrasPosibles(op.min, op.max, efectivas()).length) return;
        modal.style.display = 'none';
        if (alCerrar) alCerrar();
    }

    modal.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b || b.disabled) return;
        if (b.hasAttribute('data-dif')) { op.dificultad = b.getAttribute('data-dif'); }
        else if (b.hasAttribute('data-unidad')) {
            var u = +b.getAttribute('data-unidad');
            /* se parte de lo que se ve: las que caben y están marcadas */
            var vistas = efectivas(), i = vistas.indexOf(u);
            if (i >= 0) { if (vistas.length === 1) return; vistas.splice(i, 1); }   // siempre al menos una
            else vistas.push(u);
            /* las que no caben se conservan tal como estaban */
            op.unidades = vistas.concat(op.unidades.filter(function (e) { return e > maxExponente(); })).sort();
        }
        else if (b.hasAttribute('data-extra')) { var k = b.getAttribute('data-extra'); op[k] = !op[k]; }
        else if (b.getAttribute('data-acc') === 'fabrica') { op = copia(FABRICA); }
        else if (b.getAttribute('data-acc') === 'cerrar') { sonar(); guardar(); cerrar(); return; }
        else return;
        sonar();
        guardar();
        pintar();
    });
    modal.addEventListener('change', function (e) {
        if (e.target.id === 'op-min') { op.min = +e.target.value; if (op.max < op.min) op.max = op.min; }
        else if (e.target.id === 'op-max') { op.max = +e.target.value; }
        else return;
        guardar();
        pintar();
    });
    modal.addEventListener('mousedown', function (e) { if (e.target === modal) cerrar(); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') cerrar();
    });

    return {
        abrir: abrir,
        clave: clave,
        puntua: puntua,
        etiqueta: etiqueta,
        variante: variante,
        progresiva: function () { return clave() === 'progresiva' || op.dificultad === 'progresiva'; },
        cifrasProgresiva: cifrasProgresiva,
        aciertosPorNivel: ACIERTOS_POR_NIVEL,
        maxCifras: MAX_CIFRAS,
        sinResaltar: function () { return op.sinResaltar; },
        pregunta: pregunta,
        distractores: distractores
    };

})();
