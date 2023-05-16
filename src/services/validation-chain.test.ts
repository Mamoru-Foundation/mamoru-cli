import { describe, expect, it } from '@jest/globals'
import ValidationChainService from './validation-chain'
import { Logger } from './console'
import { Manifest } from '../types'
import { generateFoundedUser } from '../utils/test-utils'

describe('ValidationChain', () => {
    describe('getChainType', () => {
        it('Should throw an error if the chain is not supported', () => {
            expect.assertions(1)
            const vc = new ValidationChainService('', '', new Logger(2))

            expect(() =>
                vc.getChainType({ chain: 'SUI_DEVNET' } as Manifest)
            ).toThrowError(
                'Chain type "SUI_DEVNET" not supported, supported values are: SUI_TESTNET, BSC_TESTNET, BSC_MAINNET, ETH_TESTNET, ETH_MAINNET, APTOS_TESTNET, APTOS_MAINNET, SUI_MAINNET'
            )
        })
        it('should return the correct chain type', () => {
            const vc = new ValidationChainService('', '', new Logger(2))

            expect(vc.getChainType({ chain: 'SUI_TESTNET' } as Manifest)).toBe(
                1
            )
        })
    })

    describe('getDaemonMetadataById', () => {
        it('Should throw an error if the daemon is not found', async () => {
            const { privkey } = await generateFoundedUser()
            const vc = new ValidationChainService('', privkey, new Logger(2))
            const daemon = await vc.getDaemonMetadataById('HELLO')
            expect(daemon).toBe(null)
        })
    })
})
