import { describe, expect, it } from '@jest/globals'
import ValidationChainService from './validation-chain'
import { Logger } from './console'
import { Manifest } from '../types'
import { generateFoundedUser } from '../utils/test-utils'

describe('ValidationChain', () => {
    describe('getChainType', () => {
        it('should return the correct chain type', () => {
            const vc = new ValidationChainService('', '', new Logger(2))

            expect(
                vc.getChainTypes({
                    chains: ['SUI_TESTNET'],
                } as unknown as Manifest)
            ).toEqual([1])
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
