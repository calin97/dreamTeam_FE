import { ethers } from "ethers";
import MockToken from './mockTokenContract.json';

export default (signerOrProvider, address) => {
    return new ethers.Contract(address, MockToken.abi, signerOrProvider);
}