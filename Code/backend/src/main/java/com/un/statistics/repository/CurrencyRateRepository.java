package com.un.statistics.repository;

import com.un.statistics.model.CurrencyRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CurrencyRateRepository extends JpaRepository<CurrencyRate, Long> {
  List<CurrencyRate> findByCoinIdInOrderByRateDateAsc(List<Long> coinIds);
}
