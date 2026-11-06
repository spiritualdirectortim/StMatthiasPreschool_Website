# St. Matthias Preschool website: items to confirm

Updated: 2026-11-05
Every fact on the new site comes from the live site (stmatthiaspreschool.org, captured 2026-11-05 into `docs/source-content/`) or the parish website. Nothing was invented. These items need a decision or a fact from the preschool before launch.

## A. Wording that speaks for a person or the school

1. **Director's name.** The faculty page says "Mrs. Rosemary Juarez-Gomez"; her letter and the parish site say "Rosemary Juarez". The new site uses **Rosemary Juarez-Gomez** everywhere. Confirm which she prefers.
2. **Director's letter** (`/about/#director`) was tightened in her voice. She should read and approve it.
3. **Mission statement** (`/about/#mission`) was shortened from one 60-word sentence. Confirm the new wording, or restore the official text if the board approved it word for word.
4. **"Is the preschool only for Catholic families?"** (Admissions FAQ). The answer leans on the director's "where all are welcome." Confirm the actual admissions policy.

## B. Facts the live site does not state (common parent questions)

5. **Ages and placement.** Preschool is shown as ages 3–4 (Ms. Jill's title) and pre-K as "the year before kindergarten." Confirm age cutoffs and birthday rules.
6. **Toilet training for ages 3+.** The toddler policy is clear. Are older children required to be toilet-trained?
7. **Enrichment schedule and cost.** How often are Music & Movement, Spanish and gardening? Are they included in tuition? Who leads toddler STEM (Bricks 4 Kidz or teachers)?
8. **School-year calendar.** The live calendar has no events. Add closure dates and holidays; the site currently tells parents to ask on the tour.
9. **License number, ratios and class sizes.** Parents often look for a California Community Care Licensing number. Add it if the preschool wants it shown.
10. **Meals.** The site mentions a weekly snack menu only. Is lunch provided or packed?
11. **Teacher and staff emails.** The live site showed them without "@" and with inconsistent domains (for example "st.matthiasparish.org"). Only rosemary@ and smpsoffice@ are published.
12. **Parent socials.** The site says Preschool Advisory Board parent representatives "have helped host" them (from the Christmas social photo caption). Confirm.

## C. Photos and media

13. **Photo permission.** Every child photo came from the live site. Confirm signed photo releases cover the new site too. This includes the Christmas Parent Social collage now in Family Events (`/families/#events`), which shows parents and names three parent representatives (Madeline, Michelle and Mandy) in its caption.
14. **Photos still needed:** a high-resolution wide shot of the playground (hero quality), a Spanish lesson (the Spanish section, `/enrichment/#spanish`, uses the circle-time photo as a stand-in until one exists), Lisa Bamford's headshot at higher resolution (current file is 150 px), new headshots for Norma Guerrero, Jill Anderson and Jisela Moreno (the originals are cropped tight, with the top of the head at or past the edge), and a current preschool exterior.
15. **Testimonials.** The only testimonials are three YouTube videos (Angela, Nina, Alex). Short written quotes, with permission, would let the homepage show a parent's words without a click.
16. **Newsletters.** The two samples are from June and July 2024. Replace with a recent issue.
17. **Social media.** The live site's Facebook, X, Instagram and Flocknote icons pointed to placeholder pages, so they were dropped. Send real account links if they exist.

## D. Launch

18. **Domain and redirects.** `vercel.json` redirects all 31 old eCatholic page URLs to their new homes, so bookmarks and search results keep working once stmatthiaspreschool.org points here. Link previews (the picture shown when a page is shared by text, email or social media) use full `https://stmatthiaspreschool.org/images/share/…` addresses, so they appear only after the domain points to the new site. If the site launches on a different domain, update the `og:image` lines in all seven pages.
19. **Tuition** is shown as "updated July 6, 2026." Update `admissions/index.html` and the FAQ together when rates change.
