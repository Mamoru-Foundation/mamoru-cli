import axios, { AxiosResponse } from 'axios'
import open from 'open'
import { readRcConfig, writeRcConfig } from '../config'

const CLIENT_ID = 'dwauk7iBT36rlvE4XTh3QJ0IxWAv8AGc'
const DOMAIN = `https://dev-xp12liakgecl7vlc.us.auth0.com`
const AUDIENCE = 'https://mamoru.ai'

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
export function isUserAuthenticated() {
    // read config
    const config = readRcConfig()
    // if no authToken, return false
    if (!config.authToken) return false

    // if token check if still valid, if not, remove authToken and return false

    // if valid, return true
    return true
}

export function storeUserToken(authToken: string) {
    const config = readRcConfig()

    config.authToken = authToken

    writeRcConfig(config)
}

export function removeUserToken() {
    const config = readRcConfig()

    delete config.authToken

    writeRcConfig(config)
}
