import os from 'os'
import path from 'path'
import fs from 'fs'
import { Command } from 'commander'
import { InitOptions } from '../commands/init'
import { DirectSecp256k1HdWallet as Wallet } from '@cosmjs/proto-signing'
import axios from 'axios'
/**
 * Generates a user with a mnemonic, address and private key from wallet
 */
export const generateUser = async (): Promise<{
    mnemonic: string
    address: string
    privkey: string
}> => {
    const wallet = await Wallet.generate(24)
    const accounts = await wallet.getAccounts()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const [priv] = await wallet.getAccountsWithPrivkeys()

    return {
        mnemonic: wallet.mnemonic,
        address: accounts[0].address,
        privkey: Uint8ArrayToBase64String(priv.privkey),
    }
}

function Uint8ArrayToBase64String(u8a: Uint8Array): string {
    const buf = Buffer.from(u8a)
    return buf.toString('base64')
}

function useFaucet(address: string): Promise<void> {
    return axios.post('http://0.0.0.0:4500', {
        address,
        coins: ['20token'],
    })
}

export const generateFoundedUser = async (): Promise<{
    mnemonic: string
    address: string
    privkey: string
}> => {
    const user = await generateUser()
    await useFaucet(user.address)
    return user
}

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
        logo: 'https://mamoru.ai/default-mamoru-logo.png',
        subscribable: false,
        ...obj,
    }
}
