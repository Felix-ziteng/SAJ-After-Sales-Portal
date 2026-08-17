package com.saj.aftersales.service;

import com.saj.aftersales.auth.AuthenticatedUser;
import com.saj.aftersales.dto.AuditLogDto;
import com.saj.aftersales.entity.ActorType;
import com.saj.aftersales.entity.AuditLog;
import com.saj.aftersales.entity.RequestStatus;
import com.saj.aftersales.entity.ServiceRequest;
import com.saj.aftersales.entity.UserEntity;
import com.saj.aftersales.mapper.AuditLogMapper;
import com.saj.aftersales.repository.AuditLogRepository;
import com.saj.aftersales.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** The only writer of {@code audit_logs} rows — every other class that needs one calls in here
 * rather than touching {@link AuditLogRepository} directly, so "insert-only, never edited" stays
 * true by construction. */
@Service
@Transactional(readOnly = true)
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final AuditLogMapper auditLogMapper;

    public AuditLogService(AuditLogRepository auditLogRepository, UserRepository userRepository,
                            AuditLogMapper auditLogMapper) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.auditLogMapper = auditLogMapper;
    }

    public List<AuditLogDto> listForRequest(Long serviceRequestId) {
        return auditLogRepository.findByServiceRequest_IdOrderByCreatedAtAsc(serviceRequestId)
                .stream().map(auditLogMapper::toDto).toList();
    }

    @Transactional
    public void record(ServiceRequest request, AuthenticatedUser actor, String action,
                        RequestStatus previousStatus, RequestStatus newStatus, String comment, String ipAddress) {
        UserEntity actorUser = userRepository.getReferenceById(Long.valueOf(actor.id()));

        AuditLog log = new AuditLog();
        log.setServiceRequest(request);
        log.setActorUser(actorUser);
        log.setActorType(ActorType.USER);
        log.setActorRole(String.join(",", actor.roles()));
        log.setAction(action);
        log.setPreviousStatus(previousStatus);
        log.setNewStatus(newStatus);
        log.setComment(comment);
        log.setIpAddress(ipAddress);
        auditLogRepository.save(log);
    }

    /** For actions taken from the public {@code /confirm/{token}} page — there's no staff
     * {@link AuthenticatedUser} behind those, just whatever name the customer typed in. */
    @Transactional
    public void recordCustomerAction(ServiceRequest request, String signatureName, String action,
                                      RequestStatus previousStatus, RequestStatus newStatus, String comment, String ipAddress) {
        AuditLog log = new AuditLog();
        log.setServiceRequest(request);
        log.setActorType(ActorType.CUSTOMER);
        log.setActorRole(signatureName);
        log.setAction(action);
        log.setPreviousStatus(previousStatus);
        log.setNewStatus(newStatus);
        log.setComment(comment);
        log.setIpAddress(ipAddress);
        auditLogRepository.save(log);
    }
}
