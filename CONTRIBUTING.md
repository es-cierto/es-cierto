# Contribuir

Gracias por sumarte. Hay varias formas de ayudar:

- **Reportar un veredicto equivocado**: abre un issue con el enlace al análisis y la fuente que lo contradice.
- **Proponer mejoras a la metodología**: abre un issue para discutirlo antes de enviar un PR. Los cambios a [METODOLOGIA.md](METODOLOGIA.md) o a los prompts afectan todos los veredictos.
- **Código**: nuevas redes sociales, soporte de imágenes, mejoras de la página pública.

## Flujo

1. Haz un fork y crea una rama.
2. `pnpm install && pnpm types` (instala también los hooks de git).
3. Antes del PR, verifica que pase `pnpm check` (formato, lint, tipos y tests). Para formatear: `pnpm format`.
4. Explica en el PR qué cambia y por qué.

## Reglas

- Nunca subas claves ni `.dev.vars`.
- Los textos que ve el público van en español.
- La neutralidad no se negocia: no se aceptan cambios que traten distinto a un sector político.
