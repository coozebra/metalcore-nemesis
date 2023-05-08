export interface UserResponse {
  id: string;
  displayName: string;
  accountId: string;
  walletAddress: string;
  balances: Record<string, string>;
}
