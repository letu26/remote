import { Transform } from 'class-transformer';
export const Trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
export const TrimLowerCase = () => Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value));
export const ToBoolean = () => Transform(({ value }) => {
    if (value === 'true' || value === true)
        return true;
    if (value === 'false' || value === false)
        return false;
    return value;
});
//# sourceMappingURL=transforms.js.map