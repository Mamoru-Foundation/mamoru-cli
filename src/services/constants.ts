export const OUT_DIR = 'build'
export const WASM_INDEX = 'index.wasm'

const BASE_DIR = process.env.NODE_ENV === 'test' ? '../' : '../'

export const TEMPLATES = {
    PACKAGE_JSON: BASE_DIR + 'templates/init/package.json.hbs',
    MANIFEST: /*  */ BASE_DIR + 'templates/init/manifest.yml.hbs',
    QUERIES: /*   */ BASE_DIR + 'templates/init/queries.yml.hbs',

    WASM_INDEX: /**/ BASE_DIR + 'templates/init/src/index.ts.hbs',
    WASM_PROCESS: BASE_DIR + 'templates/init/src/process.ts.hbs',
    WASM_TEST:
        /* */ BASE_DIR + 'templates/init/src/__tests__/process.spec.ts.hbs',
    TS_CONFIG: /* */ BASE_DIR + 'templates/init/src/tsconfig.json.hbs',

    README_WASM: /*    */ BASE_DIR + 'templates/init/readme.wasm.md.hbs',
    README_SQL: /*    */ BASE_DIR + 'templates/init/readme.sql.md.hbs',

    GITIGNORE: /* */ BASE_DIR + 'templates/init/gitignore.hbs',

    ASPECT_TYPES: BASE_DIR + 'templates/init/src/__tests__/as-pect.d.ts.hbs',
    ASPECT_CONFIG: BASE_DIR + 'templates/init/as-pect.asconfig.json.hbs',
    ASPECT_CONFI2: BASE_DIR + 'templates/init/as-pect.config.js.hbs',
    ASPECT_CONFI3: BASE_DIR + 'templates/init/asconfig.json.hbs',
}

export const FILES: typeof TEMPLATES = {
    PACKAGE_JSON: 'package.json',
    MANIFEST: 'manifest.yml',
    QUERIES: 'queries.yml',

    WASM_INDEX: 'src/index.ts',
    WASM_PROCESS: 'src/process.ts',
    WASM_TEST: 'src/__tests__/process.spec.ts',
    TS_CONFIG: 'src/tsconfig.json',

    README_WASM: 'readme.md',
    README_SQL: 'readme.md',
    GITIGNORE: '.gitignore',

    ASPECT_TYPES: 'src/__tests__/as-pect.d.ts',
    ASPECT_CONFIG: 'as-pect.asconfig.json',
    ASPECT_CONFI2: 'as-pect.config.js',
    ASPECT_CONFI3: 'asconfig.json',
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
