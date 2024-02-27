import { Command } from 'commander'
import { Logger } from '../../services/console'
import { getListOfPlaybooks } from '../../services/graphql-api/graphql-api.service'
export default async function listPlaybooks(program: Command) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)

    const list = await getListOfPlaybooks()

    logger.log(JSON.stringify(list, null, 2))
}
