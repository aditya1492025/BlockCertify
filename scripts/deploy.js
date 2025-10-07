const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Deploy UserManagement contract
    console.log("\nDeploying UserManagement contract...");
    const UserManagement = await ethers.getContractFactory("UserManagement");
    const userManagement = await UserManagement.deploy();
    await userManagement.deployed();
    console.log("UserManagement deployed to:", userManagement.address);

    // Deploy CertificateRegistry contract
    console.log("\nDeploying CertificateRegistry contract...");
    const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    const certificateRegistry = await CertificateRegistry.deploy();
    await certificateRegistry.deployed();
    console.log("CertificateRegistry deployed to:", certificateRegistry.address);

    // Save contract addresses and ABIs
    const deploymentInfo = {
        network: network.name,
        chainId: network.config.chainId,
        deployer: deployer.address,
        contracts: {
            UserManagement: {
                address: userManagement.address,
                constructorArgs: []
            },
            CertificateRegistry: {
                address: certificateRegistry.address,
                constructorArgs: []
            }
        },
        deployedAt: new Date().toISOString()
    };

    // Write deployment info to file
    const fs = require("fs");
    const path = require("path");
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Write deployment info
    const deploymentPath = path.join(deploymentsDir, `${network.name}.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\nDeployment info saved to:", deploymentPath);

    // Copy ABIs to backend
    const backendDir = path.join(__dirname, "..", "backend", "contracts");
    if (!fs.existsSync(backendDir)) {
        fs.mkdirSync(backendDir, { recursive: true });
    }

    // Copy contract ABIs
    const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
    
    // Copy UserManagement ABI
    const userManagementABI = require(path.join(artifactsDir, "UserManagement.sol", "UserManagement.json"));
    fs.writeFileSync(
        path.join(backendDir, "UserManagement.json"),
        JSON.stringify(userManagementABI, null, 2)
    );

    // Copy CertificateRegistry ABI
    const certificateRegistryABI = require(path.join(artifactsDir, "CertificateRegistry.sol", "CertificateRegistry.json"));
    fs.writeFileSync(
        path.join(backendDir, "CertificateRegistry.json"),
        JSON.stringify(certificateRegistryABI, null, 2)
    );

    console.log("Contract ABIs copied to backend/contracts/");

    console.log("\n=== Deployment Summary ===");
    console.log("Network:", network.name);
    console.log("Chain ID:", network.config.chainId);
    console.log("Deployer:", deployer.address);
    console.log("UserManagement:", userManagement.address);
    console.log("CertificateRegistry:", certificateRegistry.address);
    console.log("============================");

    // Verify contracts on Etherscan (only for testnets/mainnet)
    if (network.name !== "hardhat" && network.name !== "localhost") {
        console.log("\nWaiting for block confirmations...");
        await userManagement.deployTransaction.wait(6);
        await certificateRegistry.deployTransaction.wait(6);

        console.log("Verifying contracts on Etherscan...");
        try {
            await hre.run("verify:verify", {
                address: userManagement.address,
                constructorArguments: [],
            });
            console.log("UserManagement verified");
        } catch (error) {
            console.log("UserManagement verification failed:", error.message);
        }

        try {
            await hre.run("verify:verify", {
                address: certificateRegistry.address,
                constructorArguments: [],
            });
            console.log("CertificateRegistry verified");
        } catch (error) {
            console.log("CertificateRegistry verification failed:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });