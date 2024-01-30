import { Command } from 'commander'
import { Logger } from '../../services/console'
import { getListOfDaemons } from '../../services/graphql-api/graphql-api.service'

export default async function listAgents(program: Command) {
    const verbosity = program.opts().verbose
    const logger = new Logger(verbosity)

    const list = await getListOfDaemons()

    logger.log(JSON.stringify(list, null, 2))
}
