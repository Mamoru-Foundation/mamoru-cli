import {
    isUserAuthenticated,
    openDeviceActivationUrl,
    requestDeviceCode,
    requestTokens,
    storeUserToken,
} from '../../services/auth'
import { confirm } from '@inquirer/prompts'
import { Logger } from '../../services/console'
import { Command } from 'commander'
import colors from 'colors'

export async function AuthCommand(program: Command) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    // if user is already logged in, ask if they want to log in again
    const isAuthenticated = isUserAuthenticated()

    if (isAuthenticated) {
        // ask if they want to log in again
        const shouldLogInAgain = await confirm({
            message:
                'You are already logged in. Would you like to log in again?',
            default: false,
        })

        if (!shouldLogInAgain) return process.exit(0)
    }

    // TODO: ask to user: how would you like to authenticate in github CLI? (login via browser, paste token)

    const deviceCode = await requestDeviceCode()

    logger.log(
        `First copy your one-time code: ${colors.magenta(deviceCode.user_code)}`
    )

    // copy code...
    const next = await confirm({
        message:
            'Press enter when you are ready to open the browser and authenticate',
        default: true,
    })

    if (!next) return process.exit(0)

    await openDeviceActivationUrl(deviceCode.verification_uri)

    const credentials = await askForCodeUntilAuthenticated(
        deviceCode.device_code,
        deviceCode.interval,
        logger
    )

    storeUserToken(credentials.access_token)

    logger.ok('You are now logged in!')
}

const askForCodeUntilAuthenticated = async (
    deviceCode: string,
    interval: number,
    logger: Logger
): Promise<{
    access_token: string
    expires_in: number
    token_type: string
}> => {
    logger.verbose('askForCodeUntilAuthenticated', deviceCode, interval)
    const tokens = await requestTokens(deviceCode)

    if (tokens) {
        logger.verbose('tokens', tokens)
        return tokens
    }

    // repeat this same function in 5 seconds
    await delay(interval * 1000)

    return askForCodeUntilAuthenticated(deviceCode, interval, logger)
}

function delay(millis: number) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(null), millis)
    })
}
