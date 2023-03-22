// eslint-disable-next-line no-undef
module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'subject-case': [
            0,
            'always',
            ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
        ],
        'body-max-line-length': [0, 'always', Infinity],
    },
}
