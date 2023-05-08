import { expect } from 'chai';

import { getTestContainer } from '../../helpers/getTestContainer';
import { UserLoginValidator } from '../../../src/dto/validators/UserLoginValidator';

describe('UserLoginValidator', () => {
  const validator = getTestContainer().get(UserLoginValidator);

  describe('EMAIL login', () => {
    describe('with valid data', () => {
      it('returns success', () => {
        expect(validator.apply({ email: 'valid@email.com', password: 'str0ngp4sswrd' })).to.deep.equal({
          isValid: true,
        });
      });
    });

    describe('invalid email', () => {
      it('returns failure object', () => {
        expect(validator.apply({ email: 'notAnEmail', password: 'password' })).to.deep.equal({
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

    describe('with invalid everything', () => {
      it('returns failure object', () => {
        expect(validator.apply({ email: '', password: '' })).to.deep.equal({
          isValid: false,
          errors: [
            {
              attribute: 'email',
              detail: '"email" is not allowed to be empty',
            },
            { attribute: 'password', detail: '"password" is not allowed to be empty' },
          ],
        });
      });
    });
  });

  describe('with BOTH username and email', () => {
    it('returns failure object', () => {
      expect(
        validator.apply({ email: 'valid@email.com', username: 'username01', password: 'str0ngp4sswrd' })
      ).to.deep.equal({
        isValid: false,
        errors: [
          { attribute: 'value', detail: '"value" contains a conflict between exclusive peers [email, username]' },
        ],
      });
    });
  });

  describe('with NEITHER username and email', () => {
    it('returns failure object', () => {
      expect(validator.apply({ password: 'str0ngp4sswrd' })).to.deep.equal({
        isValid: false,
        errors: [{ attribute: 'value', detail: '"value" must contain at least one of [email, username]' }],
      });
    });
  });
});
