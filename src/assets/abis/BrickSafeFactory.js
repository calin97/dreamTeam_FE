import { ethers } from "ethers";
import BrickSafeFactory from './BrickSafeFactory.json';

export default (signerOrProvider, address) => {
    return new ethers.Contract(address, BrickSafeFactory.abi, signerOrProvider);
};