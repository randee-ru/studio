# Randee Component Studio Architecture

## Purpose

This document shows the current execution path for the Randee Studio ecosystem:

- code-first component development;
- local preview in Studio;
- package generation;
- marketplace publish;
- Bitrix client updates through `randee.update`.

## High-Level Flow

```mermaid
flowchart LR
  A["Source code in components-src/<artifact>"] --> B["Studio UI"]
  B --> C["Studio API"]
  C --> D["Studio Kit pipeline"]
  D --> E["Build payload"]
  E --> F["ZIP package"]
  F --> G["Marketplace snapshot / audit trail"]
  G --> H["updates.c0l.ru"]
  H --> I["randee.update on Bitrix client"]
  I --> J["Client website"]

  B --> K["Preview 1440 / 768 / 390"]
  B --> L["Mock / JSON / Connector / Bitrix datasource modes"]
  B --> M["QA / Tests / Build / Validate"]
  B --> N["Publish to Marketplace"]

  C --> O["Marketplace admin APIs"]
  C --> P["Studio snapshot API"]

  D --> Q["Bitrix install roots"]
  Q --> R["local/components/randee/<component>"]
  Q --> S["local/modules/randee.<module>"]
  Q --> T["local/templates/<template>"]
```

## Runtime Layers

### 1. Studio App

`apps/studio` is the developer cockpit.

It owns:

- artifact navigation;
- preview rendering;
- data source switching;
- QA controls;
- Marketplace history panel;
- publish trigger.

### 2. Studio API

`apps/api` is the server boundary.

It owns:

- `POST /api/studio/publish`;
- `POST /api/studio/test`;
- `POST /api/studio/build`;
- `POST /api/studio/package`;
- `POST /api/studio/validate`;
- `GET /api/studio/marketplace`;
- admin endpoints for products, packages, releases, and uploads.

### 3. Studio Kit

`packages/studio-kit` is the shared pipeline library.

It owns:

- build and payload layout;
- ZIP generation;
- package validation;
- marketplace store persistence;
- publish orchestration;
- audit trail writes.

### 4. Marketplace State

Marketplace state is stored locally during development in:

```text
.studio/marketplace/
```

The structure tracks:

- products;
- packages;
- releases;
- publish audits;
- uploaded ZIPs.

### 5. Bitrix Client

`randee.update` consumes marketplace releases.

It validates packages, downloads ZIPs, and installs only the `payload/` tree into Bitrix filesystem roots.

## Contract Boundaries

### Studio does

- code editing and preview orchestration;
- build/test/package/validate/publish requests;
- QA hint surface;
- history visualization.

### Marketplace does

- product/package/release records;
- ZIP upload handling;
- publication state;
- API token protection on admin routes.

### `randee.update` does

- downloads releases;
- validates ZIP payloads;
- installs content into Bitrix;
- maintains rollback safety.

## Current Gaps

- real Bitrix Connector transport is still mocked at the Studio layer;
- dedicated scaffold templates for `module` and `template` are not yet added;
- CI/CD is not wired yet.

