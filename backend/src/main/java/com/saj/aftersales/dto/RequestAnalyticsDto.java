package com.saj.aftersales.dto;

import com.saj.aftersales.entity.RequestStatus;
import com.saj.aftersales.entity.RequestTypeCode;

import java.util.List;
import java.util.Map;

/** The management/oversight summary — every number here is scoped to whatever date range the
 * caller passed (or all-time if omitted), so it always agrees with the request list you'd get
 * back from the same range on {@code GET /api/requests}. */
public record RequestAnalyticsDto(
        int totalRequests,
        int openRequests,
        int completedRequests,
        int cancelledRequests,
        /** Average days from creation to WAREHOUSE_RECEIVED, across completed requests in range.
         * Null when none have completed yet — there's nothing to average. */
        Double avgTurnaroundDays,
        Map<RequestStatus, Integer> byStatus,
        Map<RequestTypeCode, Integer> byType,
        List<DailyRequestCountDto> volumeByDay,
        /** Sorted busiest-first. */
        List<TechnicianRequestCountDto> byTechnician
) {
}
