package com.substring.irctc.repositories;

import com.substring.irctc.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface StationRepo extends JpaRepository<Station, Long> {
    @Query("select s from Station s where lower(s.name) like lower(concat('%', ?1, '%')) or lower(s.code) like lower(concat('%', ?1, '%')) order by s.name")
    List<Station> search(String query, Pageable pageable);
}
