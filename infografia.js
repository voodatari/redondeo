/* =========================================================
   Infografía animada con voz · explicación paso a paso de un error al redondear
   (la misma dinámica que en Silabeador, adaptada al redondeo)

   Infografia.mostrar({ numero, unidad, correcta, elegida }) → promesa que se resuelve al cerrarla
   Infografia.preparar(datos) → empieza a sintetizar las frases (llamar en cuanto se falla)

   Cada explicación es una lista de «pasos»: una animación en pantalla + una frase que lee Piper (voz.js).
   Avanza sola; con ◀ ▶ (o las flechas del teclado, o tocando un punto) se salta a otro paso y desde ese
   momento ya solo avanza a mano. ⏸ para al terminar el paso en curso. Mientras dura, la música se queda baja.
   Los textos salen de explicacion.js (la explicación escrita), para que las dos digan lo mismo.
   ========================================================= */
window.Infografia = (function () {

    var X = Explicacion.interno;
    var PAUSA_FRASE = 600, PAUSA_PASO = 1100;

    function f(n) { return Ajustes.formatear(n); }
    /* texto para la voz: sin etiquetas y con los números sin puntos de miles (si no, se leería «punto») */
    function aVoz(html) {
        return String(html)
            .replace(/<small>[\s\S]*?<\/small>/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
            .replace(/(\d)\.(?=\d{3}(\D|$))/g, '$1')
            .replace(/[«»"]/g, '')
            .replace(/\s*(➜|→)\s*/g, ', ')
            .replace(/\s*\(\s*/g, ', ').replace(/\s*\)\s*/g, ', ')
            .replace(/\s+/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/,(\s*,)+/g, ',').replace(/,\s*\./g, '.')
            .trim();
    }
    function el(tag, cls, html) { var x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }

    /* ---------- guion ---------- */
    function guion(c) {
        var N = c.numero, C = c.correcta, W = c.elegida, e = c.e, cifras = X.CIFRA[e];
        var sube = c.d >= 5;
        var frase = 'Has elegido ' + W + ', pero la respuesta correcta es ' + C + '.';
        var b = [];
        b.push({
            cap: 'Has elegido <b class="ig-mal">' + f(W) + '</b>, pero la correcta es <b class="ig-bien">' + f(C) + '</b>.',
            // una sola oración, con comas: así Piper la entona entera
            voz: frase + ' Vamos a verlo paso a paso.',
            anim: function (s) { s.mostrarNumero(); s.pildora('mal'); },
            // la píldora verde aparece (y late) cuando se nombra la respuesta correcta, en el momento aproximado de la frase
            seg: function (s, k, fi, dur) {
                if (fi !== 0) return;
                var cuando = dur ? dur * 1000 * (('Has elegido ' + W + ', pero la ').length / frase.length) : 0;
                s.tarde(cuando, function () { s.pildora('bien'); });
            }
        });
        b.push({
            cap: '1 · Busca la cifra a la que nos piden redondear, las <b>' + cifras + '</b>. En este caso es este <b>' + c.cifraUnidad + '</b>',
            voz: 'Primero buscamos la cifra a la que nos piden redondear, las ' + cifras + '. En este caso es este ' + c.cifraUnidad + '.',
            anim: function (s) { s.marcarClave(); }
        });
        b.push({
            cap: '2 · Mira la cifra de la derecha: como es un <b>' + c.d + '</b>, ' + (sube ? '<b class="ig-bien">y con 5 o más se sube</b>' : 'que es menor que 5, <b class="ig-azul">se queda como está</b>'),
            voz: sube ? 'Ahora miramos la cifra de la derecha: como es un ' + c.d + ', y con cinco o más se sube, a la cifra de las ' + cifras + ' le sumamos uno.'
                      : 'Ahora miramos la cifra de la derecha: como es un ' + c.d + ', que es menor que cinco, la cifra de las ' + cifras + ' se queda como está.',
            anim: function (s) { s.marcarDecide(sube); }
        });
        var lleva = sube ? X.pasosLlevada(c) : [];
        if (lleva.length > 1) {
            // CON LLEVADAS: primero los ceros; luego, despacio, cada llevada con su animación
            b.push({
                cap: '3 · Las cifras de su derecha pasan a <b>0</b>',
                voz: 'Primero, cambiamos por ceros todas las cifras de su derecha.',
                anim: function (s) { s.transformarParcial(); }
            });
            b.push({
                cap: '4 · Sumamos 1 a la cifra de las <b>' + cifras + '</b>',
                voz: [{ t: 'Ahora sumamos uno a la cifra de las ' + cifras + '.', pausa: 700 }]
                    .concat(lleva.map(function (x) { return { t: x.voz, pausa: 1000 }; }))
                    .concat(['Queda ' + C + '.']),
                anim: function () {},
                seg: function (s, k) {
                    if (k === 0) return;
                    if (k <= lleva.length) { s.titular('4 · ' + lleva[k - 1].texto); s.llevar(lleva[k - 1]); }
                    else { s.titular('4 · Queda <b class="ig-bien">' + f(C) + '</b>.'); s.transformarFinal(); }
                }
            });
        } else if (sube) {
            b.push({
                cap: '3 · Ceros a la derecha y <b>1</b> más a las ' + cifras + ': <b class="ig-bien">' + f(C) + '</b>',
                voz: 'Por último, cambiamos por ceros todas las cifras de su derecha, y a la cifra de las ' + cifras + ' le sumamos uno: el ' + lleva[0].de + ' pasa a ' + lleva[0].a + '. Queda ' + C + '.',
                anim: function (s) { s.transformar(); }
            });
        } else {
            b.push({
                cap: '3 · Las cifras de su derecha pasan a <b>0</b>: <b class="ig-bien">' + f(C) + '</b>',
                voz: 'Por último, cambiamos por ceros todas las cifras de su derecha. Queda ' + C + '.',
                anim: function (s) { s.transformar(); }
            });
        }
        var recta = X.frasesRecta(c);
        b.push({
            cap: '📏 ' + recta[0].cap,
            voz: recta.map(function (x) { return x.voz; }),
            anim: function (s) { s.mostrarRecta(); },
            // cada frase: su subtítulo y su animación en la recta (en el momento en que se dice)
            seg: function (s, k) { if (!recta[k]) return; s.titular('📏 ' + recta[k].cap); s.rectaPaso(recta[k].paso); },
            final: true
        });
        return b;
    }

    var preparados = {};
    function clave(d) { return [d.numero, d.unidad, d.correcta, d.elegida, Ajustes.puntos()].join('|'); }
    function preparar(d) {
        var k = clave(d);
        if (!preparados[k]) {
            var c = X.calcular(d);
            preparados[k] = { c: c, beats: guion(c) };
            if (Voz.estado() !== 'error') preparados[k].beats.forEach(function (x) { Voz.precargar(x.voz); });   // en orden, en el worker
        }
        return preparados[k];
    }

    /* ---------- escena (lo que se anima) ---------- */
    /* Todo ocupa su sitio desde el principio (aunque esté invisible): la ventana no cambia de tamaño y el ajuste
       (encajar) se calcula una vez con el contenido final. */
    function Escena(raiz, c) {
        this.c = c; this.raiz = raiz; this.timers = [];
        raiz.innerHTML = '';
        this.pildorasEl = el('div', 'ig-pildoras',
            '<span class="ig-pill mal">✗ Tu respuesta <b>' + f(c.elegida) + '</b></span><span class="ig-pill bien">✓ Correcta <b>' + f(c.correcta) + '</b></span>');
        this.antes = el('div', 'ig-num'); this.despues = el('div', 'ig-num despues');
        this.flecha = el('span', 'ig-flecha', '➜');
        var fila = el('div', 'ig-fila'); fila.appendChild(this.antes); fila.appendChild(this.flecha); fila.appendChild(this.despues);
        this.fila = fila;
        this.nota = el('div', 'ig-nota');
        this.recta = el('div', 'ig-recta', X.recta(c));
        this.pintarNumero(this.antes, c.numero, function () { return ''; });
        this.pintarNumero(this.despues, c.correcta, function () { return ''; });
        var lienzo = el('div', 'ig-lienzo');
        [this.pildorasEl, fila, this.nota, this.recta].forEach(function (x) { lienzo.appendChild(x); });
        raiz.appendChild(lienzo);
        this.lienzo = lienzo;
        this.encajar();
    }
    var P = Escena.prototype;
    /* cifras con su posición (0 = unidades) y los puntos de miles si están activados */
    P.pintarNumero = function (caja, n, clase) {
        var str = String(n), i = 0, html = '';
        Ajustes.gruposDeMiles(n).forEach(function (grupo, g) {
            if (g > 0) html += '<span class="ig-punto-miles">.</span>';
            for (var k = 0; k < grupo.length; k++) {
                var pos = str.length - 1 - i;
                html += '<span class="ig-d ' + (clase(pos) || '') + '" data-p="' + pos + '">' + grupo[k] + '</span>';
                i++;
            }
        });
        caja.innerHTML = html;
    };
    P.cifra = function (caja, p) { return caja.querySelector('.ig-d[data-p="' + p + '"]'); };
    /* si no cabe, se reduce todo (nunca se corta). Se mide con todo visible y con rectángulos reales (en Safari,
       scrollWidth no avisaba del desborde con zoom) */
    P.encajar = function () {
        var raiz = this.raiz, l = this.lienzo, z = document.documentElement.classList.contains('movil') ? 2.4 : 1, piezas = [this.pildorasEl, this.fila, this.recta, this.nota];
        l.classList.add('medir');
        l.style.zoom = z;
        function nocabe() {
            var r = raiz.getBoundingClientRect(), lr = l.getBoundingClientRect();
            if (lr.height > r.height + 1) return true;
            return piezas.some(function (e) { var q = e.getBoundingClientRect(); return q.width > 0 && (q.left < r.left + 2 || q.right > r.right - 2); });
        }
        while (nocabe() && z > 0.35) { z -= 0.04; l.style.zoom = z.toFixed(2); }
        l.classList.remove('medir');
    };
    P.tarde = function (ms, fn) { if (this.rapido) fn(); else this.timers.push(setTimeout(fn, ms)); };
    P.parar = function () { this.timers.forEach(clearTimeout); this.timers = []; };

    P.mostrarNumero = function () {
        this.antes.classList.add('ver');
        [].forEach.call(this.antes.querySelectorAll('.ig-d, .ig-punto-miles'), function (d, i) { d.style.animationDelay = (i * 60) + 'ms'; d.classList.add('entra'); });
    };
    /* una píldora (mal / bien) aparece y late al nombrarse */
    P.pildora = function (cual) {
        var p = this.pildorasEl.querySelector('.' + cual);
        // la que ya estaba se desliza al sitio que le deja la nueva (así la primera empieza centrada)
        var otra = this.pildorasEl.querySelector(cual === 'bien' ? '.mal' : '.bien'), x0 = otra && otra.offsetParent ? otra.getBoundingClientRect().left : null;
        p.classList.remove('late'); void p.offsetWidth; p.classList.add('ver');
        if (x0 != null && !this.rapido && otra.animate) {
            var dx = (x0 - otra.getBoundingClientRect().left) / (parseFloat(this.lienzo.style.zoom) || 1);
            if (Math.abs(dx) > 0.5) otra.animate([{ transform: 'translateX(' + dx + 'px)' }, { transform: 'none' }], { duration: 450, easing: 'ease-out' });
        }
        if (!this.rapido) p.classList.add('late');
    };
    /* Lo que aún no ha salido no ocupa sitio, así que en cada paso lo visible queda centrado en vertical. Cuando aparece
       o se va algo, lo que ya estaba se desliza a su nuevo sitio (sin saltos). */
    P.mover = function (cambio) {
        if (this.rapido) { cambio(); return; }
        var piezas = [this.pildorasEl, this.fila, this.nota, this.recta], z = parseFloat(this.lienzo.style.zoom) || 1;
        var antes = piezas.map(function (p) { return p.offsetParent ? p.getBoundingClientRect().top : null; });
        cambio();
        piezas.forEach(function (p, i) {
            if (antes[i] == null || !p.offsetParent || !p.animate) return;
            var dy = (antes[i] - p.getBoundingClientRect().top) / z;
            if (Math.abs(dy) > 0.5) p.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 450, easing: 'ease-out' });
        });
    };
    P.marcarClave = function () {
        var d = this.cifra(this.antes, this.c.e);
        if (d) d.classList.add('oro');
        var self = this;
        this.mover(function () { self.dicho('las ' + X.CIFRA[self.c.e], 'oro'); });
    };
    P.marcarDecide = function (sube) {
        var d = this.cifra(this.antes, this.c.e - 1);
        if (d) d.classList.add('decide');
        var self = this;
        this.mover(function () { self.dicho(sube ? self.c.d + ' → 5 o más: sube ⬆' : self.c.d + ' → menos de 5: se queda', sube ? 'sube' : 'queda'); });
    };
    P.dicho = function (txt, tipo) {
        this.nota.textContent = txt;
        this.nota.className = 'ig-nota ' + (tipo || '');
        void this.nota.offsetWidth; this.nota.classList.add('ver');
    };
    P.transformar = function () {
        var c = this.c, N = c.numero, C = c.correcta, e = c.e, largoN = String(N).length, self = this;
        this.mostrarDespues(C, function (p) {
            if (p < e) return 'cero';
            return (p === e || X.cifraEn(C, p) !== X.cifraEn(N, p) || String(C).length > largoN && p >= largoN) ? 'cambia' : '';
        });
        this.mover(function () { self.nota.classList.remove('ver'); });
    };

    /* subtítulo de la frase que se está diciendo */
    P.titular = function (html) { if (this.sub && !this.rapido) { this.sub.innerHTML = '<span>' + html + '</span>'; this.sub.classList.add('ver'); } };
    /* la recta se va completando: izq → der → mitad → num → fin (cada estado deja los anteriores) */
    P.rectaPaso = function (paso) {
        var orden = ['izq', 'der', 'mitad', 'num', 'fin'], r = this.recta;
        orden.slice(0, orden.indexOf(paso) + 1).forEach(function (p) { r.classList.add('r-' + p); });
        r.classList.toggle('r-ahora-izq', paso === 'izq'); r.classList.toggle('r-ahora-der', paso === 'der');
    };
    /* muestra el número de la derecha (flecha + resultado) deslizando el de la izquierda */
    P.mostrarDespues = function (n, clase) {
        var self = this;
        this.pintarNumero(this.despues, n, clase);
        var antesX = this.antes.getBoundingClientRect().left;
        this.flecha.classList.add('ver');
        this.despues.classList.add('ver');
        if (!this.rapido) {
            var dx = (antesX - this.antes.getBoundingClientRect().left) / (parseFloat(this.lienzo.style.zoom) || 1);
            if (dx && this.antes.animate) this.antes.animate([{ transform: 'translateX(' + dx + 'px)' }, { transform: 'none' }], { duration: 450, easing: 'ease-out' });
        }
        [].forEach.call(this.despues.querySelectorAll('.ig-d, .ig-punto-miles'), function (d, i) {
            d.style.animationDelay = (self.rapido ? 0 : 250 + i * 70) + 'ms'; d.classList.add('entra');
        });
    };
    /* resultado a medias: las cifras de la derecha ya en 0 y la marcada (en oro) aún sin sumar */
    P.transformarParcial = function () {
        var e = this.c.e, self = this;
        this.mostrarDespues(this.c.abajo, function (p) { return p < e ? 'cero' : p === e ? 'oro' : ''; });
        this.mover(function () { self.nota.classList.remove('ver'); });
    };
    /* una llevada: la cifra cambia (gira) y, si era un 9, el «+1» se posa sobre la de su izquierda */
    P.llevar = function (paso) {
        if (paso.nueva) { this.transformarFinal(); return; }
        var d = this.cifra(this.despues, paso.p);
        if (!d) return;
        d.textContent = paso.a;
        d.className = 'ig-d cambia' + (this.rapido ? '' : ' gira');
        var izq = this.cifra(this.despues, paso.p + 1);
        if (paso.lleva && izq) izq.classList.add('recibe');
    };
    /* el resultado final con sus clases (si aparece una cifra nueva cambian los puntos de miles) */
    P.transformarFinal = function () {
        var c = this.c, N = c.numero, C = c.correcta, e = c.e, largoN = String(N).length;
        this.pintarNumero(this.despues, C, function (p) {
            if (p < e) return 'cero';
            return (p === e || X.cifraEn(C, p) !== X.cifraEn(N, p) || String(C).length > largoN && p >= largoN) ? 'cambia' : '';
        });
        var primera = this.despues.querySelector('.ig-d');
        if (String(C).length > largoN && primera && !this.rapido) primera.classList.add('entra');
    };
    P.mostrarRecta = function () {
        var r = this.recta;
        this.mover(function () { r.classList.remove('ver'); void r.offsetWidth; r.classList.add('ver'); });
    };

    /* iconos (SVG, estilo de los controles de reproducción de Windows 11) */
    var ICO = {
        anterior: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="2.6" height="14" rx="1.3"/><path d="M19 6.6v10.8c0 .9-1 1.4-1.7.9l-7.8-5.4a1.1 1.1 0 0 1 0-1.8l7.8-5.4c.7-.5 1.7 0 1.7.9z"/></svg>',
        siguiente: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="16.4" y="5" width="2.6" height="14" rx="1.3"/><path d="M5 6.6v10.8c0 .9 1 1.4 1.7.9l7.8-5.4a1.1 1.1 0 0 0 0-1.8L6.7 5.7C6 5.2 5 5.7 5 6.6z"/></svg>',
        pausa: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4.2" height="14" rx="1.4"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.4"/></svg>',
        seguir: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.6v12.8c0 .9 1 1.4 1.7.9l9.6-6.4a1.1 1.1 0 0 0 0-1.8L9.7 4.7C9 4.2 8 4.7 8 5.6z"/></svg>',
        repetir: '<svg viewBox="0 0 24 24" aria-hidden="true" class="trazo"><path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M19.5 4.3v4.8h-4.8"/></svg>',
        saltar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.8v10.4c0 .8.9 1.3 1.6.8l6.6-5.2a1 1 0 0 0 0-1.6L4.6 6C3.9 5.5 3 6 3 6.8z"/><path d="M11 6.8v10.4c0 .8.9 1.3 1.6.8l6.6-5.2a1 1 0 0 0 0-1.6L12.6 6c-.7-.5-1.6 0-1.6.8z"/><rect x="19.4" y="5.5" width="2.2" height="13" rx="1.1"/></svg>',
        flecha: '<svg viewBox="0 0 24 24" aria-hidden="true" class="trazo"><path d="M5 12h13.5"/><path d="M13 6.5l5.5 5.5-5.5 5.5"/></svg>'
    };
    function ico(n) { return '<span class="ig-ico">' + ICO[n] + '</span>'; }

    /* ---------- ventana ---------- */
    function mostrar(datos) {
        return new Promise(function (resolve) {
            var previo = document.activeElement;
            var script;
            try { script = preparar(datos); } catch (e) { console.warn('Infografia', e); return Explicacion.mostrar(datos).then(resolve); }
            var beats = script.beats, c = script.c, total = beats.length;

            var velo = el('div', 'dialog-overlay ig-overlay');
            velo.innerHTML =
                '<div class="dialog-box ig-box" role="dialog" aria-modal="true" aria-label="Explicación animada">' +
                    '<button type="button" class="close-x ig-cerrar" aria-label="Cerrar">✕</button>' +
                    '<div class="ig-cabecera"><span class="ig-claqueta">🎬 Explicación</span><span class="ig-voz-estado"></span><div class="ig-puntos"></div></div>' +
                    '<div class="ig-escenario"></div>' +
                    '<div class="ig-subtitulo"></div>' +
                    '<div class="ig-nav">' +
                        '<button type="button" class="ig-btn ig-atras" aria-label="Paso anterior">' + ico('anterior') + '<span class="ig-txt"> Atrás</span></button>' +
                        '<button type="button" class="ig-btn ig-pausa" aria-label="Pausar al terminar este paso"></button>' +
                        '<button type="button" class="ig-btn ig-repetir" aria-label="Repetir este paso">' + ico('repetir') + '<span class="ig-txt"> Repetir</span></button>' +
                        '<button type="button" class="ig-btn ig-adelante" aria-label="Paso siguiente"><span class="ig-txt">Adelante </span>' + ico('siguiente') + '</button>' +
                    '</div>' +
                    '<div class="dialog-actions ig-acciones"><button type="button" class="mode-button btn-free ig-ok">Saltar ' + ico('saltar') + '</button></div>' +
                '</div>';
            document.body.appendChild(velo);

            var puntos = velo.querySelector('.ig-puntos'), sub = velo.querySelector('.ig-subtitulo'), estadoVoz = velo.querySelector('.ig-voz-estado');
            var botonOk = velo.querySelector('.ig-ok'), botonRep = velo.querySelector('.ig-repetir');
            var botonAtras = velo.querySelector('.ig-atras'), botonAdelante = velo.querySelector('.ig-adelante'), botonPausa = velo.querySelector('.ig-pausa');
            beats.forEach(function (x, k) { var p = el('button', 'ig-punto'); p.type = 'button'; p.dataset.k = k; p.setAttribute('aria-label', 'Ir al paso ' + (k + 1)); puntos.appendChild(p); });

            var cerrado = false, ejecucion = 0, escena = null;
            var idx = 0, manual = false, terminado = false;
            var pausaPedida = false, detenido = false, ultimoVoz = '';
            Sonido.mantenerBajo(true);                          // la música se queda baja mientras dura la explicación

            function cerrar() {
                if (cerrado) return;
                cerrado = true; ejecucion++;
                document.removeEventListener('keydown', onKey, true);
                window.removeEventListener('resize', alRedimensionar);
                if (escena) escena.parar();
                Voz.parar();
                Sonido.mantenerBajo(false);                         // y sube suave al cerrarla
                Sonido.efecto('click');
                velo.classList.add('dialog-out');
                setTimeout(function () { velo.remove(); }, 200);
                if (previo && typeof previo.focus === 'function') previo.focus();
                resolve();
            }

            function pintar(vozTexto) {
                ultimoVoz = vozTexto || '';
                var finTotal = terminado && idx >= total - 1 && !manual;
                [].forEach.call(puntos.children, function (p, k) { p.className = 'ig-punto' + (k < idx || finTotal ? ' hecho' : '') + (k === idx && !finTotal ? ' ahora' : ''); });
                botonAtras.disabled = idx <= 0;
                botonAdelante.disabled = idx >= total - 1;
                botonOk.innerHTML = terminado && idx >= total - 1 ? '¡Entendido! Siguiente ' + ico('flecha') : 'Saltar ' + ico('saltar');
                var etiqueta = detenido ? 'en pausa' : pausaPedida ? 'se parará al terminar este paso' : manual ? 'modo manual' : '';
                estadoVoz.textContent = (vozTexto || '') + (etiqueta ? (vozTexto ? ' · ' : '') + etiqueta : '');
                var seguir = manual || pausaPedida;
                botonPausa.innerHTML = seguir ? ico('seguir') + '<span class="ig-txt"> Seguir</span>' : ico('pausa') + '<span class="ig-txt"> Pausa</span>';
                botonPausa.setAttribute('aria-label', seguir ? 'Seguir con la explicación' : 'Pausar al terminar este paso');
                botonPausa.disabled = idx >= total - 1 && terminado;
            }

            function esperar(ms, yo) { return new Promise(function (ok) { setTimeout(ok, ms); }).then(function () { return yo === ejecucion; }); }

            /* la escena tal como queda justo antes del paso i (los pasos anteriores se aplican de golpe) */
            function construirEscena(hasta) {
                if (escena) escena.parar();
                escena = new Escena(velo.querySelector('.ig-escenario'), c);
                escena.sub = sub;
                (function (e) { setTimeout(function () { if (escena === e) e.encajar(); }, 450); })(escena);   // otra vez, ya abierta la ventana
                escena.rapido = true;
                for (var k = 0; k < hasta; k++) {
                    beats[k].anim(escena);
                    if (beats[k].seg) (Array.isArray(beats[k].voz) ? beats[k].voz : [beats[k].voz]).forEach(function (x, q) { beats[k].seg(escena, q, 0, 0); });
                }
                escena.rapido = false;
            }

            async function ejecutarPaso(i, yo) {
                var b = beats[i];
                idx = i; terminado = false;
                var conVoz = Voz.estado() === 'lista';
                pintar(conVoz ? '🔊' : (Voz.estado() === 'cargando' ? '⏳ cargando la voz…' : ''));
                sub.classList.remove('ver'); void sub.offsetWidth;
                sub.innerHTML = '<span>' + b.cap + '</span>'; sub.classList.add('ver');     // un solo bloque de texto (centrado en vertical)
                b.anim(escena);
                if (conVoz) {
                    await Voz.decir(b.voz, {
                        pausa: PAUSA_FRASE,
                        alFrase: function (fi, tot, dur, seg) { if (yo === ejecucion && b.seg) b.seg(escena, seg, fi, dur); }
                    });
                } else {
                    // sin voz: cada paso dura lo que tardaría en leerse
                    // sin voz: cada frase dura lo que tardaría en leerse (y se anima en su momento)
                    var segs = Array.isArray(b.voz) ? b.voz : [b.voz], t = 0;
                    segs.forEach(function (x, q) {
                        var s = typeof x === 'string' ? x : x.t, dura = 700 + s.length * 62;
                        if (b.seg) escena.tarde(t, function () { b.seg(escena, q, 0, dura / 1000); });
                        t += dura + PAUSA_FRASE + (typeof x === 'object' && x.pausa ? x.pausa : 0);
                    });
                    if (!(await esperar(t, yo))) return false;
                }
                return yo === ejecucion;
            }

            async function correr(i, reconstruir) {
                var yo = ++ejecucion;
                Voz.parar();
                if (escena) escena.parar();
                if (reconstruir || !escena) construirEscena(i);
                for (var j = i; j < total; j++) {
                    if (!(await ejecutarPaso(j, yo))) return;
                    terminado = true;
                    if (manual) { pintar(''); return; }
                    if (pausaPedida && j < total - 1) { detenido = true; pintar(''); return; }
                    if (j < total - 1) {
                        terminado = false; pintar('');
                        if (!(await esperar(PAUSA_PASO, yo))) return;
                    }
                }
                pintar('');
                try { botonOk.focus({ preventScroll: true }); } catch (e) {}
            }

            function ir(i) {
                manual = true; pausaPedida = false; detenido = false;
                i = Math.max(0, Math.min(total - 1, i));
                Sonido.efecto('click');
                correr(i, true);
            }

            function onKey(ev) {
                if (ev.key === 'ArrowLeft') { ev.preventDefault(); ev.stopPropagation(); if (idx > 0) ir(idx - 1); }
                else if (ev.key === 'ArrowRight') { ev.preventDefault(); ev.stopPropagation(); if (idx < total - 1) ir(idx + 1); }
                else if (ev.key === 'p' || ev.key === 'P') { ev.preventDefault(); ev.stopPropagation(); pulsarPausa(); }
                else if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); cerrar(); }
            }
            document.addEventListener('keydown', onKey, true);
            function alRedimensionar() { if (escena) escena.encajar(); }
            window.addEventListener('resize', alRedimensionar);
            botonOk.addEventListener('click', cerrar);
            velo.querySelector('.ig-cerrar').addEventListener('click', cerrar);
            botonAtras.addEventListener('click', function () { if (idx > 0) ir(idx - 1); });
            botonAdelante.addEventListener('click', function () { if (idx < total - 1) ir(idx + 1); });
            botonRep.addEventListener('click', function () { ir(idx); });
            function pulsarPausa() {
                if (botonPausa.disabled) return;
                Sonido.efecto('click');
                if (!manual && !pausaPedida) { pausaPedida = true; pintar(ultimoVoz); return; }
                if (pausaPedida && !detenido && !manual) { pausaPedida = false; pintar(ultimoVoz); return; }
                var sig = terminado ? idx + 1 : idx;
                manual = false; pausaPedida = false; detenido = false;
                if (sig < total) correr(sig, !terminado); else pintar('');
            }
            botonPausa.addEventListener('click', pulsarPausa);
            puntos.addEventListener('click', function (ev) { var p = ev.target.closest('.ig-punto'); if (p) ir(parseInt(p.dataset.k, 10)); });

            correr(0, true);
        });
    }

    return { mostrar: mostrar, preparar: preparar, aVoz: aVoz };

})();
