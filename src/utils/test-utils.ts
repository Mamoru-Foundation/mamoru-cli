import os from 'os'
import path from 'path'
import fs from 'fs'
import { Command } from 'commander'
import { InitOptions } from '../commands/init'
import { DirectSecp256k1HdWallet as Wallet } from '@cosmjs/proto-signing'
import axios from 'axios'
import {
    Chain_ChainType,
    chain_ChainTypeToJSON,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/chain'
import { DaemonMetadataParameter, Manifest, ManifestParameter } from '../types'
/**
 * Generates a user with a mnemonic, address and private key from wallet
 */
export const generateUser = async (): Promise<{
    mnemonic: string
    address: string
    privkey: string
}> => {
    const wallet = await Wallet.generate(24, {
        prefix: 'mamoru',
    })
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

export const isTruthyStr = (str: string): boolean => {
    return !!str
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
        chain: 'SUI_TESTNET' as keyof Chain_ChainType,
        logo: 'https://mamoru.ai/default-mamoru-logo.png',
        subscribable: false,
        ...obj,
    }
}

export const generateManifest = (obj: Partial<Manifest> = {}): Manifest => ({
    version: '0.0.1',
    type: 'wasm',
    name: 'test',
    chains: [chain_ChainTypeToJSON(Chain_ChainType.SUI_TESTNET)],
    description: 'test_description',
    parameters: [],
    logoUrl: 'https://test.com/hello.png',
    tags: ['test'],
    subscribable: true,
    ...obj,
})

export const generateManifestSQL = (obj: Partial<Manifest> = {}): Manifest => ({
    ...generateManifest(obj),
    type: 'sql',
})

export const generateWasmContent = (): string =>
    'AGFzbQEAAAABGgVgAABgBH9/f38AYAJ/fwF/YAF/AX9gAX8AAg0BA2VudgVhYm9ydAABAwcGAgADBAAABQMBAAEGDAJ/AUEAC38AQbAKCwdFBwRtYWluAAIFX19uZXcAAQVfX3BpbgADB19fdW5waW4ABAlfX2NvbGxlY3QABQtfX3J0dGlfYmFzZQMBBm1lbW9yeQIACAEGDAERCrECBsgBAQZ/IABB7P///wNLBEBBwAlBgApB1gBBHhAAAAsgAEEQaiIEQfz///8DSwRAQcAJQYAKQSFBHRAAAAsjACIDQQRqIgIgBEETakFwcUEEayIEaiIFPwAiBkEQdEEPakFwcSIHSwRAIAYgBSAHa0H//wNqQYCAfHFBEHYiByAGIAdKG0AAQQBIBEAgB0AAQQBIBEAACwsLIAUkACADIAQ2AgAgAkEEayIDQQA2AgQgA0EANgIIIAMgATYCDCADIAA2AhAgAkEQagtQAQF/QRRBBBABIgBBADYCACAAQQA2AgQgAEEANgIIIABBADYCDCAAQQA2AhAgAEEANgIAIABBADYCBCAAQQA2AgggAEEANgIMIABBADYCEAsEACAACwMAAQsDAAELBwBB/AokAAsLogIRAEGMCAsBHABBmAgLCQIAAAACAAAAYgBBrAgLARwAQbgICw0CAAAABgAAAHUANgA0AEHMCAsBHABB2AgLCQIAAAACAAAAcwBB7AgLARwAQfgICwkCAAAAAgAAAGwAQYwJCwEcAEGYCQsLAgAAAAQAAABzAHQAQawJCwE8AEG4CQsvAgAAACgAAABBAGwAbABvAGMAYQB0AGkAbwBuACAAdABvAG8AIABsAGEAcgBnAGUAQewJCwE8AEH4CQslAgAAAB4AAAB+AGwAaQBiAC8AcgB0AC8AcwB0AHUAYgAuAHQAcwBBsAoLDRIAAAAgAAAAIAAAACAAQdAKCwZBAAAAAkEAQeAKCxoCQQAAAkEAAAJBAAAAAAAAAkEAAAAAAAACQQAiEHNvdXJjZU1hcHBpbmdVUkwQLi9pbmRleC53YXNtLm1hcA=='

export const generateParameter = (
    obj: Partial<ManifestParameter> = {}
): ManifestParameter => ({
    type: 'STRING',
    title: 'test',
    key: 'test',
    description: 'test',
    defaultValue: 'default',
    requiredFor: [chain_ChainTypeToJSON(Chain_ChainType.SUI_TESTNET)],
    hiddenFor: [chain_ChainTypeToJSON(Chain_ChainType.SUI_TESTNET)],
    ...obj,
})
