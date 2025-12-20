package com.un.statistics.controller;

import com.un.statistics.model.CurrencyRate;
import com.un.statistics.services.CurrencyRateService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class PostCurrencyRate {

    private final CurrencyRateService currencyRateService;

    public PostCurrencyRate(CurrencyRateService currencyRateService) {
        this.currencyRateService = currencyRateService;
    }

    @PostMapping("/api/v1/coins/rates")
    public Map<Long, List<CurrencyRate>> getCurrencyHistory(
        @RequestBody List<Long> coinIds
        ) {
            return currencyRateService.getHistoryByCoinIds(coinIds);
        }
}
