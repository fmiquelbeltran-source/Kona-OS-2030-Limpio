# KONA OS 2030 — Base nueva, sin Domestique (14/10/2026)

Web móvil y PWA para planificar entrenamientos semanales, registrar recuperación, estimar nutrición e interpretar cuatro gráficas deportivas. Es una base funcional desde cero, independiente de las versiones anteriores; **no importa por sí sola los datos almacenados en versiones antiguas**. Para el repositorio público de GitHub, guarda el estado personal en el navegador y, opcionalmente, en tu cuenta Supabase con acceso privado.

## Funciona ya

- Calendario semanal y registro de sesiones completadas con RPE/sensaciones.
- Botón **Importar** para un plan JSON. Formato de ejemplo `examples/semana_2026-11-02.json`.
- Botón **Buscar plan publicado en GitHub** lee `plan-semana.json`; si ChatGPT actualiza ese archivo en el repositorio con permisos autorizados, la web lo detecta al volver a cargar (el proceso de publicación sigue sujeto a la acción del chat, no se ejecuta solo cada domingo).
- Alta manual de actividades e importación CSV/JSON; gráfico de ocho semanas por disciplina y métrica; ficha individual; informe dominical copiable o descargable para traer a ChatGPT.
- Registro de sueño, HRV, FC reposo, estrés, fatiga y síntomas; recomendación conservadora sobre mantener/reducir. No cambia automáticamente la prescripción.
- Estimación nutricional sólo si añades peso y mantenimiento calórico personal. Es orientativa, no una pauta clínica.
- Exportación/restauración JSON de los datos de tu navegador.
- PWA desde móvil, instalación «Añadir a pantalla de inicio» y lectura básica en modo sin conexión una vez cargada.
- Integración **opcional** con Supabase Auth + base de datos privada, mediante el SQL `supabase/esquema.sql`, URL de proyecto y *publishable key*. Tras autenticarte, elige una copia inicial manualmente y después las modificaciones se guardarán automáticamente en la nube. No hagas cambios simultáneos desde varios dispositivos: hoy se aplica «última escritura gana».

## NO funciona todavía

- **No hay conexión real a Google Health / Health Connect.** Para leer los datos del teléfono hará falta instalar una app Android con permisos y un proceso de transferencia autenticado.
- **No hay conexión Strava automática**. Desde junio de 2026 Strava exige suscripción de desarrollador para crear nuevas aplicaciones de API (véase documentación oficial). Para conservar coste cero, la alternativa futura es aprovechar sesiones compatibles que Strava transfiera a Health Connect, con sus limitaciones. No todas las métricas ni todos los entrenamientos se compartirán.
- **No se publica automáticamente un nuevo plan desde esta conversación**. Cada domingo puedes pedirme el archivo para importarlo, o pedirme que edite `plan-semana.json` del repositorio si hay conexión autorizada a GitHub.
- El plan inicial para noviembre es **provisional**, y debe adaptarse al alta médica, las sensaciones y el retorno tras septoplastia.

## Instalación en GitHub Pages

1. **No sobrescribas la web anterior sin guardar antes sus datos**, y considera publicar esta versión primero en otro repositorio de prueba. La nueva base usa su propia clave de almacenamiento; los datos previos no se migran solos.
2. Descomprime el ZIP y sube todos los archivos de esta carpeta a la raíz del repositorio de GitHub que elijas.
3. Settings → Pages → Deploy from branch → `main` / `(root)`. Espera la publicación y abre la URL con HTTPS.
4. En móvil: menú del navegador → «Añadir a pantalla de inicio» / «Instalar aplicación».
5. El plan provisional de la semana del 2/11 se carga desde `plan-semana.json` la primera vez.

## Cuenta privada opcional en Supabase

1. Crea un proyecto **Free** en tu propia cuenta de Supabase, comprueba coste antes de confirmar y NO crees gastos recurrentes.
2. SQL Editor: ejecuta `supabase/esquema.sql` y confirma que la tabla `athlete_state` tiene RLS habilitado.
3. Auth: habilita Email (y, si deseas, confirmación por correo). Crea una cuenta con contraseña robusta.
4. En la web → **Ajustes**: pega la URL pública y la clave **publishable/anon** (nunca service_role) → iniciar sesión.
5. Dispositivo principal: **Subir datos actuales**. En otro dispositivo: iniciar sesión → **Descargar datos de nube** (guarda primero una copia de seguridad local).
6. Una vez hecha esa elección, los cambios posteriores se suben automáticamente desde el navegador en uso. Ojo: los teléfonos pueden suspender el navegador; no hay sincronización con Strava/Google Health ni tareas de servidor en segundo plano en esta primera fase.

## Estructura de archivos

- `index.html` + `styles.css`: interfaz.
- `app.js` + `engine.mjs`: interacción, importación, cálculos y gráficas.
- `cloud.mjs`: sincronización privada opcional Supabase.
- `plan-semana.json`: archivo público para el calendario. No incluyas datos íntimos de salud aquí.
- `examples/semana_2026-11-02.json`: ejemplo de importación.
- `supabase/esquema.sql`: RLS por usuario autenticado.
- `manifest.webmanifest` + `sw.js` + `assets/icon.svg`: PWA.

## Plan semanal JSON

```json
{"week_start":"2026-11-09","revision":1,"phase":"Base","objective":"Semana de adaptación","sessions":[{"id":"09nov-run-01","date":"2026-11-09","sport":"run","minutes":35,"title":"Rodaje suave","intensity":"Z2","rpeTarget":3,"notes":"Respiración cómoda"}]}
```

Campos válidos de `sport`: `run`, `bike`, `swim`, `strength`, `mobility`. Los identificadores deben ser únicos en una semana. No reuses IDs anteriores si cambias la sesión; se conservan registros pero no se reinterpretan automáticamente.

## Datos externos (opcional, manual)

CSV con encabezados como `date,sport,minutes,distance_km,hr,power,rpe,id,title` o encabezados habituales `start_date_local,type,moving_time,distance,average_heartrate,average_watts`. Distancia en metros si el campo es `distance`; kilómetros si es `distance_km`. El soporte no constituye una conexión automática.

## Seguridad y límites

La web en GitHub Pages es pública, incluso si el navegador contiene datos locales privados. No introduzcas tokens OAuth de Strava, Google, Supabase service_role, secretos ni datos médicos personales en el repositorio público. El acceso a Supabase está limitado por RLS, pero se debe comprobar la configuración antes de subir registros reales. El cálculo de carga y calorías es orientativo; no diagnostica sobreentrenamiento o enfermedad y no sustituye a profesionales sanitarios.
