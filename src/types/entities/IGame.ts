export interface Game {
  id?: string;
  key?: string;
  name: string;
  studioId: string;
  contractAddress: string;
  chain: string;
  currencies: Record<string, string>;
}
