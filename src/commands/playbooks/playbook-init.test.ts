import init from './playbook-init' // Update this import path
import { describe, expect, it } from '@jest/globals'
import { getProgramMock, getTempFolder } from '../../utils/test-utils'
import initPlaybook from './playbook-init'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import fs from 'fs'

const programMock = getProgramMock()

describe('playbook init', () => {
    it('OK - playbook init', async () => {
        const dir = getTempFolder()

        await initPlaybook.initPlaybook(programMock, dir, {
            name: 'Test Playbook',
            skipTelemetry: true,
        })
        const files = initPlaybook.getFilesToCreate(dir)
        Object.values(files).forEach((p) => {
            expect(fs.existsSync(p)).toBeTruthy()
        })
    }, 20000)
})

describe('getAugmentedInitOptions', () => {
    it('should return augmented options', async () => {
        const mockOptions = { name: 'Test Playbook', skipTelemetry: true }
        const mockProjectPath = '/path/to/project'

        const result = await init.getAugmentedInitOptions(
            mockOptions,
            mockProjectPath
        )

        expect(result).toEqual({
            name: 'Test Playbook',
            kebabName: 'test-playbook',
            skipTelemetry: true,
        })
    })
})

describe('getFilesToCreate', () => {
    it('should return files to create', () => {
        const mockProjectPath = '/path/to/project'
        const result = init.getFilesToCreate(mockProjectPath)

        expect(result).toEqual({
            PLAYBOOK_YAML: '/path/to/project/playbook.yml',
            README: '/path/to/project/readme.md',
            GITIGNORE: '/path/to/project/.gitignore',
        })
    })
})
