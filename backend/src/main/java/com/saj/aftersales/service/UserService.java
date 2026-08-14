package com.saj.aftersales.service;

import com.saj.aftersales.dto.CreateUserRequest;
import com.saj.aftersales.dto.UpdateUserRequest;
import com.saj.aftersales.dto.UserDto;
import com.saj.aftersales.entity.Role;
import com.saj.aftersales.entity.RoleEntity;
import com.saj.aftersales.entity.UserEntity;
import com.saj.aftersales.entity.UserStatus;
import com.saj.aftersales.exception.ConflictException;
import com.saj.aftersales.exception.NotFoundException;
import com.saj.aftersales.mapper.UserMapper;
import com.saj.aftersales.repository.RoleRepository;
import com.saj.aftersales.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository, RoleRepository roleRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userMapper = userMapper;
    }

    public List<UserDto> listUsers() {
        return userRepository.findAllWithRoles().stream().map(userMapper::toDto).toList();
    }

    /** Used by {@link com.saj.aftersales.auth.MockAuthProvider} to resolve the caller's identity. */
    public Optional<UserDto> findActiveByEmail(String email) {
        return userRepository.findByEmailIgnoreCaseWithRoles(email)
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .map(userMapper::toDto);
    }

    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("A user with email " + request.email() + " already exists");
        }

        UserEntity user = new UserEntity();
        user.setEmail(request.email());
        user.setDisplayName(request.displayName());
        user.setDepartment(request.department());
        user.setRoles(resolveRoles(request.roles()));

        return userMapper.toDto(userRepository.save(user));
    }

    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest request) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("No user with id " + id));

        if (request.displayName() != null) {
            user.setDisplayName(request.displayName());
        }
        if (request.department() != null) {
            user.setDepartment(request.department());
        }
        if (request.status() != null) {
            user.setStatus(request.status());
        }
        if (request.roles() != null) {
            if (request.roles().isEmpty()) {
                throw new ConflictException("A user must have at least one role");
            }
            user.setRoles(resolveRoles(request.roles()));
        }

        return userMapper.toDto(user);
    }

    private Set<RoleEntity> resolveRoles(Set<Role> codes) {
        Set<RoleEntity> resolved = roleRepository.findByCodeIn(codes);
        if (resolved.size() != codes.size()) {
            throw new IllegalStateException("One or more roles are not configured: " + codes);
        }
        return resolved;
    }
}
