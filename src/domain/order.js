import { randomUUID } from 'node:crypto';

export const STATUS = Object.freeze({
  CREATED: 'CREATED',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
});

// Maquina de estados do pedido: de cada status, para quais se pode ir.
const TRANSITIONS = Object.freeze({
  CREATED: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
});

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class InvalidTransitionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidTransitionError';
  }
}

function validateCustomer(customer) {
  if (typeof customer !== 'string' || customer.trim().length < 2) {
    throw new ValidationError('customer deve ter ao menos 2 caracteres');
  }
  return customer.trim();
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('items deve ser uma lista com ao menos 1 item');
  }
  return items.map((item, i) => {
    if (!item || typeof item.sku !== 'string' || item.sku.trim() === '') {
      throw new ValidationError(`items[${i}].sku é obrigatório`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new ValidationError(`items[${i}].quantity deve ser inteiro >= 1`);
    }
    if (!Number.isInteger(item.unitPriceCents) || item.unitPriceCents < 0) {
      throw new ValidationError(`items[${i}].unitPriceCents deve ser inteiro >= 0`);
    }
    return {
      sku: item.sku.trim(),
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
    };
  });
}

// Valores em centavos (inteiros) para evitar erro de ponto flutuante.
export function createOrder(input, { id = randomUUID(), now = new Date() } = {}) {
  const customer = validateCustomer(input?.customer);
  const items = validateItems(input?.items);
  const totalCents = items.reduce((sum, i) => sum + i.quantity * i.unitPriceCents, 0);
  const timestamp = now.toISOString();
  return {
    id,
    customer,
    items,
    totalCents,
    status: STATUS.CREATED,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function changeStatus(order, nextStatus, now = new Date()) {
  if (!Object.hasOwn(TRANSITIONS, nextStatus)) {
    throw new ValidationError(`status inválido: ${nextStatus}`);
  }
  if (!TRANSITIONS[order.status].includes(nextStatus)) {
    throw new InvalidTransitionError(
      `transição ${order.status} -> ${nextStatus} não permitida`,
    );
  }
  return { ...order, status: nextStatus, updatedAt: now.toISOString() };
}
