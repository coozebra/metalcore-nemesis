import { inject, injectable } from 'inversify';
import axios from 'axios';

import { Logger } from '../../types/ILogger';
import settings from '../../config/settings';
import { UserLoginDTO } from '../../dto/UserLoginDTO';
import { IPlayFabLoginResponse, IPlayFabLoginTokenSerialized, ErrorResponse } from '../../types/playfab/PlayFabTypes';

const EMAIL_LOGIN_URL = 'Client/LoginWithEmailAddress';
const USERNAME_LOGIN_URL = 'Client/LoginWithPlayFab';

@injectable()
export class LoginAuthorizer {
  @inject('Logger') logger!: Logger;

  apply = async (dto: UserLoginDTO): Promise<IPlayFabLoginTokenSerialized | ErrorResponse> => {
    const { password, email, username } = dto;
    const { titleId } = settings.playFab;

    const sourceUrl = `https://${titleId}.playfabapi.com/${email ? EMAIL_LOGIN_URL : USERNAME_LOGIN_URL}`;

    const body = email
      ? {
          password: password,
          email: email,
          titleId: titleId,
        }
      : {
          password: password,
          username: username,
          titleId: titleId,
        };

    try {
      const result = await axios.post(sourceUrl, body);

      return this.serializeResponse(result.data.data);
    } catch (e: any) {
      if (!e.response) {
        this.logger.error(e);
        throw e;
      }

      return new ErrorResponse(e.response.status, e.response.data.errorMessage, e.response.data.error);
    }
  };

  private serializeResponse(data: Partial<IPlayFabLoginResponse>): IPlayFabLoginTokenSerialized {
    return {
      accountId: data.PlayFabId,
      sessionTicket: data.SessionTicket,
    };
  }
}
