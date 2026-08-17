package com.saj.aftersales.mapper;

import com.saj.aftersales.dto.AuditLogDto;
import com.saj.aftersales.entity.ActorType;
import com.saj.aftersales.entity.AuditLog;
import org.springframework.stereotype.Component;

@Component
public class AuditLogMapper {

    public AuditLogDto toDto(AuditLog entity) {
        boolean isCustomer = entity.getActorType() == ActorType.CUSTOMER;
        return new AuditLogDto(
                entity.getId(),
                // Customer actions have no staff user — recordCustomerAction stashes the typed
                // signature name in actorRole instead, since there's no other slot for it.
                isCustomer ? entity.getActorRole() : entity.getActorUser().getDisplayName(),
                isCustomer ? "Customer" : entity.getActorRole(),
                entity.getActorType().name(),
                entity.getAction(),
                entity.getPreviousStatus(),
                entity.getNewStatus(),
                entity.getComment(),
                entity.getCreatedAt());
    }
}
