import { ethers } from "ethers";
import SomeContract from './mockContract.json';

export default (signerOrProvider, address) => {
    return new ethers.Contract(address, SomeContract.abi, signerOrProvider);
};