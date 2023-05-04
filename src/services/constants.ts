export const OUT_DIR = 'build'
export const WASM_INDEX = 'index.wasm'

const BASE_DIR = process.env.NODE_ENV === 'test' ? '../' : '../'

export const TEMPLATES = {
    PACKAGE_JSON: BASE_DIR + 'templates/init/package.json.hbs',
    MANIFEST: BASE_DIR + 'templates/init/manifest.yml.hbs',
    QUERIES: BASE_DIR + 'templates/init/queries.yml.hbs',
    WASM_INDEX: BASE_DIR + 'templates/init/src/index.ts.hbs',
    WASM_TEST: BASE_DIR + 'templates/init/test/index.spec.ts.hbs',
    README: BASE_DIR + 'templates/init/readme.md.hbs',
    GITIGNORE: BASE_DIR + 'templates/init/gitignore.hbs',
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

export const MAMORU_EXPLORER_URL = 'https://mamoru.foundation'
