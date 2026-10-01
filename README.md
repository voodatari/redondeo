# ¡Redondeador!

Juego para practicar el **redondeo de números naturales** en Primaria: aparece un número, se marca la cifra a la que hay que redondear y se elige la respuesta correcta entre tres opciones.

**Web:** https://voodatari.github.io/redondeo/

Pensado para jugarse en el aula, en la pizarra digital o en los ordenadores del alumnado. Funciona en el navegador, sin instalar nada.

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
- **Sin cifra resaltada**: no se marca la cifra; hay que localizarla.

Para que los rankings sean justos, **Estándar** y **Progresiva** tienen cada una su ranking. Las partidas **A medida**, o con cualquier extra cambiado, se guardan pero no cuentan para ningún ranking.

## Opciones de la ⚙️ del menú

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

### Probarlo en local

Hay que servir la carpeta con un servidor web; abrir `index.html` con doble clic puede fallar.

- **VS Code**: extensión *Live Server* → clic derecho en `index.html` → *Open with Live Server*.
- **Node**: `npx serve .`
- **Python**: `python -m http.server 8080` y abrir http://localhost:8080

## Créditos de terceros

- [supabase-js](https://github.com/supabase/supabase-js) (MIT) y [pdf.js](https://github.com/mozilla/pdf.js) (Apache 2.0), cargados desde CDN.
- Tipografías [Fredoka](https://fonts.google.com/specimen/Fredoka) y [Poppins](https://fonts.google.com/specimen/Poppins) (SIL Open Font License), de Google Fonts.

---

Hecho por Daniel Vera (profe Dani).
