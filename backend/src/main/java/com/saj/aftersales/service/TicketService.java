package com.saj.aftersales.service;

import com.saj.aftersales.dto.CreateTicketRequest;
import com.saj.aftersales.dto.TicketDto;
import com.saj.aftersales.entity.ZendeskTicket;
import com.saj.aftersales.exception.ConflictException;
import com.saj.aftersales.exception.NotFoundException;
import com.saj.aftersales.mapper.TicketMapper;
import com.saj.aftersales.repository.ZendeskTicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class TicketService {

    private final ZendeskTicketRepository ticketRepository;
    private final TicketMapper ticketMapper;

    public TicketService(ZendeskTicketRepository ticketRepository, TicketMapper ticketMapper) {
        this.ticketRepository = ticketRepository;
        this.ticketMapper = ticketMapper;
    }

    public TicketDto getByTicketId(String zendeskTicketId) {
        return ticketMapper.toDto(findEntity(zendeskTicketId));
    }

    ZendeskTicket findEntity(String zendeskTicketId) {
        return ticketRepository.findByZendeskTicketId(zendeskTicketId)
                .orElseThrow(() -> new NotFoundException("No ticket reference for " + zendeskTicketId));
    }

    @Transactional
    public TicketDto create(CreateTicketRequest request) {
        if (ticketRepository.existsByZendeskTicketId(request.zendeskTicketId())) {
            throw new ConflictException("A reference for ticket " + request.zendeskTicketId() + " already exists");
        }

        ZendeskTicket ticket = new ZendeskTicket();
        ticket.setZendeskTicketId(request.zendeskTicketId());
        ticket.setSubject(request.subject());
        ticket.setRequesterEmail(request.requesterEmail());
        return ticketMapper.toDto(ticketRepository.save(ticket));
    }
}
