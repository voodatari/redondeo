# Historial de cambios

## [2.0.1] - 2026-10-10
- **iPhone / móvil:** el juego y la ventana de explicación aprovechan todo el alto de la pantalla (antes, en iPhone, la tarjeta quedaba pequeña en el centro y la explicación salía ancha y baja). El viewport lleva minimum-scale=1 y, si Safari muestra la página en una pantalla virtual más ancha que el teléfono, se fija el ancho físico (clase html.movil). La ventana de explicación tiene altura explícita (Safari no aplicaba min(640px, 100%)). En el juego, los botones de respuesta y el número son más grandes en pantallas estrechas.
- **Cuenta atrás:** los números entran con un golpe de escala, sin giro: en iPhone el giro de 180° los mostraba reflejados.
- Explicación: en el primer paso la respuesta errónea aparece centrada y se desliza a la izquierda cuando aparece la correcta; cabecera de la explicación en una sola línea en móvil.

## [2.0] - 2026-10-10
Versión 2: el juego habla. Sustituye a la versión 1 (guardada en las copias de seguridad del proyecto).
- **Explicaciones animadas y narradas** al fallar (voz Piper en el propio dispositivo, sin servidores): infografía de cinco pasos con controles de pausa, repetir, atrás / adelante (también con puntos y flechas del teclado) y saltar. Se centra en vertical en cada paso y se adapta a pantallas verticales (móvil, tablet): si no cabe, se reduce, nunca se corta.
- **Los pasos:** tu respuesta y la correcta (cada una aparece al nombrarla), la cifra a la que hay que redondear («en este caso es este 9»), la cifra de su derecha («como es un 5, y con cinco o más se sube»), los ceros y la **recta numérica**, contada por partes con su animación: extremo izquierdo, derecho, punto medio, el número con su flecha y el resultado.
- **Llevadas con uno o varios 9:** se cuentan despacio, una a una (la cifra gira, el «+1» salta a la de su izquierda y, si hace falta, aparece un 1 nuevo delante).
- **Opciones (⚙️):** «Explicación con voz» (animación y voz, o solo texto; activada por defecto) y «Explicar los fallos», un deslizador No · Práctica · Siempre (por defecto Siempre).
- **Explicar en todos los modos:** en contrarreloj y muerte súbita el juego se pausa por completo (también el reloj) mientras se explica. En muerte súbita, como el fallo termina la partida, durante la explicación ya suena la música de fin, que sigue sin cortes en los resultados. En todos los modos la música baja con un fundido mientras se explica y vuelve al cerrar.
- **Versión solo texto** con los mismos pasos y las mismas frases que la hablada; sin enunciado ni «por qué» repetidos, y la respuesta errónea sin tachar para que se lea bien.
- **«Más opciones» → «9️⃣ Más casos con llevada»:** más números con un 9 (a veces varios seguidos) que, al subir, se llevan una. Los cuatro extras van en una cuadrícula 2×2, cada uno con su título en una línea, la descripción debajo y el interruptor abajo a la derecha; la ventana sigue sin pedir scroll.
- **El nombre es opcional:** si se deja vacío, se juega como «Anónimo».
- **Voz:** modelo es_ES-sharvard-medium (Piper) con una salida extra de duraciones de fonema; fonemizador solo español e inglés (18 MB → 1 MB); guardado en el dispositivo la primera vez (~74 MB, después casi nada). Las cifras se leen como números (sin «punto» de miles) y hay pausas donde hacen falta.
- Cinta «v.2.0» en la tarjeta del menú principal.
- Se ignora el ajuste de movimiento reducido de Windows: las animaciones se ven siempre.

## [1.x] - 2026-09-24 a 2026-10-06
Versión 1, sin historial detallado en este archivo: modos contrarreloj, muerte súbita y práctica; «Más opciones» (dificultad estándar, a medida y progresiva, redondear a, opciones trampa, más casos con el 5 y sin cifra resaltada); explicación escrita de los fallos en la práctica libre; puntos de miles, modo ligero y escala fija; música con bucle sin cortes; modo docente con Supabase y rankings.
