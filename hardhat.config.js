require("@nomicfoundation/hardhat-toolbox");

const PrivateKey =
  "97b371f55d90f5272f7a89324e172dd290274ed0126cd8dff340bf7ee5739b24";

module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "sepolia",
  networks: {
    hardhat: {},
    sepolia: {
      url: "https://sepolia.infura.io/v3/ac9a163f8c744586a666d4a8da45e5b7",
      accounts: [PrivateKey],
    },
  },
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};
