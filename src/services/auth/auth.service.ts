import axios from 'axios'
import open from 'open'
import { readRcConfig, writeRcConfig } from '../config'
import { Logger } from '../console'
import colors from 'colors'
import { verify } from 'jsonwebtoken'
import JwksClient from 'jwks-rsa'

const CLIENT_ID =
    process.env.MAMORU_CLI_AUTH0_CLIENT_ID ?? 'DKVTdw1UnneGumqOAPrEJs8RqdGTDd2e'
const DOMAIN = process.env.MAMORU_CLI_AUTH0_DOMAIN ?? `mamoru.us.auth0.com`
const AUDIENCE = process.env.MAMORU_CLI_AUTH0_AUDIENCE ?? 'https://mamoru.ai'

const jwksClient = JwksClient({
    jwksUri: `${DOMAIN}/.well-known/jwks.json`,
})

function getKey(header: any, callback: any) {
    jwksClient.getSigningKey(header.kid, function (err, key) {
        try {
            const signingKey = key.getPublicKey()
            callback(err, signingKey)
        } catch (err) {
            callback(err, null)
        }
    })
}

function checkAuth0Token(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
        verify(token, getKey, {}, (err, decoded: any) => {
            if (err) return reject(err)

            return resolve(decoded)
        })
    })
}

export function requestDeviceCode(): Promise<{
    device_code: string
    user_code: string
    verification_uri: string
    expires_in: number
    interval: number
}> {
    const options = {
        method: 'POST',
        url: `${DOMAIN}/oauth/device/code`,
        data: { client_id: CLIENT_ID, audience: AUDIENCE, scope: 'profile' },
    }

    return axios
        .request(options)
        .then((res) => res.data)
        .catch(function (error) {
            throw error
        })
}

export function openDeviceActivationUrl(url: string): void {
    open(url)
}

/**
 * Request tokens, if the device code is not yet activated, poll until it is.
 * @see https://auth0.com/docs/get-started/authentication-and-authorization-flow/call-your-api-using-the-device-authorization-flow#request-tokens
 */
export function requestTokens(deviceCode: string): Promise<{
    access_token: string
    expires_in: number
    token_type: string
}> {
    const options = {
        method: 'POST',
        url: `${DOMAIN}/oauth/token`,
        data: {
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
            device_code: deviceCode,
            client_id: CLIENT_ID,
        },
    }

    return axios
        .request(options)
        .then((res) => res.data)
        .catch(function (error) {
            if (error.response.data.error === 'authorization_pending') {
                return null
            }
            throw new Error(error.response.data.error_description)
        })
}
/**
 * Get the user from
 */
export async function isUserAuthenticated(): Promise<boolean> {
    // read config
    const config = readRcConfig()
    // if no authToken, return false
    if (!config.authToken) return false

    try {
        await checkAuth0Token(config.authToken)
    } catch (err) {
        return false
    }
    // if token check if still valid, if not, remove authToken and return false

    // if valid, return true
    return true
}

export function storeUserToken(authToken: string): void {
    const config = readRcConfig()

    config.authToken = authToken

    writeRcConfig(config)
}

export function removeUserToken(): void {
    const config = readRcConfig()

    delete config.authToken

    writeRcConfig(config)
}

export async function isAuthRequiredGuard(): Promise<void> {
    const logger = new Logger(0)
    if (!(await isUserAuthenticated())) {
        logger.error(`You must be logged in to use this command, to solve it, please run
        
    ${colors.magenta(`mamoru auth login`)}`)
        return process.exit(1)
    }
}

export function getAuthToken() {
    const config = readRcConfig()

    return config.authToken
}
