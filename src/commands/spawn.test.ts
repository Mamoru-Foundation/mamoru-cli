import { describe, expect, it } from '@jest/globals'
import colors from 'colors'
import spawn, { SpawnOptions } from './spawn'

describe(colors.yellow('spawn'), () => {
    const generateSpawnOptions = (override: Partial<SpawnOptions> = {}) => ({
        metadataId: 'metadataId',
        ...override,
    })
    it('FAIL - metadataId - metadata not found', () => {
        spawn(
            generateSpawnOptions({
                metadataId: 'NOT FOUND',
            })
        ).catch((err) => {
            expect(err.message).toBe('Metadata not found')
        })
    })
})
