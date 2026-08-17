package com.saj.aftersales.config;

import com.saj.aftersales.entity.Role;
import com.saj.aftersales.entity.RoleEntity;
import com.saj.aftersales.entity.UserEntity;
import com.saj.aftersales.repository.RoleRepository;
import com.saj.aftersales.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;

/**
 * Seeds the one Admin account every fresh deployment needs to bootstrap from — real password
 * auth has no self-registration (see memory), so without this nobody could ever log in to create
 * the first user. Runs the app's actual {@link PasswordEncoder} bean at hash time rather than
 * shipping a pre-computed hash in a Flyway migration, so the hash can never drift from whatever
 * encoder/strength the app is really configured with. Idempotent — a no-op once the account
 * exists, so it never stomps a later password change.
 *
 * <p>Email and password come from {@code ADMIN_BOOTSTRAP_EMAIL}/{@code ADMIN_BOOTSTRAP_PASSWORD}
 * (see {@code .env.example}) rather than being hardcoded, so the real bootstrap credential never
 * lives in source control — only in the gitignored {@code .env}.
 */
@Component
public class AdminAccountSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountSeeder.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final String seedEmail;
    private final String seedPassword;
    private final String seedDisplayName;

    public AdminAccountSeeder(UserRepository userRepository, RoleRepository roleRepository,
                               PasswordEncoder passwordEncoder,
                               @Value("${app.auth.bootstrap-admin.email:felix}") String seedEmail,
                               @Value("${app.auth.bootstrap-admin.password:}") String seedPassword,
                               @Value("${app.auth.bootstrap-admin.display-name:Admin}") String seedDisplayName) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.seedEmail = seedEmail;
        this.seedPassword = seedPassword;
        this.seedDisplayName = seedDisplayName;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (seedPassword.isBlank()) {
            log.warn("ADMIN_BOOTSTRAP_PASSWORD not set — skipping bootstrap admin account seeding");
            return;
        }
        if (userRepository.existsByEmailIgnoreCase(seedEmail)) {
            return;
        }
        Optional<RoleEntity> adminRoleLookup = roleRepository.findByCode(Role.ADMIN);
        if (adminRoleLookup.isEmpty()) {
            // Roles are seeded by V2's migration; a deployment that skips Flyway (e.g. this
            // app's own fast H2 test config) simply has no bootstrap admin, which is fine there.
            log.warn("ADMIN role not configured yet — skipping bootstrap admin account seeding");
            return;
        }
        RoleEntity adminRole = adminRoleLookup.get();

        UserEntity user = new UserEntity();
        user.setEmail(seedEmail);
        user.setDisplayName(seedDisplayName);
        user.setPasswordHash(passwordEncoder.encode(seedPassword));
        user.setRoles(Set.of(adminRole));
        userRepository.save(user);
    }
}
