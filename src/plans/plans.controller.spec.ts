import { Test, TestingModule } from '@nestjs/testing';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { NotFoundException } from '@nestjs/common';

describe('PlansController', () => {
  let controller: PlansController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlansController],
      providers: [PlansService],
    }).compile();

    controller = module.get<PlansController>(PlansController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of plans', () => {
      expect(controller.findAll()).toEqual([
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
  });

  describe('findOne', () => {
    it('should return a plan by id', () => {
      expect(controller.findOne('pro')).toEqual({
        id: 'pro',
        name: 'Pro',
        price: 15000,
        interval: 'month',
      });
    });

    it('should throw NotFoundException for non-existing plan id', () => {
      expect(() => controller.findOne('non-existing')).toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create and return a new plan', () => {
      const newPlan = {
        id: 'premium',
        name: 'Premium',
        price: 25000,
        interval: 'month' as const,
      };
      expect(controller.create(newPlan)).toEqual(newPlan);
    });
  });
});
