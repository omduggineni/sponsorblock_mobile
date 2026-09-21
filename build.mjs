import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));

const metadata = readFileSync(join(__dirname, 'metadata.txt'), 'utf8').trimEnd() + '\n';

await esbuild.build({
    entryPoints: [join(__dirname, 'src/main.ts')],
    outfile: join(__dirname, 'sponsorblock-mobile.user.js'),
    bundle: true,
    format: 'iife',
    target: 'es2020',
    charset: 'utf8',
    minify: false,
    legalComments: 'none',
    banner: { js: metadata },
});

console.log('Built sponsorblock-mobile.user.js');
