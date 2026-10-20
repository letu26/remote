interface DriverError {
  code?: string;
  errno?: number;
  sqlMessage?: string;
}

/** Trả về giá trị bị trùng nếu là lỗi duplicate key của MySQL, ngược lại null. */
export function getDuplicateEntryValue(error: unknown): string | null {
  const driver = ((error as { driverError?: DriverError } | null)?.driverError ?? error) as DriverError | undefined;
  if (driver?.code !== 'ER_DUP_ENTRY' && driver?.errno !== 1062) return null;
  const match = /Duplicate entry '(.*)' for key/s.exec(driver.sqlMessage ?? '');
  return match?.[1] ?? '';
}

function driverOf(error: unknown): DriverError | undefined {
  return ((error as { driverError?: DriverError } | null)?.driverError ?? error) as DriverError | undefined;
}

/** Tên chỉ mục bị trùng (ví dụ `uq_products_code`) nếu là lỗi duplicate key, ngược lại null. */
export function getDuplicateKeyName(error: unknown): string | null {
  const driver = driverOf(error);
  if (driver?.code !== 'ER_DUP_ENTRY' && driver?.errno !== 1062) return null;
  const match = /for key '([^']*)'/.exec(driver.sqlMessage ?? '');
  return match ? (match[1].split('.').pop() ?? '') : '';
}

/** Xóa/sửa bản ghi đang bị bảng khác tham chiếu (khóa ngoại). */
export function isForeignKeyReferencedError(error: unknown): boolean {
  const driver = driverOf(error);
  return driver?.code === 'ER_ROW_IS_REFERENCED_2' || driver?.errno === 1451;
}

/** Ghi bản ghi tham chiếu tới khóa ngoại không tồn tại. */
export function isForeignKeyMissingError(error: unknown): boolean {
  const driver = driverOf(error);
  return driver?.code === 'ER_NO_REFERENCED_ROW_2' || driver?.errno === 1452;
}

export interface DuplicateInfo {
  table: string;
  value: string;
}

/**
 * Bảng và giá trị bị trùng. Không dựa vào tên chỉ mục vì tên có thể là mã băm do TypeORM sinh
 * (IDX_...) chứ không phải uq_... như file SQL.
 */
export function getDuplicateInfo(error: unknown): DuplicateInfo | null {
  const value = getDuplicateEntryValue(error);
  if (value === null) return null;
  const driver = driverOf(error);
  const match = /for key '([^']*)'/.exec(driver?.sqlMessage ?? '');
  const table = match ? (match[1].split('.')[0] ?? '') : '';
  return { table, value };
}

/** Cờ tinyint/EXISTS từ SQL thô có thể về dạng số, chuỗi '0'/'1' hoặc boolean; Boolean('0') là true nên không dùng trực tiếp. */
export function toBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true';
}
