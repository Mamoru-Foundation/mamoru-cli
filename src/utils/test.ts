import os from 'os'
import path from 'path'
import fs from 'fs'
import { Command } from 'commander'
import { InitOptions } from '../commands/init'

export const isUUID = (str: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
        str
    )
}

export const getProgramMock = (): Command => {
    const programMock: Command = {
        opts: () => {
            return {
                verbose: 0,
            }
        },
        error: (str: string) => {
            throw new Error(str)
        },
    } as unknown as Command

    return programMock
}

export const getTempFolder = (): string => {
    const tmp = os.tmpdir()
    const folderName =
        'mamoru-cli-test-' + Math.random().toString(5).substring(2, 15)
    const folderPath = path.join(tmp, folderName)
    fs.mkdirSync(folderPath)
    return folderPath
}

export const generateInitOptions = (
    obj: Partial<InitOptions> = {}
): InitOptions => {
    return {
        type: 'sql',
        name: 'TEST name',
        tags: 'test,cli',
        description: 'TEST_DESCRIPTION',
        chain: 'sui',
        logo: 'https://mamoru.ai/default-mamoru-logo',
        subscribable: false,
        ...obj,
    }
}
