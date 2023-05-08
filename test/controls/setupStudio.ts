import Chance from 'chance';

import Studio, { StudioDocument } from '../../src/models/Studio';

export async function setupStudio(): Promise<StudioDocument> {
  const chance = new Chance();

  const studio = await new Studio({ name: chance.company() }).save();

  return studio;
}
