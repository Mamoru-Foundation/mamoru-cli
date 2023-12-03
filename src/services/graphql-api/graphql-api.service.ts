import axios from 'axios'
import { getAuthToken } from '../auth'
import { GRAPHQL_BASE_URL } from '../env/env.service'
import { Logger } from '../console'

function getClient() {
    const token = getAuthToken()
    return axios.create({
        baseURL: GRAPHQL_BASE_URL,
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })
}

export async function assignOrganizationToDaemon(
    daemonId: string
): Promise<any> {
    const query = `#graphql
    mutation assignDaemonOrganizationId($daemonId: String!) {
      assignDaemonOrganizationId(daemonId: $daemonId) {
        __typename
      }
    }
  `

    const client = getClient()

    const r = await client
        .post('', {
            query,
            variables: { daemonId },
        })

        .then((res) => {
            if (res.data.errors) {
                throw {
                    response: res,
                }
            }
            return res.data
        })
        .catch((e) => {
            throw e?.response?.data || e
        })

    return r
}

export async function assignOrganizationToDaemonRepeat(
    daemonId: string,
    logger: Logger
) {
    const INTERVAL = 3000 // 3 seconds
    const MAX_ATTEMPTS = 100

    let attempts = 0
    while (attempts < MAX_ATTEMPTS) {
        try {
            const res = await assignOrganizationToDaemon(daemonId)
            logger.verbose(
                `assignOrganizationToDaemon response: ${JSON.stringify(
                    res,
                    null,
                    2
                )}`
            )
            return res
        } catch (e) {
            logger.verbose(
                `Error assigning organization to daemon: ${JSON.stringify(
                    e?.response?.data || e,
                    null,
                    2
                )}`
            )
            attempts++
            await new Promise((resolve) => setTimeout(resolve, INTERVAL))
        }
    }

    throw new Error(
        `Could not assign organization to daemon after ${MAX_ATTEMPTS} attempts`
    )
}

export async function getDaemonsByIds(
    daemonIds: string[]
): Promise<{ id: string }[]> {
    const query = `#graphql
    query listDaemons($daemonIds: [String!]!) {
        listDaemons(pagination:{
            page: 1,
            pageSize: 100
        }, filter:{
            daemonIds: $daemonIds
            
        }){
            items{
            id: daemonId
            }
        }
    }
    `

    const client = getClient()

    const r = await client
        .post('', {
            query,
            variables: { daemonIds },
        })

        .then((res) => {
            if (res.data.errors) {
                throw {
                    response: res,
                }
            }
            return res
        })
        .catch((e) => {
            throw e?.response?.data || e
        })

    return r.data.data?.listDaemons?.items
}

export async function getSupportedNetworks() {
    const query = `#graphql
    query listNetworks {
	listNetworks{
        items{
        enumKey
        enumValue
        name
        enabled
        explorerTxUrl
        explorerAccUrl
        explorerBlockUrl
        logoUrl24x24
        logoUrl48x48
        }
    }
    }

    `

    const client = getClient()

    const r = await client
        .post('', {
            query,
        })

        .then((res) => {
            if (res.data.errors) {
                throw {
                    response: res,
                }
            }
            return res
        })
        .catch((e) => {
            throw e?.response?.data || e
        })

    return r.data.data?.listNetworks?.items || []
}
