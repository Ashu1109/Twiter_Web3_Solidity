npx hardhat clean
npx hardhat compile

npx hardhat ignition deploy ./ignition/modules/TwitterToken.sol  --network sepolia
npx hardhat ignition deploy ./ignition/modules/TokenFaucet.sol  --network sepolia
npx hardhat ignition deploy ./ignition/modules/TwitterAccount.sol  --network sepolia
