export interface User {
  id?: string;
  studioId: string;
  accountId: string;
  walletAddress?: bytes32String;
  balances: balances;
  wallet?: balances;
}

type bytes32String = string;
export type balances = Record<string, string>;
