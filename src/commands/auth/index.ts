import { program, InvalidArgumentError, Option, Command } from 'commander'
import { AuthCommand } from './auth'

export const initializeAuthCommands = (program: Command) => {
    const authSubCommand = program
        .command('auth')
        .description('Authentication related commands')

    authSubCommand
        .command('login')
        .description('Login to Mamoru')
        .action(() => {
            AuthCommand(program)
        })
}
