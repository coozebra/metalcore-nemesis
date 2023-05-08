import 'reflect-metadata';

import mongoose from 'mongoose';
import { delay } from '../../utils/delay';
import AssetModel from '../../models/Asset';

const main = async () => {
  await require('../boot');

  while (mongoose.connection.readyState !== 1) {
    console.log('Connection not ready. Retrying...');
    await delay(2000);
  }

  const assets = await AssetModel.find().sort({ tokenId: 1 });

  const strings = assets.map((asset) => JSON.stringify(asset));

  const resp: any = {
    Uncommon: 0,
    Rare: 0,
    Epic: 0,
    Legendary: 0,
  };

  const rarityRegex = /Rarity","value":"([A-z]+)/;

  strings.forEach((string) => {
    const [, match] = string.match(rarityRegex);
    console.log(match);
    resp[match]++;
  });

  console.log(resp);
};

main()
  .then(() => console.log('done'))
  .catch(console.log)
  .finally(() => process.exit(0));
