export function getDuplicateEntryValue(error) {
    const driver = (error?.driverError ?? error);
    if (driver?.code !== 'ER_DUP_ENTRY' && driver?.errno !== 1062)
        return null;
    const match = /Duplicate entry '(.*)' for key/s.exec(driver.sqlMessage ?? '');
    return match?.[1] ?? '';
}
function driverOf(error) {
    return (error?.driverError ?? error);
}
export function getDuplicateKeyName(error) {
    const driver = driverOf(error);
    if (driver?.code !== 'ER_DUP_ENTRY' && driver?.errno !== 1062)
        return null;
    const match = /for key '([^']*)'/.exec(driver.sqlMessage ?? '');
    return match ? (match[1].split('.').pop() ?? '') : '';
}
export function isForeignKeyReferencedError(error) {
    const driver = driverOf(error);
    return driver?.code === 'ER_ROW_IS_REFERENCED_2' || driver?.errno === 1451;
}
export function isForeignKeyMissingError(error) {
    const driver = driverOf(error);
    return driver?.code === 'ER_NO_REFERENCED_ROW_2' || driver?.errno === 1452;
}
export function getDuplicateInfo(error) {
    const value = getDuplicateEntryValue(error);
    if (value === null)
        return null;
    const driver = driverOf(error);
    const match = /for key '([^']*)'/.exec(driver?.sqlMessage ?? '');
    const table = match ? (match[1].split('.')[0] ?? '') : '';
    return { table, value };
}
export function toBool(value) {
    return value === true || value === 1 || value === '1' || value === 'true';
}
//# sourceMappingURL=db-error.util.js.map