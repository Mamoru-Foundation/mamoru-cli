import { jest, describe, it, expect } from '@jest/globals'
import { isValidPlaybookManifest } from './playbook'
import { Logger } from './console'
import { Command } from 'commander'

describe('isValidPlaybookManifest', () => {
    const logger: Logger = {
        ok: jest.fn(),
        error: jest.fn(),
        level: 0,
        verbose: jest.fn(),
        log: jest.fn(),
    }
    it('returns true for a valid playbook', () => {
        const playbook = {
            name: 'My Playbook',
            on: [
                {
                    daemonId: 'my-daemon',
                    levels: ['SEVERITY_INFO', 'SEVERITY_ERROR'],
                },
            ],
            tasks: {
                task1: {
                    command: 'echo "Hello, world!"',
                },
            },
        }

        const result = isValidPlaybookManifest(logger, playbook)

        expect(result).toBe(true)
    })

    it('returns false for an invalid playbook', () => {
        const playbook = {
            name: 'My Playbook',
            on: [
                {
                    daemonId: 'my-daemon',
                    levels: [],
                },
            ],
            tasks: {},
        }

        const result = isValidPlaybookManifest(logger, playbook)

        expect(result).toBe(false)
    })
    it('returns false on invalid on.[].levels', () => {
        const playbook = {
            name: 'My Playbook',
            on: [
                {
                    daemonId: 'my-daemon',
                    levels: ['invalid'],
                },
            ],
            tasks: {},
        }

        const result = isValidPlaybookManifest(logger, playbook)

        expect(result).toBe(false)
    })
})
