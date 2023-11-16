import { Command } from 'commander'
import { loginCommand } from './auth'
import { logoutCommand } from './logout'
import { askForTelemetry } from '../ask-for-telemetry'

export const initializeAuthCommands = (program: Command) => {
    const authSubCommand = program
        .command('auth')
        .description('Authentication related commands')

    authSubCommand
        .command('login')
        .description('Login to Mamoru')
        .action(async (options: any) => {
            await askForTelemetry(options)
            await loginCommand(program)
        })

    authSubCommand
        .command('logout')
        .description('Logout from Mamoru')
        .action(async (options: any) => {
            await askForTelemetry(options)
            logoutCommand(program)
        })
}
