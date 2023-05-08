import { expect } from 'chai';

import { setupCollection, setupGame, setupStudio, setupUser } from '../../controls';
import { AssetCreator } from '../../../src/services/assets/AssetCreator';
import { CreateAssetDTO } from '../../../src/dto/assets/CreateAssetDTO';
import { getTestContainer } from '../../helpers/getTestContainer';

import Transaction from '../../../src/models/Transaction';
import { GameDocument } from '../../../src/models/Game';
import Asset from '../../../src/models/Asset';
import { TransactionRepository } from '../../../src/repositories/TransactionRepository';
import { CollectionDocument } from '../../../src/models/Collection';
import { UserDocument } from '../../../src/models/User';

describe('AssetCreator', () => {
  const makeDTO = (game: GameDocument, accountId: string, collectionId: string): CreateAssetDTO => ({
    game,
    type: 'Infantry',
    accountId: accountId,
    externalId: '1337',
    collectionId: collectionId,
    attributes: {
      name: 'Duke',
      weapons: 'many',
      hitPoints: 'plenty',
      quote: 'Hail to the king, baby',
    },
  });

  const container = getTestContainer();
  const assetCreator = container.get(AssetCreator);

  describe('with correct parameters', () => {
    let dto: CreateAssetDTO;

    beforeEach(async () => {
      const studio = await setupStudio();
      const game = await setupGame(studio);
      const collection = await setupCollection(game);
      const user = await setupUser(game);

      dto = makeDTO(game, user.accountId, collection.id);
    });

    it('inserts both an Asset and a Transaction to the db', async () => {
      await assetCreator.apply(dto);

      const counts = await Promise.all([Asset.countDocuments(), Transaction.countDocuments()]);

      expect(counts).to.deep.equal([1, 1]);
    });
  });

  describe('with incorrect params', () => {
    let dto: CreateAssetDTO;
    let game: GameDocument;
    let user: UserDocument;
    let collection: CollectionDocument;

    beforeEach(async () => {
      const studio = await setupStudio();
      game = await setupGame(studio);
      collection = await setupCollection(game);
      user = await setupUser(game);
    });

    describe('when user does not exist', () => {
      it('throws an error', async () => {
        dto = makeDTO(game, '123', collection.id);

        await expect(assetCreator.apply(dto)).to.be.rejectedWith('User not found');
      });
    });

    describe('when requester do not own the game', () => {
      it('throws an error', async () => {
        dto = makeDTO(game, user.accountId, '123');

        await expect(assetCreator.apply(dto)).to.be.rejectedWith('Collection ownership refused');
      });
    });
  });

  describe('when one operation fails', () => {
    let dto: CreateAssetDTO;

    beforeEach(async () => {
      const studio = await setupStudio();
      const game = await setupGame(studio);
      const collection = await setupCollection(game);
      const user = await setupUser(game);

      dto = makeDTO(game, user.accountId, collection.id);
    });

    it('does not store anything', async () => {
      const mockContainer = getTestContainer();

      mockContainer.bind(TransactionRepository).toConstantValue({
        create: () => {
          throw new Error();
        },
      } as unknown as TransactionRepository);

      const mockedAssetACreator = mockContainer.get(AssetCreator);

      try {
        await mockedAssetACreator.apply(dto);
      } catch {
        const counts = await Promise.all([Asset.countDocuments(), Transaction.countDocuments()]);
        expect(counts).to.deep.equal([0, 0]);
      }
    });
  });
});
