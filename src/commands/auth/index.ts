import { Command } from 'commander'
import { loginCommand } from './auth'
import { logoutCommand } from './logout'

export const initializeAuthCommands = (program: Command) => {
    const authSubCommand = program
        .command('auth')
        .description('Authentication related commands')

    authSubCommand
        .command('login')
        .description('Login to Mamoru')
        .action(() => loginCommand(program))

    authSubCommand
        .command('logout')
        .description('Logout from Mamoru')
        .action(() => logoutCommand(program))
}
