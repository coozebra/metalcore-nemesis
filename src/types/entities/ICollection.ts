export interface Collection {
  id?: string;
  gameId: string;
  contractAddress: string;
  name: string;
  type: string;
}

export const TypeMap = {
  ERC721: 'ERC-721',
  ERC1155: 'ERC-1155',
};
