import { describe, expect, it } from '@jest/globals'
import { manifestSchema } from './manifest'
import { Manifest } from '../types'
import { generateManifest, generateParameter } from '../utils/test-utils'

describe('manifestSchema,', () => {
    it('empty', () => {
        const { error } = manifestSchema.validate({})

        expect(error).toBeTruthy()
    })
    it('basic - pass', () => {
        const manifest: Manifest = generateManifest()
        const { error } = manifestSchema.validate(manifest)

        expect(error).toBeFalsy()
    })
    describe('parameters', () => {
        it('empty', () => {
            const manifest: Manifest = generateManifest({
                parameters: [],
            })
            const { error } = manifestSchema.validate(manifest)

            expect(error).toBeFalsy()
        })

        it.each([
            ['default value can be boolean', { defaultValue: true }],
            ['default value can be boolean', { defaultValue: false }],
            ['default value can be number', { defaultValue: 1 }],
            ['default value can be float', { defaultValue: 1.1 }],
            ['default value can be string', { defaultValue: 'hello' }],
            ['symbol can be string', { symbol: '%' }],
            ['max can be string', { max: '10' }],
            ['max can be number', { max: 10 }],
            ['min can be string', { min: '1' }],
            ['min can be number', { min: 1 }],
            ['maxLen can be number', { maxLen: 10 }],
            ['minLen can be number', { minLen: 1 }],
        ])('%s - %o', (_, parameter) => {
            const manifest: Manifest = generateManifest({
                parameters: [generateParameter(parameter)],
            })
            const { error } = manifestSchema.validate(manifest)

            expect(error).toBeFalsy()
        })
    })
})
