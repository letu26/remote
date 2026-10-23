import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createOrderMac, queryOrderMac, type CreateOrderMacFields } from '../utils/zalopay-signature.util.js';

const SANDBOX_ENDPOINT = 'https://sb-openapi.zalopay.vn/v2/';
const REQUEST_TIMEOUT_MS = 10_000;

export interface ZaloPayConfig {
  appId: string;
  key1: string;
  key2: string;
  endpoint: string;
  callbackUrl: string;
  redirectUrl: string;
}

export interface GatewayCreateInput {
  appTransId: string;
  appUser: string;
  amount: number;
  description: string;
  embedData: string;
  item: string;
}

export interface GatewayCreateResult {
  returnCode: number;
  subReturnCode: number | null;
  message: string;
  orderUrl: string | null;
}

export interface GatewayQueryResult {
  returnCode: number;
  isProcessing: boolean;
  zpTransId: string | null;
  amount: number | null;
}

interface RawResponse {
  return_code?: number;
  return_message?: string;
  sub_return_code?: number;
  sub_return_message?: string;
  order_url?: string;
  is_processing?: boolean;
  zp_trans_id?: number | string;
  amount?: number;
}

/** Gọi API ZaloPay (tạo đơn, hỏi trạng thái). Chỉ làm việc với HTTP và chữ ký, không chứa quy tắc nghiệp vụ. */
@Injectable()
export class ZaloPayGateway {
  private readonly logger = new Logger(ZaloPayGateway.name);

  constructor(private readonly config: ConfigService) {}

  /** null nếu chưa cấu hình đủ khóa. */
  getConfig(): ZaloPayConfig | null {
    const appId = this.config.get<string>('ZLP_APP_ID')?.trim();
    const key1 = this.config.get<string>('ZLP_KEY1')?.trim();
    const key2 = this.config.get<string>('ZLP_KEY2')?.trim();
    if (!appId || !key1 || !key2) return null;
    const endpoint = this.config.get<string>('ZLP_ENDPOINT')?.trim() || SANDBOX_ENDPOINT;
    return {
      appId,
      key1,
      key2,
      endpoint: endpoint.endsWith('/') ? endpoint : `${endpoint}/`,
      // Có thể để trống khi chạy local chưa có tunnel: khi đó trạng thái được lấy bằng cách hỏi ZaloPay (QueryOrder).
      callbackUrl: this.config.get<string>('ZLP_CALLBACK_URL')?.trim() ?? '',
      redirectUrl: this.config.get<string>('ZLP_REDIRECT_URL')?.trim() ?? '',
    };
  }

  async createOrder(cfg: ZaloPayConfig, input: GatewayCreateInput): Promise<GatewayCreateResult> {
    const appTime = Date.now();
    const macFields: CreateOrderMacFields = {
      appId: cfg.appId,
      appTransId: input.appTransId,
      appUser: input.appUser,
      amount: input.amount,
      appTime,
      embedData: input.embedData,
      item: input.item,
    };
    // Đúng theo mã mẫu chính thức của ZaloPay: tham số gửi qua query string, thân rỗng.
    const params = new URLSearchParams({
      app_id: cfg.appId,
      app_trans_id: input.appTransId,
      app_user: input.appUser,
      app_time: String(appTime),
      amount: String(input.amount),
      item: input.item,
      embed_data: input.embedData,
      description: input.description,
      bank_code: 'zalopayapp',
      mac: createOrderMac(macFields, cfg.key1),
    });
    if (cfg.callbackUrl) params.set('callback_url', cfg.callbackUrl);
    const raw = await this.post(`${cfg.endpoint}create?${params.toString()}`, undefined);
    return {
      returnCode: raw.return_code ?? 0,
      subReturnCode: raw.sub_return_code ?? null,
      message: raw.sub_return_message ?? raw.return_message ?? '',
      orderUrl: raw.order_url ?? null,
    };
  }

  async queryOrder(cfg: ZaloPayConfig, appTransId: string): Promise<GatewayQueryResult> {
    const body = new URLSearchParams({
      app_id: cfg.appId,
      app_trans_id: appTransId,
      mac: queryOrderMac(cfg.appId, appTransId, cfg.key1),
    });
    const raw = await this.post(`${cfg.endpoint}query`, body);
    return {
      returnCode: raw.return_code ?? 0,
      isProcessing: raw.is_processing === true,
      zpTransId: raw.zp_trans_id !== undefined ? String(raw.zp_trans_id) : null,
      amount: typeof raw.amount === 'number' ? raw.amount : null,
    };
  }

  private async post(url: string, body: URLSearchParams | undefined): Promise<RawResponse> {
    const response = await fetch(url, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : undefined,
      body: body?.toString(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      this.logger.error(`ZaloPay HTTP ${response.status} for ${new URL(url).pathname}`);
      throw new Error(`ZaloPay trả về HTTP ${response.status}`);
    }
    return (await response.json()) as RawResponse;
  }
}
