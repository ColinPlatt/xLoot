// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


/// @title mLootSweeper for TemporalLoots
/// @notice This contract allows mLoot holders within a range to voluntarily and irrevocably send their mLoots to the contract, and receive the opportunity to participate in a prize draw
/// @notice This contract has not been audited. Use at your own risk.  

contract mLootSweeper is Context, ReentrancyGuard {
    
    struct DepositInfo {
        address depositor;
        uint256 mLootId;
    }
    
    DepositInfo[] public depositInfo;

    address public mLootContractAddress = 
        0x5E7c9953e501a505C92a7073CAC29e9f92B6F6F7; //0x1dfe7Ca09e99d10835Bf73044a23B73Fc20623DF;
    
    IERC721Enumerable public mLootContract;

    uint256 public mLootIdStart = 8001;
    uint256 public mLootIdEnd = 16000;

    uint256 public depositPrice = 1 * 10**16;  //0.01 ETH
    uint256 public drawSize = 100; // Frequency of mLoot deposits to allow a draw to be triggered
    uint256 public drawCount = 1;

    event Deposit(address indexed user, uint256 mLootId);

    constructor() {
        mLootContract = IERC721Enumerable(mLootContractAddress);
    }

    function _deposit(uint256 mLootId) internal {
        require(mLootId >= mLootIdStart && mLootId <= mLootIdEnd, "mLoot not within range");

        mLootContract.transferFrom(_msgSender(), address(this), mLootId);

        depositInfo.push(DepositInfo(_msgSender(), mLootId));
    }

    function mLootDeposit(uint256 mLootId) external payable nonReentrant{
        require(depositPrice == msg.value, "Ether value sent is not correct");
        _deposit(mLootId);
        emit Deposit(_msgSender(), mLootId);
    }

    function mLootMultiDeposit(uint256[] memory mLootId) external payable nonReentrant{
        require(depositPrice * mLootId.length == msg.value, "Ether value sent is not correct");
        for (uint256 i = 0; i < mLootId.length; i++){
            _deposit(mLootId[i]);
            emit Deposit(_msgSender(), mLootId[i]);
        }
    }

    function random(string memory input) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(input)));
    }

    function drawWinner() external nonReentrant{
        require(mLootContract.balanceOf(address(this)) >= (drawSize * drawCount), "Insufficient number of mLoots deposited to draw");
        drawCount += 1;

        uint256 rand = random(string(abi.encodePacked(_msgSender(), mLootContract.tokenByIndex(mLootContract.balanceOf(address(this))))));

        address winner = depositInfo[rand % depositInfo.length].depositor;

        payable(winner).transfer(address(this).balance / 2);        
    }





}