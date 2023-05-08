import { injectable } from 'inversify';

import ContractScanStatusModel, { ContractScanStatusDocument } from '../models/ContractScanStatus';
import { contractScanStatusNotFoundError } from '../errors/errors';

import { ContractScanStatus, ContractScanType } from '../types';

@injectable()
export class ContractScanStatusRepository {
  async create(ContractScanStatus: ContractScanStatus): Promise<ContractScanStatus> {
    const createdContractScanStatus = await ContractScanStatusModel.create(ContractScanStatus);

    return this.toContractScanStatusObject(createdContractScanStatus);
  }

  async findById(id: string) {
    const contractScanStatus = await ContractScanStatusModel.findById(id);

    if (!contractScanStatus) throw contractScanStatusNotFoundError;

    return this.toContractScanStatusObject(contractScanStatus);
  }

  async findAll(): Promise<ContractScanStatus[]> {
    const contractScanStatusModels = await ContractScanStatusModel.find({});

    return contractScanStatusModels.map(this.toContractScanStatusObject);
  }

  async updateLastBlock(id: string, lastBlock: number): Promise<ContractScanStatus> {
    const updatedResource = await ContractScanStatusModel.findOneAndUpdate({ _id: id }, { lastBlock }, { new: true });

    return this.toContractScanStatusObject(updatedResource);
  }

  private toContractScanStatusObject(contractScanStatus: ContractScanStatusDocument): ContractScanStatus {
    return {
      id: contractScanStatus.id,
      contractAddress: contractScanStatus.contractAddress,
      scanType: contractScanStatus.scanType as ContractScanType,
      firstBlock: contractScanStatus.firstBlock,
      lastBlock: contractScanStatus.lastBlock,
      chainId: contractScanStatus.chainId,
      updatedAt: contractScanStatus.updatedAt,
    };
  }
}
