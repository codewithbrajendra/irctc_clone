# Editable backend ticket template

- `ticket.html`: labels, field placement, sections and passenger rows.
- `ticket.css`: colours, borders, spacing, columns and A4 page rules.
- `TicketView.java`: date, time, money and missing-value formatting.
- `TicketPdfTemplate.java`: loads the template and stylesheet, runs Thymeleaf, and converts XHTML to PDF with OpenHTMLtoPDF. It contains no drawing coordinates or ticket layout.

The backend still returns the same PDF download API. No frontend or database migration is needed. The HTML follows the existing reservation-slip format: title, branding, blue boarding arrow, journey blocks, PNR/train/class, passenger table and payment details.

## Add or remove a field

1. Open `ticket.html` and edit the relevant section. For example, add `<p>Booking ID: <span th:text="${ticket.booking.bookingId}">12</span></p>`.
2. `ticket.booking` exposes the existing `BookingResponse` fields. If a new field is not available there, first add it to the DTO and booking mapping. For special formatting, add a value to `TicketView` and reference it as `${ticket.yourField}`.
3. Use `th:text` for booking values so names and other user text are escaped. Only the trusted bundled stylesheet uses `th:utext`.
4. For a passenger column, update the `colgroup`, table header and repeating `th:each` row together. Adjust column widths in CSS so they total 100%.
5. Rebuild/restart the backend after classpath resource changes. Run `./mvnw test`; synthetic PDF previews are generated in `target/ticket-preview/` by `TicketPdfTemplateTest`.

The HTML can be opened in a browser for a rough static preview with sample fallback text. The generated PDF is the authoritative preview: the renderer supports CSS 2.1 and paged-media rules, rather than browser JavaScript, flexbox or grid. Keep HTML well-formed (close tags and use `<br />`). Passenger table headers repeat on continuation pages.

Values come from the saved owner-scoped booking. Quota, berth type and overnight day offsets are not modelled, so the template does not invent them. Booking/current status both show saved booking status because there is no separate passenger status history. Unpaid bookings stay visibly unpaid; cancelled bookings are labelled.

Templates, CSS and fonts come from the classpath. External URI resolution is disabled; do not add remote images, stylesheets or fonts. PDFs are generated in memory per request and are not cached or persisted. DejaVu fonts and their license are under `fonts/`. Glyph coverage is limited to the bundled fonts; complex-script shaping is not implemented.
