package com.saj.aftersales.mapper;

import com.saj.aftersales.dto.UserDto;
import com.saj.aftersales.entity.Role;
import com.saj.aftersales.entity.RoleEntity;
import com.saj.aftersales.entity.UserEntity;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserDto toDto(UserEntity entity) {
        return new UserDto(
                entity.getId(),
                entity.getEmail(),
                entity.getDisplayName(),
                entity.getDepartment(),
                entity.getStatus(),
                toRoleCodes(entity.getRoles()),
                entity.getCreatedAt());
    }

    private Set<Role> toRoleCodes(Set<RoleEntity> roles) {
        return roles.stream().map(RoleEntity::getCode).collect(Collectors.toSet());
    }
}
