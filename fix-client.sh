# This scripts adds tx: result.tx, to the stargateclient.js file
# This is a temporary fix for an issue where the tx is not returned from the stargateclient.js
#   I don't know why they didn't added. but this was faster an easier than doing a Fork and storing it in NPM

set -e
set -x
export client_path='node_modules/@cosmjs/stargate/build/stargateclient.js'


# Path: check if line " tx: result.tx," exist
export line_exist=$(grep -c "tx: result.tx," $client_path)

# Path: if line not exist, add it
if [ $line_exist -eq 0 ]; then
    sed -i '' 's/gasWanted: result.gasWanted,/gasWanted: result.gasWanted, tx: result.tx,/' "$client_path";
fi