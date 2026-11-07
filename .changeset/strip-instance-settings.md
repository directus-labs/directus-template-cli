---
"directus-template-cli": patch
---

Stop extracting the project id and owner info (`project_id`, `project_owner`, `project_usage`, `org_name`, `product_updates`) into templates, and skip them when applying older templates that include them (#124).
