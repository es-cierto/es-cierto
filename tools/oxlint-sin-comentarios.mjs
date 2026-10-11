const PERMITIDOS = /^\s*(@ts-expect-error|@ts-check|oxlint-disable)/;

export default {
  meta: { name: "escierto" },
  rules: {
    "sin-comentarios": {
      meta: { type: "suggestion", fixable: "code" },
      create(context) {
        return {
          Program() {
            for (const comentario of context.sourceCode.getAllComments()) {
              if (PERMITIDOS.test(comentario.value)) continue;
              context.report({
                loc: comentario.loc,
                message:
                  "Sin comentarios en el código: lo que explica una regla o un porqué va en el AGENTS.md del dominio; si solo repite el código, se borra.",
                fix: (fixer) => fixer.removeRange(comentario.range),
              });
            }
          },
        };
      },
    },
  },
};
