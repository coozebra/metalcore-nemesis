export type Balances = Record<string, number>;

export interface UserResource {
  collectionId: string;
  userId: string;
  gameId: string;
  balances: Balances;
}

export interface UserResourceDeposit {
  txId: string;
  amount: number;
  tokenId: number;
  blockNumber: number;
}
