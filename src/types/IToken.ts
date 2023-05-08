type URL = string;

export type Attribute = {
  display_type?: string;
  trait_type: string;
  value: number | string;
};

export interface Token {
  description: string;
  image: URL;
  name: string;
  attributes: Attribute[];
}
