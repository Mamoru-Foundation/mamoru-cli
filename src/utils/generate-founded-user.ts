import { generateFoundedUser } from './test-utils'

generateFoundedUser().then((user) => {
    console.log('----------------------')
    console.log(user)
    console.log('----------------------')
})
