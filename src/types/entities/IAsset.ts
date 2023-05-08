export interface Asset {
  id?: string;
  userId?: string;
  externalId: string;
  collectionId: string;
  type: string;
  tokenId?: number;
  state?: StateMap;
  attributes: Record<string, unknown>;
}

export enum StateMap {
  minting = 'minting',
  minted = 'minted',
  burning = 'burning',
  burnt = 'burnt',
}
