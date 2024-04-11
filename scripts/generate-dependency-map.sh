#!/bin/bash
set -e

PACKAGE_CONTENTS=$(cat "package.json")
SDK_VERSION=$(echo $PACKAGE_CONTENTS | jq --raw-output '.devDependencies ."@mamoru-ai/mamoru-sdk-as"')
SDK_SUI_VERSION=$(echo $PACKAGE_CONTENTS | jq --raw-output '.devDependencies ."@mamoru-ai/mamoru-sui-sdk-as"')
SDK_EVM_VERSION=$(echo $PACKAGE_CONTENTS | jq --raw-output '.devDependencies ."@mamoru-ai/mamoru-evm-sdk-as"')
SDK_APTOS_VERSION=$(echo $PACKAGE_CONTENTS | jq --raw-output '.devDependencies ."@mamoru-ai/mamoru-aptos-sdk-as"')
SDK_COSMOS_VERSION=$(echo $PACKAGE_CONTENTS | jq --raw-output '.devDependencies ."@mamoru-ai/mamoru-cosmos-sdk-as"')

# echo $PACKAGE_CONTENTS
echo $SDK_VERSION
echo $SDK_SUI_VERSION
echo $SDK_EVM_VERSION
echo $SDK_APTOS_VERSION
echo $SDK_COSMOS_VERSION

# create json file with dependency map
echo "export const sdkVersions = {\"sdk\": \"$SDK_VERSION\", \"sui\": \"$SDK_SUI_VERSION\", \"evm\": \"$SDK_EVM_VERSION\", \"aptos\": \"$SDK_APTOS_VERSION\",\"cosmos\": \"$SDK_COSMOS_VERSION\" }" > src/sdk-dependency-versions.ts
