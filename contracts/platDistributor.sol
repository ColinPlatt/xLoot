// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "contracts/PlatinumToken.sol";

contract PlatinumDistributor is Context, Ownable, ReentrancyGuard, ERC721Holder {
   
    struct DistributablePool{
        uint256 lBoundId; // first ID eligible for token distributions; default to 0, all Ids accepted
        uint256 uBoundId; // last ID eligible for token distributions; default to 0, all Ids accepted
        uint256 tokenPerNFT;  // number of tokens available per claim per ID in list, must not be zero or entry will be considered deleted
        bool burnForDistribution; // flag whether the owner of a specific ID must transfer their ERC721 to this contract (burn) to claim distribution
    }

    mapping(address => DistributablePool) public distributablePools; //contract addresses for ERC721 eligible for token distributions

    uint256 public season = 0;

    PlatinumToken public platinumToken;

    // claimedByTokenId[season][eligibleERC721][tokenId][claimed]
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public claimedByTokenId;

    constructor(
        PlatinumToken _platinumToken
    ){
        platinumToken = _platinumToken;
    }


    // putting in a bunch of view only functions for testing

    function _getDistributableIdLBound(address contractERC721) public view returns(uint256) {
        // check that contract is in struct
        require(distributablePools[contractERC721].tokenPerNFT > 0, "This NFT is not eligible for distribution");

        return distributablePools[contractERC721].lBoundId;

    }

    function _getDistributableIdUBound(address contractERC721) public view returns(uint256) {
        // check that contract is in struct
        require(distributablePools[contractERC721].tokenPerNFT > 0, "This NFT is not eligible for distribution");

        return distributablePools[contractERC721].uBoundId;

    }

    function _getDistributableTokenPerNFT(address contractERC721) public view returns(uint256) {
        // check that contract is in struct
        require(distributablePools[contractERC721].tokenPerNFT > 0, "This NFT is not eligible for distribution");

        return distributablePools[contractERC721].tokenPerNFT;

    }

    function _getDistributableBurnForDistribution(address contractERC721) public view returns(bool) {
        // check that contract is in struct
        require(distributablePools[contractERC721].tokenPerNFT > 0, "This NFT is not eligible for distribution");

        return distributablePools[contractERC721].burnForDistribution;

    }

    function addDistributableContract(address _eligibleERC721, uint256 _lBoundId, uint256 _uBoundId, uint256 _tokenPerNFT, bool _burnForDistribution) external onlyOwner {
        require(IERC721(_eligibleERC721).supportsInterface(0x80ac58cd), "This does not appear to be a valid ERC721 contract");

        distributablePools[_eligibleERC721] = DistributablePool(
            {
                lBoundId : _lBoundId,
                uBoundId : _uBoundId,
                tokenPerNFT : _tokenPerNFT,
                burnForDistribution : _burnForDistribution
            }
        );

    }

    function iterateSeason() external onlyOwner {
        season += 1;
    }

    function claimSingle(address contractERC721, uint256 tokenId) external nonReentrant {
        DistributablePool storage eligibleNFTData = distributablePools[contractERC721];
        
        // check that the token has not claimed previously
        require(!claimedByTokenId[season][contractERC721][tokenId], "This NFT has already claimed its distribution");

        // check that contract is in struct
        require(eligibleNFTData.tokenPerNFT > 0, "This NFT is not eligible for distribution");

        // check that id is in range
        uint256 _tempUBoundId = eligibleNFTData.uBoundId;
        if (eligibleNFTData.uBoundId == 0){
            _tempUBoundId = IERC721Enumerable(contractERC721).totalSupply();
        }
        require(eligibleNFTData.lBoundId <= tokenId && _tempUBoundId >= tokenId, "This NFT is not in range");

        // check that owner has token
        require(_msgSender() == IERC721Enumerable(contractERC721).ownerOf(tokenId), "The caller is not the owner of this token");
        
        _claim(contractERC721, tokenId, _msgSender(), eligibleNFTData.tokenPerNFT, eligibleNFTData.burnForDistribution);

    }

    function claimMulti(address contractERC721, uint256[] memory tokenId) external nonReentrant {
        DistributablePool storage eligibleNFTData = distributablePools[contractERC721];
        
        // check that contract is in struct
        require(eligibleNFTData.tokenPerNFT > 0, "This NFT is not eligible for distribution");

        uint256 _tempUBoundId = eligibleNFTData.uBoundId;
            if (eligibleNFTData.uBoundId == 0){
                _tempUBoundId = IERC721Enumerable(contractERC721).totalSupply();
        }

        for (uint256 i = 0; i < tokenId.length; i++) {

            // check that the token has not claimed previously
            require(!claimedByTokenId[season][contractERC721][tokenId[i]], "This NFT has already claimed its distribution");

            // check that id is in range
            require(eligibleNFTData.lBoundId <= tokenId[i] && _tempUBoundId >= tokenId[i], "This NFT is not in range");

            // check that owner has token
            require(_msgSender() == IERC721Enumerable(contractERC721).ownerOf(tokenId[i]), "The caller is not the owner of this token");
            
            _claim(contractERC721, tokenId[i], _msgSender(), eligibleNFTData.tokenPerNFT, eligibleNFTData.burnForDistribution);
        }

    }

    function _claim(address _contractAddress, uint256 _tokenId, address _tokenOwner, uint256 _claimAmount, bool _burn) internal {
        
        if (_burn) {
            IERC721(_contractAddress).safeTransferFrom(_msgSender(), address(this), _tokenId);
        }
        
        claimedByTokenId[season][_contractAddress][_tokenId] = true;

        platinumToken.mint(_tokenOwner, _claimAmount);
    }

}