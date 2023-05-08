import { expect } from 'chai';

import { setupStudio, setupGame, setupUser, setupCollection } from '../controls';
import { AssetTxFactory } from '../../src/services/factories/AssetTxFactory';
import { CollectionDocument } from '../../src/models/Collection';
import { getTestContainer } from '../helpers/getTestContainer';
import { GameDocument } from '../../src/models/Game';
import { UserDocument } from '../../src/models/User';
import { TransactionType } from '../../src/types';

describe('AssetTxFactory', () => {
  const factory = getTestContainer().get(AssetTxFactory);

  let game: GameDocument;
  let user: UserDocument;
  let collection: CollectionDocument;

  describe('#call', () => {
    beforeEach(async () => {
      game = await setupStudio().then(setupGame);
      user = await setupUser(game);
      collection = await setupCollection(game);
    });

    describe('with valid transaction data', () => {
      const tokenId = 1;
      it('returns an user object', async () => {
        const transaction = await factory.call(collection.id, user.id, game.id, TransactionType.BurnAsset, tokenId);

        expect(transaction).to.deep.equal({
          state: 'pending',
          type: TransactionType.BurnAsset,
          groupId: collection.id,
          metadata: {
            userId: user.id,
            collectionId: collection.id,
            tokenId: 1,
            amount: 1,
          },
        });
      });
    });

    describe('with invalid transaction data', () => {
      describe('if ownership is refused', () => {
        it('it throws an error', async () => {
          await expect(
            factory.call(collection.id, user.id, collection.id, TransactionType.BurnAsset)
          ).to.be.rejectedWith('Collection ownership refused');
        });
      });
    });
  });
});
