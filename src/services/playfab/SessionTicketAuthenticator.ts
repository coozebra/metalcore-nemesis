import { inject, injectable } from 'inversify';
import axios from 'axios';

import settings from '../../config/settings';
import { Logger } from '../../types/ILogger';
import { ITicketAuthResponse, ITicketAuthResponseSerialized, ErrorResponse } from '../../types/playfab/PlayFabTypes';

@injectable()
export class SessionTicketAuthenticator {
  @inject('Logger') logger!: Logger;

  apply = async (token?: string): Promise<ITicketAuthResponseSerialized> => {
    if (!token) {
      throw new Error('No authorization header');
    }

    const { secretKey, titleId } = settings.playFab;
    const sourceUrl = `https://${titleId}.playfabapi.com/Server/AuthenticateSessionTicket`;

    const body = {
      SessionTicket: token,
    };

    const config = {
      headers: {
        'X-SecretKey': secretKey,
      },
    };

    try {
      const result = await axios.post(sourceUrl, body, config);

      return this.serializeResponse(result.data.data);
    } catch (e: any) {
      if (!e.response) {
        this.logger.error(e);
        throw e;
      }

      const status = e.response.data.error === 'InvalidSessionTicket' ? 401 : 400;

      throw new ErrorResponse(status, e.response.data.errorMessage, e.response.data.error);
    }
  };

  private serializeResponse(response: ITicketAuthResponse): ITicketAuthResponseSerialized {
    return {
      isSessionTicketExpired: response.IsSessionTicketExpired,
      userInfo: {
        accountId: response.UserInfo.PlayFabId,
        created: response.UserInfo.Created,
        username: response.UserInfo.Username,
      },
    };
  }
}
