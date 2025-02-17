import *  as fs from 'fs'
import * as path from 'path'

import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import 'hardhat-abi-exporter'
import 'hardhat-contract-sizer'
import 'hardhat-gas-reporter'
import 'hardhat-typechain'
import 'solidity-coverage'
import 'hardhat-deploy'
import { task, types } from 'hardhat/config'
import { TASK_TEST } from 'hardhat/builtin-tasks/task-names'
import { TaskArguments, HardhatRuntimeEnvironment, RunSuperFunction } from 'hardhat/types'

// REQUIRED TO ENSURE METADATA IS SAVED IN DEPLOYMENTS (because solidity-coverage disable it otherwise)
/* import {
  TASK_COMPILE_GET_COMPILER_INPUT
} from "hardhat/builtin-tasks/task-names"
task(TASK_COMPILE_GET_COMPILER_INPUT).setAction(async (_, bre, runSuper) => {
  const input = await runSuper()
  input.settings.metadata.useLiteralContent = bre.network.name !== "coverage"
  return input
}) */

task("lint:collisions", "Checks all contracts for function signatures collisions with ROOT (0x00000000) and LOCK (0xffffffff)",
  async (taskArguments, hre, runSuper) => {
    let ROOT = "0x00000000"
    let LOCK = "0xffffffff"
    const abiPath = path.join(__dirname, 'abi')
    for (let contract of fs.readdirSync(abiPath)) {
      const iface = new hre.ethers.utils.Interface(require(abiPath + "/" + contract))
      for (let func in iface.functions) {
        const sig = iface.getSighash(func)
        if (sig == ROOT) {
          console.error("Function " + func + " of contract " + contract.slice(0, contract.length - 5) + " has a role-colliding signature with ROOT.")
        }
        if (sig == LOCK) {
          console.error("Function " + func + " of contract " + contract.slice(0, contract.length - 5) + " has a role-colliding signature with LOCK.")
        }
      }
    }
    console.log("No collisions, check passed.")
  }
)

// This hook enables debugging during test runs by appending the `--debug` flag to the test command (`yarn test --debug`) and using `debugLog()` (instead of `console.log()`).
task(TASK_TEST).addFlag("debug", "Enable debugging logs").setAction(
  async (args: TaskArguments, hre: HardhatRuntimeEnvironment, runSuper: RunSuperFunction<TaskArguments>) => {
    process.env.DEBUG = args?.["debug"]
    delete args?.["debug"]
    await runSuper(args);
  }
)


function nodeUrl(network: any) {
  let infuraKey
  try {
    infuraKey = fs.readFileSync(path.resolve(__dirname, '.infuraKey')).toString().trim()
  } catch(e) {
    infuraKey = ''
  }
  return `https://${network}.infura.io/v3/${infuraKey}`
}

let mnemonic = process.env.MNEMONIC
if (!mnemonic) {
  try {
    mnemonic = fs.readFileSync(path.resolve(__dirname, '.secret')).toString().trim()
  } catch(e){}
}
const accounts = mnemonic ? {
  mnemonic,
}: undefined

let etherscanKey = process.env.ETHERSCANKEY
if (!etherscanKey) {
  try {
    etherscanKey = fs.readFileSync(path.resolve(__dirname, '.etherscanKey')).toString().trim()
  } catch(e){}
}

module.exports = {
  solidity: {
    version: '0.8.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 1500,
      }
    }
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  abiExporter: {
    path: './abi',
    clear: true,
    flat: true,
    spacing: 2
  },
  contractSizer: {
    alphaSort: true,
    runOnCompile: false,
    disambiguatePaths: false,
  },
  gasReporter: {
    enabled: true,
  },
  defaultNetwork: 'hardhat',
  namedAccounts: {
    deployer: 0,
    owner: 1,
    other: 2,
  },
  networks: {
    kovan: {
      accounts,
      url: nodeUrl('kovan')
    },
    goerli: {
      accounts,
      url: nodeUrl('goerli'),
    },
    rinkeby: {
      accounts,
      url: nodeUrl('rinkeby')
    },
    ropsten: {
      accounts,
      url: nodeUrl('ropsten')
    },
    mainnet: {
      accounts,
      url: nodeUrl('mainnet')
    },
    coverage: {
      url: 'http://127.0.0.1:8555',
    },
  },
  etherscan: {
    apiKey: etherscanKey
  },
}
