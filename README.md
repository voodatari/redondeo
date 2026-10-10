# ¡Redondeador!

Juego para practicar el **redondeo de números naturales** en Primaria: aparece un número, se marca la cifra a la que hay que redondear y se elige la respuesta correcta entre tres opciones.

**Web:** https://voodatari.github.io/redondeo/

Pensado para jugarse en el aula, en la pizarra digital o en los ordenadores del alumnado. Funciona en el navegador, sin instalar nada.

**Versión 2.0:** cuando se falla, el juego **habla**: una infografía animada y narrada explica el error paso a paso. La voz se genera en el propio dispositivo (ver [Explicaciones con voz](#explicaciones-con-voz)).

## Modos de juego

| Modo | Cómo se juega |
|---|---|
| ⏱️ **Contrarreloj** | Tantos aciertos como se pueda en un tiempo fijo (de 10 s a 2 min). |
| 💀 **Muerte súbita** | Un fallo y se acaba. Se elige el tiempo por pregunta: infinito o de 5 a 1 segundos. |
| 🎯 **Práctica libre** | Sin tiempo ni ranking, a tu ritmo. |

Al terminar se ve el resumen de la partida (aciertos, errores, aciertos por segundo) y el ranking.

## Más opciones

Desde la pantalla de tiempo de cada modo, **⚙️ Más opciones** permite cambiar la dificultad:

- **Estándar**: números de 2 a 6 cifras, redondeando de la decena a la decena de millar.
- **A medida**: números de x a y cifras (de 2 a 7).
- **Progresiva**: empieza con 2 cifras y cada 5 aciertos suma una más, hasta 7.
- **Redondear a**: elegir los órdenes de unidad (D, C, UM, DM, CM, UMM). Solo se pueden marcar los que caben en el número de cifras elegido.
- **Opciones trampa**: las respuestas incorrectas son los errores típicos (redondear hacia el otro lado o a la cifra de al lado).
- **Más casos con el 5**: salen más números en los que la cifra que decide es un 5.
- **Más casos con llevada**: salen más números con un 9 (a veces varios seguidos) en la cifra a la que se redondea y una cifra que decide de 5 o más, así que al subir se lleva una (3.997 → 4.000, 9.996 → 10.000).
- **Sin cifra resaltada**: no se marca la cifra; hay que localizarla.

Para que los rankings sean justos, **Estándar** y **Progresiva** tienen cada una su ranking. Las partidas **A medida**, o con cualquier extra cambiado, se guardan pero no cuentan para ningún ranking.

## Explicaciones con voz

Cuando se falla, se explica el error y la respuesta correcta. Hay dos formas, a elegir en la ⚙️ del menú:

- **Explicación con voz** (activada por defecto): una **infografía animada y narrada**, de cinco pasos: tu respuesta y la correcta, la cifra a la que hay que redondear, la cifra de su derecha (sube o se queda), los ceros —con las **llevadas** contadas una a una cuando hay uno o varios 9— y la **recta numérica** (el extremo de abajo, el de arriba, el punto medio, dónde cae el número y el resultado). Se puede pausar, repetir, ir a cualquier paso con ◀ ▶, los puntos o las flechas del teclado, y saltarla.
- **Desactivada**: la explicación escrita de siempre (solo texto), con los mismos pasos y las mismas frases.

**Explicar los fallos** decide cuándo se explica: *No*, *Práctica* o *Siempre* (por defecto):

- **Práctica libre**: se explica el fallo y luego sale otra pregunta.
- **Contrarreloj**: el juego y el reloj se pausan por completo mientras se explica; al cerrar sigue con el tiempo que quedaba.
- **Muerte súbita**: el fallo termina la partida, así que durante la explicación ya suena la música de fin, que sigue sin cortes en los resultados. El tiempo de la explicación no cuenta.

Mientras se explica, la música baja con un fundido y vuelve al cerrar. La voz es [Piper](https://github.com/rhasspy/piper) (voz *es_ES-sharvard-medium*) y se ejecuta **en el navegador** (WebAssembly, en un Web Worker): no hay servidor de voz ni se envía nada a internet. La primera vez se descargan ~74 MB (casi todo es el modelo de voz) y se **guardan en el dispositivo**, así que las visitas siguientes arrancan sin descargar nada y la voz funciona también sin conexión. El modelo está ampliado con una segunda salida (la duración de cada fonema) y el fonemizador (espeak-ng) lleva solo español e inglés.

## Opciones de la ⚙️ del menú

- **Explicación con voz** y **Explicar los fallos**: ver arriba.
- **Puntos de miles**: 45.678 en lugar de 45678.
- **Modo ligero**: quita el desenfoque para equipos poco potentes. Se activa solo si el equipo parece modesto.
- **Escala fija**: el juego se ve igual aunque Windows use una escala de pantalla del 125 % o 150 %.

## Modo docente (opcional)

Sin iniciar sesión, el juego guarda un ranking local en el propio navegador. Con **👩‍🏫 Acceso docente**:

- Se crean clases y se importa el alumnado desde el **PDF de Séneca** con las fotos de la clase. El PDF se lee en el navegador y no se sube a ningún sitio.
- Antes de cada partida se elige quién juega, o se sortea.
- Cada partida se guarda con su modo, tiempo y dificultad: hay **rankings de la sesión** (la clase de hoy), **de la clase** y un **historial** por alumno.

Usa el mismo proyecto de Supabase que el [Multiplicador](https://github.com/voodatari/multiplierquiz): la cuenta, las clases y el alumnado son comunes y las partidas van por separado. La puesta en marcha está en [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) y el esquema de la base de datos, en [`supabase/schema.sql`](supabase/schema.sql).

## Cómo está hecho

HTML, CSS y JavaScript sin frameworks ni compilación: lo que hay en el repositorio es exactamente lo que se publica.

| Archivo | Qué hace |
|---|---|
| `index.html`, `style.css` | Todas las pantallas y sus estilos |
| `main.js`, `ui-manager.js`, `game-logic.js` | Arranque, pantallas y lógica del juego |
| `opciones.js` | «Más opciones»: dificultad, generador de preguntas y respuestas trampa |
| `ranking.js` | Ranking local (modo invitado) |
| `audio.js` | Música y efectos; en Chrome, la música se repite sin cortes con Web Audio |
| `ajustes.js`, `rendimiento.js`, `escala.js` | Menú de opciones, modo ligero y escala fija |
| `effects.js`, `background-animation.js` | Cuenta atrás, confeti, avisos y fondo animado |
| `config.js`, `teacher-data.js`, `teacher-ui.js` | Modo docente con Supabase |
| `pdf-import.js` | Lectura del PDF de Séneca con pdf.js |
| `explicacion.js` | Explicación escrita de un fallo (y los textos y la recta que comparte con la animada) |
| `infografia.js` | Explicación animada y narrada: guion de pasos, escena y reproductor |
| `movil.css`, `escala.js` | Aspecto en teléfonos en vertical (tamaños, alturas) y escala |
| `voz.js`, `voz-worker.js`, `voz-ui.js`, `voz.css` | La voz: caché y reproducción, Piper en un Web Worker, opciones y estilos |
| `piper/` | Motor ONNX Runtime, fonemizador espeak-ng y modelo de voz |

### Probarlo en local

Hay que servir la carpeta con un servidor web; abrir `index.html` con doble clic no funciona (la voz necesita un Web Worker y WebAssembly).

- **VS Code**: extensión *Live Server* → clic derecho en `index.html` → *Open with Live Server*.
- **Node**: `npx serve .`
- **Python**: `python -m http.server 8080` y abrir http://localhost:8080

## Créditos de terceros

- [supabase-js](https://github.com/supabase/supabase-js) (MIT) y [pdf.js](https://github.com/mozilla/pdf.js) (Apache 2.0), cargados desde CDN.
- Tipografías [Fredoka](https://fonts.google.com/specimen/Fredoka) y [Poppins](https://fonts.google.com/specimen/Poppins) (SIL Open Font License), de Google Fonts.
- Música de bancos de música libre de derechos.
- Voz: [Piper](https://github.com/rhasspy/piper) (MIT) con la voz [es_ES-sharvard-medium](https://huggingface.co/rhasspy/piper-voices/tree/main/es/es_ES/sharvard/medium), entrenada con el corpus [Sharvard](https://datashare.ed.ac.uk/handle/10283/574) (CC BY 3.0).
- Fonemizador: [espeak-ng](https://github.com/espeak-ng/espeak-ng) (GPL-3.0) a través de piper-phonemize, compilado a WebAssembly.
- Motor de inferencia: [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) (MIT).

---

Hecho por profe Dani.
