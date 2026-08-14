package com.saj.aftersales.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Delegates identity resolution to whichever {@link AuthProvider} is active and, if one is
 * found, populates the security context with it. Provider-agnostic — swapping Mock for
 * Entra ID requires no change here.
 */
public class AuthContextFilter extends OncePerRequestFilter {

    private final AuthProvider authProvider;

    public AuthContextFilter(AuthProvider authProvider) {
        this.authProvider = authProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        authProvider.authenticate(request).ifPresent(user -> {
            List<GrantedAuthority> authorities = user.roles().stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .map(GrantedAuthority.class::cast)
                    .toList();
            var token = new UsernamePasswordAuthenticationToken(user, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(token);
        });
        chain.doFilter(request, response);
    }
}
