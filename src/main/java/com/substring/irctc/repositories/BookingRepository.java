package com.substring.irctc.repositories;

import com.substring.irctc.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByPnrAndUserEmail(String pnr, String email);
    @Query("""
        select b from Booking b where b.user.email = :email and
        (lower(b.pnr) like lower(concat('%', :query, '%')) or
         lower(b.trainSchedule.train.name) like lower(concat('%', :query, '%')) or
         lower(b.trainSchedule.train.number) like lower(concat('%', :query, '%')))
        """)
    Page<Booking> searchOwned(@Param("email") String email, @Param("query") String query, Pageable pageable);
}
