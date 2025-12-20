package com.un.statistics.controller;

import com.un.statistics.model.Coin;
import com.un.statistics.repository.CoinRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class GetListCoins {

    private final CoinRepository coinRepository;

    public GetListCoins(CoinRepository coinRepository) {
        this.coinRepository = coinRepository;
    }

    @GetMapping("/api/v1/coin/list")
    public List<Coin> getAllCoins() {
        return coinRepository.findAll();
    }
}
