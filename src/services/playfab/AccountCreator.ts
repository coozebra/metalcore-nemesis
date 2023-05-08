import { inject, injectable } from 'inversify';
import axios from 'axios';

import { Logger } from '../../types/ILogger';
import settings from '../../config/settings';
import { CreateAccountDTO } from '../../dto/CreateAccountDTO';
import { IPlayFabLoginResponse, IPlayFabLoginTokenSerialized, ErrorResponse } from '../../types/playfab/PlayFabTypes';

@injectable()
export class AccountCreator {
  @inject('Logger') private logger: Logger;

  apply = async (dto: CreateAccountDTO): Promise<IPlayFabLoginTokenSerialized | ErrorResponse> => {
    const { email, displayName, password } = dto;

    const { titleId } = settings.playFab;

    const sourceUrl = `https://${titleId}.playfabapi.com/Client/RegisterPlayFabUser`;

    const body = {
      titleId: titleId,
      email: email,
      password: password,
      displayName: displayName,
      requireBothUsernameAndEmail: false,
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
