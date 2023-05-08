import { expect } from 'chai';

import { ContractAddressChecker } from '../../../src/services/ContractAddressChecker';
import { getTestContainer } from '../../helpers/getTestContainer';

describe('ContractAddressChecker', () => {
  const contractAddressChecker = getTestContainer().get(ContractAddressChecker);

  describe('#apply', () => {
    describe('when the contract address is valid', () => {
      const validContractAddress = '0x' + '0'.repeat(40);

      it('returns the contract address', () => {
        const result = contractAddressChecker.apply(validContractAddress);

        expect(result).to.equal(validContractAddress);
      });
    });

    describe('when the contract address is invalid', () => {
      const invalidContractAddress = 'invalid';

      it('throws an error', () => {
        expect(() => contractAddressChecker.apply(invalidContractAddress)).to.throw('Invalid contract address');
      });

      it('throws an error', () => {
        expect(() => contractAddressChecker.apply('0x' + '0'.repeat(64))).to.throw('Invalid contract address');
      });
    });
  });
});
