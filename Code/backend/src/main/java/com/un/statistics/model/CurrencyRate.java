package com.un.statistics.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "currency_rate")
public class CurrencyRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "coin_id", nullable = false)
    private Long coinId;

    @Column(name = "rate_to_usd", nullable = false, precision = 18, scale = 8)
    private BigDecimal rateToUsd;

    @Column(name = "rate_to_co", nullable = false, precision = 18, scale = 8)
    private BigDecimal rateToCo;

    @Column(name = "rate_date", nullable = false)
    private OffsetDateTime rateDate;

    @Column(name = "origin", nullable = false)
    private String origin;

    /* getters y setters */

    public Long getId() {
        return id;
    }

    public Long getCoinId() {
        return coinId;
    }

    public void setCoinId(Long coinId) {
        this.coinId = coinId;
    }

    public BigDecimal getRateToUsd() {
        return rateToUsd;
    }

    public void setRateToUsd(BigDecimal rateToUsd) {
        this.rateToUsd = rateToUsd;
    }

    public BigDecimal getRateToCo() {
        return rateToCo;
    }

    public void setRateToCo(BigDecimal rateToCo) {
        this.rateToCo = rateToCo;
    }

    public OffsetDateTime getRateDate() {
        return rateDate;
    }

    public void setRateDate(OffsetDateTime rateDate) {
        this.rateDate = rateDate;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }
}
