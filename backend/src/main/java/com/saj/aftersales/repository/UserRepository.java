package com.saj.aftersales.repository;

import com.saj.aftersales.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    /**
     * Fetch-joins roles so the result is safe to read outside a transaction — needed by
     * {@code PasswordAuthProvider}, which runs in a security filter, not a
     * {@code @Transactional} service method.
     */
    @Query("select distinct u from UserEntity u left join fetch u.roles where lower(u.email) = lower(:email)")
    Optional<UserEntity> findByEmailIgnoreCaseWithRoles(@Param("email") String email);

    /** Login's fallback lookup when the typed identifier isn't anyone's login name — matched
     * against display name instead. Returns every match rather than one, so the caller can
     * refuse an ambiguous login (two people sharing a display name) instead of guessing. */
    @Query("select distinct u from UserEntity u left join fetch u.roles where lower(u.displayName) = lower(:name)")
    List<UserEntity> findByDisplayNameIgnoreCaseWithRoles(@Param("name") String name);

    boolean existsByEmailIgnoreCase(String email);

    @Query("select distinct u from UserEntity u left join fetch u.roles order by u.displayName")
    List<UserEntity> findAllWithRoles();
}
