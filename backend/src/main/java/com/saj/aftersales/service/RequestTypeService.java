package com.saj.aftersales.service;

import com.saj.aftersales.dto.RequestTypeDto;
import com.saj.aftersales.mapper.RequestTypeMapper;
import com.saj.aftersales.repository.RequestTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class RequestTypeService {

    private final RequestTypeRepository requestTypeRepository;
    private final RequestTypeMapper requestTypeMapper;

    public RequestTypeService(RequestTypeRepository requestTypeRepository, RequestTypeMapper requestTypeMapper) {
        this.requestTypeRepository = requestTypeRepository;
        this.requestTypeMapper = requestTypeMapper;
    }

    public List<RequestTypeDto> list() {
        return requestTypeRepository.findAll().stream().map(requestTypeMapper::toDto).toList();
    }
}
