import 'reflect-metadata';

import mongoose from 'mongoose';
import { assert } from 'chai';
import { delay } from '../../utils/delay';
import AssetModel from '../../models/Asset';

const main = async () => {
  await require('../boot');

  while (mongoose.connection.readyState !== 1) {
    console.log('Connection not ready. Retrying...');
    await delay(2000);
  }

  const assets = await AssetModel.find().sort({ tokenId: 1 });

  const ids = assets.map((asset) => asset.tokenId);

  ids.map((id, index) => assert(id === index + 1));
};

main()
  .then(() => console.log('done'))
  .catch(console.log)
  .finally(() => process.exit(0));
