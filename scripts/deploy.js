const { ethers } = require("hardhat");
//const { hre } = require("@nomiclabs/hardhat-etherscan");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    // We get the contracts to deploy 
    // xLoot first
    const xLootContract = await ethers.getContractFactory("extensionLoot");
    const xLoot = await xLootContract.deploy();
  
    console.log("xLoot deployed to: ", xLoot.address);

    // now OG Loot
    const LootContract = await ethers.getContractFactory("Loot");
    const Loot = await LootContract.deploy();
  
    console.log("Loot deployed to: ", Loot.address);

    // then do Platinum
    const platTokenContract = await ethers.getContractFactory("PlatinumToken");
    const Plat = await platTokenContract.deploy();
  
    console.log("$PLAT deployed to: ", Plat.address);

    // Then deploy PlatDistributor
    const platDistributorContract = await ethers.getContractFactory("PlatinumDistributor");
    const distributor = await platDistributorContract.deploy(Plat.address);
  
    console.log("PlatDistributor deployed to: ", distributor.address);

    // And now we transfer ownership of $PLAT to the distributor
    await Plat.transferOwnership(distributor.address);

    console.log("Ownership of $PLAT: ", await Plat.owner());

    // Finally we log xLoot as as a distributable
    await distributor.addDistributableContract(xLoot.address, 8001, 16000, "10000000000000000000000", false);

  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });