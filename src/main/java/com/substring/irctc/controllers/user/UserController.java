package com.substring.irctc.controllers.user;

import com.substring.irctc.dto.RoleDto;
import com.substring.irctc.dto.UserDto;
import com.substring.irctc.entity.Role;
import com.substring.irctc.entity.User;
import com.substring.irctc.exceptions.ResourceNotFoundException;
import com.substring.irctc.repositories.RoleRepo;
import com.substring.irctc.repositories.UserRepo;
import com.substring.irctc.service.UserService;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Administrative user-management endpoints.
 *
 * These routes are under /admin/**, which is restricted to ROLE_ADMIN
 * by SecurityConfig. Keep public registration in AuthController.
 */
@RestController
@RequestMapping("/admin/users")
public class UserController {

    private final UserService userService;
    private final UserRepo userRepo;
    private final RoleRepo roleRepo;
    private final ModelMapper modelMapper;

    public UserController(
            UserService userService,
            UserRepo userRepo,
            RoleRepo roleRepo,
            ModelMapper modelMapper
    ) {
        this.userService = userService;
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.modelMapper = modelMapper;
    }

    /**
     * Creates a user with the project's default ROLE_NORMAL role.
     * Example: POST /admin/users
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> addUser(@RequestBody UserDto request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required.");
        }
        if (userRepo.findByEmail(request.getEmail().trim()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        request.setEmail(request.getEmail().trim());
        UserDto created = userService.registerUser(request);

        // Never return even the encoded password to the caller.
        created.setPassword(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Assigns a role to an existing user.
     * Example: PUT /admin/users/12/roles/ROLE_ADMIN
     *
     * The roleId is the Role entity's primary key (for example ROLE_NORMAL).
     * Repeating the same assignment is safe and does not create duplicates.
     */
    @PutMapping("/{userId}/roles/{roleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> mapRoleToUser(
            @PathVariable Long userId,
            @PathVariable String roleId
    ) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with id: " + userId));

        Role role = roleRepo.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Role not found with id: " + roleId));

        boolean alreadyAssigned = user.getRoles().stream()
                .anyMatch(existingRole -> existingRole.getId().equals(role.getId()));

        if (!alreadyAssigned) {
            user.getRoles().add(role);
            user = userRepo.save(user);
        }

        UserDto response = modelMapper.map(user, UserDto.class);
        response.setPassword(null);
        return ResponseEntity.ok(response);
    }

    /**
     * Lists the roles available for assignment.
     * Example: GET /admin/users/roles
     */
    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RoleDto>> listRoles() {
        List<RoleDto> roles = roleRepo.findAll().stream()
                .map(role -> modelMapper.map(role, RoleDto.class))
                .toList();
        return ResponseEntity.ok(roles);
    }
}
