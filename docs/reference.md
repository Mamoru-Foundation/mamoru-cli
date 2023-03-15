# Mamoru CLI Reference

## Basic Usage

```
mamoru-cli [options] [command]

Options:
  -v, --verbose             define verbosity to show execution logs
  -h, --help                display help for command
```

## Commands

 
### init

```
Usage:  init [options] <path>

Arguments:
  path                             path to folder with queryable project (default: "")

Options:
  -t, --type <type>                Type of project (choices: "sql", "wasm", default: "wasm")
  -c, --chain <chain>              Chain where the daemon runs (choices: "ethereum", "bsc", "sui")
  -n, --name <name>                Name of the project (default: "Default Name")
  -d, --description <description>  Description of the project (default: "Mamoru Daemon")
  -t, --tags <tags>                Tags of the project, comma separated (default: "mamoru,daemon")
  -l, --logo <logo>                Logo of the project, should be an url (default:
                                   "https://mamoru.ai/default-daemon-logo.png")
  --subscribable                   If the project is subscribable, or standalone (default: false)
  -h, --help                       display help for command

```
 
### build

```
Usage:  build [options] [path]

compile project

Arguments:
  path        path to folder with queryable project (default: ".")

Options:
  -h, --help  display help for command

```
 
### publish

```
Usage:  publish [options] [path]

publish project

Arguments:
  path                     path to folder with queryable project (default: ".")

Options:
  --rpc <rpcUrl>           rpc url of the chain
  --gas <gas>              gas fee of the transaction (default: "200000")
  -k, --private-key <key>  Private key of the account that will be used to publish the project
  -h, --help               display help for command

```
