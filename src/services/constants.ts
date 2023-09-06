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

export const MAMORU_EXPLORER_URL =
    process.env.MAMORU_EXPLORER_URL || 'https://app.mamoru.foundation'

export const DEFAULT_MAMORU_VERSION = '0.1.0'
export const MAMORU_VERSION_KEY = 'mamoru'

export const PLAYBOOK_TEMPLATES = {
    PLAYBOOK_YAML: BASE_DIR + 'templates/playbook/playbook.yml.hbs',
    README: BASE_DIR + 'templates/playbook/readme.md.hbs',
    GITIGNORE: BASE_DIR + 'templates/playbook/gitignore.hbs',
}

export const PLAYBOOK_FILES: typeof PLAYBOOK_TEMPLATES = {
    PLAYBOOK_YAML: 'playbook.yml',
    README: 'readme.md',
    GITIGNORE: '.gitignore',
}
