import { registerDecorator } from 'class-validator';
export function Match(property, validationOptions) {
    return (object, propertyName) => {
        registerDecorator({
            name: 'match',
            target: object.constructor,
            propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value, args) {
                    const [related] = args.constraints;
                    return value === args.object[related];
                },
            },
        });
    };
}
//# sourceMappingURL=match.decorator.js.map