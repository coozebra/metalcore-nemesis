import 'reflect-metadata';

import mongoose from 'mongoose';
import { range } from 'lodash';
import { Chance } from 'chance';

import { delay } from '../../utils/delay';
import AssetModel from '../../models/Asset';

const main = async () => {
  await require('../boot');

  while (mongoose.connection.readyState !== 1) {
    console.log('Connection not ready. Retrying...');
    await delay(2000);
  }

  const assets = await AssetModel.find();

  if (!(assets.length === 10003)) throw new Error();

  const assetsRange = range(0, assets.length + 1);

  const indexesToKill = new Chance().pickset(assetsRange, 3);

  await Promise.all(
    indexesToKill.map((index) => {
      console.log('killing', index);
      console.log(JSON.stringify(assets[index]));
      return assets[index].delete();
    })
  );
};

main()
  .then(() => console.log('done'))
  .catch(console.log)
  .finally(() => process.exit(0));
