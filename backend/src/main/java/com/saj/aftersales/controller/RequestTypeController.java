package com.saj.aftersales.controller;

import com.saj.aftersales.dto.RequestTypeDto;
import com.saj.aftersales.service.RequestTypeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/request-types")
public class RequestTypeController {

    private final RequestTypeService requestTypeService;

    public RequestTypeController(RequestTypeService requestTypeService) {
        this.requestTypeService = requestTypeService;
    }

    @GetMapping
    public List<RequestTypeDto> list() {
        return requestTypeService.list();
    }
}
