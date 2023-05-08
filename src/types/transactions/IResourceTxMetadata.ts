import { Balances } from './IUserResource';

export interface ResourceTxMetadata extends Record<string, unknown> {
  collectionId: string;
  userId: string;
  gameId: string;
  balances: Balances;
}
