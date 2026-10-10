/* =========================================================
   Escala fija · el juego se ve igual con cualquier escala de Windows
   Con la escala de Windows al 125 % o al 150 %, el navegador solo
   tiene 1536 o 1280 px de ancho (y menos alto) en lugar de 1920:
   las ventanas ocupan proporcionalmente más y algunas no caben.
   Con <html class="escala-fija"> las tarjetas y ventanas se amplían o
   reducen con CSS zoom para ocupar la misma proporción de pantalla que
   en un monitor 1080p al 100 % (referencia: 1920×900 px útiles).
   Los velos de los modales y el fondo no se tocan: siguen a pantalla completa.
   En pantallas estrechas (móvil, tableta en vertical) no se aplica.
   iPhone / Safari: a veces muestra la página en una pantalla virtual más ancha que el teléfono (se encoge para ajustar un
   elemento que desborda) y todo sale pequeño y sin los estilos de móvil. Si se detecta, se fija el ancho del viewport al de
   la pantalla física (y la clase html.movil marca los teléfonos).
   Se carga en el <head> para que la clase esté puesta antes de pintar.
   ========================================================= */
window.Escala = (function (global) {

    var K_ESCALA = 'redondeo.escala';   // '1' / '0' · sin guardar = activada
    var REF_ANCHO = 1920, REF_ALTO = 900;
    var MIN = 0.5, MAX = 2, ANCHO_MINIMO = 900;

    function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function escribir(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    var activa = leer(K_ESCALA) !== '0';

    /* ¿Teléfono o tableta pequeña? Ancho de su pantalla física en px CSS «normales» */
    function dispositivo() {
        var tactil = (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in global;
        var w = (global.screen && screen.width) || 0, h = (global.screen && screen.height) || 0;
        var corto = Math.min(w, h), largo = Math.max(w, h);
        var horizontal = global.innerWidth > global.innerHeight;
        return { movil: tactil && corto > 0 && corto <= 600, ancho: horizontal ? largo : corto };
    }
    /* viewport: si la ventana es mucho más ancha que la pantalla del teléfono, se fija el ancho físico */
    var ultimoAncho = 0;
    function corregirViewport() {
        var d = dispositivo(), meta = document.querySelector('meta[name="viewport"]');
        if (!meta || !d.movil || !d.ancho) return;
        var ratio = global.innerWidth / d.ancho;
        var contenido = ratio > 1.15 && d.ancho !== ultimoAncho
            ? 'width=' + d.ancho + ', initial-scale=1, minimum-scale=1, viewport-fit=cover'
            : null;
        if (contenido) { ultimoAncho = d.ancho; meta.setAttribute('content', contenido); }
    }
    corregirViewport();
    global.addEventListener('load', corregirViewport);

    function calcular() {
        var w = global.innerWidth, h = global.innerHeight;
        if (w < ANCHO_MINIMO) return 1;
        var z = Math.min(w / REF_ANCHO, h / REF_ALTO);
        return Math.round(Math.min(MAX, Math.max(MIN, z)) * 100) / 100;
    }

    function factor() { return activa ? calcular() : 1; }

    function aplicar() {
        var raiz = document.documentElement;
        raiz.classList.toggle('movil', dispositivo().movil);
        raiz.classList.toggle('escala-fija', activa);
        raiz.style.setProperty('--escala', String(factor()));
        var b = document.getElementById('scale-toggle-button');
        if (b) {
            b.setAttribute('aria-pressed', String(activa));
            var nota = document.getElementById('scale-toggle-info');
            if (nota) nota.textContent = activa
                ? 'Activada: ahora mismo al ' + Math.round(factor() * 100) + ' %.'
                : 'Mantiene el aspecto previsto aunque Windows use una escala del 125 % o 150 %.';
        }
    }
    aplicar();

    function conectarBoton() {
        var b = document.getElementById('scale-toggle-button');
        if (!b) return;
        b.addEventListener('click', function () {
            activa = !activa;
            escribir(K_ESCALA, activa ? '1' : '0');
            aplicar();
            global.dispatchEvent(new Event('resize'));   // que se recoloquen las cuadrículas
        });
        aplicar();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', conectarBoton);
    else conectarBoton();

    global.addEventListener('resize', function () { corregirViewport(); aplicar(); });
    global.addEventListener('orientationchange', function () { ultimoAncho = 0; setTimeout(function () { corregirViewport(); aplicar(); }, 250); });

    return {
        activa: function () { return activa; },
        factor: factor
    };

})(window);
