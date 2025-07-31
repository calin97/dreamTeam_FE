import { utils } from "ethers"; // v5
import getBrickSafePropertyContract from "../abis/BrickSafeProperty";
import getMockUSDTContract from "../abis/MockUSDT"; 
import { toast } from "react-toastify";

const USDT_DECIMALS = 6;

/** mici utilitare */
const toUnits = (bn, decimals = USDT_DECIMALS) => utils.formatUnits(bn, decimals);
const toWei   = (n, decimals = USDT_DECIMALS) => utils.parseUnits(String(n), decimals);
const pctFromBps = (bps) => Number(bps) / 100; // 10_000 bps = 100%

/** decode data:application/json;base64,... din tokenURI (opțional în UI) */
function tryDecodeDataUri(uri) {
  try {
    const prefix = "data:application/json;base64,";
    if (!uri || !uri.startsWith(prefix)) return null;
    const b64 = uri.slice(prefix.length);
    const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    return json; // { name, description, image, attributes, ...}
  } catch {
    return null;
  }
}

export default function frontendLibProperty() {

  // ---------------- READS ----------------

  /** Rezumatul proprietății: parametrii, starea de funding & income */
  async function getSummary(signerOrProvider, propertyAddress) {
    const p = getBrickSafePropertyContract(signerOrProvider, propertyAddress);

    const [
      usdt, price, propertyURI, seller,
      raised, finalized, pendingIncome,
      oceanDid, oceanDataNft,
    ] = await Promise.all([
      p.usdt(),
      p.price(),
      p.propertyURI(),
      p.seller(),
      p.raised(),
      p.finalized(),
      p.pendingIncome(),
      p.oceanDid(),
      p.oceanDataNft(),
    ]);

    let totalShares = 0;
    try {
      const n = await p.totalShareTokens();
      totalShares = n.toNumber();
    } catch {
      totalShares = 0;
    }

    return {
      address: propertyAddress,
      usdt,
      price,
      priceFormatted: toUnits(price),
      propertyURI,
      seller,
      raised,
      raisedFormatted: toUnits(raised),
      finalized,
      pendingIncome,
      pendingIncomeFormatted: toUnits(pendingIncome),
      oceanDid,
      oceanDataNft,
      totalShares,
    };
  }

  /** Listă cu toate share‑urile (NFT‑uri): tokenId, owner, bps, tokenURI (+ decode optional) */
  async function getShares(signerOrProvider, propertyAddress) {
    const p = getBrickSafePropertyContract(signerOrProvider, propertyAddress);

    // avem getterul totalShareTokens() în contract
    const total = await p.totalShareTokens();
    const n = total.toNumber();

    const out = [];
    for (let i = 0; i < n; i++) {
      // array public shareTokens -> index getter
      const tokenId = await p.shareTokens(i);
      const [owner, bps, uri] = await Promise.all([
        p.ownerOf(tokenId),
        p.tokenShareBps(tokenId),
        p.tokenURI(tokenId),
      ]);
      const meta = tryDecodeDataUri(uri);
      out.push({
        tokenId: tokenId.toNumber ? tokenId.toNumber() : Number(tokenId),
        owner,
        bps: bps.toString(),
        percent: pctFromBps(bps.toString()), // ex: 7000 -> 70
        tokenURI: uri,
        metadata: meta || undefined,
      });
    }
    return out;
  }

  /** Listează contributorii inițiali (doar adrese + amount) */
  async function getContributors(signerOrProvider, propertyAddress) {
    const p = getBrickSafePropertyContract(signerOrProvider, propertyAddress);
    const addrs = await p.getContributors();
    const rows = [];
    for (const a of addrs) {
      const amt = await p.contributed(a);
      rows.push({ address: a, amount: amt, amountFormatted: toUnits(amt) });
    }
    return rows;
  }

  /** Verifică dacă o adresă e shareholder (deține cel puțin 1 NFT) */
  async function isShareholder(signerOrProvider, propertyAddress, account) {
    const p = getBrickSafePropertyContract(signerOrProvider, propertyAddress);
    const bal = await p.balanceOf(account);
    return bal.gt(0);
  }

  // ---------------- WRITES ----------------

  /** Approve mUSDT + contribute(amount) */
  async function approveAndContribute(signer, propertyAddress, usdtAddress, amountWhole) {
    if (!signer) throw new Error("Signer required");
    const usdt = getMockUSDTContract(signer, usdtAddress);
    const p    = getBrickSafePropertyContract(signer, propertyAddress);

    const amount = toWei(amountWhole);
    const a = await usdt.approve(propertyAddress, amount);
    await a.wait();

    const tx = await p.contribute(amount);
    const rc = await tx.wait();
    toast?.success?.("Contribution successful");
    return { txHash: tx.hash, receipt: rc };
  }

  /** Doar contribute (dacă approve e deja făcut manual) */
  async function contribute(signer, propertyAddress, amountWhole) {
    const p = getBrickSafePropertyContract(signer, propertyAddress);
    const amount = toWei(amountWhole);
    const tx = await p.contribute(amount);
    const rc = await tx.wait();
    toast?.success?.("Contribution successful");
    return { txHash: tx.hash, receipt: rc };
  }

  /** Approve mUSDT + depositIncome + (opțional) distribute imediat */
  async function depositIncome(signer, propertyAddress, usdtAddress, rentWhole, autoDistribute = false) {
    if (!signer) throw new Error("Signer required");
    const usdt = getMockUSDTContract(signer, usdtAddress);
    const p    = getBrickSafePropertyContract(signer, propertyAddress);

    const amt = toWei(rentWhole);
    const a = await usdt.approve(propertyAddress, amt);
    await a.wait();

    const d = await p.depositIncome(amt);
    await d.wait();
    toast?.success?.("Income deposited");

    let dist = null;
    if (autoDistribute) {
      dist = await p.distributeIncome();
      await dist.wait();
      toast?.success?.("Income distributed");
    }

    return { depositTx: d.hash, distributeTx: dist?.hash || null };
  }

  /** Distribute pending income (permisiune: doar shareholder) */
  async function distributeIncome(signer, propertyAddress) {
    const p = getBrickSafePropertyContract(signer, propertyAddress);
    const tx = await p.distributeIncome();
    const rc = await tx.wait();
    toast?.success?.("Income distributed");
    return { txHash: tx.hash, receipt: rc };
  }

  /** Setează display name pe un token (doar ownerul acelui token) */
  async function setDisplayName(signer, propertyAddress, tokenId, name) {
    const p = getBrickSafePropertyContract(signer, propertyAddress);
    const tx = await p.setDisplayName(tokenId, name);
    const rc = await tx.wait();
    toast?.success?.("Display name updated");
    return { txHash: tx.hash, receipt: rc };
  }

  /** Link Ocean asset (doar shareholder) */
  // async function linkOceanAsset(signer, propertyAddress, did, dataNftAddress) {
  //   const p = getBrickSafePropertyContract(signer, propertyAddress);
  //   const tx = await p.linkOceanAsset(did, dataNftAddress || "0x0000000000000000000000000000000000000000");
  //   const rc = await tx.wait();
  //   toast?.success?.("Ocean asset linked");
  //   return { txHash: tx.hash, receipt: rc };
  // }

  // in frontendLibProperty()
async function linkOceanAsset(signer, propertyAddress, did, dataNftAddress) {
  const prop = getBrickSafePropertyContract(signer, propertyAddress);
  const tx = await prop.linkOceanAsset(did, dataNftAddress);
  await tx.wait();
  return tx.hash;
}

  // ---------------- EVENTS ----------------
  // toate folosesc ethers v5: numele evenimentului ca string

  function onContributed(signerOrProvider, propertyAddress, cb) {
    const p = getBrickSafePropertyContract(signerOrProvider, propertyAddress);
    const handler = (investor, amount, newRaised, event) => cb({ investor, amount, newRaised, event });
    p.on("Contributed", handler);
    return () => p.off("Contributed", handler);
  }

  function onFinalized(signerOrProvider, propertyAddress, cb) {
    const p = getBrickSafePropertyContract(signerOrProvider, propertyAddress);
    const handler = (totalRaised, sellerPaid, event) => cb({ totalRaised, sellerPaid, event });
    p.on("Finalized", handler);
    return () => p.off("Finalized", handler);
  }

  function onIncomeDeposited(signerOrProvider, propertyAddress, cb) {
    const p = getBrickSafePropertyContract(signerOrProvider, propertyAddress);
    const handler = (from, amount, event) => cb({ from, amount, event });
    p.on("IncomeDeposited", handler);
    return () => p.off("IncomeDeposited", handler);
  }

  function onIncomeDistributed(signerOrProvider, propertyAddress, cb) {
    const p = getBrickSafePropertyContract(signerOrProvider, propertyAddress);
    const handler = (amount, event) => cb({ amount, event });
    p.on("IncomeDistributed", handler);
    return () => p.off("IncomeDistributed", handler);
  }

  function onShareMinted(signerOrProvider, propertyAddress, cb) {
    const p = getBrickSafePropertyContract(signerOrProvider, propertyAddress);
    const handler = (tokenId, investor, shareBps, tokenURI, event) =>
      cb({ tokenId, investor, shareBps, tokenURI, event });
    p.on("ShareMinted", handler);
    return () => p.off("ShareMinted", handler);
  }

  function onDisplayNameSet(signerOrProvider, propertyAddress, cb) {
    const p = getBrickSafePropertyContract(signerOrProvider, propertyAddress);
    const handler = (tokenId, name, event) => cb({ tokenId, name, event });
    p.on("DisplayNameSet", handler);
    return () => p.off("DisplayNameSet", handler);
  }

  function onOceanLinked(signerOrProvider, propertyAddress, cb) {
    const p = getBrickSafePropertyContract(signerOrProvider, propertyAddress);
    const handler = (did, dataNft, event) => cb({ did, dataNft, event });
    p.on("OceanLinked", handler);
    return () => p.off("OceanLinked", handler);
  }

  // ---------------- ERROR HANDLING ----------------

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
    // reads
    getSummary: safe(getSummary),
    getShares: safe(getShares),
    getContributors: safe(getContributors),
    isShareholder: safe(isShareholder),

    // writes
    approveAndContribute: safe(approveAndContribute),
    contribute: safe(contribute),
    depositIncome: safe(depositIncome),
    distributeIncome: safe(distributeIncome),
    setDisplayName: safe(setDisplayName),
    linkOceanAsset: safe(linkOceanAsset),

    // events
    onContributed,
    onFinalized,
    onIncomeDeposited,
    onIncomeDistributed,
    onShareMinted,
    onDisplayNameSet,
    onOceanLinked,

    // helpers
    toUnits,
    toWei,
    pctFromBps,
  };
}
