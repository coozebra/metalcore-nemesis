import AssetModel, { AssetDocument } from '../../src/models/Asset';
import { UserDocument } from '../../src/models/User';
import { CollectionDocument } from '../../src/models/Collection';

export async function setupAsset(
  user: UserDocument,
  collection: CollectionDocument,
  assetInfo?: Partial<AssetDocument>
): Promise<AssetDocument> {
  const asset = await new AssetModel({
    type: 'Mech',
    userId: user.id,
    externalId: '123',
    collectionId: collection.id,
    attributes: {
      rarity: 'Uncommon',
      combat_role: 'Scout',
      model_number: 'ZA-V1',
      model_name: 'Zephyr',
      base_health: 300,
      hull: 1250,
      armor: '10%',
      weight: 'Light',
      gameplay_role: 'Support, Fast moving target designator',
      utility_slots: 3,
      utility_loadout: ['Sensors B6', 'Sensors B9', 'Mobility F2'],
      weapon_slots: 2,
      weapons: ['Energy weapons H2'],
    },
    ...assetInfo,
  }).save();

  return asset;
}
