#! /bin/bash
# This scripts adds tx: result.tx, to the stargateclient.js file
# This is a temporary fix for an issue where the tx is not returned from the stargateclient.js
#   without the tx, we can't get the result data from the transaction in the blockchain.
#
#   I don't know why they didn't added. but this was faster an easier than doing a Fork and storing it in NPM
# forking would require us to maintain the forked repo and update it every time the original repo is updated.

set -e
export client_path='node_modules/@cosmjs/stargate/build/signingstargateclient.js'


# Path: check if line " tx: result.tx," exist
export line_exist=$(grep -c "data: result.data," $client_path)

# Mac OS X sed is not GNU sed
function is_gnu_sed(){
  sed --version >/dev/null 2>&1
}

function sed_i_wrapper(){
  if is_gnu_sed; then
    $(which sed) "$@"
  else
    a=()
    for b in "$@"; do
      [[ $b == '-i' ]] && a=("${a[@]}" "$b" "") || a=("${a[@]}" "$b")
    done
    $(which sed) "${a[@]}"
  fi
}



# Path: if line not exist, add it
if [ $line_exist -eq 0 ]; then
    sed_i_wrapper -i  's/const tmClient = await tendermint_rpc_1.Tendermint34Client.connect(endpoint);/const tmClient = await tendermint_rpc_1.Tendermint37Client.connect(endpoint);/' "$client_path";
    # sed_i_wrapper -i  's/gasWanted: tx.result.gasWanted,/gasWanted: tx.result.gasWanted, data: tx.result.data,/' "$client_path";
fi

