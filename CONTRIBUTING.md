# Contribuir

Gracias por sumarte. ¿Es Cierto? es un verificador de datos abierto y no partidista: cada cambio tiene que mantenerlo correcto, neutral y fácil de auditar.

## Formas de ayudar

- **Reportar un veredicto equivocado.** Abre un issue con la plantilla «Veredicto equivocado», con el enlace a la investigación y la fuente que lo contradice. Si se confirma, se publica una corrección ([cómo](METODOLOGIA.md#correcciones)).
- **Proponer un cambio a la metodología.** Abre un issue con la plantilla «Propuesta de metodología» y discútelo antes de escribir código. Un cambio a los prompts, la escala o los umbrales afecta todos los veredictos.
- **Código.** Busca issues con la etiqueta `good first issue` para empezar. Para algo más grande, comenta en el issue antes de partir, así nadie hace el mismo trabajo dos veces.

## Antes de escribir código

1. **Lee `AGENTS.md`** en la raíz y el de la carpeta donde vas a trabajar (`bot/verificacion/`, `landing/`, etc.). Ahí están las reglas que el repo no negocia y dónde va cada cosa. Están escritas para agentes de IA, pero valen igual para personas.
2. **Toda regla tiene su test.** El repo sigue [context architecture](https://context-architecture.dev/): si una guía afirma algo del código, hay un test que falla cuando deja de ser cierto. Si agregas una regla, agrega su test. Para que un test pase, se arregla el código, no se debilita el test.

## Preparar el entorno

Requisitos: Node 24 (ver `.node-version`) y pnpm 10.

```bash
pnpm install          # instala el bot y la landing (es un monorepo) y activa los hooks de git
pnpm check            # formato, lint, tipos y tests: no necesita claves ni red
```

Con eso ya puedes trabajar en casi todo: la landing (`cd landing && pnpm dev`), el código del bot y sus tests.

### Probar el bot de punta a punta

Para que el bot investigue de verdad en tu computador necesitas **tus propias cuentas gratis**, nunca las del proyecto:

- **Cloudflare:** Workers AI y Vectorize no tienen simulación local, corren en tu cuenta aun en `pnpm dev`. El plan gratis alcanza para varias investigaciones al día.
- **Tavily** (la búsqueda web): una clave gratis en tavily.com, 1.000 búsquedas al mes.
- **Bluesky:** no hace falta. El chat de prueba en `/probar` hace de red social.

```bash
pnpm exec wrangler login   # con tu cuenta de Cloudflare
pnpm entorno               # crea tu .dev.vars, el índice de Vectorize en tu cuenta y la base local
# agrega tu TAVILY_API_KEY en .dev.vars
pnpm dev                   # y abre http://localhost:8787/probar
```

`pnpm entorno` se puede correr las veces que haga falta. Si tienes `CLOUDFLARE_ACCOUNT_ID` o `CLOUDFLARE_API_TOKEN` en tu terminal (por ejemplo, de un trabajo), wrangler usa esa cuenta y no la de tu sesión: el script te avisa.

Para correr los evals (`pnpm eval`) hace falta además un token de tu cuenta con permiso de Workers AI (ver `evals/proveedor.ts`). Gastan tu plan, no el del proyecto.

## Flujo de trabajo

1. Crea una rama desde `main` (los integrantes de la organización pueden crearla en el repo; si no, haz un fork).
2. Haz los cambios con commits pequeños, en español, con el formato `tipo(ámbito): qué cambia` (`feat`, `fix`, `chore`, `docs`; por ejemplo `fix(landing): …`).
3. Antes de abrir el PR, corre `pnpm check` (formato, lint, tipos y tests de todo el monorepo). Los hooks lo corren solos al hacer push. Para formatear: `pnpm format`.
4. Abre el PR contra `main` y completa la plantilla. El CI corre lo mismo que `pnpm check`, más las migraciones y el build.
5. `main` está protegida: se entra solo por PR, con el CI en verde y la aprobación de una persona que mantiene el proyecto. Los cambios a la metodología, los prompts, la configuración y los perfiles necesitan además la revisión del equipo `mantenedores` (ver `.github/CODEOWNERS`).

Si tocas la landing, revisa cómo se ve en escritorio y en celular antes de pedir revisión, y adjunta capturas al PR.

## Lo que no se acepta

- Cambios que traten distinto a un sector político, o textos, colores o símbolos que se asocien a uno (ver `landing/AGENTS.md`).
- Contenido de terceros usado como instrucción para el modelo: lo que viene de una red social o de la web entra solo como dato (ver `AGENTS.md`).
- Claves, tokens o `.dev.vars` en el repo. Si se filtra una por error, avisa: hay que revocarla, no basta con borrar el commit.
- Datos inventados en la página o en los ejemplos.

## Firma de los commits (DCO)

Cada commit lleva al final una línea `Signed-off-by: Tu Nombre <tu@correo>`. Con ella certificas el [Developer Certificate of Origin](https://developercertificate.org): que escribiste ese cambio o tienes derecho a aportarlo, y que se puede publicar bajo la licencia del proyecto (AGPL-3.0). Lo usan proyectos como el kernel de Linux y GitLab.

No tienes que hacer nada: el hook `.githooks/prepare-commit-msg` (se activa con `pnpm install`) la agrega sola, con el nombre y correo de tu `git config`. El correo tiene que ser el mismo con que firmas el commit. Si trabajas desde un fork sin los hooks, usa `git commit -s`. El check `DCO` del PR avisa si falta en algún commit y dice cómo arreglarlo.

## Despliegue

Al mergear a `main`, cuando el CI termina en verde, se despliega solo: migraciones, bot y página, en la cuenta de Cloudflare del proyecto (`.github/workflows/desplegar.yml`). Nadie necesita acceso a Cloudflare, a la cuenta de Bluesky ni a las claves del proyecto para contribuir, y esas claves no se comparten (ver `GOVERNANCE.md`, «Accesos»).

## Conducta y seguridad

- Sigue el [código de conducta](CODE_OF_CONDUCT.md).
- Cómo se toman las decisiones, quién mantiene el proyecto y cómo se llega a mantenedor: [GOVERNANCE.md](GOVERNANCE.md).
- Las vulnerabilidades se reportan en privado: [SECURITY.md](SECURITY.md).
