export const OUT_DIR = 'build'
export const WASM_INDEX = 'index.wasm'

export const TEMPLATES = {
    PACKAGE_JSON: 'src/templates/init/package.json.hbs',
    MANIFEST: 'src/templates/init/manifest.yml.hbs',
    QUERIES: 'src/templates/init/queries.yml.hbs',
    WASM_INDEX: 'src/templates/init/src/index.ts.hbs',
    WASM_TEST: 'src/templates/init/test/index.spec.ts.hbs',
    README: 'src/templates/init/readme.md.hbs',
    GITIGNORE: 'src/templates/init/gitignore.hbs',
}

export const FILES: typeof TEMPLATES = {
    PACKAGE_JSON: 'package.json',
    MANIFEST: 'manifest.yml',
    QUERIES: 'queries.yml',
    WASM_INDEX: 'src/index.ts',
    WASM_TEST: 'test/index.spec.ts',
    README: 'readme.md',
    GITIGNORE: '.gitignore',
}

export const ONLY_ALPHA_NUMERIC = /^[a-zA-Z0-9]+$/
