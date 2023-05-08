import { inject, injectable } from 'inversify';
import StudioModel, { StudioDocument } from '../models/Studio';

import { Logger } from '../types/ILogger';
import { Studio } from '../types';

@injectable()
export class StudioCreator {
  @inject('Logger') logger!: Logger;

  async apply(name: string): Promise<Studio> {
    try {
      const studio = await StudioModel.create({ name });

      return this.toStudio(studio);
    } catch (err) {
      this.logger.error(`Failed to create Studio. Error: ${err}`);
    }
  }

  private toStudio(studio: StudioDocument): Studio {
    return {
      id: studio.id.toString(),
      name: studio.name,
    };
  }
}
