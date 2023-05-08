export enum ContractScanType {
  DepositUserResource = 'DepositUserResource',
  MintAsset = 'MintAsset',
  WithdrawAsset = 'WithdrawAsset',
  DepositAsset = 'DepositAsset',
}

export interface ContractScanStatus {
  id?: string;
  contractAddress: string;
  firstBlock: number;
  lastBlock: number;
  chainId: number;
  scanType: ContractScanType;
  updatedAt?: number;
}
