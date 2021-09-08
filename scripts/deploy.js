const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
    
    // We get the contract to deploy   
    const mLootContract = await ethers.getContractFactory("TemporalLoot");
    const mLoot = await mLootContract.deploy();
  
    console.log("mLoot deployed to:", mLoot.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });