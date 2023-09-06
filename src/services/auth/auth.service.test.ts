import { describe, expect, it } from '@jest/globals'
import {
    requestDeviceCode,
    openDeviceActivationUrl,
    requestTokens,
} from './auth.service'

describe('AuthService', () => {
    describe('requestDeviceCode', () => {
        it('should return a device code', async () => {
            const r = await requestDeviceCode()

            expect(r).toBeTruthy()

            expect(r).toHaveProperty('device_code')
            expect(r).toHaveProperty('user_code')
            expect(r).toHaveProperty('verification_uri')
            expect(r).toHaveProperty('expires_in')
            expect(r).toHaveProperty('interval')
            expect(r).toHaveProperty('verification_uri_complete')
        })
    })

    describe('openDeviceActivationUrl', () => {
        it.skip('should open the url', async () => {
            openDeviceActivationUrl('https://google.com')
        })
    })

    describe('requestTokens', () => {
        it('should null if user havent authorized the device', async () => {
            const r0 = await requestDeviceCode()

            const r = await requestTokens(r0.device_code)

            expect(r).toBeNull()
        })
    })
})
