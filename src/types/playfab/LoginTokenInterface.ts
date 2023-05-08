export interface LoginTokenInterface {
  IsSessionTicketExpired: boolean;
  UserInfo: {
    PlayFabId: string;
    Created: string;
    Username: string;
  };
}
