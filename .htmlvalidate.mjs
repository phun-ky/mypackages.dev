// HTML validation of the built site and of each rendered page (#42)
export default {
  extends: ['html-validate:recommended'],
  rules: {
    // Both `<meta>` and `<meta />` are valid. Prettier writes the second in
    // index.html, Vite injects its stylesheet with the first, and a rendered
    // page serializes with the first
    'void-style': 'off',
    // Prettier writes the doctype in lowercase
    'doctype-style': ['error', { style: 'lowercase' }]
  }
};
