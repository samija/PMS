import { Request, Response, NextFunction } from 'express';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError as ClassValidationError } from 'class-validator';
import { ValidationError } from '../../domain/exceptions/AppError.js';

type ClassConstructor<T> = new (...args: any[]) => T;

export class ValidationMiddleware {
  static validate<T extends object>(dtoClass: ClassConstructor<T>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const dto = plainToClass(dtoClass, req.body);
        const errors = await validate(dto);

        if (errors.length > 0) {
          const formattedErrors = errors.map((error: ClassValidationError) => ({
            field: error.property,
            constraints: error.constraints,
            value: error.value,
          }));

          const errorMessage = formattedErrors
            .map(e => Object.values(e.constraints || {}).join(', '))
            .join('; ');

          throw new ValidationError(`Validation failed: ${errorMessage}`, formattedErrors);
        }

        // Replace req.body with validated DTO
        req.body = dto;
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
