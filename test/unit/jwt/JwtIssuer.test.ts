import { expect } from 'chai';
import jwt from 'jsonwebtoken';

import { JwtIssuer } from '../../../src/services/JwtIssuer';
import { getTestContainer } from '../../helpers/getTestContainer';

describe('JwtIssuer', () => {
  const jwtIssuer = getTestContainer().get(JwtIssuer);

  describe('#apply', () => {
    describe('when the data is properly signed', () => {
      const email = 'test109"!#$%¨&U@gmail.com';

      it('generates a jwt', () => {
        const result = jwtIssuer.apply(email, '123');

        const decodedResult = jwt.decode(result);

        expect(decodedResult).to.have.property('email', email);
        expect(decodedResult).to.have.property('name', 'testU');
      });
    });
  });
});
