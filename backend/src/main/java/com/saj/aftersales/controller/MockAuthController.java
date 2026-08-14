package com.saj.aftersales.controller;

import com.saj.aftersales.auth.AuthenticatedUser;
import com.saj.aftersales.auth.MockAuthProvider;
import com.saj.aftersales.entity.UserStatus;
import com.saj.aftersales.service.UserService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Lets the frontend's dev-only login screen list the selectable identities — every active user
 * in the real {@code users} table, so anyone Admin creates via {@code /api/users} shows up here
 * too. Only registered while {@link MockAuthProvider} is the active auth provider.
 */
@RestController
@RequestMapping("/api/auth")
@ConditionalOnBean(MockAuthProvider.class)
public class MockAuthController {

    private final UserService userService;

    public MockAuthController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/demo-users")
    public List<AuthenticatedUser> demoUsers() {
        return userService.listUsers().stream()
                .filter(user -> user.status() == UserStatus.ACTIVE)
                .map(MockAuthProvider::toAuthenticatedUser)
                .toList();
    }
}
