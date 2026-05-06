import { Test, TestingModule } from '@nestjs/testing';
import { PlansService } from './plans.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PlansService', () => {
  let service: PlansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlansService],
    }).compile();

    service = module.get<PlansService>(PlansService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of plans', () => {
      expect(service.findAll()).toEqual([
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
      expect(service.findOne('basic')).toEqual({
        id: 'basic',
        name: 'Basic',
        price: 5000,
        interval: 'month',
      });
    });

    it('should throw NotFoundException for non-existing plan id', () => {
      expect(() => service.findOne('non-existing')).toThrow(NotFoundException);
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
      expect(service.create(newPlan)).toEqual(newPlan);
    });
  });

  it('should throw ConflictException when creating a plan with an existing id', () => {
    const duplicatePan = {
      id: 'basic',
      name: 'Basic Duplicate',
      price: 7000,
      interval: 'month' as const,
    };
    expect(() => service.create(duplicatePan)).toThrow(ConflictException);
  });
});
