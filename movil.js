/* =========================================================
   Móvil en vertical: cada ventana (opciones, tiempo, etc.) reduce su letra hasta que todo cabe sin scroll.
   Los estilos de movil.css usan em, así que al bajar el font-size del panel todo se encoge a la vez.
   ========================================================= */
(function () {
    var raiz = document.documentElement, pendiente = false;
    var PANELES = '.modal > .panel, .modal > #time-selection-area, .modal > #player-name-area, .modal > #ranking-area';

    function activo() { return raiz.classList.contains('movil') && global_vertical(); }
    function global_vertical() { return window.matchMedia ? window.matchMedia('(orientation: portrait)').matches : innerHeight > innerWidth; }

    function ajustar(p) {
        p.style.fontSize = '';
        if (!activo() || p.offsetParent === null) return;
        var f = 100;
        while (p.scrollHeight > p.clientHeight + 1 && f > 52) { f -= 3; p.style.fontSize = f + '%'; }
    }
    function todos() { [].forEach.call(document.querySelectorAll(PANELES), ajustar); }
    function programar() {
        if (pendiente) return;
        pendiente = true;
        requestAnimationFrame(function () { pendiente = false; todos(); });
    }

    document.querySelectorAll('.modal').forEach(function (m) {
        new MutationObserver(programar).observe(m, { attributes: true, attributeFilter: ['style'] });   // se abre / se cierra
        [].forEach.call(m.children, function (p) { new MutationObserver(programar).observe(p, { childList: true, subtree: true, characterData: true }); });
    });
    window.addEventListener('resize', programar);
    window.addEventListener('orientationchange', function () { setTimeout(programar, 300); });
    document.addEventListener('click', function () { setTimeout(programar, 0); }, true);   // desplegables, pestañas…
    programar();
})();
