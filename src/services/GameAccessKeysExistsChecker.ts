import { injectable, inject } from 'inversify';

import { AccessKeyRepository } from '../repositories/AccessKeyRepository';

@injectable()
export class GameAccessKeysExistsChecker {
  @inject(AccessKeyRepository) accessKeyRepository: AccessKeyRepository;

  async apply(gameId: string): Promise<boolean> {
    const accessKeys = await this.accessKeyRepository.findByGameId(gameId);

    return Boolean(accessKeys.length);
  }
}
