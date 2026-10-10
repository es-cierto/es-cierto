# Gobernanza

Cómo se toman las decisiones en ¿Es Cierto? y quién las toma. Un verificador de datos vale lo que vale su independencia: este documento existe para que nadie, ni quienes lo mantienen, pueda cambiar cómo se verifica sin que quede a la vista y sin pasar por otras personas.

## Roles

- **Personas que contribuyen.** Cualquiera puede abrir issues, discusiones y PR (desde un fork). No hace falta pedir permiso.
- **Colaboradores** (equipo `colaboradores` en GitHub). Pueden crear ramas en el repo y aprobar PR del día a día. Se suma a quien contribuye con regularidad, por invitación de una persona que mantiene el proyecto.
- **Mantenedores** (equipo `mantenedores`). Revisan lo que define la metodología, dónde corre el bot y cómo se presenta en público (`.github/CODEOWNERS`), publican correcciones, despliegan y responden por el proyecto.

Mantenedores actuales: [@IsraelHuentecura](https://github.com/IsraelHuentecura) y [@fforres](https://github.com/fforres) (Felipe Torres).

### Fundadores

Israel Huentecura y Felipe Torres fundaron el proyecto y son sus primeros mantenedores. Entran **sin el requisito de tres meses** de contribución, porque al partir no hay a quién aplicárselo; ese requisito rige para todas las personas que lleguen después.

Cada fundador declara en el PR que lo nombra que no milita en un partido, no trabaja para una campaña y no recibe dinero de nadie afectado por una verificación. Ser fundador no da más votos ni derechos que ser mantenedor: solo deja constancia de quién empezó el proyecto.

## Cómo se decide

| Qué cambia                                                                 | Qué hace falta                                                                                                                                                                                                                |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Código, la página, las herramientas                                        | Un PR con el CI en verde y una aprobación.                                                                                                                                                                                    |
| Metodología: prompts, escala de veredictos, umbrales, jerarquía de fuentes | Un issue con la plantilla «Propuesta de metodología», **al menos 7 días de discusión pública**, `pnpm eval` antes y después, `METODOLOGIA.md` actualizada en el mismo PR y la aprobación de **dos personas de mantenedores**. |
| Una corrección de un veredicto                                             | La revisa una persona de mantenedores contra las fuentes ([cómo](METODOLOGIA.md#correcciones)).                                                                                                                               |
| Este documento, la licencia o el financiamiento                            | Lo mismo que la metodología.                                                                                                                                                                                                  |

Las decisiones se toman en issues, PR o Discussions, nunca en privado. Si hubo una conversación fuera de GitHub, se resume en el issue.

## Neutralidad por encima de todo

- **Cualquier persona de mantenedores puede bloquear** un cambio que trate distinto a un sector político o que se pueda leer como de uno. El bloqueo se explica por escrito y se resuelve discutiéndolo, no votando.
- **Conflictos de interés.** Quien milita en un partido, trabaja para una campaña o recibe dinero de alguien afectado por una verificación lo declara en el issue y no aprueba esa decisión ni corrige esa investigación.
- **Financiamiento.** Ningún aporte puede condicionar qué se verifica ni el veredicto. Toda fuente que aporte el 5% o más del presupuesto anual se publica en [METODOLOGIA.md](METODOLOGIA.md#financiamiento).

## Cómo se llega a mantenedor

Una persona de colaboradores que lleva al menos tres meses contribuyendo, conoce la metodología y no tiene conflictos de interés puede ser propuesta en un issue. Entra si lo aprueban todas las personas de mantenedores.

Se deja de ser mantenedor por decisión propia, por seis meses sin actividad (se puede volver), o si el resto de mantenedores lo decide por romper esta gobernanza o el [código de conducta](CODE_OF_CONDUCT.md).

## Accesos

Las cuentas del proyecto (Cloudflare, Bluesky, el correo `escierto.dev@gmail.com`) las administran las personas de mantenedores, con verificación en dos pasos. Por ahora las administra solo Israel Huentecura; los demás mantenedores revisan y aprueban en GitHub, y el acceso a producción se amplía por decisión de mantenedores, a la vista en un issue. Nadie más necesita acceso para contribuir. Cuando alguien deja de ser mantenedor, se le quitan los accesos y se rotan las claves que conocía.
