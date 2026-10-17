package com.substring.irctc.config.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtHelper jwtHelper;
    private final UserDetailsService users;
    public JwtAuthenticationFilter(JwtHelper jwtHelper, UserDetailsService users) {
        this.jwtHelper = jwtHelper; this.users = users;
    }
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ") &&
                SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                String token = authorization.substring(7);
                // A refresh credential must never authorize a normal API request.
                if (jwtHelper.isAccessToken(token)) {
                    UserDetails user = users.loadUserByUsername(jwtHelper.getUsernameFromToken(token));
                    if (jwtHelper.isTokenValid(token, user)) {
                        var authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            } catch (ExpiredJwtException expired) {
                request.setAttribute("jwtExpiredError", "JWT expired");
            } catch (JwtException | IllegalArgumentException | UsernameNotFoundException invalid) {
                logger.debug("Rejected invalid authentication for {}", request.getRequestURI());
            }
        }
        chain.doFilter(request, response);
    }
}
