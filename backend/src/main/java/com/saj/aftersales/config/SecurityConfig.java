package com.saj.aftersales.config;

import com.saj.aftersales.auth.AuthContextFilter;
import com.saj.aftersales.auth.AuthProvider;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final AuthProvider authProvider;
    private final List<String> corsAllowedOrigins;

    public SecurityConfig(AuthProvider authProvider,
                           @Value("${app.cors.allowed-origins:http://localhost:3000}") List<String> corsAllowedOrigins) {
        this.authProvider = authProvider;
        this.corsAllowedOrigins = corsAllowedOrigins;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // No anonymous principal: a request with no resolvable identity should fail
                // authentication (401), not authorization (403) against an "anonymous" user.
                .anonymous(AbstractHttpConfigurer::disable)
                .addFilterBefore(new AuthContextFilter(authProvider), UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(ex -> ex.authenticationEntryPoint(
                        (request, response, authException) -> response.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health").permitAll()
                        // Can't require a session to log in / can't require a valid one to log
                        // out — both need to work from a logged-out state.
                        .requestMatchers("/api/auth/login", "/api/auth/logout").permitAll()
                        // The customer-facing confirmation flow (D6/memory): no staff login, no
                        // account — the token in the URL is the entire identity proxy.
                        .requestMatchers("/api/confirm/**").permitAll()
                        // Spring Boot's error view forwards internally to /error — e.g. when
                        // @PreAuthorize denies a request, AccessDeniedHandler's sendError(403)
                        // triggers this forward, which re-enters this same filter chain as a
                        // new request. Without this, that second pass fails .authenticated()
                        // and silently replaces the intended 403 with a 401.
                        .requestMatchers("/error").permitAll()
                        .anyRequest().authenticated()
                );
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(corsAllowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
