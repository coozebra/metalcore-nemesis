import Game from '../src/models/Game';
import User from '../src/models/User';
import Asset from '../src/models/Asset';
import Studio from '../src/models/Studio';
import Collection from '../src/models/Collection';
import Transaction from '../src/models/Transaction';
import UserResource from '../src/models/UserResource';
import AccessKey from '../src/models/AccessKey';

import { cleanCollection, setupDatabase, teardownDatabase } from './helpers/databaseControls';
import Resource from '../src/models/Resource';

before(async () => {
  await setupDatabase();
});

after(async () => {
  await teardownDatabase();
});

beforeEach(async () => {
  await cleanDatabase();
});

async function cleanDatabase() {
  await Promise.all([
    cleanCollection(Game),
    cleanCollection(User),
    cleanCollection(Asset),
    cleanCollection(Studio),
    cleanCollection(Resource),
    cleanCollection(Collection),
    cleanCollection(Transaction),
    cleanCollection(UserResource),
    cleanCollection(AccessKey),
  ]);
}
