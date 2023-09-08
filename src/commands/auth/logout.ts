import { Command } from 'commander'
import { isUserAuthenticated, removeUserToken } from '../../services/auth'
import { Logger } from '../../services/console'

export async function logoutCommand(program: Command) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)
    // if user is already logged in, ask if they want to log in again
    const isAuthenticated = await isUserAuthenticated()

    if (!isAuthenticated) {
        logger.log('You are not logged in.')
        return process.exit(0)
    }

    removeUserToken()
    logger.ok('You are now logged out')
}
