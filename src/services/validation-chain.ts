/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Manifest } from '../types'
/* @ts-ignore */
import { Client } from '@mamoru-ai/validation-chain-ts-client'
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing'
import { fromBase64 } from '@cosmjs/encoding'
import { Logger } from './console'
import {
    MsgRegisterDaemon,
    txClient,
    queryClient,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/module'
import { CreateDaemonMetadataCommandRequestDTO } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_create_command_dto'
import {
    DaemonMetadataContentQuery,
    DaemonMetadataType,
    DaemonMetadataContent,
    DaemonMetadataParemeter,
    DaemonMetadataParemeter_DaemonParemeterType,
    DaemonMetadataContentType,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_utils'
import { DaemonRegisterCommandRequestDTO } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_register_command_request_dto'
import {
    MsgCreateDaemonMetadata,
    MsgCreateDaemonMetadataResponse,
    MsgRegisterDaemonResponse,
    MsgRegisterSniffer,
    MsgRegisterSnifferResponse,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/tx'
import protobuf from 'protobufjs'
import { Chain_ChainType } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/chain'
import { SnifferRegisterCommandRequestDTO } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/sniffer_register_command_request_dto'
import { getAvailableChains } from './utils'
import { DaemonMetadata } from '@mamoru-ai/validation-chain-ts-client/src/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata'
import {
    ValidationchainDaemonMetadataContentQuery,
    ValidationchainQueryGetDaemonMetadataResponse,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/rest'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { IncidentSeverity } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/incident'
import { TxResponse } from '@cosmjs/tendermint-rpc'
import type { V1Beta1GetTxResponse } from '@mamoru-ai/validation-chain-ts-client/dist/cosmos.tx.v1beta1/rest'

type TxMsgData = {
    msgResponses: AnyMsg[]
}

type AnyMsg = {
    typeUrl: string
    value: Uint8Array
}

type DeliverTxResponse = {
    code: number
    height: number
    rawLog?: string
    transactionHash: string
    gasUsed: number
    gasWanted: number
    data?: any
}

export type Msgs =
    | MsgRegisterDaemon
    | MsgCreateDaemonMetadata
    | TxMsgData
    | AnyMsg

export type ValidationChainMsgs =
    | MsgRegisterDaemon
    | MsgCreateDaemonMetadata
    | MsgCreateDaemonMetadataResponse
    | MsgRegisterDaemonResponse

const ADDRESS_PREFIX = 'mamoru'

class ValidationChainService {
    /**
     * ts-client types are broken, so using any for now
     */
    client: any
    apiClient: AxiosInstance
    wallet: DirectSecp256k1Wallet
    apiUrl: string
    constructor(
        private readonly rpcUrl: string = 'http://0.0.0.0:26657',
        private readonly privateKey: string,
        private readonly logger: Logger
    ) {
        this.apiUrl = getApiURl(rpcUrl)
    }

    private async getWallet() {
        if (this.wallet) return this.wallet
        const key = fromBase64(this.privateKey)
        const wallet = await DirectSecp256k1Wallet.fromKey(key, ADDRESS_PREFIX)

        this.wallet = wallet
        return wallet
    }

    async registerDaemonFromManifest(
        manifest: Manifest,
        daemonMetadataId: string,
        chain: Chain_ChainType
    ): Promise<MsgRegisterDaemonResponse> {
        this.logger.verbose('Registering daemon')
        const txClient = await this.getTxClient()
        const address = await this.getAddress()

        const payload: DaemonRegisterCommandRequestDTO = {
            chain: {
                chainType: Chain_ChainType[chain] as unknown as Chain_ChainType,
            },
            daemonMetadataId,
            // @TODO: add parameters
            parameters: [],
            // @TODO: add relay
            relay: {
                type: 0,
                address: '',
                call: '',
            },
        }

        const value: MsgRegisterDaemon = {
            creator: address,
            daemon: payload,
        }

        this.logger.verbose('Payload', payload)

        const result = await txClient.sendMsgRegisterDaemon({
            value,
        })
        this.throwOnError('MsgRegisterDaemon', result)

        const data = await this.getTxDataOnlyResponse(result.transactionHash)
        const decodedArr = this.decodeTxMessages(data)

        return decodedArr[0] as MsgRegisterDaemonResponse
    }
    async registerDaemon(
        daemonMetadataId: string,
        chainType: Chain_ChainType
    ): Promise<MsgRegisterDaemonResponse> {
        this.logger.verbose('Registering daemon')
        const txClient = await this.getTxClient()
        const address = await this.getAddress()

        const payload: DaemonRegisterCommandRequestDTO = {
            chain: {
                chainType: Chain_ChainType[
                    chainType
                ] as unknown as Chain_ChainType,
            },
            daemonMetadataId,
            // @TODO: add parameters
            parameters: [],
            // @TODO: add relay
            relay: {
                type: 0,
                address: '',
                call: '',
            },
        }

        const value: MsgRegisterDaemon = {
            creator: address,
            daemon: payload,
        }

        this.logger.verbose('Payload', payload)

        const result = await txClient.sendMsgRegisterDaemon({
            value,
        })
        this.throwOnError('MsgRegisterDaemon', result)

        const data = await this.getTxDataOnlyResponse(result.transactionHash)
        const decodedArr = this.decodeTxMessages(data)

        return decodedArr[0] as MsgRegisterDaemonResponse
    }

    async registerSniffer(address: string, chain: Chain_ChainType) {
        const txClient = await this.getTxClient()

        const payload: SnifferRegisterCommandRequestDTO = {
            chains: [{ chainType: chain }],
            sniffer: address,
        }

        const message: MsgRegisterSniffer = {
            creator: address,
            sniffer: payload,
        }

        const result = await txClient.sendMsgRegisterSniffer({
            value: message,
        })

        this.throwOnError('MsgRegisterSniffer', result)

        const data = await this.getTxDataOnlyResponse(result.transactionHash)
        const decodedArr = this.decodeTxMessages(data)

        const decodeTxMessages = this.decodeTxMessages(data)
        return decodeTxMessages[0] as MsgRegisterSnifferResponse
    }

    private async getVcClient(): Promise<any> {
        if (this.client) return this.client

        const wallet = await this.getWallet()

        this.client = new Client(
            {
                rpcURL: this.rpcUrl,
                apiURL: this.apiUrl,
                prefix: ADDRESS_PREFIX,
            },
            wallet
        )

        return this.client
    }

    private getApiClient(): AxiosInstance {
        if (this.apiClient) return this.apiClient
        this.apiClient = axios.create({
            baseURL: this.apiUrl,
        })
        return this.apiClient
    }

    private async getTxClient(): Promise<ReturnType<typeof txClient>> {
        const client = await this.getVcClient()
        return client.ValidationchainValidationchain.tx
    }

    private async getQueryClient(): Promise<ReturnType<typeof queryClient>> {
        // const client = axios.create({
        //     baseURL: this.apiUrl
        // })
        // return client
        const client = await this.getVcClient()
        return client.ValidationchainValidationchain.query
    }

    private async getAddress() {
        const wallet = await this.getWallet()
        const accounts = await wallet.getAccounts()
        return accounts[0].address
    }

    async registerDaemonMetadata(
        manifest: Manifest,
        queries: DaemonMetadataContentQuery[],
        wasmModule?: string,
        gas?: string
    ): Promise<MsgCreateDaemonMetadataResponse> {
        this.logger.verbose('Registering daemon metadata')
        const txClient = await this.getTxClient()
        const vcClient = await this.getVcClient()
        const queryClient = await this.getQueryClient()
        const address = await this.getAddress()
        // @ts-ignore
        const payload: CreateDaemonMetadataCommandRequestDTO = {
            logoUrl: manifest.logoUrl,
            metadataType: getSubscribableType(manifest),
            title: manifest.name,
            description: manifest.description,
            tags: manifest.tags,
            supportedChains: this.getChainTypes(manifest).map((chain) => ({
                chainType: chain,
            })),
            // parameters: manifest.parameters,
            content: getDaemonContent(manifest, queries, wasmModule),
        }

        const message: MsgCreateDaemonMetadata = {
            creator: address,
            daemonMetadata: payload,
        }

        this.logger.verbose('message', JSON.stringify(message, null, 2))

        const result = await txClient.sendMsgCreateDaemonMetadata({
            value: message,
            fee: {
                amount: [],
                gas: gas || '200000',
            },
        })

        this.throwOnError('MsgCreateDaemonMetadata', result)

        const data = await this.getTxDataOnlyResponse(result.transactionHash)
        const decodedArr = this.decodeTxMessages(data)

        // this doesnt work as data is returned in an array of message.
        // @todo: fix it so this.decodeTxMessages can be deprecated and removed
        // const decoded = MsgCreateDaemonMetadataResponse.decode(data)

        const msg = decodedArr[0] as MsgCreateDaemonMetadataResponse

        return msg
    }

    async getDaemonMetadataById(id: string): Promise<DaemonMetadata> {
        const client = await this.getQueryClient()
        const result: AxiosResponse<ValidationchainQueryGetDaemonMetadataResponse> =
            await client
                .queryDaemonMetadata(id, {
                    // client throws an issue when tries to serialize response for this call
                    format: 'json',
                })
                .catch((err) => {
                    if (err.response.status === 404) {
                        return null
                    }
                    throw err
                })
        if (!result) return null
        const metadata = result.data.daemonMetadata
        return {
            daemonMetadataId: metadata.daemonMetadataId || null,
            logoUrl: metadata.logoUrl || null,
            developerAddress: metadata.developerAddress || null,
            type: DaemonMetadataType[metadata.type] || null,
            title: metadata.title || null,
            description: metadata.description || null,
            tags: metadata.tags || [],
            supportedChains:
                metadata.supportedChains?.map((el) => ({
                    chainType: Chain_ChainType[el.chain_type],
                })) || [],
            parameters:
                metadata.parameters?.map(
                    (el) =>
                        ({
                            defaultValue: el.defaultValue,
                            description: el.description,
                            hiddenFor: el.hiddenFor,
                            key: el.key,
                            requiredFor: el.requiredFor,
                            title: el.title,
                            type: DaemonMetadataParemeter_DaemonParemeterType[
                                el.type
                            ],
                        } as DaemonMetadataParemeter)
                ) || [],
            content: {
                query: metadata.content.query?.map(
                    (el: ValidationchainDaemonMetadataContentQuery) => ({
                        incidentMessage: el.incidentMessage,
                        severity: IncidentSeverity[el.severity],
                        query: el.query,
                    })
                ),
                type: DaemonMetadataContentType[metadata?.content?.type],
                wasmModule: metadata?.content?.wasmModule,
            },
            createdAt: metadata.createdAt || null,
        }
    }

    private getDecoder(name = 'TxMsgData') {
        const parsedName = name.replace('/validationchain.validationchain.', '')
        /**
         * @TODO: instead of hardcode the schema, we should use the generated one from the client.
         * load from client that is placed in "@mamoru-ai/validation-chain-ts-client/proto"
         */
        const root = protobuf.parse(`
        syntax = "proto3";
        message Any {
            string type_url = 1;
            bytes value = 2;
        }

        message MsgCreateDaemonMetadataResponse {
            string daemonMetadataId = 1;
        }

        message MsgRegisterDaemonResponse {
            string daemonId = 1;
        }

        message TxMsgData {
            repeated Any msg_responses = 2;
        }
        `).root
        return root.lookupType(`.${parsedName}`)
    }

    private decodeProtobuf(name: string, data: Uint8Array): Msgs {
        const result: any = this.getDecoder(name).decode(data)

        return result
    }

    private decodeTxMessages(data: Uint8Array): ValidationChainMsgs[] {
        const result: TxMsgData = this.getDecoder().decode(data) as any

        return result.msgResponses.map(
            (msg) =>
                this.decodeProtobuf(
                    msg.typeUrl,
                    msg.value
                ) as ValidationChainMsgs
        )
    }

    private formatError(msgType: string, error: DeliverTxResponse) {
        const { code, rawLog } = error
        return `Error sending "${msgType}" code: "${code}", log: "${rawLog}" hash: "${error.transactionHash}"`
    }
    private throwOnError(MsgType: string, response: DeliverTxResponse) {
        if (response.code) {
            throw new Error(this.formatError(MsgType, response))
        }
        return response
    }
    /**
     * Get the chain type from the manifest.
     * Exported just for testing purposes
     */
    public getChainTypes(manifest: Manifest): Chain_ChainType[] {
        const chains = manifest.chains
        if (!chains) throw new Error('Chain type not defined in manifest')

        return chains.map(
            (chain) => Chain_ChainType[chain] as unknown as Chain_ChainType
        )
    }

    /**
     * Utility function that can be used for debug messages from validation-chain protobuf API.
     * Uncomment if you need to debug messages.
     */
    private inspectMsgData(data: Uint8Array) {
        // console.log('----------------------------')
        // const buffer = Buffer.from(data)
        // const d = getData(buffer)
        // const schema = getProto(buffer)
        // console.log(schema)
        // console.log(JSON.stringify(d, null, 2), false, 100, true)
        // inspect(getData(Buffer.from()), false, 100, true)
        // console.log('----------------------------')
    }

    private async getTxData(txHexHash: string): Promise<V1Beta1GetTxResponse> {
        const apiClient = this.getApiClient()

        const txByHashUrl = `/cosmos/tx/v1beta1/txs/${txHexHash}`

        const response = await apiClient.get(txByHashUrl)

        return response.data
    }

    private async getTxDataOnlyResponse(
        txHexHash: string
    ): Promise<Uint8Array> {
        const txData = await this.getTxData(txHexHash)

        // hex data
        const data: string = txData.tx_response.data

        const dataBytes = hexToBytes(data)

        return dataBytes
    }
}

export default ValidationChainService

function getSubscribableType(manifest: Manifest): DaemonMetadataType {
    if (manifest.subscribable) {
        return 2
    }
    return 1
}

function getDaemonContent(
    manifest: Manifest,
    queries: DaemonMetadataContentQuery[],
    wasmModule?: string
): DaemonMetadataContent {
    if (manifest.type === 'wasm') {
        return {
            type: 1,
            wasmModule,
            query: [],
        }
    }
    // @ts-ignore as wasmModule is not defined for non wasm type
    return {
        type: 0,
        query: queries,
    }
}

function randomNumericChar(): string {
    const numbersWithoutZero = '123456789'
    return numbersWithoutZero[
        Math.floor(Math.random() * numbersWithoutZero.length)
    ]
}

function randomId(): number {
    return parseInt(
        Array.from({ length: 12 })
            .map(() => randomNumericChar())
            .join(''),
        10
    )
}

function createJsonRpcRequest(
    method: string,
    params?: Record<string, any>
): any {
    const paramsCopy = params ? { ...params } : {}
    return {
        jsonrpc: '2.0',
        id: randomId(),
        method: method,
        params: paramsCopy,
    }
}

function getApiURl(rpcUrl: string): string {
    if (rpcUrl) {
        return rpcUrl.replace(':26657', ':1317')
    }
    return 'http://localhost:1317'
}

function hexToBytes(hex: string): Uint8Array {
    return Uint8Array.from(Buffer.from(hex, 'hex'))
}
