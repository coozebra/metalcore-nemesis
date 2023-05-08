import { injectable } from 'inversify';

import AccessKeyModel, { AccessKeyDocument } from '../models/AccessKey';
import { AccessKey } from '../types';

@injectable()
export class AccessKeyRepository {
  async findByGameId(gameId: string, limit = 1): Promise<AccessKey[]> {
    const accessKeys = await AccessKeyModel.find({ gameId }).limit(limit);

    if (!accessKeys.length) return [];

    return accessKeys.map(this.toAccessKeyObject);
  }

  async findByGameIdAndUserId(gameId: string, userId: string): Promise<AccessKey[]> {
    const accessKeys = await AccessKeyModel.find({ gameId, userId });

    if (!accessKeys.length) return [];

    return accessKeys.map(this.toAccessKeyObject);
  }

  async activateKeyById(id: string, userId: string): Promise<AccessKey> {
    const activatedKey = await AccessKeyModel.findOneAndUpdate(
      { active: false, _id: id },
      {
        userId: userId,
        active: true,
      },
      { new: true }
    );

    if (!activatedKey) return null;

    return this.toAccessKeyObject(activatedKey);
  }

  async getAvailableKeys(gameId: string, limit = 1): Promise<AccessKey[]> {
    const accessKeys = await AccessKeyModel.find({ gameId, active: false }).limit(limit);

    if (!accessKeys.length) return [];

    return accessKeys.map(this.toAccessKeyObject);
  }

  private toAccessKeyObject(installationKey: AccessKeyDocument): AccessKey {
    return {
      id: installationKey.id,
      key: installationKey.key,
      userId: installationKey.userId?.toString(),
      gameId: installationKey.gameId.toString(),
      active: installationKey.active,
    };
  }
}
