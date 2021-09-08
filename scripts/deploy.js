const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    // We get the contract to deploy   
    const xLootContract = await ethers.getContractFactory("extensionLoot");
    const xLoot = await xLootContract.deploy();
  
    console.log("xLoot deployed to:", xLoot.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });