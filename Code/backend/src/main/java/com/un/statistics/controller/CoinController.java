package com.un.statistics.controller;

import com.un.statistics.model.Coin;
import com.un.statistics.repository.CoinRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class CoinController {

    private final CoinRepository coinRepository;

    public CoinController(CoinRepository coinRepository) {
        this.coinRepository = coinRepository;
    }

    @GetMapping("/api/getAllCoins")
    public List<Coin> getAllCoins() {
        return coinRepository.findAll();
    }
}
