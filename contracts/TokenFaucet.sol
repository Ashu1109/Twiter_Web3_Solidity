// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenFaucet {
    IERC20 public token;
    mapping(address => bool) public hasClaimed;

    event TokensClaimed(address indexed user, uint256 amount);

    constructor(address _tokenAddress) {
        token = IERC20(_tokenAddress);
    }

    function claimTokens() external {
        require(!hasClaimed[msg.sender], "Already claimed");
        hasClaimed[msg.sender] = true;
        uint256 amount = 100 * 10 ** 18;
        require(
            token.balanceOf(address(this)) >= amount,
            "Faucet out of tokens"
        );
        require(token.transfer(msg.sender, amount), "Transfer failed");
        emit TokensClaimed(msg.sender, amount);
    }

    function getClaimStatus(address user) external view returns (bool) {
        return hasClaimed[user];
    }
}
