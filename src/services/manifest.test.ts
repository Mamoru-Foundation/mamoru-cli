import { describe, expect, it } from '@jest/globals'
import { manifestSchema } from './manifest'
import { Manifest } from '../types'
import {
    Chain_ChainType,
    chain_ChainTypeToJSON,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/chain'
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
    it('parameters - pass', () => {
        const manifest: Manifest = generateManifest({
            parameters: [generateParameter()],
        })
        const { error } = manifestSchema.validate(manifest)

        expect(error).toBeFalsy()
    })
})
