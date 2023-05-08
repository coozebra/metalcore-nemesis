import { ethers } from 'hardhat';

import { ContractFactory } from 'ethers';

import Asset from '../../src/abi/Asset.json';
import GamePortal from '../../src/abi/GamePortal.json';

export async function setupChain() {
  const [owner, userWallet] = await ethers.getSigners();
  const gamePortalFactory = new ContractFactory(GamePortal.abi, GamePortal.bytecode, owner);
  const assetContractFactory = new ContractFactory(Asset.abi, Asset.bytecode, owner);

  const [gamePortal, assetContract] = await Promise.all([
    gamePortalFactory.deploy(owner.address),
    assetContractFactory.deploy('Test asset', 'ANFT', 'https://api.example.com/metadata/', 0),
  ]);

  // SETUP ASSET CONTRACT
  await assetContract.addMinter(gamePortal.address);
  await assetContract.increaseAllowance(gamePortal.address, 10);

  // SETUP GAME PORTAL
  await gamePortal.setTokenAcceptance(assetContract.address, { erc721: true });

  return { gamePortal, assetContract, userWallet };
}
