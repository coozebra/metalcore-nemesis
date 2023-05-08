export const userCreatedFixture = {
  code: 200,
  status: 'OK',
  data: {
    PlayFabId: 'XXXXXXXXXXXXXXXX',
    SessionTicket:
      'XXXXXXXXXXXXXXXX--XXXXXXXXXXXXXXXX-XXXXX-XXXXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX=',
    SettingsForUser: {
      NeedsAttribution: false,
      GatherDeviceInfo: true,
      GatherFocusInfo: true,
    },
  },
};

export const getUserAccountInfoFixture = {
  code: 200,
  status: 'OK',
  data: {
    UserInfo: {
      TitleInfo: {
        DisplayName: 'CornFlower',
      },
    },
  },
};

export const userNotFoundFixture = {
  code: 401,
  status: 'Unauthorized',
  error: 'AccountNotFound',
  errorCode: 1001,
  errorMessage: 'User not found',
};

export const emailAlreadyExistsFixture = {
  code: 400,
  status: 'BadRequest',
  error: 'EmailAddressNotAvailable',
  errorCode: 1006,
  errorMessage: 'Email address not available',
  errorDetails: {
    Email: ['Email address already exists. '],
  },
};

export const nonExpiredTicketAuth = {
  code: 200,
  status: 'OK',
  data: {
    UserInfo: {
      PlayFabId: 'XXXXXXXXXXXXXXXX',
      Created: '2022-04-01T14:06:04.733Z',
      Username: 'myUserName',
      TitleInfo: {},
      PrivateInfo: {
        Email: 'email@provider.com',
      },
    },
    IsSessionTicketExpired: false,
  },
};

export const expiredTicketAuth = {
  code: 200,
  status: 'OK',
  data: {
    UserInfo: {
      PlayFabId: 'XXXXXXXXXXXXXXXX',
      Created: '2022-04-01T14:06:04.733Z',
      Username: 'myUserName',
      TitleInfo: {},
      PrivateInfo: {
        Email: 'email@provider.com',
      },
    },
    IsSessionTicketExpired: true,
  },
};

export const invalidAuthTicket = {
  code: 400,
  status: 'BadRequest',
  error: 'InvalidSessionTicket',
  errorCode: 1100,
  errorMessage: 'InvalidSessionTicket',
};

export const invalidInputParams = {
  code: 400,
  status: 'BadRequest',
  error: 'InvalidParams',
  errorCode: 1000,
  errorMessage: 'Invalid input parameters',
  errorDetails: {},
};

export const loginFixture = {
  code: 200,
  status: 'OK',
  data: {
    PlayFabId: 'XXXXXXXXXXXXXXXX',
    SessionTicket:
      'XXXXXXXXXXXXXXXX--XXXXXXXXXXXXXXXX-XXXXX-XXXXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX=',
  },
};
