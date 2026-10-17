package com.substring.irctc;

import com.fasterxml.jackson.databind.*;
import com.substring.irctc.config.security.JwtHelper;
import com.substring.irctc.entity.*;
import com.substring.irctc.repositories.*;
import com.substring.irctc.service.BookingService;
import com.substring.irctc.dto.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class BookingFlowIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired StationRepo stations;
    @Autowired TrainRepository trains;
    @Autowired TrainRouteRepository routes;
    @Autowired TrainScheduleRepository schedules;
    @Autowired TrainSeatRepository seats;
    @Autowired UserRepo users;
    @Autowired RoleRepo roles;
    @Autowired BookingService bookings;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtHelper jwt;
    Station source, middle, destination;
    Train train;
    TrainSchedule schedule;
    String ownerToken, otherToken, adminToken, ownerEmail;
    LocalDate date = LocalDate.now(ZoneId.of("Asia/Kolkata")).plusDays(7);

    @BeforeEach void seed() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0,8);
        source = stations.save(new Station(null, "A" + suffix, "Start " + suffix, "Delhi", "Delhi"));
        middle = stations.save(new Station(null, "B" + suffix, "Middle " + suffix, "City", "State"));
        destination = stations.save(new Station(null, "C" + suffix, "End " + suffix, "Mumbai", "Maharashtra"));
        train = new Train(); train.setName("Test Express " + suffix); train.setNumber(suffix);
        train.setSourceStation(source); train.setDestinationStation(destination); train = trains.save(train);
        addRoute(source, 1, LocalTime.of(8,0), LocalTime.of(8,5));
        addRoute(middle, 2, LocalTime.of(10,0), LocalTime.of(10,5));
        addRoute(destination, 3, LocalTime.of(12,0), LocalTime.of(12,5));
        schedule = new TrainSchedule(); schedule.setTrain(train); schedule.setRunDate(date); schedule.setAvailableSeats(2);
        schedule = schedules.save(schedule);
        for (int order = 1; order <= 2; order++) {
            TrainSeat seat = new TrainSeat(); seat.setTrainSchedule(schedule); seat.setCoachType(CoachType.AC);
            seat.setTotalSeats(1); seat.setAvailableSeats(1); seat.setSeatNumberToAssign(1);
            seat.setTrainSeatOrder(order); seat.setPrice(100.10); seats.save(seat);
        }
        ownerEmail = "owner" + suffix + "@example.com";
        ownerToken = loginUser(ownerEmail, "ROLE_NORMAL");
        otherToken = loginUser("other" + suffix + "@example.com", "ROLE_NORMAL");
        adminToken = loginUser("admin" + suffix + "@example.com", "ROLE_ADMIN");
    }
    void addRoute(Station station, int order, LocalTime arrival, LocalTime departure) {
        TrainRoute route = new TrainRoute(); route.setTrain(train); route.setStation(station);
        route.setStationOrder(order); route.setArrivalTime(arrival); route.setDepartureTime(departure); routes.save(route);
    }
    String loginUser(String email, String roleName) throws Exception {
        User user = new User(); user.setName("Test User"); user.setEmail(email); user.setPassword(encoder.encode("Password123!"));
        user.setRoles(new ArrayList<>(List.of(roles.findAll().stream().filter(r -> r.getName().equals(roleName)).findFirst().orElseThrow())));
        users.save(user);
        JsonNode response = json.readTree(mvc.perform(post("/auth/login").contentType("application/json")
                .content(json.writeValueAsString(Map.of("username",email,"password","Password123!"))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        return response.get("token").asText();
    }
    Map<String,Object> request(int count) {
        List<Map<String,Object>> passengers = new ArrayList<>();
        for (int i=0;i<count;i++) passengers.add(Map.of("name","Passenger " + i,"age",30,"gender","MALE", "id",999, "seatNumber","999"));
        return Map.of("trainScheduleId",schedule.getId(),"sourceStationId",source.getId(),"destinationStationId",destination.getId(),
                "coachType","AC","passengers",passengers,"userId",999999);
    }
    MvcResult book(String token, int count, int expected) throws Exception {
        return mvc.perform(post("/user/bookings").header("Authorization","Bearer " + token).contentType("application/json")
                .content(json.writeValueAsString(request(count)))).andExpect(status().is(expected)).andReturn();
    }
    @Test void searchBookLookupAndHistoryAreConnectedAndOwned() throws Exception {
        mvc.perform(post("/user/trains/search").header("Authorization","Bearer " + ownerToken).contentType("application/json")
                .content(json.writeValueAsString(Map.of("sourceStationId",source.getId(),"destinationStationId",destination.getId(),"journeyDate",date.toString(),"coachType","AC"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].arrivalTime").value("12:00:00"))
                .andExpect(jsonPath("$[0].seatsAvailable.AC").value(2));
        JsonNode booking = json.readTree(book(ownerToken,2,201).getResponse().getContentAsString());
        assertThat(booking.get("totalFare").decimalValue()).isEqualByComparingTo("200.20");
        assertThat(booking.get("paymentStatus").asText()).isEqualTo("NOT_PAID");
        assertThat(booking.get("passengers").get(0).get("seatNumber").asText()).isEqualTo("1");
        assertThat(booking.get("passengers").get(0).get("coachId")).isNotEqualTo(booking.get("passengers").get(1).get("coachId"));
        String pnr = booking.get("pnr").asText();
        mvc.perform(get("/user/bookings/pnr/"+pnr).header("Authorization","Bearer " + ownerToken)).andExpect(status().isOk());
        mvc.perform(get("/user/bookings/pnr/"+pnr).header("Authorization","Bearer " + otherToken)).andExpect(status().isNotFound());
        mvc.perform(get("/user/bookings").param("query",pnr).header("Authorization","Bearer " + ownerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/user/bookings").param("query",pnr).header("Authorization","Bearer " + otherToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        book(ownerToken,1,409);
        Long usedCoach = seats.findByTrainScheduleId(schedule.getId()).get(0).getId();
        mvc.perform(delete("/admin/train-seats/" + usedCoach).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict());
    }
    @Test void validatesRequestsAndAllowsAdminCustomerAccess() throws Exception {
        mvc.perform(get("/user/bookings")).andExpect(status().isUnauthorized());
        mvc.perform(get("/user/stations").header("Authorization","Bearer " + adminToken)).andExpect(status().isOk());
        book(adminToken,1,201);
        book(ownerToken,0,400);
        mvc.perform(post("/user/trains/search").header("Authorization","Bearer " + ownerToken).contentType("application/json")
                .content(json.writeValueAsString(Map.of("sourceStationId",destination.getId(),"destinationStationId",source.getId(),"journeyDate",date.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(post("/user/trains/search").header("Authorization","Bearer " + ownerToken).contentType("application/json")
                .content("{}")).andExpect(status().isBadRequest());
        Map<String,Object> invalid = new HashMap<>(request(1)); invalid.put("destinationStationId",source.getId());
        mvc.perform(post("/user/bookings").header("Authorization","Bearer " + ownerToken).contentType("application/json")
                .content(json.writeValueAsString(invalid))).andExpect(status().isBadRequest());
    }
    @Test void concurrentBookingsCannotOversell() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<Boolean> attempt = () -> {
            start.await();
            try { bookings.createBooking(json.convertValue(request(2), BookingRequest.class),ownerEmail); return true; }
            catch (IllegalStateException soldOut) { return false; }
        };
        try {
            Future<Boolean> a=pool.submit(attempt), b=pool.submit(attempt); start.countDown();
            assertThat(List.of(a.get(15,TimeUnit.SECONDS),b.get(15,TimeUnit.SECONDS))).containsExactlyInAnyOrder(true,false);
            assertThat(seats.findByTrainScheduleId(schedule.getId())).allMatch(c -> c.getAvailableSeats()==0);
        } finally { pool.shutdownNow(); }
    }
    @Test void adminCanCreateUsableInventoryButNormalUserCannot() throws Exception {
        Map<String,Object> coach = Map.of("trainScheduleId",schedule.getId(),"coachType","SLEEPER",
                "totalSeats",10,"price",75.50,"trainSeatOrder",3,"availableSeats",999,"seatNumberToAssign",999);
        mvc.perform(post("/admin/train-seats").header("Authorization","Bearer " + ownerToken)
                .contentType("application/json").content(json.writeValueAsString(coach))).andExpect(status().isForbidden());
        mvc.perform(post("/admin/train-seats").header("Authorization","Bearer " + adminToken)
                .contentType("application/json").content(json.writeValueAsString(coach))).andExpect(status().isCreated())
                .andExpect(jsonPath("$.availableSeats").value(10)).andExpect(jsonPath("$.seatNumberToAssign").value(1));
    }
    @Test void ticketPdfIsAnOwnerOnlyAttachmentWithoutChangingBooking() throws Exception {
        JsonNode booking = json.readTree(book(ownerToken,1,201).getResponse().getContentAsString());
        String path = "/user/bookings/pnr/" + booking.get("pnr").asText() + "/ticket.pdf";
        var result = mvc.perform(get(path).header("Authorization", "Bearer " + ownerToken)
                .accept("application/pdf", "application/json"))
                .andExpect(status().isOk()).andExpect(content().contentType("application/pdf"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("attachment")))
                .andExpect(header().string("Cache-Control", "private, no-store, max-age=0"))
                .andReturn();
        try (var document = org.apache.pdfbox.Loader.loadPDF(result.getResponse().getContentAsByteArray())) {
            assertThat(new org.apache.pdfbox.text.PDFTextStripper().getText(document)).contains("Passenger 0", "NOT_PAID");
        }
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
        mvc.perform(get(path).header("Authorization", "Bearer " + otherToken).accept("application/pdf", "application/json"))
                .andExpect(status().isNotFound());
        // Administrators may use customer APIs, but may not download another account's ticket.
        mvc.perform(get(path).header("Authorization", "Bearer " + adminToken).accept("application/pdf", "application/json"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/user/bookings/pnr/missing/ticket.pdf").header("Authorization", "Bearer " + ownerToken)
                .accept("application/pdf", "application/json")).andExpect(status().isNotFound());
        assertThat(seats.findByTrainScheduleId(schedule.getId()).stream().mapToInt(TrainSeat::getAvailableSeats).sum()).isEqualTo(1);
    }
    @Test void refreshTokenCannotBeUsedAsAccessToken() throws Exception {
        String refresh = jwt.generateRefreshToken(org.springframework.security.core.userdetails.User.withUsername(ownerEmail).password("x").roles("NORMAL").build());
        mvc.perform(get("/user/bookings").header("Authorization","Bearer " + refresh)).andExpect(status().isUnauthorized());
    }
}
