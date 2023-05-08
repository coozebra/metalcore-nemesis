import { inject, injectable } from 'inversify';

import { UserResourceRepository } from '../../repositories/UserResourceRepository';
import { ResourceRepository } from '../../repositories/ResourceRepository';
import { Logger } from '../../types/ILogger';
import { UserResource } from '../../types';

@injectable()
export class UserResourceDecrementor {
  @inject('Logger') logger!: Logger;

  @inject(ResourceRepository)
  private resourceRepository: ResourceRepository;

  @inject(UserResourceRepository)
  private userResourceRepository: UserResourceRepository;

  async apply(resourceId: string, userId: string, gameId: string, quantity: number): Promise<UserResource> {
    const { collectionId } = await this.resourceRepository.findByResourceId(resourceId);

    const result = await this.userResourceRepository.decrementBalance({
      collectionId,
      userId,
      gameId,
      balances: {
        [resourceId]: quantity,
      },
    });

    if (!result) {
      throw new Error('Subtraction overflow');
    }

    return this.userResourceRepository.findOne(collectionId, userId, gameId);
  }
}
