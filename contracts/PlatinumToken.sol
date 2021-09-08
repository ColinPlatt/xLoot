// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @dev {ERC20} token, including:
 *
 */
contract PlatinumToken is Context, Ownable, ERC20 {

    constructor() ERC20("Platinum Token","PLAT") {

    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
