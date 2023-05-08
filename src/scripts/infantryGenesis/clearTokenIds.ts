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

  await Promise.all(
    assets.map((asset) => {
      asset.tokenId = undefined;
      return asset.save();
    })
  );
};

main()
  .then(() => console.log('done'))
  .catch(console.log)
  .finally(() => process.exit(0));
