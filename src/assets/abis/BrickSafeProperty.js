import { ethers } from "ethers";
import BrickSafeProperty from './BrickSafeProperty.json';

export default (signerOrProvider, address) => {
    return new ethers.Contract(address, BrickSafeProperty.abi, signerOrProvider);
};