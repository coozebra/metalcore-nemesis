import { Game } from '../../types';

export interface CreateAssetDTO {
  game: Game;
  type: string;
  accountId: string;
  externalId: string;
  collectionId: string;
  attributes: Record<string, unknown>;
}
