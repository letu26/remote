import { registerDecorator, type ValidationArguments, type ValidationOptions } from 'class-validator';

/** Trường phải bằng giá trị của trường khác (vd confirmPassword = password). */
export function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'match',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [related] = args.constraints as [string];
          return value === (args.object as Record<string, unknown>)[related];
        },
      },
    });
  };
}
