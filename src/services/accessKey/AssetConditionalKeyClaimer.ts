import { inject, injectable } from 'inversify';

import { AccessKey } from '../../types';
import settings from '../../config/settings';
import { ResultObject } from '../../types/IResultObject';
import { InvalidInputError, NotFoundError, UnauthorizedError } from '../../errors/application';
import { AccessKeyRepository } from '../../repositories/AccessKeyRepository';
import { CollectionParticipationVerifier } from './assetConditionalKeyClaimer/CollectionParticipationVerifier';
import { KeyClaimerDto } from '../../dto/KeyClaimerDTO';
import { CollectionRepository } from '../../repositories/CollectionRepository';
import { UserRepository } from '../../repositories/UserRepository';

@injectable()
export class AssetConditionalKeyClaimer {
  @inject(AccessKeyRepository) private accessKeyRepository: AccessKeyRepository;
  @inject(CollectionParticipationVerifier) private collectionParticipationVerifier: CollectionParticipationVerifier;
  @inject(CollectionRepository) private collectionRepository: CollectionRepository;
  @inject(UserRepository) private userRepository: UserRepository;

  async apply(dto: KeyClaimerDto): Promise<ResultObject<AccessKey[]>> {
    const maxAccessKeysPerPlayer = settings.accessKeys.maxAccessKeysPerPlayer;

    const [contractAddresses, { id: userId, walletAddress }, availableKeys] = await Promise.all([
      this.getContractAddresses(dto.gameId),
      this.userRepository.findByAccountId(dto.accountId),
      this.accessKeyRepository.getAvailableKeys(dto.gameId, maxAccessKeysPerPlayer),
    ]);

    if (await this.checkClaimedKeys(dto.gameId, userId)) {
      return { error: new InvalidInputError('Key already claimed by user', 'KeyAlreadyClaimed') };
    }

    const participations = await Promise.all(
      contractAddresses.map((contractAddress) =>
        this.collectionParticipationVerifier.apply(contractAddress, walletAddress)
      )
    );

    if (!participations.includes(true)) {
      return { error: new UnauthorizedError('Claim qualifications not met') };
    }

    if (availableKeys.length !== maxAccessKeysPerPlayer) {
      return { error: new NotFoundError('Ran out of AccessKeys') };
    }

    const activatedKeys = await this.activateKeys(availableKeys, userId);

    return { data: activatedKeys };
  }

  private checkClaimedKeys = async (gameId: string, userId: string): Promise<boolean> => {
    const claimedKeys = await this.accessKeyRepository.findByGameIdAndUserId(gameId, userId);

    return Boolean(claimedKeys.length);
  };

  private getContractAddresses = async (gameId: string): Promise<string[]> => {
    const contractType = 'ERC-721';
    const collections = await this.collectionRepository.findByGameIdAndContractType(gameId, contractType);
    const contractAddresses = collections.map((collection) => collection.contractAddress);

    return contractAddresses;
  };

  private activateKeys = async (availableKeys: AccessKey[], userId: string): Promise<AccessKey[]> => {
    const activatedKeys = await Promise.all(
      availableKeys.map((availableKey) => this.accessKeyRepository.activateKeyById(availableKey.id, userId))
    );

    return activatedKeys;
  };
}
