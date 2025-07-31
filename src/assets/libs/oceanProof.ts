// src/assets/libs/oceanProof.ts
import { Signer } from "ethers";

type CreateProofParams = {
  ethersSigner: Signer;
  contributor: string;
  propertyAddress: string;
  proofJson: any;
};

export async function createOceanProof({
  ethersSigner,
  contributor,
  propertyAddress,
  proofJson,
}: CreateProofParams) {
  // 1) Import DINAMIC al @oceanprotocol/lib
  const oceanLib = await import("@oceanprotocol/lib");
  const {
    ConfigHelper,
    ZERO_ADDRESS,
    NftFactory,
    Datatoken, // (uneori e Datatokens, dar în majoritatea buildurilor e Datatoken)
    Nft,
  } = oceanLib as any;

  // 2) Config din ENV (tu folosești REACT_APP_ ca prefix în Vite)
  const oceanChainId = Number(import.meta.env.REACT_APP_OCEAN_CHAIN_ID);
  if (!oceanChainId) throw new Error("REACT_APP_OCEAN_CHAIN_ID missing.");

  const helper = new ConfigHelper();
  const baseCfg = helper.getConfig(oceanChainId);

  const cfg: any = {
    ...baseCfg,
    chainId: oceanChainId,
    nodeUri: import.meta.env.REACT_APP_OCEAN_NODE_URI || baseCfg.nodeUri,
    aquariusUri: import.meta.env.REACT_APP_OCEAN_AQUARIUS_URI || baseCfg.aquariusUri,
    providerUri: import.meta.env.REACT_APP_OCEAN_PROVIDER_URI || baseCfg.providerUri,
    subgraphUri: import.meta.env.REACT_APP_OCEAN_SUBGRAPH_URI || baseCfg.subgraphUri,
  };

  if (!cfg.nftFactoryAddress) {
    throw new Error("Missing nftFactoryAddress for selected Ocean chain.");
  }

  const me = await ethersSigner.getAddress();

  // 3) Instanțe (observă semnăturile cerute de SDK)
  const nftFactory = new NftFactory(cfg.nftFactoryAddress, ethersSigner, oceanChainId, cfg);
  const nft = new Nft(ethersSigner);
  const datatoken = new Datatoken(ethersSigner);

  // 4) Parametri DataNFT + DT
  const nftParams = {
    name: "BrickSafe Contribution Proof",
    symbol: "BSAFE-PROOF",
    templateIndex: 1,
    tokenURI: "",
    transferable: true,
    owner: me,
  };

  const dtParams = {
    name: "BrickSafe Proof DT",
    symbol: "BSPDT",
    templateIndex: 2,
    cap: "1000000000000000000000000",
    feeAmount: "0",
    paymentCollector: ZERO_ADDRESS,
    feeToken: ZERO_ADDRESS,
    minter: me,
    mpFeeAddress: ZERO_ADDRESS,
  };

  // 5) Creează DataNFT + Datatoken
  const tx = await nftFactory.createNftWithDatatoken(me, nftParams, dtParams);
  const receipt = await tx.wait();

  const evs = receipt.events || [];
  const evNft = evs.find((e: any) => (e.event || "").toLowerCase().includes("nftcreated"));
  const evDt  = evs.find((e: any) => (e.event || "").toLowerCase().includes("tokencreated"));

  const dataNftAddress: string | undefined =
    evNft?.args?.newTokenAddress || evNft?.args?.nftAddress;
  const datatokenAddress: string | undefined =
    evDt?.args?.newTokenAddress || evDt?.args?.tokenAddress;

  if (!dataNftAddress || !datatokenAddress) {
    console.log("Events:", evs);
    throw new Error("Could not parse DataNFT/Datatoken address from receipt events.");
  }

  // 6) Metadata (dovada) → Provider + Aquarius
  const metadata = {
    created: new Date().toISOString(),
    type: "dataset",
    name: `BrickSafe Proof - ${contributor.slice(0, 6)}…`,
    description: "Proof of contribution for a BrickSafe property.",
    author: contributor,
    license: "CC0",
    tags: ["bricksafe", "proof", "real-estate", "ocean"],
    links: [],
    additionalInformation: {
      propertyAddress,
      proof: proofJson,
    },
  };

  const enc = await nft.encryptMetadata(metadata as any, cfg.providerUri);
  await nft.setMetadata(
    dataNftAddress,
    me,
    0,
    "",
    "0x2",
    enc,
    [],
    cfg.providerUri
  );

  // 7) DID (fallback simplu)
  const did = `did:op:${(oceanChainId + dataNftAddress).toLowerCase()}`;

  // 8) (opțional) mint 1 DT ca “badge”
  await datatoken.mint(datatokenAddress, contributor, "1", me);

  return { did, dataNftAddress, datatokenAddress };
}
