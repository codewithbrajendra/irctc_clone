# Backend ticket template

`com.substring.irctc.pdf.TicketPdfTemplate` owns the PDF layout. It uses Apache PDFBox and classpath-bundled DejaVu fonts under this directory; generation never fetches remote templates, fonts or images.

The layout follows the supplied reservation-slip reference: bordered page, title and application branding, source/boarding/destination blocks, blue boarding arrow, PNR/train/class fields, quota/distance/booking date, passenger table and payment section. It uses Railway Connect branding. It does not claim to be an official IRCTC ticket or generate a fake verification QR.

Values come from the persisted owner-scoped booking. Distance is calculated from recorded route distances; quota and berth type are not modelled. Booking and current status both show the saved booking status because no separate passenger status history exists. Coach order and database ID are shown without inventing coach codes or berths. Arrival time is shown without an invented arrival date; the current route model has no day offsets.

The template wraps long values and passenger rows and repeats passenger headers on continuation pages. It creates bytes in memory and uses a fresh document and font instances per request. PDFs are not persisted or cached. Embedded fonts support their available Unicode glyphs; unsupported glyphs render as `?`, and complex-script shaping is not implemented.

The font license is included in `fonts/LICENSE.txt`.
