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
        }, 10000)
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
                        severity: 'SEVERITY_INFO',
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
            const metadata = await vc.registerDaemonMetadata(
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
                        severity: 'SEVERITY_ERROR',
                    },
                ]
            )
            expect(metadata).not.toBe(null)
        }, 20000)
    })

    describe('registerDaemon', () => {
        it('with parameters', async () => {
            const { privkey } = await generateFoundedUser()
            const vc = new ValidationChainService(
                undefined,
                privkey,
                new Logger(2)
            )
            const metadataResult = await vc.registerDaemonMetadata(
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
                        severity: 'SEVERITY_ERROR',
                    },
                ]
            )

            const daemon = await vc.registerDaemon(
                metadataResult.daemonMetadataId,
                'SUI_TESTNET',
                {
                    test: 'test_value',
                }
            )

            expect(daemon).not.toBe(null)

            const daemonMetadata = await vc.getDaemonMetadataById(
                metadataResult.daemonMetadataId
            )

            expect(daemonMetadata).not.toBe(null)
            expect(daemonMetadata.content?.query[0].severity).toBe(2)
        }, 30000)
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
