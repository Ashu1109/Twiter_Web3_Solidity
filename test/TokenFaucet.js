const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("TokenFaucet", function () {
  async function deployFaucetFixture() {
    const [owner, acc1] = await ethers.getSigners();
    const TokenFaucet = await ethers.getContractFactory("TokenFaucet");
    const token = await ethers.getContractFactory("TwitterToken");
    const twitterToken = await token.deploy();
    await twitterToken.waitForDeployment();
    const tokenFaucet = await TokenFaucet.deploy(twitterToken.target);
    await tokenFaucet.waitForDeployment();

    // Mint initial tokens to the faucet
    await twitterToken.mint(tokenFaucet.target, ethers.parseEther("1000"));
    return { tokenFaucet, owner, acc1, twitterToken };
  }
  describe("Deployment", function () {
    it("Should have the correct token address", async function () {
      const { tokenFaucet, twitterToken } = await loadFixture(
        deployFaucetFixture
      );
      expect(await tokenFaucet.token()).to.equal(twitterToken.target);
    });
    it("Should have the correct initial balance", async function () {
      const { tokenFaucet, twitterToken } = await loadFixture(
        deployFaucetFixture
      );
      const balance = await twitterToken.balanceOf(tokenFaucet.target);
      expect(balance).to.equal(ethers.parseEther("1000"));
    });
    it("should allow users to claim tokens", async function () {
      const { tokenFaucet, acc1, twitterToken } = await loadFixture(
        deployFaucetFixture
      );
      const initialBalance = await twitterToken.balanceOf(acc1.address);
      expect(initialBalance).to.equal(ethers.parseEther("0"));

      // Claim tokens (fixed amount of 100 tokens)
      await tokenFaucet.connect(acc1).claimTokens();
      const newBalance = await twitterToken.balanceOf(acc1.address);
      expect(newBalance).to.equal(ethers.parseEther("100"));

      // Check faucet balance after claim
      const faucetBalance = await twitterToken.balanceOf(tokenFaucet.target);
      expect(faucetBalance).to.equal(ethers.parseEther("900"));
    });

    it("should prevent users from claiming tokens twice", async function () {
      const { tokenFaucet, acc1 } = await loadFixture(deployFaucetFixture);

      // First claim should succeed
      await tokenFaucet.connect(acc1).claimTokens();

      // Second claim should fail
      await expect(tokenFaucet.connect(acc1).claimTokens()).to.be.revertedWith(
        "Already claimed"
      );
    });
  });
});
