import { inject, injectable } from 'inversify';

import { UserRepository } from '../../repositories/UserRepository';
import Asset, { AssetDocument } from '../../models/Asset';

@injectable()
export class AssetUpdater {
  @inject(UserRepository)
  private userRepository: UserRepository;

  apply = async (
    id: string,
    type: string,
    accountId: string,
    attributes: Record<string, unknown>
  ): Promise<AssetDocument> => {
    const user = await this.userRepository.findByAccountId(accountId);
    const asset = await Asset.findOne({ _id: id }, { __v: 0 });

    if (user && asset) {
      await Asset.findOneAndUpdate(
        { _id: id },
        {
          _id: id,
          type,
          userId: user.id,
          attributes,
        }
      );

      const updatedAsset = await Asset.findOne({ _id: id }, { __v: 0 });
      return updatedAsset;
    }
  };
}
