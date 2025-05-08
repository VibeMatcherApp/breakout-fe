import { ethers } from 'ethers';

// RIZZ Token Contract ABI (only includes functions we need)
export const RIZZ_ABI = [
    // Basic ERC20 functions
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    // Custom functions
    "function register() public",
    "function isRegistered(address user) public view returns (bool)"
];

// Contract address (to be filled after deployment)
export const RIZZ_CONTRACT_ADDRESS = "0x7B7E367B6F328F16cfe61336928908cc91289353";

// Get contract instance
export const getRizzContract = (provider: ethers.providers.Web3Provider) => {
    const signer = provider.getSigner();
    // Get contract directly using field access
    return new ethers.Contract(
        RIZZ_CONTRACT_ADDRESS,
        RIZZ_ABI,
        signer
    );
};

