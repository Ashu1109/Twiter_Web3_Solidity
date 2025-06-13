//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./TokenFaucet.sol";

contract TwitterAccount {
    struct Tweet {
        uint256 id;
        string content;
        address author;
        uint256 timestamp;
        bool isDeleted;
        uint256 likeCount;
    }
    struct TwitterUser {
        address userAddress;
        string username;
        string bio;
        Tweet[] tweets;
    }

    IERC20 public twitterToken;
    TokenFaucet public tokenFaucet;
    uint256 public constant TWEET_COST = 10 * 10 ** 18; // 10 tokens with 18 decimals
    uint256 public constant LIKE_COST = 1 * 10 ** 18; // 1 token with 18 decimals

    mapping(address => TwitterUser) private users;
    mapping(uint256 => Tweet) private tweets;
    uint256 private tweetCounter;
    event TweetCreated(
        uint256 indexed tweetId,
        address indexed author,
        string content
    );
    event TweetDeleted(uint256 indexed tweetId, address indexed author);
    event TweetLiked(uint256 indexed tweetId, address indexed user);
    event UserRegistered(
        address indexed userAddress,
        string username,
        string bio
    );

    constructor(address _twitterToken, address _tokenFaucet) {
        twitterToken = IERC20(_twitterToken);
        tokenFaucet = TokenFaucet(_tokenFaucet);
    }
    modifier onlyUser() {
        require(
            bytes(users[msg.sender].username).length > 0,
            "User not registered"
        );
        _;
    }
    function balanceOf(address _user) public view returns (uint256) {
        return twitterToken.balanceOf(_user);
    }
    function registerUser(string memory _username, string memory _bio) public {
        require(bytes(_username).length > 0, "Username cannot be empty");
        require(
            bytes(users[msg.sender].username).length == 0,
            "User already registered"
        );

        // Create user without initializing tweets array directly
        users[msg.sender].userAddress = msg.sender;
        users[msg.sender].username = _username;
        users[msg.sender].bio = _bio;
        // tweets array is automatically initialized as empty

        // tokenFaucet.claimTokens(); // Removed: Contract should not claim tokens for itself here
        emit UserRegistered(msg.sender, _username, _bio);
    }
    function createTweet(string memory _content) public onlyUser {
        require(bytes(_content).length > 0, "Tweet content cannot be empty");
        require(
            twitterToken.balanceOf(msg.sender) >= TWEET_COST,
            "Insufficient Twitter tokens to create tweet"
        );

        // Deduct 10 Twitter tokens from the user
        require(
            twitterToken.transferFrom(msg.sender, address(this), TWEET_COST),
            "Token transfer failed"
        );

        tweetCounter++;
        Tweet memory newTweet = Tweet(
            tweetCounter,
            _content,
            msg.sender,
            block.timestamp,
            false,
            0
        );
        users[msg.sender].tweets.push(newTweet);
        tweets[tweetCounter] = newTweet;
        emit TweetCreated(tweetCounter, msg.sender, _content);
    }
    function deleteTweet(uint256 _tweetId) public onlyUser {
        require(_tweetId > 0 && _tweetId <= tweetCounter, "Invalid tweet ID");
        require(
            tweets[_tweetId].author == msg.sender,
            "Only the author can delete this tweet"
        );
        require(!tweets[_tweetId].isDeleted, "Tweet already deleted");
        tweets[_tweetId].isDeleted = true;
        emit TweetDeleted(_tweetId, msg.sender);
    }
    function likeTweet(uint256 _tweetId) public onlyUser {
        require(!tweets[_tweetId].isDeleted, "Cannot like a deleted tweet");
        require(
            twitterToken.balanceOf(msg.sender) >= LIKE_COST,
            "Insufficient Twitter tokens to like tweet"
        );
        require(
            twitterToken.transferFrom(msg.sender, address(this), LIKE_COST),
            "Token transfer failed"
        );
        require(
            tweets[_tweetId].author != msg.sender,
            "Cannot like your own tweet"
        );
        tweets[_tweetId].likeCount++;
        emit TweetLiked(_tweetId, msg.sender);
    }
    function getUserTweets(address _user) public view returns (Tweet[] memory) {
        return users[_user].tweets;
    }
    function getUserInfo(
        address _user
    ) public view returns (string memory, string memory) {
        TwitterUser storage user = users[_user];
        return (user.username, user.bio);
    }
    function getTweet(uint256 _tweetId) public view returns (Tweet memory) {
        require(_tweetId > 0 && _tweetId <= tweetCounter, "Invalid tweet ID");
        return tweets[_tweetId];
    }
    function getAllTweets() public view returns (Tweet[] memory) {
        Tweet[] memory allTweets = new Tweet[](tweetCounter);
        for (uint256 i = 1; i <= tweetCounter; i++) {
            allTweets[i - 1] = tweets[i];
        }
        return allTweets;
    }
    function getUserByAddress(
        address _user
    ) public view returns (TwitterUser memory) {
        TwitterUser storage user = users[_user];
        if (bytes(user.username).length == 0) {
            // User not present, return empty TwitterUser
            return
                TwitterUser({
                    userAddress: address(0),
                    username: "",
                    bio: "",
                    tweets: new Tweet[](0)
                });
        }
        return user;
    }
}
