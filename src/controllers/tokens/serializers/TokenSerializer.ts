// This implements the following standard:
// https://docs.opensea.io/docs/metadata-standards

import { injectable } from 'inversify';

import { Asset } from '../../../types';
import { Token, Attribute } from '../../../types/IToken';

@injectable()
export class TokenSerializer {
  serialize(asset: Asset): Token {
    return {
      name: asset.attributes.name as string,
      description: asset.attributes.description as string,
      image: asset.attributes.image as string,
      attributes: asset.attributes.attributes as Attribute[],
    };
  }
}
