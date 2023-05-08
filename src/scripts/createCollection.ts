import 'reflect-metadata';

import mongoose from 'mongoose';
import promptSync from 'prompt-sync';

import { delay } from '../utils/delay';
import Application from '../lib/Application';
import { CollectionStorer } from '../services/CollectionStorer';
import { CollectionFactory } from '../services/factories/CollectionFactory';

const main = async () => {
  await require('../boot');

  while (mongoose.connection.readyState !== 1) {
    console.log('Connection not ready. Retrying...');
    await delay(2000);
  }

  const prompt = promptSync();

  const collectionStorer = Application.get(CollectionStorer);
  const collectionFactory = Application.get(CollectionFactory);

  const gameId = prompt('What is the game ID? ');
  const name = prompt('What is the name of the collection? ');
  const contractAddress = prompt('What is the contract address? ');
  const type = prompt('Type: ERC-721 or ERC-1155? ');
  const collection = await collectionFactory.call(gameId, contractAddress, name, type);
  const storedCollection = await collectionStorer.apply(collection);

  console.log(storedCollection);
};

main()
  .then(() => console.log('done'))
  .catch(console.log)
  .finally(() => process.exit(0));
