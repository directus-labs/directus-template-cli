---
"directus-template-cli": patch
---

Template settings now override the instance's existing settings when applying (e.g. `project_name`, `project_color`), instead of being ignored (#78). The project id and owner info (`project_id`, `project_owner`, `project_usage`, `org_name`, `product_updates`) are no longer extracted, and are skipped when applying older templates that include them (#124).
