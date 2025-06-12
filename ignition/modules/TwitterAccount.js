// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const TwitterTokenModule = require("./TwitterToken");
const FaucetModule = require("./TokenFaucet");

const JAN_1ST_2030 = 1893456000;
const ONE_GWEI = 1_000_000_000n;

module.exports = buildModule("TwitterAccount", (m) => {
  const { twitterToken } = m.useModule(TwitterTokenModule);
  const { tokenFaucet } = m.useModule(FaucetModule);

  const account = m.contract("TwitterAccount", [twitterToken, tokenFaucet]);

  return { account };
});
