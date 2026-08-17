package com.saj.aftersales.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record BatchIdsRequest(@NotEmpty List<Long> ids) {
}
