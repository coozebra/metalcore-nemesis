import 'reflect-metadata';

import { range, shuffle } from 'lodash';
import mongoose from 'mongoose';

import { delay } from '../../utils/delay';
import AssetModel from '../../models/Asset';

const main = async () => {
  await require('../boot');

  while (mongoose.connection.readyState !== 1) {
    console.log('Connection not ready. Retrying...');
    await delay(2000);
  }

  const shuffledRange = shuffle(range(1, 10000 + 1));

  const assets = await AssetModel.find({ tokenId: undefined });

  await Promise.all(
    assets.map(async (asset, index) => {
      const tokenId = shuffledRange[index];

      asset.tokenId = tokenId;

      return asset.save();
    })
  );

  console.log('Assigning TokenIds DONE');
};

main()
  .then(() => console.log('done'))
  .catch(console.log)
  .finally(() => process.exit(0));
