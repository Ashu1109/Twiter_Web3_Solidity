const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { ethers } = require("hardhat");

describe("TwitterToken", function () {
  async function deployTwitterTokenFixture() {
    const [owner, acc1] = await ethers.getSigners();
    const TwitterToken = await ethers.getContractFactory("TwitterToken");
    const token = await TwitterToken.deploy();
    await token.waitForDeployment();
    return { token, owner, acc1 };
  }
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployTwitterTokenFixture);
      expect(await token.owner()).equal(owner.address);
    });
    it("Should have the correct name and symbol", async function () {
      const { token } = await loadFixture(deployTwitterTokenFixture);
      expect(await token.name()).equal("TwitterToken");
      expect(await token.symbol()).equal("TTK");
    });
    it("Should have the correct decimals", async function () {
      const { token } = await loadFixture(deployTwitterTokenFixture);
      expect(await token.decimals()).equal(18);
    });
    it("Should mint tokens to the owner", async function () {
      const { token, owner } = await loadFixture(deployTwitterTokenFixture);
      const balance = await token.balanceOf(owner.address);
      expect(balance).equal(ethers.parseEther("1000000"));
    });
    it("Should mint tokens to the account", async function () {
      const { token, owner, acc1 } = await loadFixture(
        deployTwitterTokenFixture
      );
      const balance = await token.balanceOf(acc1.address);
      expect(balance).equal(ethers.parseEther("0"));
      await token.mint(acc1.address, ethers.parseEther("1000"));
      const newBalance = await token.balanceOf(acc1.address);
      expect(newBalance).equal(ethers.parseEther("1000"));
      expect(await token.owner()).equal(owner.address);
    });
  });
});
