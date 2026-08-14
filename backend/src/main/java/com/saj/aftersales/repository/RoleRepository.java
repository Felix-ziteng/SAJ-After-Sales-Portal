package com.saj.aftersales.repository;

import com.saj.aftersales.entity.Role;
import com.saj.aftersales.entity.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.Set;

public interface RoleRepository extends JpaRepository<RoleEntity, Long> {

    Optional<RoleEntity> findByCode(Role code);

    Set<RoleEntity> findByCodeIn(Set<Role> codes);
}
