// Permite `import` de arquivos .sql (migrations do Drizzle) via babel-plugin-inline-import.
declare module '*.sql' {
  const content: string;
  export default content;
}
