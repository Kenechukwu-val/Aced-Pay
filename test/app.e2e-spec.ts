import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect({
      status: 'ok',
      app: 'aced-pay',
    });
  });

  it('/plans (GET)', () => {
    return request(app.getHttpServer())
      .get('/plans')
      .expect(200)
      .expect([
        {
          id: 'basic',
          name: 'Basic',
          price: 5000,
          interval: 'month',
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 15000,
          interval: 'month',
        },
      ]);
  });

  it('/plans/:id (GET)', () => {
    return request(app.getHttpServer()).get('/plans/pro').expect(200).expect({
      id: 'pro',
      name: 'Pro',
      price: 15000,
      interval: 'month',
    });
  });

  it('/plans/:id (GET) - not found', () => {
    return request(app.getHttpServer())
      .get('/plans/non-existing')
      .expect(404)
      .expect({
        statusCode: 404,
        message: "Plan with id 'non-existing' not found",
        error: 'Not Found',
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
