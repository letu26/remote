import { ValidationPipe, type ValidationError } from '@nestjs/common';
import { ValidationException } from '../exceptions/validation.exception.js';
import type { ErrorDetail } from '../exceptions/error-codes.js';

function flatten(errors: ValidationError[], parent = ''): ErrorDetail[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.values(error.constraints ?? {})
      .slice(0, 1)
      .map((message) => ({ field, message }));
    return [...own, ...flatten(error.children ?? [], field)];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errors) => new ValidationException(flatten(errors)),
  });
}
