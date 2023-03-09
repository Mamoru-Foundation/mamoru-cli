import assert from 'node:assert'
import { describe, it } from 'node:test'
import publish from './publish'
import colors from 'colors'
import init from './init'
import {
    generateInitOptions,
    getProgramMock,
    getTempFolder,
} from '../utils/test'

const programMock = getProgramMock()

describe(colors.yellow('publish'), () => {
    describe(colors.cyan('SQL'), () => {
        it('FAIL - invalid manifest', async () => {
            const dir = getTempFolder()
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const options = generateInitOptions({ type: 'not-valid' })
            init.init(programMock, dir, options)

            try {
                await publish.publish(programMock, dir, {
                    privateKey: 'privateKey',
                    rpcUrl: 'rpcUrl',
                })
            } catch (error) {
                assert.match(
                    error.message,
                    /manifest contains invalid structure/
                )
            }
        })
        it('FAIL - invalid privateKey', async () => {
            const dir = getTempFolder()
            const options = generateInitOptions({ type: 'sql' })
            init.init(programMock, dir, options)

            try {
                await publish.publish(programMock, dir, {
                    privateKey: 'privateKey',
                    rpcUrl: 'rpcUrl',
                })
            } catch (error) {
                assert.match(
                    error.message,
                    /Invalid string. Length must be a multiple of 4/
                )
            }
        })
    })
})
