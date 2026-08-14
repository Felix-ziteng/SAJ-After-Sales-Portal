package com.saj.aftersales.entity;

/**
 * The full v1 state set (see Phase 0 blueprint, Fig. 3). Phase 3 only ever writes
 * {@link #DRAFT} — every other transition is owned by the workflow engine landing in Phase 4+.
 */
public enum RequestStatus {
    DRAFT,
    SUBMITTED,
    PENDING_MANAGER_APPROVAL,
    REJECTED,
    PENDING_CUSTOMER_CONFIRMATION,
    CUSTOMER_CONFIRMED,
    READY_TO_SHIP,
    ON_HOLD,
    CANCELLED,
    WAREHOUSE_RECEIVED
}
