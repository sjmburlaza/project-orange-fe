import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateTradeInSessionRequest,
  TradeInBrand,
  TradeInCategory,
  TradeInConfig,
  TradeInDevice,
  TradeInSession,
  TradeInStorage,
  UpdateTradeInStepOneRequest,
  UpdateTradeInStepThreeRequest,
  UpdateTradeInStepTwoRequest,
} from '@orange/core/models';

@Injectable({ providedIn: 'root' })
export class TradeInApiService {
  private readonly http = inject(HttpClient);
  private readonly tradeInsUrl = '/api/trade-ins';
  private readonly sessionsUrl = '/api/trade-in-sessions';

  getConfig(): Observable<TradeInConfig> {
    return this.http.get<TradeInConfig>(`${this.tradeInsUrl}/config`);
  }

  getCategories(): Observable<TradeInCategory[]> {
    return this.http.get<TradeInCategory[]>(`${this.tradeInsUrl}/categories`);
  }

  getBrands(categoryCode?: string | null): Observable<TradeInBrand[]> {
    let params = new HttpParams();

    if (categoryCode) {
      params = params.set('categoryCode', categoryCode);
    }

    return this.http.get<TradeInBrand[]>(`${this.tradeInsUrl}/brands`, {
      params,
    });
  }

  getDevices(
    categoryCode?: string | null,
    brandCode?: string | null,
  ): Observable<TradeInDevice[]> {
    let params = new HttpParams();

    if (categoryCode) {
      params = params.set('categoryCode', categoryCode);
    }

    if (brandCode) {
      params = params.set('brandCode', brandCode);
    }

    return this.http.get<TradeInDevice[]>(`${this.tradeInsUrl}/devices`, {
      params,
    });
  }

  getStorages(deviceCode?: string | null): Observable<TradeInStorage[]> {
    let params = new HttpParams();

    if (deviceCode) {
      params = params.set('deviceCode', deviceCode);
    }

    return this.http.get<TradeInStorage[]>(`${this.tradeInsUrl}/storages`, {
      params,
    });
  }

  createSession(
    request: CreateTradeInSessionRequest = {},
  ): Observable<TradeInSession> {
    return this.http.post<TradeInSession>(this.sessionsUrl, request);
  }

  getSession(sessionId: string): Observable<TradeInSession> {
    return this.http.get<TradeInSession>(`${this.sessionsUrl}/${sessionId}`);
  }

  updateStepOne(
    sessionId: string,
    request: UpdateTradeInStepOneRequest,
  ): Observable<TradeInSession> {
    return this.http.patch<TradeInSession>(
      `${this.sessionsUrl}/${sessionId}/step-one`,
      request,
    );
  }

  updateStepTwo(
    sessionId: string,
    request: UpdateTradeInStepTwoRequest,
  ): Observable<TradeInSession> {
    return this.http.patch<TradeInSession>(
      `${this.sessionsUrl}/${sessionId}/step-two`,
      request,
    );
  }

  updateStepThree(
    sessionId: string,
    request: UpdateTradeInStepThreeRequest,
  ): Observable<TradeInSession> {
    return this.http.patch<TradeInSession>(
      `${this.sessionsUrl}/${sessionId}/step-three`,
      request,
    );
  }

  confirmSession(sessionId: string): Observable<TradeInSession> {
    return this.http.patch<TradeInSession>(
      `${this.sessionsUrl}/${sessionId}/confirm`,
      {},
    );
  }
}
