"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CREATE2_DEPLOYER_ADDRESS = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const config_1 = require("hardhat/config");
const config_2 = require("./config");
const networks_1 = require("./networks");
const constants_1 = require("./constants");
Object.defineProperty(exports, "CREATE2_DEPLOYER_ADDRESS", { enumerable: true, get: function () { return constants_1.CREATE2_DEPLOYER_ADDRESS; } });
require("./type-extensions");
const Create2Deployer_json_1 = __importDefault(require("./abi/Create2Deployer.json"));
const ethers_1 = require("ethers");
const plugins_1 = require("hardhat/plugins");
require("@nomiclabs/hardhat-ethers");
(0, config_1.extendConfig)(config_2.xdeployConfigExtender);
(0, config_1.task)("xdeploy", "Deploys the contract across all predefined networks").setAction(async ({ contract, constructorArgs }, hre) => {
    console.log(`Deployment of ${contract} through xdeployer starting now !`);
    await hre.run(constants_1.TASK_VERIFY_NETWORK_ARGUMENTS);
    await hre.run(constants_1.TASK_VERIFY_SUPPORTED_NETWORKS);
    await hre.run(constants_1.TASK_VERIFY_EQUAL_ARGS_NETWORKS);
    await hre.run(constants_1.TASK_VERIFY_SALT);
    await hre.run(constants_1.TASK_VERIFY_SIGNER);
    await hre.run(constants_1.TASK_VERIFY_CONTRACT, { contract });
    await hre.run(constants_1.TASK_VERIFY_GASLIMIT);
    await hre.run(constants_1.TASK_VERIFY_DEPLOYER_ADDRESS);
    await hre.run("compile");
    if (hre.config.xdeploy.rpcUrls && hre.config.xdeploy.networks) {
        const providers = [];
        const wallets = [];
        const signers = [];
        const create2Deployer = [];
        const createReceipt = [];
        const result = [];
        let initcode;
        const Contract = await hre.ethers.getContractFactory(contract);
        if (constructorArgs && contract) {
            initcode = await Contract.getDeployTransaction(...constructorArgs);
        }
        else if (!constructorArgs && contract) {
            initcode = await Contract.getDeployTransaction();
        }
        for (let i = 0; i < hre.config.xdeploy.rpcUrls.length; i++) {
            providers[i] = new hre.ethers.providers.JsonRpcProvider(hre.config.xdeploy.rpcUrls[i]);
            if (hre.config.xdeploy.networks[i] === "celo") {
                const originalBlockFormatter = providers[i].formatter._block;
                providers[i].formatter._block = (value, format) => {
                    return originalBlockFormatter({
                        gasLimit: ethers_1.constants.Zero,
                        ...value,
                    }, format);
                };
            }
            wallets[i] = new hre.ethers.Wallet(hre.config.xdeploy.signer, providers[i]);
            signers[i] = wallets[i].connect(providers[i]);
            let computedContractAddress;
            if (hre.config.xdeploy.networks[i] !== "hardhat" &&
                hre.config.xdeploy.networks[i] !== "localhost") {
                if (!hre.config.xdeploy.deployerAddress) {
                    throw new Error("Deployer address undefined");
                }
                create2Deployer[i] = new hre.ethers.Contract(hre.config.xdeploy.deployerAddress, Create2Deployer_json_1.default, signers[i]);
                if (hre.config.xdeploy.salt) {
                    try {
                        computedContractAddress = await create2Deployer[i].computeAddress(hre.ethers.utils.id(hre.config.xdeploy.salt), hre.ethers.utils.keccak256(initcode.data));
                      }
                    catch (err) {
                        throw new Error("Contract address could not be computed, check your contract name and arguments");
                    }
                    try {
                        createReceipt[i] = await create2Deployer[i].deploy(constants_1.AMOUNT, hre.ethers.utils.id(hre.config.xdeploy.salt), initcode.data, { gasLimit: hre.config.xdeploy.gasLimit });
                        createReceipt[i] = await createReceipt[i].wait();
                        result[i] = {
                            network: hre.config.xdeploy.networks[i],
                            contract: contract,
                            address: computedContractAddress,
                            receipt: createReceipt[i],
                            deployed: true,
                            error: undefined,
                        };
                    }
                    catch (err) {
                        result[i] = {
                            network: hre.config.xdeploy.networks[i],
                            contract: contract,
                            address: computedContractAddress,
                            receipt: undefined,
                            deployed: false,
                            error: err,
                        };
                    }
                }
            }
            else if (hre.config.xdeploy.networks[i] === "hardhat" ||
                hre.config.xdeploy.networks[i] === "localhost") {
                const hhcreate2Deployer = await hre.ethers.getContractFactory("Create2DeployerLocal");
                create2Deployer[i] = await hhcreate2Deployer.deploy();
                if (hre.config.xdeploy.salt) {
                    try {
                        computedContractAddress = await create2Deployer[i].computeAddress(hre.ethers.utils.id(hre.config.xdeploy.salt), hre.ethers.utils.keccak256(initcode.data));
                    }
                    catch (err) {
                        throw new Error("Contract address could not be computed, check your contract name and arguments");
                    }
                    try {
                        createReceipt[i] = await create2Deployer[i].deploy(constants_1.AMOUNT, hre.ethers.utils.id(hre.config.xdeploy.salt), initcode.data, { gasLimit: hre.config.xdeploy.gasLimit });
                        createReceipt[i] = await createReceipt[i].wait();
                        result[i] = {
                            network: hre.config.xdeploy.networks[i],
                            contract: contract,
                            address: computedContractAddress,
                            receipt: createReceipt[i],
                            deployed: true,
                            error: undefined,
                        };
                    }
                    catch (err) {
                        result[i] = {
                            network: hre.config.xdeploy.networks[i],
                            contract: contract,
                            address: computedContractAddress,
                            receipt: undefined,
                            deployed: false,
                            error: err,
                        };
                    }
                }
            }
        }
        return result;
    }
});
(0, config_1.subtask)(constants_1.TASK_VERIFY_NETWORK_ARGUMENTS).setAction(async (_, hre) => {
    if (!hre.config.xdeploy.networks ||
        hre.config.xdeploy.networks.length === 0) {
        throw new plugins_1.NomicLabsHardhatPluginError(constants_1.PLUGIN_NAME, `Please provide at least one deployment network via the hardhat config.
        E.g.: { [...], xdeploy: { networks: ["rinkeby", "kovan"] }, [...] }
        The current supported networks are ${networks_1.networks}.`);
    }
});
(0, config_1.subtask)(constants_1.TASK_VERIFY_DEPLOYER_ADDRESS).setAction(async (_, hre) => {
    if (!hre.config.xdeploy.deployerAddress ||
        hre.config.xdeploy.deployerAddress === "" ||
        !hre.ethers.utils.isAddress(hre.config.xdeploy.deployerAddress)) {
        throw new plugins_1.NomicLabsHardhatPluginError(constants_1.PLUGIN_NAME, `The deployer contract address that you specified `);
    }
});
(0, config_1.subtask)(constants_1.TASK_VERIFY_SUPPORTED_NETWORKS).setAction(async (_, hre) => {
    const unsupported = hre?.config?.xdeploy?.networks?.filter((v) => !networks_1.networks.includes(v));
    if (hre.config.xdeploy.deployerAddress === constants_1.CREATE2_DEPLOYER_ADDRESS &&
        unsupported &&
        unsupported.length > 0) {
        throw new plugins_1.NomicLabsHardhatPluginError(constants_1.PLUGIN_NAME, `You have tried to configure a network that this plugin does not yet support,
      or you have misspelled the network name. The currently supported networks are
      ${networks_1.networks}.`);
    }
});
(0, config_1.subtask)(constants_1.TASK_VERIFY_EQUAL_ARGS_NETWORKS).setAction(async (_, hre) => {
    if (hre.config.xdeploy.networks &&
        hre.config.xdeploy.rpcUrls &&
        hre.config.xdeploy.rpcUrls.length !== hre.config.xdeploy.networks.length) {
        throw new plugins_1.NomicLabsHardhatPluginError(constants_1.PLUGIN_NAME, `The parameters "network" and "rpcUrls" do not have the same length.
      Please ensure that both parameters have the same length, i.e. for each
      network there is a corresponding rpcUrls entry.`);
    }
});
(0, config_1.subtask)(constants_1.TASK_VERIFY_SALT).setAction(async (_, hre) => {
    if (!hre.config.xdeploy.salt || hre.config.xdeploy.salt === "") {
        throw new plugins_1.NomicLabsHardhatPluginError(constants_1.PLUGIN_NAME, `Please provide an arbitrary value as salt.
      E.g.: { [...], xdeploy: { salt: "WAGMI" }, [...] }.`);
    }
});
(0, config_1.subtask)(constants_1.TASK_VERIFY_SIGNER).setAction(async (_, hre) => {
    if (!hre.config.xdeploy.signer || hre.config.xdeploy.signer === "") {
        throw new plugins_1.NomicLabsHardhatPluginError(constants_1.PLUGIN_NAME, `Please provide a signer private key. We recommend using a .env file.
      See https://www.npmjs.com/package/dotenv.
      E.g.: { [...], xdeploy: { signer: process.env.PRIVATE_KEY }, [...] }.`);
    }
});
(0, config_1.subtask)(constants_1.TASK_VERIFY_CONTRACT).setAction(async ({ contract }) => {
    if (!contract || contract === "") {
        throw new plugins_1.NomicLabsHardhatPluginError(constants_1.PLUGIN_NAME, `Please specify the contract name of the smart contract to be deployed.
      E.g.: { [...], xdeploy: { contract: "ERC20" }, [...] }.`);
    }
});
(0, config_1.subtask)(constants_1.TASK_VERIFY_GASLIMIT).setAction(async (_, hre) => {
    if (hre.config.xdeploy.gasLimit &&
        hre.config.xdeploy.gasLimit > 15 * 10 ** 6) {
        throw new plugins_1.NomicLabsHardhatPluginError(constants_1.PLUGIN_NAME, `Please specify a lower gasLimit. Each block has currently 
      a target size of 15 million gas.`);
    }
});
//# sourceMappingURL=index.js.map