import { ESLintUtils } from "@typescript-eslint/utils";

const DIRECTIVE = /^(eslint(-disable|-enable)?\b|global\b|@ts-|\/ <reference\b)/;

export const noComments = ESLintUtils.RuleCreator.withoutDocs({
  meta: {
    type: "suggestion",
    messages: {
      noComments: "Comments are banned; only tool directives are allowed",
    },
    schema: [],
    defaultOptions: [],
  },
  create(context) {
    return {
      Program: () => {
        context.sourceCode
          .getAllComments()
          .filter((comment) => !context.sourceCode.getText(comment).startsWith("#!"))
          .filter((comment) => !DIRECTIVE.test(comment.value.trimStart()))
          .forEach((comment) => {
            context.report({ loc: comment.loc, messageId: "noComments" });
          });
      },
    };
  },
});
