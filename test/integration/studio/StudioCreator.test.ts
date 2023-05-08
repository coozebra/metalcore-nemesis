import { expect } from 'chai';

import { StudioCreator } from '../../../src/services/StudioCreator';
import { getTestContainer } from '../../helpers/getTestContainer';
import { Studio } from '../../../src/types';
import StudioModel from '../../../src/models/Studio';

describe('StudioCreator', () => {
  const studioCreator = getTestContainer().get(StudioCreator);
  const studioName = 'Fancy Schmancy Games 2000';

  describe('when inserting a studio that does not exist', () => {
    let initialCount: number;
    let currentCount: number;
    let studio: Studio;

    before(async () => {
      initialCount = await StudioModel.countDocuments();
      studio = await studioCreator.apply(studioName);
      currentCount = await StudioModel.countDocuments();
    });

    it('db docs count increases', () => {
      expect(currentCount).to.be.greaterThan(initialCount);
    });

    it('creates a studio', () => {
      expect(studio).to.have.property('name', studioName);
      expect(studio).to.have.property('id');
    });
  });

  describe('when inserting a studio that already exists', () => {
    let initialCount: number;

    beforeEach(async () => {
      await StudioModel.create({ name: studioName });
      initialCount = await StudioModel.countDocuments();
    });

    it('does not create duplicated studios', async () => {
      await studioCreator.apply(studioName);

      const currentCount = await StudioModel.countDocuments();

      expect(initialCount).to.equal(currentCount);
    });
  });
});
