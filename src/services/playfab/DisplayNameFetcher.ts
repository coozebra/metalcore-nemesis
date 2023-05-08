import axios from 'axios';
import { inject, injectable } from 'inversify';

import { Logger } from '../../types/ILogger';
import settings from '../../config/settings';
import { IPlayFabUserAccountInfoResponse } from '../../types/playfab/PlayFabTypes';

@injectable()
export class DisplayNameFetcher {
  @inject('Logger') private logger: Logger;

  apply = async (accountId: string): Promise<string> => {
    const { titleId, secretKey } = settings.playFab;

    const sourceUrl = `https://${titleId}.playfabapi.com/Server/GetUserAccountInfo`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'X-SecretKey': secretKey,
      },
    };

    const data = {
      PlayFabId: accountId,
    };

    try {
      const result = await axios.post(sourceUrl, data, config);

      return this.serializeResponse(result.data.data);
    } catch (e: any) {
      if (!e.response) {
        this.logger.error(e);
        throw e;
      }

      return undefined;
    }
  };

  private serializeResponse(data: IPlayFabUserAccountInfoResponse): string {
    return data.UserInfo.TitleInfo.DisplayName;
  }
}
