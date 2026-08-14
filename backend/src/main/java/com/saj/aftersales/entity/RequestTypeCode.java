package com.saj.aftersales.entity;

/**
 * Only the shape needed to look up a {@link RequestType} row and label the UI — actual workflow
 * behavior (approval / confirmation gates) comes entirely from that row's flags, never from a
 * switch on this code. Adding Return, Repair, Upgrade, Loaner, or Warranty later means a new
 * enum value plus a seed migration, not new branching logic.
 */
public enum RequestTypeCode {
    REPLACEMENT,
    PARTS
}
