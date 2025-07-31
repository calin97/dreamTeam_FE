import { ethers } from "ethers";
import MockUSDT from './MockUSDT.json';

export default (signerOrProvider, address) => {
    return new ethers.Contract(address, MockUSDT.abi, signerOrProvider);
}