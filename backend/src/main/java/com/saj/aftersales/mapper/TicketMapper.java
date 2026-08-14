package com.saj.aftersales.mapper;

import com.saj.aftersales.dto.TicketDto;
import com.saj.aftersales.entity.ZendeskTicket;
import org.springframework.stereotype.Component;

@Component
public class TicketMapper {

    public TicketDto toDto(ZendeskTicket entity) {
        return new TicketDto(entity.getId(), entity.getZendeskTicketId(),
                entity.getCustomer().getId(), entity.getCustomer().getName(),
                entity.getSubject(), entity.getRequesterEmail(), entity.getCreatedAt());
    }
}
