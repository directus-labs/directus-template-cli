---
"directus-template-cli": patch
---

Stop sending `license_key` and `license_token` when applying settings, so templates apply on licensed Directus instances (#143). Check that a collection is a singleton before treating it as one (#145).
