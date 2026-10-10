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
pnpm types            # tipos de Cloudflare a partir de wrangler.jsonc
cp .dev.vars.example .dev.vars
```

Para probar el bot sin Bluesky: pon `PRUEBA_WEB=si` en `.dev.vars`, corre `pnpm dev` y abre http://localhost:8787/probar. Para investigar hace falta una clave de Tavily propia (gratis en tavily.com) y una sesión de wrangler en una cuenta tuya de Cloudflare (`npx wrangler login`): Workers AI corre remoto aun en local.

Para la landing: `cd landing && pnpm dev`.

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

## Despliegue

El bot y la página corren en la cuenta de Cloudflare del proyecto. Por ahora despliegan solo las personas que mantienen el proyecto, después de mergear. Nadie necesita acceso a Cloudflare ni a la cuenta de Bluesky para contribuir.

## Conducta y seguridad

- Sigue el [código de conducta](CODE_OF_CONDUCT.md).
- Las vulnerabilidades se reportan en privado: [SECURITY.md](SECURITY.md).
