export interface AssetTxMetadata extends Record<string, unknown> {
  userId: string;
  collectionId: string;
  amount: number;
  tokenId?: number;
}
