import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import 'chartjs-adapter-date-fns';

import { CoinService, Coin } from './index/services/coin.service';
import {
  CurrencyRateService,
  CurrencyRateMap,
} from './index/services/currency-rate.service';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './index/index.page.html',
})
export default class IndexPage implements OnInit {
  private coinService = inject(CoinService);
  private rateService = inject(CurrencyRateService);

  // estado reactivo
  coins = signal<Coin[]>([]);
  selectedCoinIds = signal<Set<number>>(new Set());

  ratesMap = signal<CurrencyRateMap>({});

  chartData = signal<ChartConfiguration<'line'>['data']>({
    labels: [],
    datasets: [],
  });

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'yyyy-MM-dd',
        },
      },
    },
  };

  ngOnInit(): void {
    this.loadCoins();
  }

  private loadCoins(): void {
    this.coinService.getAllCoins().subscribe((coins) => {
      this.coins.set(coins);
    });
  }

  toggleCoin(coinId: number): void {
    const next = new Set(this.selectedCoinIds());

    if (next.has(coinId)) {
      next.delete(coinId);
    } else {
      next.add(coinId);
    }

    this.selectedCoinIds.set(next);
    this.fetchRates();
  }

  private fetchRates(): void {
    const ids = Array.from(this.selectedCoinIds());

    if (ids.length === 0) {
      this.chartData.set({ labels: [], datasets: [] });
      return;
    }

    this.rateService.getHistoryByCoinIds(ids).subscribe((map) => {
      this.ratesMap.set(map);
      this.buildChart();
    });
  }

  private buildChart(): void {
    const map = this.ratesMap();
    const datasets: ChartConfiguration<'line'>['data']['datasets'] = [];
    let labels: string[] = [];

    Object.entries(map).forEach(([coinId, rates]) => {
      if (!rates || rates.length === 0) return;

      if (labels.length === 0) {
        labels = rates.map((r) => r.rateDate);
      }

      const coin = this.coins().find((c) => c.id === Number(coinId));
      const label = coin ? `${coin.name} (${coin.code})` : `coin ${coinId}`;

      datasets.push({
        type: 'line',
        label,
        data: rates.map((r) => r.rateToUsd),
        tension: 0.25,
      });
    });

    this.chartData.set({
      labels,
      datasets,
    });
  }
}
