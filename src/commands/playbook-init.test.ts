import init from './playbook-init' // Update this import path
import { describe, expect, it } from '@jest/globals'

describe('getAugmentedInitOptions', () => {
    it('should return augmented options', async () => {
        const mockOptions = { name: 'Test Playbook' }
        const mockProjectPath = '/path/to/project'

        const result = await init.getAugmentedInitOptions(
            mockOptions,
            mockProjectPath
        )

        expect(result).toEqual({
            name: 'Test Playbook',
            kebabName: 'test-playbook',
        })
    })

    // Add more test cases for different scenarios
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

    // Add more test cases for different scenarios
})
