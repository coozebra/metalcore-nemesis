import Joi, { Schema } from 'joi';

export function testSchema(body: object, schema: Schema): boolean {
  try {
    Joi.assert(body, schema);
    return true;
  } catch (e) {
    return false;
  }
}
