/* =========================================================
   Ajustes · menú de opciones (rueda dentada del menú principal)
   - Puntos de miles: 45.678 en lugar de 45678 (activado por defecto)
   - Modo ligero: lo gestiona rendimiento.js (#perf-toggle-button)
   La elección se guarda en localStorage.
   ========================================================= */
window.Ajustes = (function () {

    var K_PUNTOS = 'redondeo.puntos';   // '1' / '0' · sin guardar = con puntos

    function leer(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function escribir(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    var puntos = leer(K_PUNTOS) !== '0';

    /* 45678 → ['45', '678'] · 1234567 → ['1', '234', '567'] */
    function gruposDeMiles(n) {
        var cifras = String(n);
        var grupos = [];
        for (var fin = cifras.length; fin > 0; fin -= 3) grupos.unshift(cifras.slice(Math.max(0, fin - 3), fin));
        return grupos;
    }

    function formatear(n) {
        return puntos ? gruposDeMiles(n).join('.') : String(n);
    }

    var modal = document.getElementById('settings-modal');
    var botonPuntos = document.getElementById('dots-toggle-button');

    function pintar() { botonPuntos.setAttribute('aria-pressed', String(puntos)); }
    pintar();

    function sonar() { if (typeof playSound === 'function' && typeof clickSound !== 'undefined') playSound(clickSound); }
    function abrir() { sonar(); modal.style.display = 'flex'; }
    function cerrar() { modal.style.display = 'none'; }

    document.getElementById('settings-button').addEventListener('click', abrir);
    botonPuntos.addEventListener('click', function () {
        sonar();
        puntos = !puntos;
        escribir(K_PUNTOS, puntos ? '1' : '0');
        pintar();
    });
    document.getElementById('perf-toggle-button').addEventListener('click', sonar);
    document.getElementById('scale-toggle-button').addEventListener('click', sonar);
    modal.addEventListener('mousedown', function (e) { if (e.target === modal) cerrar(); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') cerrar();
    });

    return {
        puntos: function () { return puntos; },
        gruposDeMiles: function (n) { return puntos ? gruposDeMiles(n) : [String(n)]; },
        formatear: formatear
    };

})();
