package com.saj.aftersales.dto;

import java.time.LocalDate;

public record DailyRequestCountDto(LocalDate date, int count) {
}
