import { Command } from 'commander'
import path from 'path'
import program from '../program'
import fs from 'fs'

function generateMarkdown() {
    const { commands } = program

    const markdown = commands.reduce((acc, command) => {
        return `${acc} 
### ${command.name()}

\`\`\`
${command.helpInformation()}
\`\`\`
`
    }, '')

    // const markdown = commands.reduce((acc, command) => {
    //     const { name, description, /*options,*/ args } = command

    //     command.helpInformation()
    //     // const optionsMarkdown = options.reduce((acc, option) => {
    //     //     const { flags, description, defaultValue } = option

    //     //     return (
    //     //         acc +
    //     //         `| ${flags} | ${description} | ${defaultValue || ''} | \n`
    //     //     )
    //     // }, '')

    //     // const argsMarkdown = args.reduce((acc, arg) => {
    //     //     const { name, description, defaultValue } = arg

    //     //     return (
    //     //         acc + `| ${name} | ${description} | ${defaultValue || ''} | \n`
    //     //     )
    //     // }, '')

    //     // return (
    //     //     acc +
    //     //     `## \`${name}\`\n\n` +
    //     //     `${description}\n\n` +
    //     //     `### Options\n\n` +
    //     //     `| Option | Description | Default | \n` +
    //     //     `| --- | --- | --- | \n` +
    //     //     // `${optionsMarkdown}\n` +
    //     //     `### Arguments\n\n` +
    //     //     `| Argument | Description | Default | \n` +
    //     //     `| --- | --- | --- | \n`
    //     //     // `${argsMarkdown}\n`
    //     // )

    //     return ''
    // }, '')

    return `# Mamoru CLI Reference

## Basic Usage

\`\`\`
${getBasicUsage(program)}
\`\`\`

## Commands

${markdown}`
}

function getBasicUsage(program: Command) {
    return program
        .helpInformation()
        .replace('Usage: ', 'mamoru-cli')
        .split('Commands:')[0]
        .trim()
}

function generateDocs() {
    const docsPath = path.resolve(__dirname, '../../docs/reference.md')

    fs.writeFileSync(docsPath, generateMarkdown())
}

generateDocs()
