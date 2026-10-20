import { registerDecorator } from 'class-validator';
export function hasControlCharacters(value) {
    for (let i = 0; i < value.length; i += 1) {
        const code = value.charCodeAt(i);
        if (code <= 31 || code === 127)
            return true;
    }
    return false;
}
export function isSafeLink(value) {
    if (typeof value !== 'string' || !value || hasControlCharacters(value) || /\s/.test(value))
        return false;
    if (value.startsWith('/'))
        return !value.startsWith('//') && !value.includes('\\');
    try {
        const url = new URL(value);
        return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.hostname;
    }
    catch {
        return false;
    }
}
export function isHttpsUrl(value) {
    if (typeof value !== 'string' || !value || hasControlCharacters(value) || /\s/.test(value))
        return false;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && !!url.hostname;
    }
    catch {
        return false;
    }
}
function makeDecorator(name, check, defaultMessage) {
    return (options) => (object, propertyName) => registerDecorator({
        name,
        target: object.constructor,
        propertyName,
        options: { message: defaultMessage, ...options },
        validator: { validate: check },
    });
}
export const IsSafeLink = makeDecorator('isSafeLink', isSafeLink, 'Liên kết chỉ chấp nhận đường dẫn bắt đầu bằng / (không phải //) hoặc http/https');
export const IsHttpsUrl = makeDecorator('isHttpsUrl', isHttpsUrl, 'Địa chỉ phải là URL https');
//# sourceMappingURL=link-url.util.js.map