// Check that the stylesheets and scripts in src/ use the colour tokens in
// src/styles/variables.css, not their own colours, so both themes reach
// everything. Run by `npm run lint`.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const TOKENS = join(SRC, 'styles', 'variables.css');
// Hex colours, rgb()/hsl() with numbers instead of a token, and the named
// colours this site has used
const HEX = /#[0-9a-f]{3,8}\b/;
const NAMED = /(?<![-\w])(?:white|black)\b(?!-)/;
const FUNCTION =
  /\b(?:rgba?|hsla?)\(\s*[\d.]+(?:deg)?[\s,]+[\d.]+%?[\s,]+[\d.]+%?/;
const COLOUR = new RegExp(
  `${HEX.source}|${FUNCTION.source}|${NAMED.source}`,
  'gi'
);
// Scripts: only colours in strings, so ids like `#app` in selectors and
// hex numbers in code are left alone
const SCRIPT_COLOUR =
  /(['"`])(?:#[0-9a-f]{3,8}|(?:rgba?|hsla?)\([\d\s.,%]+\))\1/gi;
const files = readdirSync(SRC, { recursive: true })
  .map((file) => join(SRC, file))
  .filter((file) => /\.(css|ts)$/.test(file) && file !== TOKENS);
const problems = [];

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const pattern = file.endsWith('.css') ? COLOUR : SCRIPT_COLOUR;

  lines.forEach((line, index) => {
    // Comments may show examples
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;

    // Inline images, like icon masks, aren't themed
    const code = line.replace(/url\([^)]*\)/g, 'url()');

    for (const [match] of code.matchAll(pattern)) {
      problems.push(`${relative(ROOT, file)}:${index + 1}  ${match}`);
    }
  });
}

if (problems.length > 0) {
  console.error(
    `${problems.length} colour(s) outside src/styles/variables.css. Use a token, like rgb(var(--rgb-brand) / 0.2), or themeColor('brand', 0.2) in scripts:\n\n${problems.join('\n')}`
  );
  process.exit(1);
}

console.log(`No colours outside the tokens in ${files.length} files`);
