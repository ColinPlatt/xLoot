/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require ('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {

    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      loggingEnabled: true
    },
    rinkeby: {
      url: `${process.env.INFURA_RINKEBY_ADDR}`,
      accounts: {
          mnemonic: `${process.env.WALLET_MNEMONIC}`,
          path: "m/44'/60'/0'/0/0",
      }
    },
    goerli: {
      url: `${process.env.INFURA_GOERLI_ADDR}`,
      accounts: {
          mnemonic: `${process.env.WALLET_MNEMONIC}`,
          path: "m/44'/60'/0'/0/0",
      }
    }
  },

  solidity: {
    compilers: [
      {
        version: "0.8.4"
      },
    ]
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_PRIVATE_KEY,
  }

};
