const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TwitterAccount", function () {
  async function deployedTwitterAccount() {
    const [owner, acc1, acc2, acc3] = await ethers.getSigners();
    const token = await ethers.getContractFactory("TwitterToken");
    const twitterFaucet = await ethers.getContractFactory("TokenFaucet");
    const twitterAccount = await ethers.getContractFactory("TwitterAccount");

    const tokenContract = await token.deploy();
    await tokenContract.waitForDeployment();
    const faucetContract = await twitterFaucet.deploy(tokenContract.target);
    await faucetContract.waitForDeployment();
    const accountContract = await twitterAccount.deploy(
      tokenContract.target,
      faucetContract.target
    );
    await accountContract.waitForDeployment();
    // Mint some tokens to the faucet
    await tokenContract.mint(faucetContract.target, ethers.parseEther("2000"));

    if ((await faucetContract.getClaimStatus(acc1.address)) === false) {
      // claim some tokens to the account only once
      await faucetContract.connect(acc1).claimTokens();
    }

    return {
      accountContract,
      tokenContract,
      faucetContract,
      owner,
      acc1,
      acc2,
      acc3,
    };
  }
  describe("Deployment", function () {
    it("Should have the correct token address", async function () {
      const { accountContract, tokenContract } = await loadFixture(
        deployedTwitterAccount
      );
      expect(await accountContract.twitterToken()).to.equal(
        tokenContract.target
      );
    });
    it("Should have the correct faucet address", async function () {
      const { accountContract, faucetContract } = await loadFixture(
        deployedTwitterAccount
      );
      expect(await accountContract.tokenFaucet()).to.equal(
        faucetContract.target
      );
    });
  });
  describe("Twitter Account", function () {
    it("Should allow creating a Twitter account", async function () {
      const { accountContract, tokenContract, acc1 } = await loadFixture(
        deployedTwitterAccount
      );

      // First, approve the contract to spend tokens for the user
      await tokenContract
        .connect(acc1)
        .approve(accountContract.target, ethers.parseEther("1000"));

      await accountContract
        .connect(acc1)
        .registerUser("test_account", "test_bio");

      const userInfo = await accountContract.getUserInfo(acc1.address);
      expect(userInfo[0]).to.equal("test_account");
      expect(userInfo[1]).to.equal("test_bio");
    });

    it("Should create a Tweet", async function () {
      const { accountContract, tokenContract, acc1 } = await loadFixture(
        deployedTwitterAccount
      );

      // Register user first
      await tokenContract
        .connect(acc1)
        .approve(accountContract.target, ethers.parseEther("1000"));
      await accountContract.connect(acc1).registerUser("test_user", "test_bio");

      // Create tweet
      await accountContract.connect(acc1).createTweet("Hello, world!");

      const tweet = await accountContract.getTweet(1);
      expect(tweet.content).to.equal("Hello, world!");
      expect(tweet.author).to.equal(acc1.address);
    });

    it("Should allow liking a Tweet", async function () {
      const { accountContract, tokenContract, faucetContract, acc2, acc3 } =
        await loadFixture(deployedTwitterAccount);
      // Claim tokens from faucet for acc2 and acc3
      await faucetContract.connect(acc2).claimTokens();
      await faucetContract.connect(acc3).claimTokens();
      // Approve the contract to spend tokens for the users
      await tokenContract
        .connect(acc2)
        .approve(accountContract.target, ethers.parseEther("1000"));

      await tokenContract
        .connect(acc3)
        .approve(accountContract.target, ethers.parseEther("1000"));

      await accountContract
        .connect(acc2)
        .registerUser("test_account", "test_bio");

      await accountContract
        .connect(acc3)
        .registerUser("test_account2", "test_bio2");

      const userInfo = await accountContract.getUserInfo(acc2.address);
      const userInfo2 = await accountContract.getUserInfo(acc3.address);
      expect(userInfo[0]).to.equal("test_account");
      expect(userInfo[1]).to.equal("test_bio");
      expect(userInfo2[0]).to.equal("test_account2");
      expect(userInfo2[1]).to.equal("test_bio2");

      // Create tweet
      await accountContract.connect(acc2).createTweet("Hello, world!");
      const tweet = await accountContract.getTweet(1);
      expect(tweet.content).to.equal("Hello, world!");
      expect(tweet.author).to.equal(acc2.address);
      expect(tweet.likeCount).to.equal(0); // Changed likesCount to likeCount
      expect(tweet.isDeleted).to.equal(false);

      // Like tweet
      await accountContract.connect(acc3).likeTweet(1);
      const updatedTweet = await accountContract.getTweet(1);
      expect(updatedTweet.likeCount).to.equal(1); // Changed likesCount to likeCount
    });

    it("Should allow to delete a tweet", async function () {
      const { accountContract, tokenContract, acc1 } = await loadFixture(
        deployedTwitterAccount
      );

      // Register user and approve token spending
      await tokenContract
        .connect(acc1)
        .approve(accountContract.target, ethers.parseEther("1000"));
      await accountContract.connect(acc1).registerUser("test_user", "test_bio");

      // Create tweet
      await accountContract.connect(acc1).createTweet("Hello, world!");

      // Delete tweet
      await accountContract.connect(acc1).deleteTweet(1);

      const tweet = await accountContract.getTweet(1);
      expect(tweet.isDeleted).to.equal(true);
    });

    it("Should return empty TwitterUser for unregistered address", async function () {
      const { accountContract, acc2 } = await loadFixture(
        deployedTwitterAccount
      );
      // acc2 has not registered
      const user = await accountContract.getUserByAddress(acc2.address);
      expect(user.userAddress).to.equal(ethers.ZeroAddress);
      expect(user.username).to.equal("");
      expect(user.bio).to.equal("");
      expect(user.tweets.length).to.equal(0);
    });

    it("Should return correct TwitterUser for registered address", async function () {
      const { accountContract, tokenContract, acc1 } = await loadFixture(
        deployedTwitterAccount
      );
      await tokenContract
        .connect(acc1)
        .approve(accountContract.target, ethers.parseEther("1000"));
      await accountContract.connect(acc1).registerUser("alice", "bio");
      const user = await accountContract.getUserByAddress(acc1.address);
      expect(user.userAddress).to.equal(acc1.address);
      expect(user.username).to.equal("alice");
      expect(user.bio).to.equal("bio");
      expect(user.tweets.length).to.equal(0);
    });
  });
});
