/* eslint-disable no-console */
import { generateFoundedUser } from './test-utils'

generateFoundedUser()
    .then((user) => {
        console.log('----------------------')
        console.log(user)
        console.log('----------------------')
    })
    .catch((err) => {
        console.log(err)
    })
