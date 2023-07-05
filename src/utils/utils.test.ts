import assert from 'node:assert'
import { describe, it } from '@jest/globals'
import { extractSdkVersions } from './utils'

describe('extractSdkVersions', () => {
    it('PASS - no dependencies', () => {
        const packageJson = {}
        const sdkVersions = extractSdkVersions(packageJson)
        assert.deepStrictEqual(sdkVersions, [])
    })
    it('PASS - sdk dependencies', () => {
        const packageJson = {
            dependencies: {
                '@mamoru-ai/sdk': '0.0.0',
                '@mamoru-ai/sdk2': '^0.0.1',
                '@mamoru-ai/sdk3': '~0.0.2',
                '@mamoru-ai/sdk4': '0.0.3-dev',
                'not-sdk': '0.0.0',
            },
        }
        //
        const sdkVersions = extractSdkVersions(packageJson)
        assert.deepStrictEqual(sdkVersions, [
            {
                sdk: '@mamoru-ai/sdk',
                version: 'v0.0.0',
            },
            {
                sdk: '@mamoru-ai/sdk2',
                version: 'v0.0.1',
            },
            {
                sdk: '@mamoru-ai/sdk3',
                version: 'v0.0.2',
            },
            {
                sdk: '@mamoru-ai/sdk4',
                version: 'v0.0.3-dev',
            },
        ])
    })
})
