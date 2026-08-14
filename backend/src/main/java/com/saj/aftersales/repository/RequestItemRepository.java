package com.saj.aftersales.repository;

import com.saj.aftersales.entity.RequestItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequestItemRepository extends JpaRepository<RequestItem, Long> {

    List<RequestItem> findByServiceRequest_Id(Long serviceRequestId);

    void deleteByServiceRequest_Id(Long serviceRequestId);
}
