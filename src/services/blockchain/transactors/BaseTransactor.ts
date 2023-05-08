import { UnknownTransaction } from '../../../types';

export interface BaseTransactor {
  apply(transactions: UnknownTransaction[]): Promise<string>;
}
