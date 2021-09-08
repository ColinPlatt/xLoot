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



describe("We should be able to deploy and initiate the mLootSweeper contract", function() {
  
  let ownerMLoot;
  let alice;
  let bob;
  let carol;

 
  beforeEach("Deploy and initialize mLoot and mLootSweeper contract before each test ",async function() {
    [ownerMLoot, alice, bob, carol] = await ethers.getSigners();

    const TemporalLootContract = await ethers.getContractFactory("TemporalLoot");
    mLoot = await TemporalLootContract.deploy();
    await mLoot.deployed();

    expect(await mLoot.totalSupply()).to.equal(0);

    mLoot.connect(alice).claim(8001);

    for (let i = 8001; i < 8102; i = i + 50){
      let claimArr = Array();
      for (let j=1; j <= 50; j++) {
        claimArr.push(i+j);
      }
      mLoot.connect(alice).multiClaim(claimArr);
    }
    
    for (let i = 8151; i < 8452; i = i + 50){
      let claimArr = Array();
      for (let j=1; j <= 50; j++) {
        claimArr.push(i+j);
      }
      mLoot.connect(bob).multiClaim(claimArr);
    }
    
    for (let i = 15501; i < 16000; i = i + 50){
      let claimArr = Array();
      for (let j=1; j <= 50; j++) {
        claimArr.push(i+j);
      }
      mLoot.connect(carol).multiClaim(claimArr);
    }

    const mLootSweeperContract = await ethers.getContractFactory("mLootSweeper");
    mLootSweeper = await mLootSweeperContract.deploy(mLoot.address);
    await mLootSweeper.deployed();


    expect(await ethers.provider.getBalance(mLootSweeper.address)).to.equal(0);
    

  });

  it("It should set the mLoot address correctly", async function() {
    expect(await mLootSweeper.mLootContract()).to.equal(await mLoot.address);
  });

  it("It should allow users to deposit mLoots in range", async function() {  
    let overrides = {value: ethers.utils.parseEther("0.005")};
    
    await mLoot.connect(alice).setApprovalForAll(mLootSweeper.address, "true");
    await mLootSweeper.connect(alice).mLootDeposit(8001, overrides);
    
    expect(await mLoot.balanceOf(alice.address)).to.equal(150);
    expect(await mLoot.balanceOf(mLootSweeper.address)).to.equal(1);
    expect(await ethers.utils.formatEther(await ethers.provider.getBalance(mLootSweeper.address))).to.equal("0.005");
  });

  it("It should allow users to deposit multiple mLoots in range", async function() {  
    let overrides = {value: ethers.utils.parseEther("0.015")};
    
    await mLoot.connect(bob).setApprovalForAll(mLootSweeper.address, "true");
    await mLootSweeper.connect(bob).mLootMultiDeposit([8152,8153,8154], overrides);
    
    expect(await mLoot.balanceOf(bob.address)).to.equal(347);
    expect(await mLoot.balanceOf(mLootSweeper.address)).to.equal(3);
    expect(await ethers.utils.formatEther(await ethers.provider.getBalance(mLootSweeper.address))).to.equal("0.015");
  });

  it("It should NOT allow users to deposit mLoots out of range", async function() {  
    let overrides = {value: ethers.utils.parseEther("0.01")};
    
    await mLoot.connect(carol).setApprovalForAll(mLootSweeper.address, "true");
    await expect(mLootSweeper.connect(carol).mLootDeposit(16001, overrides)).to.be.revertedWith('mLoot not within range');
    
    expect(await mLoot.balanceOf(mLootSweeper.address)).to.equal(0);
  });

  it("It should NOT allow users to call pickWinner unless deposit threshold has been met", async function() {  
    let overrides = {value: ethers.utils.parseEther("0.03")};
    await mLoot.connect(bob).setApprovalForAll(mLootSweeper.address, "true");
    await mLootSweeper.connect(bob).mLootMultiDeposit([8152,8153,8154], overrides);
    await expect(mLootSweeper.connect(carol).pickWinner()).to.be.revertedWith('Insufficient number of mLoots deposited to draw');
  });

  it("It should allow users to call pickWinner once deposit threshold has been met", async function() {  
    await mLoot.connect(alice).setApprovalForAll(mLootSweeper.address, "true");
    await mLoot.connect(bob).setApprovalForAll(mLootSweeper.address, "true");

    let mLootIds = new Array(0);

    for(i=8152;i<8253;i++){
      mLootIds.push(i);
    }

    await mLootSweeper.connect(bob).mLootMultiDeposit(mLootIds, {value: ethers.utils.parseEther("1.01")});
    await mLootSweeper.connect(alice).mLootDeposit(8001, {value: ethers.utils.parseEther("0.01")});
    await mLootSweeper.connect(carol).pickWinner();
    expect(await mLoot.balanceOf(mLootSweeper.address)).to.equal(102);
    expect(await ethers.utils.formatEther(await ethers.provider.getBalance(mLootSweeper.address))).to.equal("0.51");
    expect(await mLootSweeper.drawCount()).to.equal(2);
  });




});