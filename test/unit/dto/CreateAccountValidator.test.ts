import Chance from 'chance';
import { expect } from 'chai';

import { getTestContainer } from '../../helpers/getTestContainer';
import { CreateAccountDTO } from '../../../src/dto/CreateAccountDTO';
import { CreateAccountValidator } from '../../../src/dto/validators/CreateAccountValidator';

describe('CreateAccountValidator', () => {
  const chance = new Chance();
  const validator = getTestContainer().get(CreateAccountValidator);

  const dto: Partial<CreateAccountDTO> = {
    email: chance.email(),
    password: chance.string({ length: 8 }),
    displayName: chance.word({ syllables: 3 }),
  };

  describe('with valid data', () => {
    it('returns success object', () => {
      expect(validator.apply(dto)).to.deep.equal({
        isValid: true,
      });
    });
  });

  describe('with invalid email', () => {
    it('returns failure object', () => {
      expect(validator.apply({ ...dto, email: 'notAnEmail' })).to.deep.equal({
        isValid: false,
        errors: [
          {
            attribute: 'email',
            detail: '"email" must be a valid email',
          },
        ],
      });
    });
  });

  describe('with invalid displayName', () => {
    it('returns failure object', () => {
      expect(validator.apply({ ...dto, displayName: 'wu' })).to.deep.equal({
        isValid: false,
        errors: [
          {
            attribute: 'displayName',
            detail: '"displayName" length must be at least 3 characters long',
          },
        ],
      });
    });
  });

  describe('with invalid password', () => {
    it('returns failure object', () => {
      expect(validator.apply({ ...dto, password: 'short' })).to.deep.equal({
        isValid: false,
        errors: [
          {
            attribute: 'password',
            detail: '"password" length must be at least 8 characters long',
          },
        ],
      });
    });
  });

  describe('with missing parameters', () => {
    it('returns failure object', () => {
      expect(validator.apply({})).to.deep.equal({
        isValid: false,
        errors: [
          {
            attribute: 'email',
            detail: '"email" is required',
          },
          { attribute: 'displayName', detail: '"displayName" is required' },
          { attribute: 'password', detail: '"password" is required' },
        ],
      });
    });
  });
});
