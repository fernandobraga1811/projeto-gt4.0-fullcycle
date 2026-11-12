import { describe, it, expect } from 'vitest';
import {
  createOrder,
  changeStatus,
  STATUS,
  ValidationError,
  InvalidTransitionError,
} from '../src/domain/order.js';

const validInput = () => ({
  customer: '  Maria Silva ',
  items: [
    { sku: 'A-1', quantity: 2, unitPriceCents: 1500 },
    { sku: 'B-2', quantity: 1, unitPriceCents: 999 },
  ],
});

describe('createOrder', () => {
  it('calcula o total em centavos e começa como CREATED', () => {
    const order = createOrder(validInput(), { id: 'p1', now: new Date('2026-11-11T10:00:00Z') });
    expect(order.totalCents).toBe(2 * 1500 + 999);
    expect(order.status).toBe(STATUS.CREATED);
    expect(order.customer).toBe('Maria Silva');
    expect(order.id).toBe('p1');
    expect(order.createdAt).toBe('2026-11-11T10:00:00.000Z');
  });

  it('gera um id quando não informado', () => {
    expect(createOrder(validInput()).id).toBeTruthy();
  });

  it.each([
    ['sem cliente', { ...validInput(), customer: '' }],
    ['cliente não string', { ...validInput(), customer: 42 }],
    ['sem itens', { ...validInput(), items: [] }],
    ['itens não é lista', { ...validInput(), items: 'x' }],
    ['item nulo', { ...validInput(), items: [null] }],
    ['sku vazio', { ...validInput(), items: [{ sku: ' ', quantity: 1, unitPriceCents: 10 }] }],
    ['quantidade zero', { ...validInput(), items: [{ sku: 'A', quantity: 0, unitPriceCents: 10 }] }],
    ['quantidade decimal', { ...validInput(), items: [{ sku: 'A', quantity: 1.5, unitPriceCents: 10 }] }],
    ['preço negativo', { ...validInput(), items: [{ sku: 'A', quantity: 1, unitPriceCents: -1 }] }],
  ])('rejeita entrada inválida: %s', (_nome, input) => {
    expect(() => createOrder(input)).toThrow(ValidationError);
  });

  it('rejeita entrada ausente', () => {
    expect(() => createOrder(undefined)).toThrow(ValidationError);
  });
});

describe('changeStatus', () => {
  const base = () => createOrder(validInput(), { now: new Date('2026-11-11T10:00:00Z') });

  it('percorre o fluxo feliz CREATED -> PAID -> SHIPPED -> DELIVERED', () => {
    let order = base();
    for (const next of ['PAID', 'SHIPPED', 'DELIVERED']) {
      order = changeStatus(order, next, new Date('2026-11-12T10:00:00Z'));
      expect(order.status).toBe(next);
    }
    expect(order.updatedAt).toBe('2026-11-12T10:00:00.000Z');
  });

  it('não altera o pedido original (imutável)', () => {
    const order = base();
    changeStatus(order, 'PAID');
    expect(order.status).toBe('CREATED');
  });

  it('permite cancelar um pedido pago', () => {
    const paid = changeStatus(base(), 'PAID');
    expect(changeStatus(paid, 'CANCELLED').status).toBe('CANCELLED');
  });

  it('bloqueia transição inválida', () => {
    expect(() => changeStatus(base(), 'SHIPPED')).toThrow(InvalidTransitionError);
  });

  it('bloqueia sair de um estado final', () => {
    const cancelled = changeStatus(base(), 'CANCELLED');
    expect(() => changeStatus(cancelled, 'PAID')).toThrow(InvalidTransitionError);
  });

  it('rejeita status desconhecido', () => {
    expect(() => changeStatus(base(), 'VOANDO')).toThrow(ValidationError);
  });
});
