import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { RegisterDto } from '../../auth/dtos/auth.dtos.js';
import { UpdateProfileDto } from './user.dtos.js';

const base = { email: 'a@b.co', phone: '0912345678', password: '123456', confirmPassword: '123456', acceptTerms: true };

async function registerErrors(fullName: unknown): Promise<string[]> {
  const errors = await validate(plainToInstance(RegisterDto, { ...base, fullName }), { whitelist: true });
  return errors.filter((e) => e.property === 'fullName').flatMap((e) => Object.values(e.constraints ?? {}));
}
async function profileErrors(fullName: unknown): Promise<string[]> {
  const errors = await validate(plainToInstance(UpdateProfileDto, { fullName }), { whitelist: true });
  return errors.filter((e) => e.property === 'fullName').flatMap((e) => Object.values(e.constraints ?? {}));
}

describe.each([
  ['RegisterDto', registerErrors],
  ['UpdateProfileDto', profileErrors],
])('họ tên (%s)', (_name, check) => {
  it.each(['Nguyễn Văn Nam', 'Lê Thị Bích Ngọc', 'Đặng Khánh Linh', 'Nguyễn T. Lan', "O'Brien", 'Anne-Marie', 'Tú', 'A'.repeat(25)])(
    'chấp nhận %s',
    async (name) => expect(await check(name)).toEqual([]),
  );

  it.each(['12345', 'abc123', 'Nam 2', '@@', 'A_B', '-Nam', 'Nam<script>'])('từ chối %s (có số hoặc ký tự đặc biệt)', async (name) => {
    expect(await check(name)).toContain('Họ tên chỉ được gồm chữ cái, không chứa số hoặc ký tự đặc biệt');
  });

  it('từ chối quá ngắn (1 ký tự) và quá dài (26 ký tự)', async () => {
    expect(await check('A')).toContain('Họ tên phải từ 2 đến 25 ký tự');
    expect(await check('A'.repeat(26))).toContain('Họ tên phải từ 2 đến 25 ký tự');
  });
});
