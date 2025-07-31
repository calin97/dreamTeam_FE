import { utils } from "ethers";
// import getBrickSafeFactoryContract from "../abis/getBrickSafeFactoryContract";
import getBrickSafeFactoryContract from "../abis/BrickSafeFactory";
import getBrickSafePropertyContract from "../abis/BrickSafeProperty";
import { toast } from "react-toastify";
// (opțional) toast

const USDT_DECIMALS = 6;

/**
 * Librărie pentru interacțiunea cu BrickSafeFactory și utilitare conexe.
 * signerOrProvider = provider (read) sau signer (tx).
 */
function hasFn(contract, signature) {
  // ex: 'globalId()' sau 'getAllPropertyInfo()'
  return !!contract.interface.functions[signature];
}

export default function frontendLibFactory() {
  // ---------- READS ----------
  async function totalProperties(signerOrProvider, factoryAddress) {
    const factory = getBrickSafeFactoryContract(signerOrProvider, factoryAddress);
    return await factory.totalProperties(); // BigNumber
  }

  async function getAllPropertyInfo(signerOrProvider, factoryAddress) {
    const factory = getBrickSafeFactoryContract(signerOrProvider, factoryAddress);

    // 1) Dacă există funcția agregată, o folosim direct
    if (hasFn(factory, "getAllPropertyInfo()")) {
      const all = await factory.getAllPropertyInfo();
      return all.map((p, i) => ({
        id: i,
        address: p.contractAddress,
        lister: p.lister,
        price: p.price, // BigNumber
        uri: p.uri,
      }));
    }

    // 2) Fallback: folosim totalProperties + allProperties(i) și citim din BrickSafeProperty
    const nBN = await factory.totalProperties();
    const n = nBN.toNumber();
    const out = [];

    for (let i = 0; i < n; i++) {
      const propertyAddr = await factory.allProperties(i);
      const prop = getBrickSafePropertyContract(signerOrProvider, propertyAddr);

      // BrickSafeProperty are getters publice:
      // price() -> uint256, propertyURI() -> string, seller() -> address
      const [price, uri, lister] = await Promise.all([
        prop.price(),
        prop.propertyURI(),
        prop.seller(),
      ]);

      out.push({
        id: i,
        address: propertyAddr,
        lister,
        price,   // BigNumber
        uri,
      });
    }
    return out;
  }

  async function propertiesOf(signerOrProvider, factoryAddress, lister) {
    const factory = getBrickSafeFactoryContract(signerOrProvider, factoryAddress);
    return await factory.propertiesOf(lister); // array de adrese
  }

  async function getLatest(signerOrProvider, factoryAddress) {
    const factory = getBrickSafeFactoryContract(signerOrProvider, factoryAddress);

    // dacă ai varianta cu globalId/propertyInfoById, o poți folosi:
    if (hasFn(factory, "globalId()") && hasFn(factory, "propertyInfoById(uint256)")) {
      const nBN = await factory.globalId();
      const n = nBN.toNumber();
      if (n === 0) return null;
      const info = await factory.propertyInfoById(n - 1);
      return {
        id: n - 1,
        address: info.contractAddress,
        lister: info.lister,
        price: info.price,
        uri: info.uri,
      };
    }

    // fallback: totalProperties + allProperties(last)
    const nBN = await factory.totalProperties();
    const n = nBN.toNumber();
    if (n === 0) return null;

    const addr = await factory.allProperties(n - 1);
    const prop = getBrickSafePropertyContract(signerOrProvider, addr);
    const [price, uri, lister] = await Promise.all([
      prop.price(),
      prop.propertyURI(),
      prop.seller(),
    ]);

    return { id: n - 1, address: addr, lister, price, uri };
  }

  // ---------- WRITES ----------
  async function createProperty(signer, factoryAddress, priceWhole, uri) {
    const factory = getBrickSafeFactoryContract(signer, factoryAddress);
    const price = utils.parseUnits(String(priceWhole), USDT_DECIMALS);

    const tx = await factory.createProperty(price, uri);
    const receipt = await tx.wait();

    let propertyAddress = null;
    for (const ev of receipt.events || []) {
      if (ev.event === "PropertyDeployed") {
        propertyAddress = ev.args && ev.args.property;
        break;
      }
    }

    toast?.success?.("Property created");
    return { propertyAddress, txHash: tx.hash };
  }

  // ---------- EVENTS ----------
  function onPropertyDeployed(signerOrProvider, factoryAddress, callback) {
    const factory = getBrickSafeFactoryContract(signerOrProvider, factoryAddress);
    const handler = (property, lister, price, uri, event) => {
      callback({ property, lister, price, uri, log: event });
    };
    factory.on("PropertyDeployed", handler);
    return () => factory.off("PropertyDeployed", handler);
  }

  // ---------- HELPERS ----------
  function getPropertyInstance(signerOrProvider, propertyAddress) {
    return getBrickSafePropertyContract(signerOrProvider, propertyAddress);
  }

  function errorHandling(error) {
    const msg =
      error?.error?.message
        ? error.error.message
        : error?.message
        ? error.message.split("(")[0]
        : String(error);
    toast?.error?.(msg);
    throw error;
  }

  const safe = (fn) => async (...args) => {
    try { return await fn(...args); } catch (e) { return errorHandling(e); }
  };

  return {
    totalProperties: safe(totalProperties),
    getAllPropertyInfo: safe(getAllPropertyInfo),
    propertiesOf: safe(propertiesOf),
    getLatest: safe(getLatest),
    createProperty: safe(createProperty),
    onPropertyDeployed,
    getPropertyInstance,
  };
}