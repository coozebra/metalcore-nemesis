import { inject, injectable } from 'inversify';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

import { Logger } from '../types/ILogger';
import Settings from '../types/Settings';

@injectable()
export class JwtIssuer {
  @inject('Logger') logger!: Logger;
  @inject('Settings') settings: Settings;

  apply = (email: string, accountId: string): string => {
    const { fieldId } = this.settings.zendesk;
    const name = email.replace(/@.*$/g, '').replace(/[^A-Za-z]+/g, '');

    const data = {
      email: email,
      name: name,
      user_fields: {
        [fieldId]: accountId,
      },
    };

    const token = jwt.sign(data, this.settings.jwtSecretKey, { jwtid: uuidv4(), expiresIn: '1d' });

    return token;
  };
}
