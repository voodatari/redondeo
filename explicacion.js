/* =========================================================
   Explicación del error · práctica libre
   Al fallar una pregunta se abre una ventana que cuenta:
   - por qué la respuesta elegida no vale (según el error cometido:
     redondear hacia el otro lado, a la cifra de al lado, no redondear…)
   - cómo se hace, paso a paso, con las cifras coloreadas
   - la recta numérica con el número, la mitad y la respuesta correcta
   Explicacion.mostrar(...) devuelve una promesa que se resuelve al cerrarla.
   ========================================================= */
window.Explicacion = (function () {

    /* exponente: 0 = unidad … 7 = decena de millón */
    var UNIDAD = ['la unidad', 'la decena', 'la centena', 'la unidad de millar', 'la decena de millar',
                  'la centena de millar', 'la unidad de millón', 'la decena de millón'];
    var CIFRA = ['unidades', 'decenas', 'centenas', 'unidades de millar', 'decenas de millar',
                 'centenas de millar', 'unidades de millón', 'decenas de millón'];
    var TITULOS = ['¡Casi! Vamos a verlo', '¡Uy! Repasemos este', '¡No pasa nada! Aprendamos'];

    function f(n) { return Ajustes.formatear(n); }
    function cifraEn(n, pos) { return Math.floor(n / Math.pow(10, pos)) % 10; }
    function redondear(n, u) { return Math.round(n / u) * u; }

    /* Cifras del número con una clase por posición (0 = unidades), con o sin puntos de miles */
    function cifrasHtml(n, clase) {
        var str = String(n), i = 0, html = '';
        Ajustes.gruposDeMiles(n).forEach(function (grupo, g) {
            if (g > 0) html += '<span class="ex-dot">.</span>';
            for (var k = 0; k < grupo.length; k++) {
                var pos = str.length - 1 - i;
                html += '<span class="ex-d ' + (clase(pos) || '') + '">' + grupo[k] + '</span>';
                i++;
            }
        });
        return html;
    }

    /* ---------- ¿qué error se ha cometido? ---------- */
    function porQue(c) {
        var N = c.numero, W = c.elegida, C = c.correcta, U = c.unidad, e = c.e;
        var unidad = UNIDAD[e];
        var bN = '<b>' + f(N) + '</b>', bW = '<b class="ex-mal">' + f(W) + '</b>';

        if (W === N) {
            return 'Has elegido ' + bW + ', que es el mismo número: ¡no lo has redondeado! ' +
                'Redondear a ' + unidad + ' es quedarse con ' + unidad + ' más cercana y poner <b>ceros</b> en todas las cifras de su derecha.';
        }
        if (N % U === 0) {
            return bN + ' ya acaba en ceros a partir de las ' + CIFRA[e - 1] + ': <b>ya está redondeado</b> a ' + unidad +
                '. La respuesta es el propio número; al cambiarlo a ' + bW + ' te has alejado de él.';
        }
        if (W === c.abajo) {   // tocaba subir
            if (c.d === 5) {
                return 'Has redondeado hacia abajo, a ' + bW + '. Pero la cifra que decide es un <b>5</b>, y la regla dice: ' +
                    '<b>con 5 o más, se sube</b>.' +
                    (N === c.mitad ? ' Aunque ' + bN + ' está justo en la mitad, el 5 siempre redondea hacia arriba.' : '');
            }
            return 'Has redondeado hacia abajo, a ' + bW + '. Pero la cifra que decide es un <b>' + c.d +
                '</b>, que es mayor que 5: hay que <b>subir</b> a la ' + unidad.replace('la ', '') + ' siguiente.';
        }
        if (W === c.arriba) {  // tocaba quedarse
            return 'Has redondeado hacia arriba, a ' + bW + '. Pero la cifra que decide es un <b>' + c.d +
                '</b>, que es menor que 5: ' + unidad + ' <b>se queda como está</b>.';
        }
        if (e >= 2 && W === redondear(N, U / 10)) {
            return 'Has redondeado a <b>' + UNIDAD[e - 1] + '</b> en lugar de a <b>' + unidad + '</b>. ' +
                'Te has fijado en una cifra demasiado a la derecha: la cifra clave es la de las <b>' + CIFRA[e] + '</b>.';
        }
        if (e + 1 < UNIDAD.length && W === redondear(N, U * 10)) {
            return 'Has redondeado a <b>' + UNIDAD[e + 1] + '</b> en lugar de a <b>' + unidad + '</b>. ' +
                'Te has fijado en una cifra demasiado a la izquierda: la cifra clave es la de las <b>' + CIFRA[e] + '</b>.';
        }
        if (W % U === 0) {
            return bW + ' está demasiado lejos. ' + bN + ' está entre <b>' + f(c.abajo) + '</b> y <b>' + f(c.arriba) +
                '</b>: la respuesta tiene que ser una de esas dos ' + CIFRA[e] + '.';
        }
        return bW + ' no es ' + unidad + ' más cercana a ' + bN + '. Fíjate en los pasos:';
    }

    /* LLEVADA: al subir, si la cifra marcada es un 9 pasa a 10 (se pone 0 y se lleva una a la izquierda); si la de su
       izquierda también es 9, le pasa lo mismo, y así seguido. Si se acaban las cifras, aparece un 1 delante. */
    function llevada(c) {
        if (c.d < 5) return null;
        var k = 0, largo = String(c.numero).length;
        while (c.e + k < largo && cifraEn(c.numero, c.e + k) === 9) k++;
        if (!k) return null;
        var nueva = c.e + k >= largo;
        var texto = k === 1
            ? 'El 9 pasa a 10: se pone 0 y se lleva una a la cifra de su izquierda' + (nueva ? ', que es un 1 nuevo delante.' : '.')
            : 'Hay ' + k + ' nueves seguidos: cada 9 pasa a 10, se pone 0 y se lleva una a la cifra de su izquierda' +
              (nueva ? '; al final aparece un 1 nuevo delante.' : '.');
        var voz = k === 1
            ? 'El nueve pasa a diez: se pone un cero y se lleva una a la cifra de su izquierda' + (nueva ? ', que es un uno nuevo delante.' : '.')
            : 'Hay ' + k + ' nueves seguidos: cada nueve pasa a diez, se pone un cero y se lleva una a la cifra de su izquierda' +
              (nueva ? '. Al final aparece un uno nuevo delante.' : '.');
        return { nueves: k, nueva: nueva, texto: texto, voz: voz };
    }

    /* SUMAR UNO CON LLEVADAS, cifra a cifra (para contarlo despacio): la cifra marcada más uno; si era 9, pasa a 10: se
       escribe 0 y se lleva una a la de su izquierda, y así hasta una cifra que no sea 9 (o hasta delante del todo). */
    function pasosLlevada(c) {
        var N = c.numero, largo = String(N).length, p = c.e, out = [], primera = true;
        for (;;) {
            if (p >= largo) {
                out.push({ p: p, nueva: true,
                    texto: 'No quedan más cifras: la que nos llevamos se escribe delante, un <b>1</b>.',
                    voz: 'Ya no quedan más cifras: la una que nos llevamos se escribe delante, un uno.' });
                break;
            }
            var d = cifraEn(N, p), mas = primera ? 'más 1' : 'más la que nos llevamos', masVoz = primera ? 'más uno' : 'más la una que nos llevamos';
            if (d === 9) {
                out.push({ p: p, de: 9, a: 0, lleva: true,
                    texto: 'El <b>9</b> de las ' + CIFRA[p] + ', ' + mas + ', son <b>10</b>: se escribe <b>0</b> y nos llevamos una.',
                    voz: 'El nueve de las ' + CIFRA[p] + ', ' + masVoz + ', son diez: escribimos un cero, y nos llevamos una a la cifra de su izquierda.' });
                p++; primera = false;
                continue;
            }
            out.push({ p: p, de: d, a: d + 1,
                texto: 'El <b>' + d + '</b> de las ' + CIFRA[p] + ', ' + mas + ', son <b>' + (d + 1) + '</b>.',
                voz: 'El ' + d + ' de las ' + CIFRA[p] + ', ' + masVoz + ', son ' + (d + 1) + '.' });
            break;
        }
        return out;
    }

    /* LA RECTA, contada así (ejemplo: 34 a las decenas): «Como nos piden que redondeemos a las decenas, en el extremo
       izquierdo estará la decena actual de 34, 30, y en el derecho, la siguiente, 40. El punto medio entre ambas es 35.
       Por tanto, 34 está más cerca de 30 que de 40, y redondeado a las decenas sería 30.»
       Cada frase: lo que se lee (cap), lo que se dice (voz) y qué se anima en la recta (paso). */
    function frasesRecta(c) {
        var N = c.numero, A = c.abajo, B = c.arriba, M = c.mitad, C = c.correcta, e = c.e;
        var plural = CIFRA[e], una = UNIDAD[e];
        var bN = '<b>' + f(N) + '</b>', bA = '<b>' + f(A) + '</b>', bB = '<b>' + f(B) + '</b>', bM = '<b class="ex-morado">' + f(M) + '</b>', bC = '<b class="ex-bien">' + f(C) + '</b>';
        if (N === A) return [
            { paso: 'izq', cap: 'Nos piden redondear a las <b>' + plural + '</b>: ' + bN + ' ya es ' + una.replace(/^la /, 'una ') + ' exacta.',
              voz: 'Como nos piden que redondeemos a las ' + plural + ', miramos dónde cae ' + N + ' en la recta: justo sobre una marca.' },
            { paso: 'fin', cap: 'Ya está redondeado: ' + bC + '.', voz: 'Ya está redondeado, así que el resultado es el mismo, ' + C + '.' }
        ];
        var cerca = N === M
            ? { cap: bN + ' está justo en el punto medio y, en ese caso, se redondea hacia arriba,', voz: N + ' está justo en el punto medio y, en ese caso, se redondea hacia arriba,' }
            : N < M
                ? { cap: 'Por tanto, ' + bN + ' está más cerca de ' + bA + ' que de ' + bB + ',', voz: 'Por tanto, ' + N + ' está más cerca de ' + A + ' que de ' + B + ',' }
                : { cap: 'Por tanto, ' + bN + ' está más cerca de ' + bB + ' que de ' + bA + ',', voz: 'Por tanto, ' + N + ' está más cerca de ' + B + ' que de ' + A + ',' };
        return [
            { paso: 'izq', cap: 'Nos piden redondear a las <b>' + plural + '</b>: en el extremo izquierdo está ' + una + ' actual de ' + bN + ', que es ' + bA + ',',
              voz: 'Como nos piden que redondeemos a las ' + plural + ', en el extremo izquierdo está ' + una + ' actual de ' + N + ', que es ' + A + ',' },
            { paso: 'der', cap: 'y a la derecha, la siguiente, ' + bB + '.', voz: 'y en el derecho, la siguiente, ' + B + '.' },
            { paso: 'mitad', cap: 'El punto medio entre ambas es ' + bM + '.', voz: 'El punto medio entre ambas es ' + M + '.' },
            { paso: 'num', cap: cerca.cap, voz: cerca.voz },
            { paso: 'fin', cap: 'y redondeado a las ' + plural + ' sería ' + bC + '.', voz: 'y redondeado a las ' + plural + ' sería ' + C + '.' }
        ];
    }

    /* ---------- cómo se hace ---------- */
    function pasos(c) {
        var e = c.e, sube = c.d >= 5;
        var ll = sube ? pasosLlevada(c) : [];
        var tercero = !sube
            ? 'Cambia por <b>ceros</b> todas las cifras de su derecha: <b class="ex-bien">' + f(c.correcta) + '</b>'
            : ll.length === 1
                ? 'Cambia por <b>ceros</b> todas las cifras de su derecha y suma <b>1</b> a la cifra de las ' + CIFRA[e] + ': ' + ll[0].texto.replace(/\.$/, '') + '. Queda <b class="ex-bien">' + f(c.correcta) + '</b>'
                : 'Cambia por <b>ceros</b> todas las cifras de su derecha y suma <b>1</b> a la cifra de las ' + CIFRA[e] + ', con llevadas:' +
                  '<ul class="ex-llevadas">' + ll.map(function (x) { return '<li>' + x.texto + '</li>'; }).join('') + '</ul>' +
                  'Queda <b class="ex-bien">' + f(c.correcta) + '</b>';
        return '<ol class="ex-pasos">' +
            '<li>Busca la cifra a la que nos piden redondear, las <b>' + CIFRA[e] + '</b>. En este caso es este <span class="ex-badge oro">' + c.cifraUnidad + '</span></li>' +
            '<li>Mira la cifra de la derecha: como es un <span class="ex-badge decide">' + c.d + '</span>, ' +
                (sube ? '<b class="ex-bien">y con 5 o más se sube</b>' : 'que es menor que 5, <b class="ex-azul">se queda como está</b>') + '.</li>' +
            '<li>' + tercero + '</li>' +
            '</ol>';
    }

    function transformacion(c) {
        var e = c.e, N = c.numero, C = c.correcta;
        var antes = cifrasHtml(N, function (p) { return p === e ? 'oro' : p === e - 1 ? 'decide' : ''; });
        var despues = cifrasHtml(C, function (p) {
            if (p < e) return 'cero';
            return (p === e || cifraEn(C, p) !== cifraEn(N, p) || String(C).length > String(N).length && p >= String(N).length) ? 'cambia' : '';
        });
        return '<div class="ex-transforma">' +
            '<span class="ex-num">' + antes + '</span>' +
            '<span class="ex-flecha">➜</span>' +
            '<span class="ex-num">' + despues + '</span></div>';
    }

    /* ---------- recta numérica (SVG) ---------- */
    function recta(c) {
        var N = c.numero, C = c.correcta, W = c.elegida, U = c.unidad;
        var lo = c.abajo, hi = c.arriba;
        /* si la respuesta elegida está una unidad más allá, se alarga la recta para que se vea */
        if (W % U === 0 && W < lo && lo - W <= U) lo = W;
        else if (W % U === 0 && W > hi && W - hi <= U) hi = W;
        var fuera = W < lo ? -1 : W > hi ? 1 : 0;

        var VW = 520, M = 64, Y = 104;
        function X(v) { return M + (v - lo) / (hi - lo) * (VW - 2 * M); }
        function anchoTexto(t, px) { return t.length * px * 0.56 + 18; }
        function limitar(x, w) { return Math.max(w / 2 + 2, Math.min(VW - w / 2 - 2, x)); }

        var s = '';
        s += '<defs><marker id="ex-punta" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
             '<path d="M0,0 L10,5 L0,10 z" fill="#16a34a"/></marker></defs>';

        /* mitad del tramo del número, coloreada hacia la respuesta correcta */
        var xm = X(c.mitad);
        if (N !== C) {
            var x1 = Math.min(xm, X(C)), x2 = Math.max(xm, X(C));
            s += '<rect class="ex-zona" x="' + x1 + '" y="' + (Y - 9) + '" width="' + (x2 - x1) + '" height="18" rx="9"/>';
        }

        /* recta y marcas: una cada décima parte de la unidad */
        s += '<line class="ex-eje" x1="' + (M - 26) + '" y1="' + Y + '" x2="' + (VW - M + 26) + '" y2="' + Y + '"/>';
        s += '<path class="ex-eje-punta" d="M' + (M - 34) + ',' + Y + ' l10,-7 v14 z M' + (VW - M + 34) + ',' + Y + ' l-10,-7 v14 z"/>';
        var paso = U / 10, total = Math.round((hi - lo) / paso);
        for (var k = 0; k <= total; k++) {
            var v = lo + k * paso, x = X(v), mayor = v % U === 0;
            s += '<line class="ex-marca' + (mayor ? ' mayor' : '') + '" x1="' + x + '" y1="' + (Y - (mayor ? 14 : 7)) + '" x2="' + x + '" y2="' + (Y + (mayor ? 14 : 7)) + '"/>';
            if (mayor) {
                s += '<text class="ex-etq' + (v === C ? ' bien' : '') + '" data-v="' + (v === c.abajo ? 'izq' : v === c.arriba ? 'der' : '') + '" x="' + x + '" y="' + (Y + 40) + '">' + f(v) + (v === C ? '<tspan class="ex-check"> ✓</tspan>' : '') + '</text>';
            }
        }

        /* la mitad (línea morada discontinua) */
        s += '<line class="ex-mitad" x1="' + xm + '" y1="' + (Y - 30) + '" x2="' + xm + '" y2="' + (Y + 22) + '"/>';
        s += '<text class="ex-etq-mitad" x="' + xm + '" y="' + (Y + 40) + '">' + f(c.mitad) + '</text>';

        /* flecha verde del número a la respuesta correcta */
        var xN = X(N), xC = X(C);
        if (N !== C) {
            var cx = (xN + xC) / 2, alto = Math.min(56, 26 + Math.abs(xC - xN) * 0.25);
            s += '<path class="ex-arco" marker-end="url(#ex-punta)" d="M' + xN + ',' + (Y - 12) + ' Q' + cx + ',' + (Y - 12 - alto * 2) + ' ' + (xC + (xC > xN ? -3 : 3)) + ',' + (Y - 12) + '"/>';
        }
        s += '<circle class="ex-punto-bien" cx="' + xC + '" cy="' + Y + '" r="9"/>';

        /* respuesta elegida: aspa roja y etiqueta debajo */
        var tW = '✗ tu respuesta: ' + f(W);
        if (!fuera) {
            var xW = X(W);
            s += '<g class="ex-aspa"><path d="M' + (xW - 7) + ',' + (Y - 7) + ' L' + (xW + 7) + ',' + (Y + 7) + ' M' + (xW + 7) + ',' + (Y - 7) + ' L' + (xW - 7) + ',' + (Y + 7) + '"/></g>';
            var wW = anchoTexto(tW, 16);
            s += '<line class="ex-guia-mal" x1="' + xW + '" y1="' + (Y + 16) + '" x2="' + xW + '" y2="' + (Y + 52) + '"/>';
            s += '<text class="ex-etq-mal" x="' + limitar(xW, wW) + '" y="' + (Y + 70) + '">' + tW + '</text>';
        } else {
            s += '<text class="ex-etq-mal" text-anchor="' + (fuera > 0 ? 'end' : 'start') + '" x="' + (fuera > 0 ? VW - 4 : 4) + '" y="' + (Y + 70) + '">' +
                 (fuera > 0 ? tW + ' ➜' : '⬅ ' + tW) + '</text>';
        }

        /* el número: chincheta con su valor encima */
        var tN = f(N), wN = anchoTexto(tN, 22), bx = limitar(xN, wN);
        s += '<g class="ex-pin">' +
             '<line class="ex-pin-palo" x1="' + xN + '" y1="' + Y + '" x2="' + bx + '" y2="42"/>' +
             '<rect class="ex-pin-caja" x="' + (bx - wN / 2) + '" y="10" width="' + wN + '" height="34" rx="12"/>' +
             '<text class="ex-pin-txt" x="' + bx + '" y="35">' + tN + '</text>' +
             '<circle class="ex-pin-punto" cx="' + xN + '" cy="' + Y + '" r="8"/></g>';

        return '<svg class="ex-svg" viewBox="0 0 ' + VW + ' 182" role="img" aria-label="Recta numérica de ' + f(lo) + ' a ' + f(hi) + '">' + s + '</svg>';
    }

    function pie(c) {
        return frasesRecta(c).map(function (x) { return x.cap; }).join(' ');
    }
    function pieAntiguo(c) {
        var N = c.numero, bN = '<b>' + f(N) + '</b>';
        if (N === c.correcta) return bN + ' cae justo sobre una marca grande: ya está redondeado.';
        var entre = bN + ' está entre <b>' + f(c.abajo) + '</b> y <b>' + f(c.arriba) + '</b>. ';
        var mitad = '<b class="ex-morado">' + f(c.mitad) + '</b>';
        if (N === c.mitad) return entre + 'Está justo en la mitad (' + mitad + ') y, en ese caso, se redondea hacia arriba: <b class="ex-bien">' + f(c.correcta) + '</b>.';
        if (N > c.mitad) return entre + 'Ha pasado la mitad (' + mitad + '), así que está más cerca de <b class="ex-bien">' + f(c.arriba) + '</b>.';
        return entre + 'No llega a la mitad (' + mitad + '), así que está más cerca de <b class="ex-bien">' + f(c.abajo) + '</b>.';
    }

    /* ---------- ventana ---------- */
    /* datos: { numero, unidad (10, 100…), correcta, elegida } */
    /* todo lo que hace falta saber del caso (también lo usa la explicación animada, infografia.js) */
    function calcular(datos) {
        var U = datos.unidad, e = Math.round(Math.log10(U)), N = datos.numero;
        var abajo = Math.floor(N / U) * U;
        return {
            numero: N, unidad: U, e: e, correcta: datos.correcta, elegida: datos.elegida,
            abajo: abajo, arriba: abajo + U, mitad: abajo + U / 2,
            cifraUnidad: cifraEn(N, e), d: cifraEn(N, e - 1)
        };
    }

    function mostrar(datos) {
        var c = calcular(datos), N = c.numero, e = c.e;

        return new Promise(function (resolve) {
            var previo = document.activeElement;
            var velo = document.createElement('div');
            velo.className = 'dialog-overlay ex-overlay';
            velo.innerHTML =
                '<div class="dialog-box ex-box" role="dialog" aria-modal="true" aria-labelledby="ex-title">' +
                    '<button type="button" class="close-x ex-cerrar" aria-label="Cerrar">✕</button>' +
                    '<div class="ex-cabecera">' +
                        '<div class="ex-emoji">🤔</div>' +
                        '<h3 id="ex-title" class="ex-titulo">' + TITULOS[Math.floor(Math.random() * TITULOS.length)] + '</h3>' +
                        '<div class="ex-respuestas">' +
                            '<span class="ex-pill mal">✗ Tu respuesta <b>' + f(c.elegida) + '</b></span>' +
                            '<span class="ex-pill bien">✓ Correcta <b>' + f(c.correcta) + '</b></span>' +
                        '</div>' +
                    '</div>' +
                    '<section class="ex-card ex-como"><h4>💡 Así se hace</h4>' + transformacion(c) + pasos(c) + '</section>' +
                    '<section class="ex-card ex-recta"><h4>📏 En la recta numérica</h4>' + recta(c) + '<p class="ex-pie">' + pie(c) + '</p></section>' +
                    '<div class="dialog-actions"><button type="button" class="mode-button btn-free ex-ok">¡Entendido! Siguiente ➜</button></div>' +
                '</div>';
            document.body.appendChild(velo);

            var cerrado = false;
            function cerrar() {
                if (cerrado) return;
                cerrado = true;
                document.removeEventListener('keydown', onKey, true);
                if (typeof playSound === 'function' && typeof clickSound !== 'undefined') playSound(clickSound);
                velo.classList.add('dialog-out');
                setTimeout(function () { velo.remove(); }, 200);
                if (previo && typeof previo.focus === 'function') previo.focus();
                resolve();
            }
            /* Escape, Enter y espacio cierran y no llegan al resto de la página */
            function onKey(ev) {
                if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); cerrar(); }
            }
            document.addEventListener('keydown', onKey, true);
            velo.querySelector('.ex-ok').addEventListener('click', cerrar);
            velo.querySelector('.ex-cerrar').addEventListener('click', cerrar);
            setTimeout(function () { var b = velo.querySelector('.ex-ok'); if (b && !cerrado) b.focus({ preventScroll: true }); }, 50);
        });
    }

    return {
        mostrar: mostrar,
        interno: { calcular: calcular, porQue: porQue, pasos: pasos, transformacion: transformacion, recta: recta, pie: pie,
                   cifrasHtml: cifrasHtml, cifraEn: cifraEn, llevada: llevada, pasosLlevada: pasosLlevada, frasesRecta: frasesRecta, UNIDAD: UNIDAD, CIFRA: CIFRA, TITULOS: TITULOS }
    };

})();
