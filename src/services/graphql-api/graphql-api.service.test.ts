import { describe, expect, it } from '@jest/globals'
import { assignOrganizationToDaemon } from './graphql-api.service'
import nock from 'nock'

describe('GraphQLApiService', () => {
    describe('assignOrganizationToDaemon', () => {
        it('PASS - call to graphql api', async () => {
            nock('https://mamoru-be-production.mamoru.foundation')
                .post('/graphql')
                .reply(200, {})
            await assignOrganizationToDaemon('organizationId')
        })
    })
})
