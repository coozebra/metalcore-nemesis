import 'reflect-metadata';

import fs from 'fs/promises';
import mongoose from 'mongoose';

import { delay } from '../../utils/delay';
import AssetModel from '../../models/Asset';

const main = async (collectionId?: string) => {
  await require('../boot');

  while (mongoose.connection.readyState !== 1) {
    console.log('Connection not ready. Retrying...');
    await delay(2000);
  }

  const assets = <any[]>JSON.parse(await fs.readFile('infantry.json', 'utf-8'));

  await Promise.all(
    assets.map((asset) =>
      AssetModel.create({
        type: 'Infantry',
        externalId: asset.id,
        collectionId: collectionId,
        attributes: {
          ...asset,
          id: undefined,
          v: undefined,
        },
      })
    )
  );

  console.log('Importing assets DONE');
};

// Pass collectionId here when running this script.
main('62e2dd05b788bcd3295dca44')
  .then(() => console.log('done'))
  .catch(console.log)
  .finally(() => process.exit(0));
