# YouCam API notes (verified Nov 1 2026 with our key)

- Base URL `https://yce-api-01.makeupar.com`, auth header `Authorization: Bearer $YOUCAM_API_KEY`. Verified: our key
  returns HTTP 200 from the File API.
- Every AI call is async, in four steps:
  1. `POST /s2s/v2.0/file` with `{"files":[{"content_type":"image/jpg","file_name":"x.jpg","file_size":<bytes>}]}`
     returns `data.files[0].file_id` and `requests[0]` (`method: PUT`, `url`, `headers`). This call costs nothing.
  2. **PUT the image bytes to that URL** with the returned headers. Skipping this gives 404 or 500 on the task.
  3. `POST /s2s/v2.0/task/<feature>` with `src_file_id` (or `src_file_url` for a public image) returns `data.task_id`.
  4. Poll `GET /s2s/v2.0/task/<feature>/<task_id>` every few seconds until `task_status` is `success` or `error`.
     Units are charged only on success.
  Results chain: a success returns a `dst_id` you can feed to another task without re-uploading.
- **Skin analysis**: `POST /s2s/v2.0/task/skin-analysis` with `dst_actions` (array) and optional
  `miniserver_args: {"enable_mask_overlay": true}`, `format: "json"`. SD and HD actions can't be mixed ("cannot mix HD
  and SD dst_actions"). SD examples: wrinkle, droopy_upper_eyelid, droopy_lower_eyelid, firmness, acne, moisture,
  eye_bag, dark_circle_v2, age_spot; the docs also show pore and texture; HD examples: hd_pore, hd_skin_type,
  hd_moisture, hd_redness, hd_oiliness. Each concern returns `ui_score` (1 to 100, calibrated to read kindly),
  `raw_score` (1 to 100, higher is healthier) and `mask_urls`. **Cost: 9 units for 1 to 4 SD concerns, 12 for 5 to 8,
  14 for 9 to 12; HD 12 / 16 / 20.** Needs a front-facing selfie with the face large enough in frame.
- **Clothes try-on**: `POST /s2s/v2.0/task/cloth-v4` with `src_file_id` or `src_file_url` (the person, full body) and
  `ref_file_id`, `ref_file_url` or `template_id` (the garment), plus `garment_category` (for example `full_body`; check
  the docs for upper and lower body values). Result: `results.url`.
- Other try-ons (about 2 units each): shoes `/s2s/v2.0/task/shoes-transfer`, bag `/s2s/v2.0/task/bag`, hat
  `/s2s/v2.0/task/hat`, look `/s2s/v2.0/task/look-vto`; watch 1 unit.
- Docs index: https://docs.perfectcorp.com/llms.txt (every page has a `.md` version, for example
  https://docs.perfectcorp.com/reference/description/ai_skin_analysis.md). Playground:
  https://yce.makeupar.com/api-console/en/api-playground/.
- 1,000 free units shared by both builds. Cache every result; never call the API in a loop.
