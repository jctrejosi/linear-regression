import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CurrencyRate {
  id: number;
  coinId: number;
  rateToUsd: number;
  rateToCo: number;
  rateDate: string;
  origin: string;
}

export type CurrencyRateMap = Record<number, CurrencyRate[]>;

@Injectable({
  providedIn: 'root',
})
export class CurrencyRateService {
  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/v1/coins/rates';

  getHistoryByCoinIds(coinIds: number[]): Observable<CurrencyRateMap> {
    return this.http.post<CurrencyRateMap>(this.apiUrl, coinIds);
  }
}
