// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const TwitterTokenModule = require("./TwitterToken");

module.exports = buildModule("TokenFaucet", (m) => {
  const { twitterToken } = m.useModule(TwitterTokenModule);

  const tokenFaucet = m.contract("TokenFaucet", [twitterToken]);

  return { tokenFaucet };
});
