import { injectable } from 'inversify';

import { AccessKey } from '../../../types';

import { AccessKeyResponse } from '../../../types/IAccessKeyResponse';

@injectable()
export class AccessKeySerializer {
  apply(accessKeys: AccessKey[]): AccessKeyResponse {
    return {
      data: accessKeys.map((accessKey) => ({ key: accessKey.key })),
    };
  }
}
