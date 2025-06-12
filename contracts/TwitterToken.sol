// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TwitterToken is Ownable(msg.sender), ERC20 {
    constructor() ERC20("TwitterToken", "TTK") {
        // Mint an initial supply (e.g., 1,000,000 tokens) to the deployer
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    // Function to mint tokens (onlyOwner)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
