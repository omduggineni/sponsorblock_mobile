import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outfile = join(__dirname, 'sponsorblock-mobile.user.js');

const metadata = readFileSync(join(__dirname, 'metadata.txt'), 'utf8').trimEnd() + '\n';

// A userscript ships as one file — there's nowhere to put a separate .css
// output for the browser to fetch — so CSS still has to end up as a JS
// string, injected at runtime via a <style> tag (see styles.ts). This
// plugin lets that string be authored as a normal, lint/highlight-able
// .css file: it runs each .css import through esbuild's own CSS minifier
// and turns the result into a tiny JS module exporting the minified text
// as its default export, which `import STYLE from './styles.css'` then
// picks up like any other module.
const cssTextPlugin = {
    name: 'css-text',
    setup(build) {
        build.onLoad({ filter: /\.css$/ }, async (args) => {
            const source = readFileSync(args.path, 'utf8');
            const result = await esbuild.transform(source, { loader: 'css', minify: true });
            return { contents: `export default ${JSON.stringify(result.code)};`, loader: 'js' };
        });
    },
};

await esbuild.build({
    entryPoints: [join(__dirname, 'src/main.ts')],
    outfile,
    bundle: true,
    format: 'iife',
    target: 'es2020',
    charset: 'utf8',
    minify: true,
    legalComments: 'none',
    banner: { js: metadata },
    plugins: [cssTextPlugin],
});

// esbuild prepends a top-level "use strict"; directive ahead of the IIFE
// when bundling ESM sources to this format. Some userscript managers
// (quoid/userscripts, on Safari) inject @grant'd scripts by wrapping the
// entire file as the body of `Function(paramList, code)`, where paramList
// is a destructured parameter list (the granted APIs). Per the "use
// strict" + non-simple-parameter-list restriction, WebKit's parser rejects
// that combination outright with a SyntaxError — the script never even
// parses, let alone runs. Our own source doesn't rely on any strict-only
// semantics, so the directive is safe to drop entirely.
let built = readFileSync(outfile, 'utf8');
const directive = '"use strict";';
const directiveIndex = built.indexOf(directive);
if (directiveIndex === -1) {
    throw new Error('Expected a top-level "use strict"; directive from esbuild but did not find one — build.mjs needs updating.');
}
built = built.slice(0, directiveIndex) + built.slice(directiveIndex + directive.length);
writeFileSync(outfile, built);

console.log('Built sponsorblock-mobile.user.js');
