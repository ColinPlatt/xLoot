const { expect } = require("chai");

// use(solidity);

// Advance 1 block and 13s of time
// Altered version from @openzeppelin/test-helpers, to work with ethers rather than web3
function advanceBlock () {
    ethers.provider.send("evm_increaseTime", [13])   // add 13 seconds
    ethers.provider.send("evm_mine", [])      // mine the next block
}

// Advance the block to the specified height
// Altered version from @openzeppelin/test-helpers, to work with ethers rather than web3
async function advanceBlockTo (target) {
    const currentBlock = (await ethers.provider.getBlockNumber());
    const start = Date.now();
    let notified;
    if (target < currentBlock) throw Error(`Target block #(${target}) is lower than current block #(${currentBlock})`);
    if (target === currentBlock) throw Error(`Target block #(${target}) is equal to current block #(${currentBlock})`);
    while ((await ethers.provider.getBlockNumber()) < target) {
        if (!notified && Date.now() - start >= 5000) {
        notified = true;
        console.log(`Advancing too many blocks is causing this test to be slow.`);
        }
        await advanceBlock();
    }
}

// Advance the block a specified number of blocks
// Altered version from @openzeppelin/test-helpers, to work with ethers rather than web3
async function advanceBlocks (blocks) {
    const currentBlock = (await ethers.provider.getBlockNumber());
    const start = Date.now();
    let notified;
    let i;
    while (await i < blocks) {
        if (!notified && blocks >= 5000) {
        notified = true;
        console.log(`Advancing too many blocks is causing this test to be slow.`);
        }
        await advanceBlock();
        i++;
    }
}



describe("We should be able to deploy and initiate the contracts", function() {
  
  let deployer;
  let alice;
  let bob;
  let carol;

 
  beforeEach("Deploy and initialize mLoot and mLootSweeper contract before each test ",async function() {
    [deployer, alice, bob, carol] = await ethers.getSigners();

    const xLootContract = await ethers.getContractFactory("extensionLoot");
    xLoot = await xLootContract.deploy();
    await xLoot.deployed();

    for(i=8001; i<8011; i++) {
      xLoot.connect(alice).claim(i);
    }

    const LootContract = await ethers.getContractFactory("Loot");
    Loot = await LootContract.deploy();
    await Loot.deployed();

    for(i=1; i<11; i++) {
      Loot.connect(carol).claim(i);
    }

    const PlatinumContract = await ethers.getContractFactory("PlatinumToken");
    platinum = await PlatinumContract.deploy();
    await platinum.deployed();

    const DistributorContract = await ethers.getContractFactory("PlatinumDistributor");
    distributor = await DistributorContract.deploy(platinum.address);
    await distributor.deployed();

    await platinum.transferOwnership(distributor.address);

    await distributor.addDistributableContract(xLoot.address, 8001, 16000, 100, false);

  });


  it("It should set the owner correctly for Platinum and allow the deployer add a contract for claims", async function() {
    expect(await platinum.owner()).to.equal(await distributor.address);
    
    expect(await distributor._getDistributableIdLBound(xLoot.address)).to.equal(8001);
    expect(await distributor._getDistributableIdUBound(xLoot.address)).to.equal(16000);
    expect(await distributor._getDistributableTokenPerNFT(xLoot.address)).to.equal(100);
    expect(await distributor._getDistributableBurnForDistribution(xLoot.address)).to.equal(false);
  });

  it("It should allow an eligible ERC721 holder to claim without a burn", async function() {
    await distributor.connect(alice).claimSingle(xLoot.address, 8001);

    expect(await platinum.balanceOf(alice.address)).to.equal(100);
  });

  it("It should allow an eligible ERC721 holder to claim a burn", async function() {
    await distributor.addDistributableContract(Loot.address, 1, 8000, 100, true);
    await Loot.connect(carol).setApprovalForAll(distributor.address, true);
    await distributor.connect(carol).claimSingle(Loot.address, 1);

    expect(await platinum.balanceOf(carol.address)).to.equal(100);
    expect(await Loot.balanceOf(carol.address)).to.equal(9);
  });

  it("It should not allow an ineligible ERC721 holder to claim", async function() {
    
    await expect(distributor.connect(carol).claimSingle(Loot.address, 1)).to.be.revertedWith("This NFT is not eligible for distribution");

    xLoot.connect(carol).claim(8012);
    await expect(distributor.connect(alice).claimSingle(xLoot.address, 8012)).to.revertedWith("The caller is not the owner of this token");

    await distributor.addDistributableContract(Loot.address, 1, 1, 100, false);
    await expect(distributor.connect(carol).claimSingle(Loot.address, 2)).to.revertedWith("This NFT is not in range");
    
    await distributor.connect(alice).claimSingle(xLoot.address, 8001);
    expect(await platinum.balanceOf(alice.address)).to.equal(100);
    await expect(distributor.connect(alice).claimSingle(xLoot.address, 8001)).to.revertedWith("This NFT has already claimed its distribution");

  });

  it("It should allow an eligible ERC721 holder to do multi claims", async function() {
    await distributor.connect(alice).claimMulti(xLoot.address, [8001,8002,8003]);

    expect(await platinum.balanceOf(alice.address)).to.equal(300);

    await distributor.addDistributableContract(Loot.address, 1, 8000, 100, true);
    await Loot.connect(carol).setApprovalForAll(distributor.address, true);
    await distributor.connect(carol).claimMulti(Loot.address, [1,2,3,4]);

    expect(await platinum.balanceOf(carol.address)).to.equal(400);
    expect(await Loot.balanceOf(carol.address)).to.equal(6);
  });






});