# Spring Security — IRCTC Booking Project

This guide describes the security implementation currently present in this repository and how a request moves through it. The project uses Spring Boot 3.5, Java 21, Spring Security, BCrypt, and JWT (JJWT 0.12.6).

## 1. Security building blocks

| Class | Responsibility |
|---|---|
| `config/security/SecurityConfig.java` | Defines public routes, role-based URL rules, stateless sessions, CORS, password encoding, and the authentication manager |
| `AuthController.java` | Login, registration, and refresh-token endpoints |
| `CustomUserDetailService.java` | Loads a user from the database by email |
| `CustomUserDetail.java` | Adapts the `User` entity to Spring Security's `UserDetails` contract |
| `JwtHelper.java` | Creates and validates signed access/refresh JWTs |
| `JwtAuthenticationFilter.java` | Reads the Bearer token and populates the security context |
| `JwtAuthenticationEntryPoint.java` | Returns a JSON 401 response for unauthenticated requests |
| `User.java`, `Role.java` | Store users and their many-to-many role assignments |
| `UserRepo.java`, `RoleRepo.java` | Load users and roles from the database |

## 2. How authentication and authorization differ

- **Authentication** answers “Who is making this request?” Login verifies the email/password and issues JWTs.
- **Authorization** answers “What can this authenticated user do?” The authorities loaded from the user's roles are checked against URL rules and `@PreAuthorize`.

The database role names should include the `ROLE_` prefix, such as `ROLE_NORMAL` and `ROLE_ADMIN`. Spring's `hasRole("ADMIN")` checks for the authority `ROLE_ADMIN`.

## 3. Step-by-step login flow

1. The client sends `POST /auth/login` with JSON containing `username` (the user's email) and `password`.
2. `AuthController.login()` creates a `UsernamePasswordAuthenticationToken` and calls `AuthenticationManager.authenticate()`.
3. Spring Security calls `CustomUserDetailService.loadUserByUsername(email)`.
4. `UserRepo.findByEmail(email)` loads the user. `CustomUserDetail` exposes the stored password hash and the user's role names as authorities.
5. Spring compares the submitted password with the stored BCrypt hash using the configured `PasswordEncoder`.
6. If authentication succeeds, `JwtHelper` generates an access token and a refresh token. The response includes both tokens and the user DTO.
7. The client stores tokens safely and sends the access token on protected requests using the header `Authorization: Bearer <access-token>`.

A failed login should return a generic message. Do not reveal whether an email exists.

## 4. Step-by-step protected-request flow

1. A request reaches the servlet filter chain.
2. `JwtAuthenticationFilter`, registered before `UsernamePasswordAuthenticationFilter`, reads the `Authorization` header.
3. If the header starts with `Bearer `, the filter extracts the token and asks `JwtHelper` to read its signed claims and subject.
4. The filter loads the current user from the database by email.
5. `JwtHelper.isTokenValid()` checks that the token subject matches the user and that the token has not expired.
6. On success, the filter creates an authenticated `UsernamePasswordAuthenticationToken` containing the current authorities and stores it in `SecurityContextHolder`.
7. `SecurityConfig` checks the request path and required role. If the user is authenticated and has the required authority, the controller runs. Otherwise, the request is rejected.
8. Requests that require authentication but have no valid authentication are handled by `JwtAuthenticationEntryPoint` with HTTP 401. Authenticated users who lack a required role should receive HTTP 403.

## 5. Current route rules

The rules are defined in `SecurityConfig.securityFilterChain()`:

| Route | Current access |
|---|---|
| `POST /auth/login` | Public |
| `POST /auth/register` | Public |
| `POST /auth/refresh-token` | Public; endpoint validates the refresh token |
| `/swagger-ui/**`, `/v3/api-docs/**`, `/webjars/**` | Public |
| `GET /admin/stations/**` | `ROLE_NORMAL` or `ROLE_ADMIN` |
| `/admin/**` | `ROLE_ADMIN` |
| `/user/**` | `ROLE_NORMAL` |
| Any other route | Authenticated |

The user-management controller uses `/admin/users`, so adding users, assigning roles, and listing assignable roles are administrator-only. The `@PreAuthorize("hasRole('ADMIN')")` annotations add method-level checks; `@EnableMethodSecurity` enables them.

## 6. Password storage

- `SecurityConfig.passwordEncoder()` returns `BCryptPasswordEncoder`.
- Registration must encode the password before saving it. `UserServiceImpl.registerUser()` does this.
- Never store plaintext passwords, log passwords, or return password hashes in API responses.
- Prefer request/response DTOs with separate fields rather than reusing a DTO that includes a password for both directions.

## 7. Roles and role mapping

The `User` entity has a many-to-many relationship with `Role`. `CustomUserDetail.getAuthorities()` maps each assigned role's name to a `SimpleGrantedAuthority`.

Administrator endpoints added in `UserController`:

- `POST /admin/users` — creates a user with the default `ROLE_NORMAL` role through the existing registration service.
- `PUT /admin/users/{userId}/roles/{roleId}` — assigns the existing role whose primary key is `roleId` to the user. For example, `PUT /admin/users/12/roles/ROLE_ADMIN`.
- `GET /admin/users/roles` — lists role IDs and names available for assignment.

Do not accept a role list directly from a public registration request. Otherwise, a caller could try to register themselves as an administrator. Keep role assignment behind an administrator authorization rule and audit role changes in a production system.

## 8. CORS and sessions

- The configuration currently allows the origin `http://localhost:4200`, methods GET/POST/PUT/DELETE/OPTIONS, all request headers, and credentials.
- If the React/Vite frontend runs on `http://localhost:5173`, add that exact origin to the allow-list for local development.
- CSRF is disabled and session management is stateless. This is typical for APIs that use an Authorization Bearer token in a header. If authentication moves to cookies, revisit CSRF protections and cookie flags.
- CORS is not an authentication mechanism; it controls which browser origins can read responses.

## 9. JWT configuration and important production hardening

Before deploying, address these items in the existing implementation:

1. **Move the signing secret out of source code.** `JwtHelper` currently hard-codes `SECRET`. Load a strong random key from an environment variable or secret manager. If a real secret has ever been committed, rotate it.
2. **Review token lifetimes.** The current constants are `30 * 1000` milliseconds for the access token (30 seconds) and `60 * 60 * 1000` milliseconds for the refresh token (1 hour). The comments beside those constants do not match the values.
3. **Validate token type on each endpoint.** Ensure protected API requests accept access tokens only and the refresh endpoint accepts refresh tokens only. Do not treat any validly signed JWT as interchangeable.
4. **Remove the artificial sleep.** `JwtAuthenticationFilter` currently pauses every request for 450 ms, increasing latency without improving security.
5. **Handle JWT failures cleanly.** Avoid `printStackTrace()` and sensitive exception messages in responses. Catch expected JWT exceptions and return consistent 401 JSON responses.
6. **Validate request data.** Use Jakarta Bean Validation constraints on DTO fields and `@Valid` on controller parameters. Normalize emails consistently and enforce uniqueness at the database level.
7. **Avoid exposing password hashes.** Clear the password field in user API responses; ideally introduce a response DTO that has no password property.
8. **Use HTTPS in production.** Never send bearer tokens over plain HTTP outside local development.
9. **Set production CORS origins explicitly.** Do not use a wildcard origin when credentials are enabled.
10. **Add tests.** Cover anonymous access, valid and expired JWTs, wrong roles (403), missing/invalid tokens (401), and the user/role administration endpoints.

## 10. Test the endpoints

Use a valid administrator access token in the Authorization header.

### Create a user

```http
POST /admin/users
Authorization: Bearer <admin-access-token>
Content-Type: application/json
```

```json
{
  "name": "Sample User",
  "email": "sample.user@example.com",
  "password": "Use-A-Strong-Password-123!",
  "phone": "9999999999"
}
```

Expected result: `201 Created`, with user details and roles; the password field is omitted/null.

### Assign a role

```http
PUT /admin/users/12/roles/ROLE_ADMIN
Authorization: Bearer <admin-access-token>
```

Expected result: `200 OK`, with the updated user. The user ID and role ID must already exist.

### List roles

```http
GET /admin/users/roles
Authorization: Bearer <admin-access-token>
```

Expected result: `200 OK`, with role IDs and names.

## 11. Local verification

From the repository root, run:

```bash
./mvnw test
```

On Windows PowerShell:

```powershell
.\mvnw.cmd test
```

Then start the application with your normal Spring profile and database configuration and test the endpoints with Swagger UI or Postman. Ensure the database contains the expected roles (at minimum `ROLE_NORMAL` and `ROLE_ADMIN`) before testing. This guide documents the current code and recommended hardening; passing tests and a security review are still required before production use.
