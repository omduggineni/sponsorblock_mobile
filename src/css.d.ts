// build.mjs's css-text esbuild plugin turns a `.css` import into a module
// exporting the minified CSS as a plain string default export.
declare module '*.css' {
    const css: string;
    export default css;
}
