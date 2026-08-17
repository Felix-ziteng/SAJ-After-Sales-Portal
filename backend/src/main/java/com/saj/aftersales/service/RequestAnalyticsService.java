package com.saj.aftersales.service;

import com.saj.aftersales.dto.DailyRequestCountDto;
import com.saj.aftersales.dto.RequestAnalyticsDto;
import com.saj.aftersales.dto.TechnicianRequestCountDto;
import com.saj.aftersales.entity.RequestStatus;
import com.saj.aftersales.entity.RequestTypeCode;
import com.saj.aftersales.entity.ServiceRequest;
import com.saj.aftersales.repository.ServiceRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** Aggregates computed in Java over the same rows {@code GET /api/requests} would return for the
 * same date range — deliberately not raw SQL aggregation, so the numbers are guaranteed to match
 * what a Manager/Viewer sees if they open the Overview list with that same range, and so it never
 * has to reconcile date-truncation differences between H2 (tests) and MySQL (real). At v1's
 * request volume this is fast; if it ever isn't, the aggregation moves into the query, not before. */
@Service
@Transactional(readOnly = true)
public class RequestAnalyticsService {

    private final ServiceRequestRepository serviceRequestRepository;

    public RequestAnalyticsService(ServiceRequestRepository serviceRequestRepository) {
        this.serviceRequestRepository = serviceRequestRepository;
    }

    public RequestAnalyticsDto summarize(Instant from, Instant to) {
        List<ServiceRequest> requests = serviceRequestRepository.search(null, null, from, to, null);

        Map<RequestStatus, Integer> byStatus = new EnumMap<>(RequestStatus.class);
        Map<RequestTypeCode, Integer> byType = new EnumMap<>(RequestTypeCode.class);
        Map<String, Integer> byTechnician = new LinkedHashMap<>();
        Map<LocalDate, Integer> byDay = new TreeMap<>();

        int completed = 0;
        int cancelled = 0;
        double turnaroundDaysSum = 0;
        int turnaroundCount = 0;

        for (ServiceRequest sr : requests) {
            byStatus.merge(sr.getStatus(), 1, Integer::sum);
            byType.merge(sr.getRequestType().getCode(), 1, Integer::sum);
            byTechnician.merge(sr.getTechnician().getDisplayName(), 1, Integer::sum);
            byDay.merge(sr.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate(), 1, Integer::sum);

            if (sr.getStatus() == RequestStatus.WAREHOUSE_RECEIVED) {
                completed++;
                if (sr.getCompletedAt() != null) {
                    turnaroundDaysSum += Duration.between(sr.getCreatedAt(), sr.getCompletedAt()).toMinutes() / (60.0 * 24.0);
                    turnaroundCount++;
                }
            } else if (sr.getStatus() == RequestStatus.CANCELLED) {
                cancelled++;
            }
        }

        List<DailyRequestCountDto> volumeByDay = byDay.entrySet().stream()
                .map(e -> new DailyRequestCountDto(e.getKey(), e.getValue()))
                .toList();

        List<TechnicianRequestCountDto> byTechnicianSorted = byTechnician.entrySet().stream()
                .map(e -> new TechnicianRequestCountDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingInt(TechnicianRequestCountDto::count).reversed())
                .toList();

        return new RequestAnalyticsDto(
                requests.size(),
                requests.size() - completed - cancelled,
                completed,
                cancelled,
                turnaroundCount == 0 ? null : turnaroundDaysSum / turnaroundCount,
                byStatus,
                byType,
                volumeByDay,
                byTechnicianSorted);
    }
}
