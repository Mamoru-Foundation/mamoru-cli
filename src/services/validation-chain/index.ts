/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
    DaemonMetadataContentQuery as MyDaemonMetadataContentQuery,
    DaemonParameterMap,
    Manifest,
} from '../../types'
/* @ts-ignore */
import { Client } from '@mamoru-ai/validation-chain-ts-client'
import { DirectSecp256k1Wallet } from '@cosmjs/proto-signing'
import { fromBase64 } from '@cosmjs/encoding'
import { Logger } from '../console'
import {
    MsgRegisterDaemon,
    queryClient,
    txClient,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/module'
import { CreateDaemonMetadataCommandRequestDTO } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_create_command_dto'

import {
    DaemonMetadataContent,
    DaemonMetadataContentType,
    DaemonMetadataParemeter,
    DaemonMetadataParemeter_DaemonParemeterType,
    DaemonMetadataType,
    MetadataSdkVersion,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata_utils'
import { DaemonRegisterCommandRequestDTO } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/daemon_register_command_request_dto'
import {
    MsgCreateDaemonMetadata,
    MsgCreateDaemonMetadataResponse,
    MsgCreatePlaybook,
    MsgCreatePlaybookResponse,
    MsgDeletePlaybook,
    MsgDeletePlaybookResponse,
    MsgRegisterDaemonResponse,
    MsgUnregisterDaemon,
    MsgUnregisterDaemonResponse,
    MsgUpdatePlaybook,
    MsgUpdatePlaybookResponse,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/tx'
import protobuf from 'protobufjs'
import { DaemonMetadata } from '@mamoru-ai/validation-chain-ts-client/src/validationchain.validationchain/types/validationchain/validationchain/daemon_metadata'
import {
    ValidationchainDaemonMetadataContentQuery,
    ValidationchainQueryGetDaemonMetadataResponse,
} from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/rest'
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { incidentSeverityFromJSON } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/incident'
import type { V1Beta1GetTxResponse } from '@mamoru-ai/validation-chain-ts-client/dist/cosmos.tx.v1beta1/rest'
import {
    getDaemonParametersFromDaemonParameterMap,
    getMetadataParametersFromManifest,
} from './utils'
import { PlaybookDTO } from '@mamoru-ai/validation-chain-ts-client/dist/validationchain.validationchain/types/validationchain/validationchain/playbooks_dto'
import { SigningStargateClient } from '@cosmjs/stargate'

type TxMsgData = {
    msgResponses: AnyMsg[]
}

type AnyMsg = {
    typeUrl: string
    value: Uint8Array
}

const TX_CLIENT_FEE = 2

type DeliverTxResponse = {
    code: number
    height: number
    rawLog?: string
    transactionHash: string
    gasUsed: number
    gasWanted: number
    data?: any
}

export type SdkVersion = {
    version: string
    sdk: string
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
    | MsgCreatePlaybookResponse
    | MsgUpdatePlaybookResponse

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

    public async registerDaemonMetadata(
        manifest: Manifest,
        queries: MyDaemonMetadataContentQuery[],
        wasmModule?: string,
        sdkVersions?: SdkVersion[]
    ): Promise<MsgCreateDaemonMetadataResponse> {
        this.logger.verbose('Registering Agent Metadata')
        const txClient = await this.getTxClient()
        const address = await this.getAddress()
        // @ts-ignore
        const payload: CreateDaemonMetadataCommandRequestDTO = {
            logoUrl: manifest.logoUrl,
            metadataType: getSubscribableType(manifest),
            title: manifest.name,
            description: manifest.description,
            tags: manifest.tags,
            supportedChains: manifest.chains.map((chainName) => ({
                name: chainName,
            })),
            parameters: getMetadataParametersFromManifest(manifest),
            content: getDaemonContent(manifest, queries, wasmModule),
            sdkVersions: sdkVersions || [],
        }

        const message: MsgCreateDaemonMetadata = {
            creator: address,
            daemonMetadata: payload,
        }

        this.logger.verbose('message', JSON.stringify(message, null, 2))

        const result = await txClient.sendMsgCreateDaemonMetadata({
            value: message,
            // @ts-ignore
            fee: TX_CLIENT_FEE,
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

    public async getDaemonMetadataById(id: string): Promise<DaemonMetadata> {
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
            sdkVersions: (metadata.sdkVersions || []) as MetadataSdkVersion[],
            daemonMetadataId: metadata.daemonMetadataId || null,
            logoUrl: metadata.logoUrl || null,
            developerAddress: metadata.developerAddress || null,
            type: DaemonMetadataType[metadata.type] || null,
            title: metadata.title || null,
            description: metadata.description || null,
            tags: metadata.tags || [],
            supportedChains:
                metadata.supportedChains?.map((el) => ({
                    name: el.name,
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
                        severity: incidentSeverityFromJSON(el.severity),
                        query: el.query,
                    })
                ),
                type: DaemonMetadataContentType[metadata?.content?.type],
                wasmModule: metadata?.content?.wasmModule,
            },
            createdAt: metadata.createdAt || null,
        }
    }

    public async unRegisterDaemon(
        id: string
    ): Promise<MsgUnregisterDaemonResponse> {
        this.logger.verbose('Unregister Agent')
        const txClient = await this.getTxClient()
        const address = await this.getAddress()

        const value: MsgUnregisterDaemon = {
            creator: address,
            daemon: {
                daemonId: id,
            },
        }

        const result = await txClient.sendMsgUnregisterDaemon({
            value,
            // @ts-ignore
            fee: TX_CLIENT_FEE,
        })

        this.throwOnError('MsgUnregisterDaemon', result)
        const data = await this.getTxDataOnlyResponse(result.transactionHash)
        const decodedArr = this.decodeTxMessages(data)

        return decodedArr[0] as MsgRegisterDaemonResponse
    }

    public async registerDaemonFromManifest(
        manifest: Manifest,
        daemonMetadataId: string,
        chainName: string,
        parameterValues: DaemonParameterMap,
        gas?: string
    ): Promise<MsgRegisterDaemonResponse> {
        this.logger.verbose('Registering Agent')
        const txClient = await this.getTxClient()
        const address = await this.getAddress()

        const payload: DaemonRegisterCommandRequestDTO = {
            chain: {
                name: chainName,
            },
            daemonMetadataId,
            parameters:
                getDaemonParametersFromDaemonParameterMap(parameterValues),
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
            // @ts-ignore
            fee: TX_CLIENT_FEE,
        })
        this.throwOnError('MsgRegisterDaemon', result)

        const data = await this.getTxDataOnlyResponse(result.transactionHash)
        const decodedArr = this.decodeTxMessages(data)

        return decodedArr[0] as MsgRegisterDaemonResponse
    }

    public async registerDaemon(
        daemonMetadataId: string,
        chainName: string,
        parameterValues: DaemonParameterMap,
        gas?: string
    ): Promise<MsgRegisterDaemonResponse> {
        this.logger.verbose('Registering Agent')
        const txClient = await this.getTxClient()
        const address = await this.getAddress()

        const payload: DaemonRegisterCommandRequestDTO = {
            chain: {
                name: chainName,
            },
            daemonMetadataId,
            parameters:
                getDaemonParametersFromDaemonParameterMap(parameterValues),
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
            // @ts-ignore
            fee: TX_CLIENT_FEE,
        })
        this.throwOnError('MsgRegisterDaemon', result)

        const data = await this.getTxDataOnlyResponse(result.transactionHash)
        const decodedArr = this.decodeTxMessages(data)

        return decodedArr[0] as MsgRegisterDaemonResponse
    }

    public async createPlaybook(
        playbook: PlaybookDTO,
        gas?: string
    ): Promise<MsgCreatePlaybookResponse> {
        const txClient = await this.getTxClient()
        const address = await this.getAddress()

        const value: MsgCreatePlaybook = {
            creator: address,
            playbook: playbook,
        }
        const result = await txClient.sendMsgCreatePlaybook({
            value,
            // @ts-ignore
            fee: TX_CLIENT_FEE,
        })
        this.logger.verbose('Payload result', result)

        this.throwOnError('MsgCreatePlaybook', result)
        this.logger.verbose('Transaction Hash', result.transactionHash)
        const data = await this.getTxDataOnlyResponse(result.transactionHash)
        const decodedArr = this.decodeTxMessages(data)
        return decodedArr[0] as MsgCreatePlaybookResponse
    }

    public async updatePlaybook(
        playbookId: string,
        playbook: PlaybookDTO,
        gas?: string
    ): Promise<MsgUpdatePlaybookResponse> {
        const txClient = await this.getTxClient()
        const queryClient = await this.getQueryClient()
        const address = await this.getAddress()

        try {
            const found = await queryClient.queryPlaybook(playbookId)
            if (
                !found.data.playbook ||
                found.data.playbook.creator !== address
            ) {
                throw new Error(
                    `Playbook with id ${playbookId} not found or not owned by ${address}`
                )
            }
        } catch (error) {
            this.logger.error('An error occurred:', error.message)
            process.exit(1)
        }

        playbook.id = playbookId

        const value: MsgUpdatePlaybook = {
            creator: address,
            playbook: playbook,
        }

        const result = await txClient.sendMsgUpdatePlaybook({
            value,
            // @ts-ignore
            fee: TX_CLIENT_FEE,
        })
        this.logger.verbose('Payload result', result)

        this.throwOnError('MsgUpdatePlaybook', result)
        this.logger.verbose('Transaction Hash', result.transactionHash)
        const data = await this.getTxDataOnlyResponse(result.transactionHash)
        const decodedArr = this.decodeTxMessages(data)
        return decodedArr[0] as MsgUpdatePlaybookResponse
    }

    public async removePlaybook(
        playbookId: string
    ): Promise<MsgDeletePlaybookResponse> {
        const txClient = await this.getTxClient()
        const queryClient = await this.getQueryClient()
        const address = await this.getAddress()

        try {
            this.logger.verbose(`querying playbook with id ${playbookId}`)
            const found = await queryClient.queryPlaybook(playbookId)
            if (
                !found.data.playbook ||
                found.data.playbook.creator !== address
            ) {
                throw new Error(
                    `Playbook with id ${playbookId} not found or not owned by ${address}`
                )
            }
        } catch (error) {
            this.logger.error(
                'An error occurred:',
                `Playbook with id ${playbookId} not found`
            )
            this.logger.verbose(JSON.stringify(error))
            process.exit(1)
        }

        const value: MsgDeletePlaybook = {
            creator: address,
            playbookId: playbookId,
        }

        const result = await txClient.sendMsgDeletePlaybook({
            value,
            // @ts-ignore
            fee: TX_CLIENT_FEE,
        })

        this.logger.verbose('Payload result', result)

        this.throwOnError('MsgDeletePlaybook', result)

        this.logger.verbose('Transaction Hash', result.transactionHash)
        const data = await this.getTxDataOnlyResponse(result.transactionHash)
        const decodedArr = this.decodeTxMessages(data)
        return decodedArr[0] as MsgDeletePlaybookResponse
    }

    private async getWallet() {
        if (this.wallet) return this.wallet
        const key = fromBase64(this.privateKey)
        const wallet = await DirectSecp256k1Wallet.fromKey(key, ADDRESS_PREFIX)

        this.wallet = wallet
        return wallet
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

        if (
            Object.getOwnPropertyDescriptor(
                SigningStargateClient.prototype,
                'gasPrice'
            ) === undefined
        ) {
            Object.defineProperty(SigningStargateClient.prototype, 'gasPrice', {
                get: function gasPrice() {
                    return '0.0000token'
                },
                set: function gasPrice() {
                    // nothing
                },
            })
        }

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
        
        message MsgCreatePlaybookResponse {
            string playbookId = 1;
        }  
        
        message MsgUpdatePlaybookResponse {
            string playbookId = 1;
        }

        message MsgUnregisterDaemonResponse {
            string daemonId = 1;
        }
        
        message TxMsgData {
            repeated Any msg_responses = 2;
        }

        message MsgDeletePlaybookResponse {}

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
    queries: MyDaemonMetadataContentQuery[],
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
        query: (queries || []).map((query) => ({
            query: query.query,
            incidentMessage: query.incidentMessage,
            severity: incidentSeverityFromJSON(query.severity),
        })),
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
