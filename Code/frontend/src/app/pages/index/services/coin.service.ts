import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Coin {
  id: number;
  code: string;
  name: string;
  symbol: string;
}

@Injectable({
  providedIn: 'root',
})
export class CoinService {
  private http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/v1/coin/list';

  getAllCoins(): Observable<Coin[]> {
    return this.http.get<Coin[]>(this.apiUrl);
  }
}
