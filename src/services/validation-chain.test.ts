import { describe, expect, it } from '@jest/globals'
import ValidationChainService from './validation-chain'
import { Logger } from './console'
import { Manifest } from '../types'

describe('ValidationChain', () => {
    describe('getChainType', () => {
        it('Should throw an error if the chain is not supported', () => {
            const vc = new ValidationChainService('', '', new Logger(2))

            expect(() =>
                vc.getChainType({ chain: 'notsupported' } as Manifest)
            ).toThrowError(
                'Chain type "notsupported" not supported, supported values are: SUI_DEVNET, SUI_TESTNET, BSC_TESTNET, BSC_MAINNET, ETH_TESTNET, ETH_MAINNET'
            )
        })
        it('should return the correct chain type', () => {
            const vc = new ValidationChainService('', '', new Logger(2))

            expect(vc.getChainType({ chain: 'SUI_TESTNET' } as Manifest)).toBe(
                1
            )
        })
    })
})
