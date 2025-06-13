npx hardhat clean
npx hardhat compile

npx hardhat ignition deploy ./ignition/modules/TwitterToken.js  --network sepolia
npx hardhat ignition deploy ./ignition/modules/TokenFaucet.js  --network sepolia
npx hardhat ignition deploy ./ignition/modules/TwitterAccount.js  --network sepolia
