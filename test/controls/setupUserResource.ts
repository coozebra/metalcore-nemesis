import UserResourceModel, { UserResourceDocument } from '../../src/models/UserResource';
import { ResourceDocument } from '../../src/models/Resource';
import { UserDocument } from '../../src/models/User';
import { GameDocument } from '../../src/models/Game';
import { CollectionDocument } from '../../src/models/Collection';

export async function setupUserResource(
  user: UserDocument,
  resource: ResourceDocument,
  collection: CollectionDocument,
  game: GameDocument
): Promise<UserResourceDocument> {
  const userResource = await new UserResourceModel({
    userId: user.id,
    collectionId: collection.id,
    gameId: game.id,
    balances: { [resource.id]: 2 },
  }).save();

  return userResource;
}
