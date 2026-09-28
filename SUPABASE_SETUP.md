# Modo docente con Supabase: puesta en marcha

Sin configurar nada, el juego funciona igual que siempre (modo invitado con ranking local).
El modo docente se activa al iniciar sesión con **👩‍🏫 Acceso docente**.

## Un solo proyecto para los dos juegos

El Redondeador usa **el mismo proyecto de Supabase que el Multiplicador** (las claves de
[`config.js`](config.js) son las mismas). Por eso:

- Entras con **el mismo usuario y contraseña** en los dos juegos.
- Las **clases y los alumnos se comparten**: si ya importaste el PDF en el Multiplicador, aquí ya están.
- Las **partidas, sesiones y rankings van por separado**: cada partida lleva la columna `game`
  (`'multiplicador'` o `'redondeo'`, según `GAME_ID` en `config.js`).

## 1. Actualizar la base de datos (una sola vez)

1. En Supabase: **SQL Editor** → **New query**.
2. Copia todo el contenido de [`supabase/schema.sql`](supabase/schema.sql), pégalo y pulsa **Run**.
3. Debe aparecer `Success. No rows returned`.

El script no borra nada: añade la columna `game` a `sessions` y `games` (lo que ya estaba
queda como del Multiplicador) y actualiza la función de ranking. Se puede ejecutar varias veces.

> Hazlo **antes** de publicar esta versión del Redondeador y la nueva del Multiplicador:
> las dos necesitan la columna `game`. La versión del Multiplicador que está publicada ahora
> sigue funcionando después de ejecutar el script.

## 2. Probar en local

Hay que servir la carpeta con un servidor web; abrir `index.html` con doble clic puede fallar.

- **VS Code**: extensión *Live Server* → clic derecho en `index.html` → **Open with Live Server**.
- **Node**: `npx serve .` y abre la dirección que muestre.
- **Python**: `python -m http.server 8080` y abre <http://localhost:8080>.

Recorrido de prueba:

1. **👩‍🏫 Acceso docente** → **Entrar** con tu cuenta del Multiplicador.
2. Elige un modo de juego → aparece el selector de alumnos → elige uno (o pulsa **🎲 Al azar**).
3. Al acabar se guarda la partida con fecha y hora, y se muestra su puesto en la sesión.
4. **🏆 Rankings**: ranking de la sesión, ranking total de la clase e historial (solo del Redondeador).

Si vas a crear la base de datos desde cero, sigue la guía completa de `SUPABASE_SETUP.md` del
Multiplicador (crear el proyecto, desactivar *Confirm email* y pegar las claves) y ejecuta este mismo
`schema.sql`.

## Cómo funciona

| Concepto | Detalle |
|---|---|
| **Clase** | Grupo de alumnos (p. ej. "5º A"), común a los dos juegos. Se crea al importar el PDF de Séneca. |
| **Alumno** | Nombre, apellidos y foto en miniatura, comunes a los dos juegos. Si borras un alumno, se borran sus partidas de ambos. |
| **Sesión** | Agrupa las partidas de un día de este juego. Se crea sola con la primera partida del día; con **✨ Nueva sesión** empiezas otra. |
| **Partida** | Juego, alumno, modo, configuración de tiempo, aciertos, errores, duración, fecha/hora y sesión. |
| **Ranking** | La mejor puntuación de cada alumno en este juego, por modo y configuración de tiempo (o "Todos"). |
| **Práctica libre** | También se registra (botón **✅ Terminar y guardar**) y aparece en el historial. |
| **Sin conexión** | Si falla el guardado, la partida queda en cola en el navegador y se envía sola más tarde. |
