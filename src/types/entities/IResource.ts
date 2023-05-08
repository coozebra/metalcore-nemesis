export interface Resource {
  id?: string;
  tokenId?: number;
  collectionId: string;
  attributes: Record<string, unknown>;
}
