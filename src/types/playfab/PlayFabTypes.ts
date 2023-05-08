export interface IPlayFabLoginResponse {
  PlayFabId: string;
  SessionTicket: string;
}

export interface IPlayFabLoginTokenSerialized {
  accountId: string;
  sessionTicket: string;
}

export interface ITicketAuthResponse {
  IsSessionTicketExpired: boolean;
  UserInfo: {
    PlayFabId: string;
    Created: string;
    Username: string;
  };
}

export interface ITicketAuthResponseSerialized {
  isSessionTicketExpired: boolean;
  userInfo: {
    accountId: string;
    created: string;
    username: string;
  };
}

export class ErrorResponse extends Error {
  title: string;
  status: number;

  constructor(status: number, message: string, title: string) {
    super(message);

    this.status = status;
    this.title = title;
  }
}

export interface IPlayFabUserAccountInfoResponse {
  UserInfo: {
    PlayFabId: string;
    Created: string;
    TitleInfo: {
      DisplayName: string;
      Origination: string;
      Created: string;
      LastLogin: string;
      FirstLogin: string;
      isBanned: boolean;
      TitlePlayerAccount: {
        Id: string;
        Type: string;
        TypeString: string;
      };
    };
    PrivateInfo: {
      Email: string;
    };
  };
}
