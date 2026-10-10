/* =========================================================
   Voz · opciones e indicador de carga (como en Silabeador)
   - «Explicación con voz»: al fallar se muestra la infografía animada y narrada; si se desactiva, la explicación
     escrita de siempre (solo texto). Activada por defecto.
   - «Explicar los fallos»: No · En práctica · Siempre (por defecto). En «Siempre», en contrarreloj y muerte súbita
     el juego se pausa por completo (también el reloj) mientras se explica el fallo.
   La voz (Piper) se carga entera al entrar en la web y se queda en memoria (y guardada en el dispositivo).
   ========================================================= */
window.VozUI = (function () {

    var K_EXP = 'redondeo.explicaAnimada', K_CUANDO = 'redondeo.explicarFallos';
    function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function escribir(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function $(id) { return document.getElementById(id); }

    var explica = leer(K_EXP) !== '0';
    var cuando = leer(K_CUANDO); if (['no', 'practica', 'siempre'].indexOf(cuando) < 0) cuando = 'siempre';
    var chip = $('voz-carga'), texto = $('voz-carga-texto'), barra = $('voz-carga-barra');
    var botonExp = $('voz-explica-button'), segCuando = $('explicar-seg');
    var ocultar = null;

    function pintar() {
        botonExp.setAttribute('aria-pressed', String(explica));
        // deslizador de tres posiciones: la pastilla se coloca en la opción elegida
        var botones = [].slice.call(segCuando.querySelectorAll('button'));
        botones.forEach(function (b, i) { var si = b.dataset.explicar === cuando; b.classList.toggle('active', si); b.setAttribute('aria-checked', String(si)); b.setAttribute('role', 'radio'); if (si) segCuando.style.setProperty('--pos', i); });
    }

    function esconderChip(ms) {
        ocultar = setTimeout(function () { chip.classList.add('fuera'); setTimeout(function () { chip.classList.add('oculto'); }, 450); }, ms);
    }
    function alProgreso(f, estado) {
        clearTimeout(ocultar);
        if (estado === 'cargando' && f < 1) {
            chip.classList.remove('oculto', 'fuera', 'error');
            texto.textContent = '🗣️ Cargando la voz… ' + Math.round(f * 100) + ' %';
            barra.style.width = Math.round(f * 100) + '%';
        } else if (estado === 'lista') {
            barra.style.width = '100%';
            texto.textContent = '✓ Voz lista';
            chip.classList.remove('oculto', 'error');
            esconderChip(1300);
        } else if (estado === 'error') {
            chip.classList.remove('oculto', 'fuera'); chip.classList.add('error');
            texto.textContent = 'No se pudo cargar la voz: las explicaciones seguirán sin ella';
            esconderChip(4500);
        }
    }

    function cargar() {
        if (!explica || cuando === 'no') return;
        // que el navegador no borre la voz guardada en el dispositivo cuando le falte espacio (si lo permite)
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {}); } catch (e) {}
        Voz.iniciar(alProgreso).catch(function () {});
    }

    function sonar() { if (typeof playSound === 'function' && typeof clickSound !== 'undefined') playSound(clickSound); }

    botonExp.addEventListener('click', function () {
        sonar(); explica = !explica; escribir(K_EXP, explica ? '1' : '0'); if (explica) cargar(); pintar();
    });
    segCuando.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        sonar(); cuando = b.dataset.explicar; escribir(K_CUANDO, cuando); cargar(); pintar();
    });

    cargar();
    pintar();

    return {
        /* ¿infografía animada con voz (true) o solo texto (false)? */
        explicacion: function () { return explica; },
        /* ¿se explica un fallo en este modo de juego? (free = práctica libre) */
        explicarEn: function (modo) { return cuando === 'siempre' || (cuando === 'practica' && modo === 'free'); }
    };

})();
