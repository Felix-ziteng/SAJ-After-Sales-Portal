package com.saj.aftersales.exception;

/** For request-shape validation that depends on another field's value, so bean validation
 * annotations alone can't express it (e.g. "productId required when requestType=REPLACEMENT"). */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
