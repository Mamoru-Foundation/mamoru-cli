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
