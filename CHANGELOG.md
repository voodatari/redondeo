# Historial de cambios

## [2.0.6] - 2026-10-10
- **Móvil, sin scroll en ninguna ventana:** nuevo movil.js: cada panel (Más opciones —en sus tres dificultades—, tiempo, opciones, nombre, ranking) reduce su letra lo necesario hasta que todo cabe en el alto visible, con margen abajo. Sirve para cualquier móvil.
- **Toques más rápidos en iPhone:** se quita el retardo de toque (touch-action), el logo animado deja de pintar su sombra mientras hay otra ventana encima, y el fondo en el móvil dibuja un fotograma de cada dos y sin sombras ni conexiones.
- **Música en el menú:** Safari solo deja arrancar el audio con «touchend» o «click»; ahora se prueban ambos hasta que suena, así la música del menú empieza con el primer toque.
- **Recta numérica:** la etiqueta del punto medio (y las de los extremos y el punto verde) se amplían sobre su sitio; en Safari se iban hacia la diagonal.

## [2.0.5] - 2026-10-10
- Quitada una franja gris que aparecía en la esquina superior izquierda del menú (el brillo del botón de música se escapaba de su botón).
- Móvil: logo algo menor y con menos zoom en su animación (ya no roza la tarjeta); subtítulo de la explicación con voz más pequeño; en «Más opciones» los botones «Restablecer» y «Listo» quedan fijos abajo y no se cortan; en el juego las respuestas y «Volver al menú» ya no se solapan y el sitio de «¡Correcto!» está siempre reservado, así que nada se mueve al aparecer.

## [2.0.4] - 2026-10-10
Móvil en vertical: nueva hoja de estilos movil.css (solo teléfonos con la pantalla en vertical; ordenador y horizontal no cambian).
- **Todo más grande y sin huecos:** menú (letras de los botones mucho mayores, logo que ocupa el hueco libre), selección de tiempo, juego, opciones y «Más opciones», explicaciones y avisos. El alto disponible es el que deja visible la barra de Safari (ya no se corta el botón de música).
- **Juego:** el texto «a la unidad de… más cercana» ya no queda tapado por la primera respuesta; las tres respuestas y «Volver» se reparten el alto.
- **Explicación con voz:** Atrás / Pausa / Repetir / Adelante en una cuadrícula 2×2 (ya no se pegan al borde), subtítulo más grande, las dos respuestas una bajo otra y la escena se amplía para aprovechar el espacio.
- **Explicación solo texto:** letra mayor con interlineado normal, y se desactiva el autoajuste de texto de iOS (hacía la letra pequeña y el interlineado enorme).
- **Opciones:** letra mayor, interruptores más grandes, sin «Escala fija» (no sirve en el móvil); en «Más opciones» los cuatro extras van en una columna y ya no se salen de la pantalla.
- Pantallas bajas (iPhone SE, Android pequeños): versión algo más compacta.

## [2.0.3] - 2026-10-10
- **iPhone:** si Safari muestra la página en una ventana virtual más ancha que la pantalla (todo salía diminuto), ahora se compensa ampliando menús, ventanas, juego y explicaciones lo que se había encogido (escala = ventana / pantalla), con las alturas ajustadas. En una ventana normal no cambia nada.

## [2.0.2] - 2026-10-10
Móvil y explicación escrita.
- **Explicación solo texto en dos vistas**, sin scroll: primero «Así se hace»; abajo, «Recta numérica» (izquierda) y «¡Entendido! Siguiente» (derecha). Al pulsar «Recta numérica» se ve «En la recta numérica» y el botón pasa a «Así se hace», para alternar.
- **Teléfonos:** la escala fija nunca se aplica (en iPhone, con la ventana virtual de Safari, todo salía diminuto); botones del menú, selección de tiempo (Volver / Más opciones en dos botones grandes) y diálogos más grandes y cómodos para los dedos; la cabecera de la explicación se compacta.

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
