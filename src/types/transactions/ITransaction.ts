export enum TransactionState {
  pending = 'pending',
  submitting = 'submitting',
  submitted = 'submitted',
}

export enum TransactionType {
  MintAsset = 'MintAsset',
  MintResource = 'MintResource',
  MintCurrency = 'MintCurrency',
  BurnAsset = 'BurnAsset',
}

export interface Transaction<T extends Record<string, unknown>> {
  id?: string;
  transactionHash?: string;
  state: TransactionState;
  updatedAt?: number;
  type: TransactionType;
  metadata: T;
  groupId: string; // @groupId can be used group transaction for batch minting.
}

export type UnknownTransaction = Transaction<Record<string, unknown>>;
