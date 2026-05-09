/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let userId: string;
  let planId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  describe('User Registration & Login', () => {
    it('/users/register (POST) - create user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      token = response.body.accessToken;
      userId = response.body.user.id;
    });

    it('/users/register (POST) - duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      expect([400, 409]).toContain(response.status);
    });

    it('/users/login (POST) - successful login', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
    });

    it('/users/login (POST) - invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/users/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Plans CRUD', () => {
    it('/plans (GET) - get all plans', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('/plans (POST) - create plan', async () => {
      const response = await request(app.getHttpServer())
        .post('/plans')
        .send({
          name: 'Premium',
          price: 25000,
          interval: 'month',
        })
        .expect(201);

      planId = response.body.id;
      expect(response.body.name).toBe('Premium');
    });

    it('/plans/:id (GET) - get plan by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/plans/${planId}`)
        .expect(200);

      expect(response.body.name).toBe('Premium');
    });

    it('/plans/:id (GET) - not found', async () => {
      await request(app.getHttpServer())
        .get('/plans/non-existing-id')
        .expect(404);
    });

    it('/plans/:id (PUT) - update plan', async () => {
      const response = await request(app.getHttpServer())
        .put(`/plans/${planId}`)
        .send({
          price: 30000,
        })
        .expect(200);

      expect(response.body.price).toBe(30000);
    });
  });

  describe('Subscriptions', () => {
    it('/subscriptions (POST) - create subscription', async () => {
      const response = await request(app.getHttpServer())
        .post('/subscriptions')
        .send({
          userId: userId,
          planId: planId,
        })
        .expect(201);

      subscriptionId = response.body.id;
      expect(response.body.status).toBe('active');
    });

    it('/subscriptions (GET) - get all subscriptions', async () => {
      await request(app.getHttpServer()).get('/subscriptions').expect(200);
    });

    it('/subscriptions/user/:userId (GET) - get user subscriptions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/subscriptions/user/${userId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('/subscriptions/:id (GET) - get subscription by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/subscriptions/${subscriptionId}`)
        .expect(200);

      expect(response.body.id).toBe(subscriptionId);
    });

    it('/subscriptions/:id/cancel (POST) - cancel subscription', async () => {
      const response = await request(app.getHttpServer())
        .post(`/subscriptions/${subscriptionId}/cancel`)
        .expect(200);

      expect(response.body.status).toBe('cancelled');
    });
  });

  describe('Payments', () => {
    it('/payments (POST) - create payment', async () => {
      const response = await request(app.getHttpServer())
        .post('/payments')
        .send({
          subscriptionId: subscriptionId,
          amount: 25000,
          paymentMethod: 'card',
          transactionId: 'txn_123',
        })
        .expect(201);

      expect(response.body.status).toBe('completed');
    });

    it('/payments (GET) - get all payments', async () => {
      const response = await request(app.getHttpServer())
        .get('/payments')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('/payments/subscription/:id (GET) - get payments by subscription', async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments/subscription/${subscriptionId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
