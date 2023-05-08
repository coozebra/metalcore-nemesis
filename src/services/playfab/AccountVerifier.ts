import { inject, injectable } from 'inversify';
import axios from 'axios';

import { Logger } from '../../types/ILogger';
import settings from '../../config/settings';

@injectable()
export class AccountVerifier {
  @inject('Logger') logger!: Logger;

  isValid = async (accountId: string): Promise<boolean> => {
    const { secretKey, titleId } = settings.playFab;
    const sourceUrl = `https://${titleId}.playfabapi.com/Server/GetUserAccountInfo`;

    const body = {
      PlayFabId: accountId,
    };

    const config = {
      headers: {
        'X-SecretKey': secretKey,
      },
    };

    try {
      const result = await axios.post(sourceUrl, body, config);

      if (result.status !== 200) {
        throw new Error(result.data);
      }

      return !!result.data.data;
    } catch (e: any) {
      const error = new Error('Invalid Params');
      error.name = 'InvalidParams';

      if (e.response.data.error === 'InvalidParams') throw error;

      this.logger.error(e);
      throw e;
    }
  };
}
