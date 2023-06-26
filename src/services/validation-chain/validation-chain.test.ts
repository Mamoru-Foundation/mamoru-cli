import { describe, expect, it } from '@jest/globals'
import ValidationChainService from '.'
import { Logger } from '../console'
import { Manifest } from '../../types'
import {
    generateFoundedUser,
    generateManifest,
    generateManifestSQL,
    generateParameter,
} from '../../utils/test-utils'
import { getMetadataParametersFromManifest } from './utils'
import { getAvailableChains } from '../utils'

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

    describe('registerDaemonMetadata', () => {
        it('Should register a daemon metadata SQL', async () => {
            const { privkey } = await generateFoundedUser()
            const vc = new ValidationChainService(
                undefined,
                privkey,
                new Logger(2)
            )
            const daemon = await vc.registerDaemonMetadata(
                generateManifestSQL(),
                [
                    {
                        query: "SELECT 1 FROM transactions t WHERE starts_with(t.digest, '0x1_this_is_an_example_query')",
                        incidentMessage: 'Example incident message',
                        severity: 1,
                    },
                ]
            )
            expect(daemon).not.toBe(null)
        }, 20000)

        it('Should register a daemon metadata SQL - parameters', async () => {
            const { privkey } = await generateFoundedUser()
            const vc = new ValidationChainService(
                undefined,
                privkey,
                new Logger(2)
            )
            const daemon = await vc.registerDaemonMetadata(
                generateManifestSQL({
                    parameters: [
                        generateParameter({
                            hiddenFor: [],
                        }),
                    ],
                }),
                [
                    {
                        query: "SELECT 1 FROM transactions t WHERE starts_with(t.digest, '0x1_this_is_an_example_query')",
                        incidentMessage: 'Example incident message',
                        severity: 1,
                    },
                ]
            )
            expect(daemon).not.toBe(null)
        }, 20000)
    })
})

describe('utils', () => {
    describe('getMetadataParametersFromManifest', () => {
        it('should return the correct parameters', () => {
            const r = getMetadataParametersFromManifest(
                generateManifest({
                    parameters: [generateParameter()],
                })
            )

            expect(r).toEqual([
                {
                    type: 1,
                    title: 'test',
                    key: 'test',
                    description: 'test',
                    defaultValue: 'default',
                    requiredFor: [
                        {
                            chainType: 1,
                        },
                    ],
                    hiddenFor: [
                        {
                            chainType: 1,
                        },
                    ],
                },
            ])
        })
    })
})
