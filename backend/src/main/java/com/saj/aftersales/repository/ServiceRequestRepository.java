package com.saj.aftersales.repository;

import com.saj.aftersales.entity.RequestStatus;
import com.saj.aftersales.entity.RequestTypeCode;
import com.saj.aftersales.entity.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {

    List<ServiceRequest> findByZendeskTicket_ZendeskTicketIdOrderByCreatedAtDesc(String zendeskTicketId);

    /** Guards user deletion — a technician with request history can't be hard-deleted (the FK
     * has no cascade), only deactivated. */
    boolean existsByTechnician_Id(Long technicianId);

    /** Backs the Warehouse/Manager/Technician/Overview dashboards: any combination of status
     * list, request-type list, created-date range, and a case-insensitive substring match on the
     * Zendesk ticket id — oldest first (a work queue, not a feed) — null/blank params mean "no
     * filter". */
    @Query("""
            select sr from ServiceRequest sr
            where (:statuses is null or sr.status in :statuses)
              and (:requestTypes is null or sr.requestType.code in :requestTypes)
              and (:from is null or sr.createdAt >= :from)
              and (:to is null or sr.createdAt <= :to)
              and (:ticketId is null or lower(sr.zendeskTicket.zendeskTicketId) like lower(concat('%', :ticketId, '%')))
            order by sr.createdAt asc
            """)
    List<ServiceRequest> search(@Param("statuses") List<RequestStatus> statuses,
                                 @Param("requestTypes") List<RequestTypeCode> requestTypes,
                                 @Param("from") Instant from,
                                 @Param("to") Instant to,
                                 @Param("ticketId") String ticketId);
}
