import 'reflect-metadata';

import { expect } from 'chai';
import request from 'supertest';
import Server from '../../src/lib/Server';
import { getTestContainer } from '../helpers/getTestContainer';

describe('HealthController', () => {
  describe('GET /health', () => {
    it('returns pong', async () => {
      const server = getTestContainer().get(Server).app;

      const res = await request(server).get('/health');

      expect(res.status).to.eql(200);
      expect(res.text).to.eql('pong');
    });
  });
});
