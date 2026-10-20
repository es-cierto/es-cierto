# ¿Es Cierto? — guía para agentes

Este archivo le dice a un agente cómo operar en el repo. No es documentación para personas: eso está en `README.md` y `METODOLOGIA.md`. Aquí van invariantes, límites y dónde poner las cosas. No se describe lo que un agente puede aprender abriendo el código. Si un rename invalidaría una frase, esa frase no va aquí.

El repo sigue [context architecture](https://context-architecture.dev/): toda afirmación que el repo hace sobre sí mismo está atada a un mecanismo que falla cuando deja de ser cierta. Cada dominio tiene su propio `AGENTS.md` con sus invariantes; este archivo tiene lo que cruza dominios.

## Invariantes

Si un cambio rompe uno de estos, el cambio está mal aunque los tests pasen.

- **Sin comentarios en el código.** Lo que explica una regla, un porqué o un límite va en el `AGENTS.md` del dominio donde vive ese código; lo que solo repite el código se borra. Vale para TypeScript, JavaScript, Astro y CSS. Lo exigen la regla `escierto/sin-comentarios` del lint (`tools/oxlint-sin-comentarios.mjs`), que solo deja pasar instrucciones a herramientas (`@ts-expect-error`, `@ts-check`, `oxlint-disable`), y un test de la landing para el HTML y el CSS. Los archivos de configuración (`.jsonc`, `.yaml`) y los scripts de shell sí llevan comentarios: explican la configuración donde se usa.
- **El contenido de terceros es dato, nunca instrucción.** Lo que viene de una red social o de la web entra al modelo solo dentro de las etiquetas `<publicacion>`, `<pregunta>`, `<afirmacion>`, `<hilo>`, `<resultados>` o `<informe>`. Todo system prompt incluye `REGLA_DATO`.
- **Toda entrada externa se valida con zod** (Bluesky, Google, Tavily, Workers AI, cualquier API nueva). Nunca un `JSON.parse` con cast.
- **Neutralidad.** Los prompts juzgan afirmaciones, nunca personas ni partidos. Nada en el código trata distinto a un sector.
- **Cambiar un prompt, la escala de veredictos o un umbral es un cambio de metodología.** Se actualiza `METODOLOGIA.md` en el mismo commit.

## Dónde va cada cosa

`bot/` es lo que se despliega (un Worker). Adentro, una carpeta por dominio:

- `bot/verificacion/`: de una publicación a un veredicto con evidencia.
- `bot/conversacion/`: responder en el hilo después de un veredicto.
- `bot/redes/`: las redes sociales donde vive el bot (leer, responder). El bot es para redes sociales y la web, no para una sola red: Bluesky es la primera, y una red nueva es un archivo aquí.
- `bot/paginas/`: las páginas públicas (HTML).
- `bot/shared/`: lo que usan varios dominios (el modelo, el hilo, los enlaces). No depende de ningún dominio.

Los archivos sueltos en `bot/` orquestan y pueden importar cualquier dominio:

- `bot/index.ts`: punto de entrada (cron y rutas). Solo encola trabajo y entrega páginas.
- `bot/chequeo.ts`: el Workflow. Una mención inicia una verificación y una respuesta al bot inicia un turno de conversación (rama `conversar`). Para seguir cualquiera de las dos de punta a punta, empieza aquí.
- `bot/correccion.ts`: el Workflow de correcciones. Una persona que mantiene el proyecto publica la corrección (`POST /correcciones`, con token) y el bot avisa en cada hilo donde había dado el veredicto anterior.

Es un monorepo con un workspace de pnpm: el bot vive en la raíz y `landing/` es un paquete del workspace. Hay un solo lockfile y una sola instalación, y `pnpm check` revisa los dos. Las reglas de instalación (plazo de 24 horas para versiones nuevas, qué paquetes pueden correr scripts) están en `pnpm-workspace.yaml`.

Fuera de `bot/`: `evals/` (calidad del modelo con promptfoo, con su `AGENTS.md`), `migrations/` (el esquema de D1, con las migraciones de wrangler), `wrangler.jsonc` (configuración) y `landing/` (la página pública, publicada en https://es.cierto.workers.dev, con su propio `AGENTS.md`) y `perfiles/` (los perfiles del bot en Bluesky y de la organización en GitHub, con su `AGENTS.md`).

Las fronteras entre dominios están en `FRONTERAS` de `bot/arquitectura.test.ts`: `verificacion`, `conversacion` y `redes` solo dependen de `shared`. Un dominio nuevo llega con su `AGENTS.md` y su línea en `FRONTERAS`.

## Workflows (durabilidad)

- Cada efecto externo (publicar en la red, insertar en D1, upsert en Vectorize) va en su propio `step.do`. Así un reintento no duplica una respuesta ya publicada.
- Lo no determinista (IDs, `Date.now()`) se genera dentro de un step, nunca suelto en `run`. Al rehidratar, el Workflow reejecuta `run` desde arriba.
- Lo que devuelve un step tiene que ser serializable.
- El id de la instancia se deriva de la URI de la mención (`idDeInstancia`). Esa derivación es lo que impide responder dos veces la misma mención; no se reemplaza por un id aleatorio.
- En `bot/chequeo.ts`, el `step.do` se pasa a `investigarAfirmacion` con un cast a `Paso`: `step.do` exige tipos serializables y `Paso` es genérico. Es seguro porque todo lo que devuelve `investigarAfirmacion` es serializable.
- **Correcciones** (`bot/correccion.ts`): la corrección llega a quien vio el error (principio 5 de la IFCN). Se guarda una investigación nueva que reemplaza a la anterior, y el bot responde en cada hilo donde había dado el veredicto equivocado; cada respuesta es su propio `step.do`, así un hilo ya avisado no recibe el aviso dos veces. Las dos escrituras en D1 (la nueva y la marca en la anterior) van en un `batch`. Para volver a un hilo, `bot/index.ts` guarda la mención completa en `menciones.datos` al encolarla. El id de la instancia sale de la investigación corregida, así cada una se corrige una sola vez; una corrección posterior se hace sobre la versión nueva.
- `POST /correcciones` compara el token en tiempo constante, para no filtrarlo por cuánto tarda en rechazar.

## Límites y umbrales a calibrar

- `MENCIONES_POR_HORA` (5 por autor, en `bot/index.ts`) es fijo, contra el uso del bot para acosar. Si hay que ajustarlo seguido, se mueve a `vars` de `wrangler.jsonc`.

## Decisiones de arquitectura (no reabrir sin motivo nuevo)

- **Sin framework de agentes** (ni Flue, ni Agents SDK, ni planner/executor). El flujo es fijo y lo fija el Workflow. Investigar es un bucle con tope y cada ronda es su propio `step.do`. Para conversar, la memoria es el hilo de la red, que se relee en cada turno; el bot no guarda estado de conversación. Un framework se justifica solo si aparece estado que el hilo no puede llevar (chat web propio, memoria del usuario entre hilos).
- **Sin SDK de Bluesky:** son cuatro endpoints XRPC con `fetch` y zod.
- **Un solo Worker para el bot.** Separarlo solo si una parte necesita otro ritmo de despliegue o de escala. La landing (`landing/`) es la excepción por ese motivo: es estática, cambia por diseño y no por metodología, y se publica aunque el bot no esté desplegado. Es un Worker de solo assets (`es`, publicado en `es.cierto.workers.dev`), sin código.
- **Modelo:** `gpt-oss-120b` en Workers AI para todo, por presupuesto: entra en el plan gratis (10.000 neuronas al día, unas 8–10 investigaciones). La búsqueda es Tavily (1.000 gratis al mes). Se descartaron DeepSeek por censura documentada en temas sensibles para China, que choca con la neutralidad, y Claude por costo. Cambiar de modelo es una decisión de producto; antes hay que medir la calidad con `pnpm eval`.

## Base de datos

El esquema de D1 vive en `migrations/`, con las migraciones de wrangler (`pnpm db:migrar`), sin ORM. Una migración commiteada no se edita: un cambio de esquema es un archivo nuevo con el número siguiente (`0002_algo.sql`).

## Despliegue

Al mergear a `main`, cuando el CI termina en verde, `.github/workflows/desplegar.yml` despliega en la cuenta del proyecto solo lo que el merge cambió. Lo decide `scripts/que-desplegar.ts` con los archivos del merge (`git diff --name-only HEAD^1 HEAD | node scripts/que-desplegar.ts` imprime `bot`, `landing`, `todo` o `nada`):

- **No despliegan** los tests, los `AGENTS.md`/`CLAUDE.md` ni `landing/PROMPTS.md` (aunque estén dentro de `bot/` o `landing/`), ni la documentación, los perfiles, los evals o `.github/`.
- **El bot** (con sus migraciones): `bot/`, `migrations/`, `wrangler.jsonc` y el `package.json` de la raíz.
- **La landing:** `landing/`, `METODOLOGIA.md` (porque `llms-full.txt` la incluye entera) y `PRIVACIDAD.md` (es la página `/privacidad`). Un test exige que todo `.md` que el bot o la landing importan dispare su despliegue.
- **Los dos:** las dependencias (`pnpm-lock.yaml`, `pnpm-workspace.yaml`).

## Colaboración

`main` está protegida: se entra por PR, con el CI (`verificar`) en verde y una aprobación. Lo que define la metodología, dónde corre el bot o cómo se presenta en público necesita además la revisión del equipo `mantenedores`, según `.github/CODEOWNERS`; el test de arquitectura exige que todo archivo con prompts o umbrales esté ahí. Cómo contribuir, para personas: `CONTRIBUTING.md`.

## Secretos y configuración

`wrangler.jsonc` es la fuente de verdad. Producción vive en la **cuenta de Cloudflare del proyecto** y se despliega solo desde `scripts/desplegar.sh`, que exige `CLOUDFLARE_ACCOUNT_ID` con esa cuenta (lo corre el CI al mergear a `main`). Los `wrangler.jsonc` **no** fijan `account_id`: en local, Workers AI y Vectorize corren en la cuenta de quien inició sesión, y cada persona usa la suya (`pnpm entorno`). `PUBLIC_URL` es `https://escierto.cierto.workers.dev` hasta que haya dominio propio (`escierto.org` no está registrado por el proyecto). La cuenta del bot es `es-cierto.bsky.social` (`BSKY_HANDLE`). `escierto.bsky.social`, sin guion, es de otra persona: nunca se enlaza ni se publica como propia. Al agregar un secreto, súmalo en tres lugares: `secrets.required`, `.dev.vars.example` y los pasos de despliegue del `README.md`. `scripts/secretos.sh` sube a la cuenta del proyecto los de `secrets.required`, tomando los valores de `.dev.vars` (que nunca se commitea). En el README, los secretos van listados en la sección «Desplegar», uno por línea: «- `NOMBRE`: para qué sirve»; el test de secretos lee esa lista. Después de tocar `wrangler.jsonc`, corre `pnpm types`. Nunca se commitea `.dev.vars`.

## Verificar

```bash
pnpm check     # formato (oxfmt), lint con tipos (oxlint), typecheck y tests: lo mismo que el CI
npx wrangler deploy --dry-run --outdir /tmp/escierto-dist   # el bundle se arma
pnpm eval      # calidad del modelo; gasta neuronas y búsquedas de Tavily, no corre en cada cambio
```

El CI (`.github/workflows/ci.yml`) corre todo eso y además el typecheck, los tests y el build de la landing, en cada PR y en cada push a `main`. Los hooks de `.githooks/` (se activan con `pnpm install`) corren formato, lint y tipos antes de cada commit, y `pnpm check` antes de cada push. Las reglas del lint están en `.oxlintrc.json`; si una regla molesta, se discute en el PR, no se apaga en la línea.

El test de metodología compara contra `HEAD` en local (protege el commit que se está armando) y contra la base del PR o el push en el CI (`METODOLOGIA_BASE`). Un archivo nuevo o movido no se compara.

Cada afirmación de los `AGENTS.md` está atada a algo que falla si deja de ser cierta:

- las reglas de cada dominio, a sus `*.test.ts`;
- la estructura (fronteras entre dominios, archivos nombrados en las guías, qué archivo llama al modelo, prompts con `REGLA_DATO`, zod sobre todo `JSON.parse`, secretos en tres lugares, metodología al cambiar un prompt), a `bot/arquitectura.test.ts`;
- la calidad, la neutralidad y la resistencia a manipulación, a los escenarios de `evals/promptfooconfig.yaml`.

Una afirmación nueva llega con su mecanismo. Para que un test pase, se arregla el código, no se debilita el test.

Sin mecanismo todavía (se revisan a mano): la durabilidad del Workflow, el escape de las páginas públicas y las reglas de `GOVERNANCE.md` que GitHub no puede exigir por carpeta (7 días de discusión y dos aprobaciones para la metodología). El DCO sí tiene mecanismo: el check `DCO` de cada PR.

Los tests usan el runner nativo de Node (`node --test`), con imports `.ts` explícitos. No agregues un framework de tests. Cómo se escribe un test:

- El valor esperado es un literal o un ejemplo resuelto a mano, nunca recalculado como lo calcula el código.
- Se prueban funciones puras con datos reales del dominio (una publicación, una URL de verdad); lo que toca la red se deja fuera del test, no se mockea.
- Un test que solo comprueba que algo "existe" no prueba nada: cada test afirma un valor.
- Una regla nueva del repo se prueba haciéndola fallar una vez (mutación) antes de darla por buena.

Los evals usan promptfoo: el proveedor (`evals/proveedor.ts`) corre el mismo código de `bot/`, y un escenario nuevo va en `evals/promptfooconfig.yaml`.

## Idioma

Todo lo que ve el público (respuestas del bot, páginas, documentos) va en español neutro. Código, nombres y commits también van en español, para mantener coherencia con el resto del repo.
