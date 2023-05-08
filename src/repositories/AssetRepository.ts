import { inject, injectable } from 'inversify';
import { ClientSession } from 'mongoose';

import { Logger } from '../types/ILogger';
import { Asset, AssetStateMap } from '../types';
import { NotFoundError } from '../errors/application';
import AssetModel, { AssetDocument } from '../models/Asset';

@injectable()
export class AssetRepository {
  @inject('Logger') logger!: Logger;

  async create(asset: Asset, session?: ClientSession): Promise<Asset> {
    const [savedAsset] = await AssetModel.create(
      [
        {
          type: asset.type,
          state: asset.state,
          userId: asset.userId,
          externalId: asset.externalId,
          collectionId: asset.collectionId,
          attributes: asset.attributes,
        },
      ],
      { session }
    );

    return this.toAssetObject(savedAsset);
  }

  async findByCollectionIdAndTokenId(collectionId: string, tokenId: number): Promise<Asset> {
    const asset = await AssetModel.findOne({ collectionId, tokenId });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    return this.toAssetObject(asset);
  }

  async setTokenId(collectionId: string, userId: string, tokenId: number): Promise<Asset> {
    const asset = await AssetModel.findOneAndUpdate(
      { collectionId, userId, tokenId: null },
      { tokenId, state: AssetStateMap.minted },
      { new: true }
    );

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    return this.toAssetObject(asset);
  }

  async setUserId(collectionId: string, tokenId: number, userId: string): Promise<Asset> {
    const asset = await AssetModel.findOneAndUpdate({ collectionId, tokenId }, { userId }, { new: true });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    return this.toAssetObject(asset);
  }

  async findById(id: string): Promise<Asset> {
    const asset = await AssetModel.findOne({ _id: id });

    if (!asset) throw new NotFoundError('Asset not found');

    return this.toAssetObject(asset);
  }

  async updateState(assetId: string, state: AssetStateMap, session?: ClientSession): Promise<Asset> {
    const asset = await AssetModel.findOneAndUpdate({ _id: assetId }, { state }, { new: true, session });

    return this.toAssetObject(asset);
  }

  async findByCollectionId(collectionId: string): Promise<Asset[]> {
    const assets = await AssetModel.find({ collectionId });

    if (!assets) throw new NotFoundError('Assets not found');

    return assets.map(this.toAssetObject);
  }

  async findByUserIdAndCollectionId(userId: string, collectionId: string): Promise<Asset[]> {
    const assets = await AssetModel.find({ userId, collectionId });

    if (!assets.length) return [];

    return assets.map(this.toAssetObject);
  }

  async updateAttributes(assetId: string, attributes: Record<string, unknown>): Promise<Asset> {
    const asset = await AssetModel.findOneAndUpdate({ _id: assetId }, { attributes }, { new: true });

    if (!asset) throw new NotFoundError('Asset not found');

    return this.toAssetObject(asset);
  }

  private toAssetObject(asset: AssetDocument): Asset {
    return {
      id: asset.id,
      type: asset.type,
      userId: asset.userId?.toString() || null,
      externalId: asset.externalId,
      collectionId: asset.collectionId.toString(),
      attributes: asset.attributes,
      tokenId: asset.tokenId || null,
      state: asset.state as AssetStateMap,
    };
  }
}
