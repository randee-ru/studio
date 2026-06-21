# Randee Component Studio Roadmap

## Purpose

Этот документ фиксирует последовательность работ для `Randee Component Studio + Marketplace Automation` и показывает, на каком этапе проект находится сейчас.

## Target Repository

- GitHub: `https://github.com/randee-ru/studio.git`
- Статус: пустой репозиторий, готовый к заполнению
- Роль: основной delivery-repo для Studio, roadmap, pipeline и всей новой кодовой базы

## Current Status

### Done

- Изучена текущая архитектура `Randee Ecosystem`.
- Изучен `marketplace`-слой в монорепо.
- Изучен `randee.update` на Bitrix-сайте клиента.
- Найден референсный проект `Randee Ecosystem` с UI-концепцией.
- Найдены целевые серверные окружения:
  - `192.168.42.50` — app/runtime Randee;
  - `192.168.88.20` — Bitrix site + update module.
- Поднят локальный `studio/` workspace и базовый Vite UI.
- Собран demo-компонент `slider`.
- Реализованы `build:component`, `package:component`, `validate:package`, `test:component`.
- Реализован серверный `POST /api/studio/publish`.
- Реализованы базовые Marketplace admin endpoints.
- Добавлен Marketplace snapshot endpoint для Studio.
- Добавлен audit trail публикаций.
- Добавлена поддержка `component/module/template` в контракте pipeline.
- Добавлен общий pipeline для `mock/json/bitrix-connector/bitrix-site/bitrix-iblock` data source modes.
- Добавлены scaffold-артефакты `menu` (module) и `legacy` (template).
- Publish pipeline verified on `slider`, `menu`, and `legacy`.
- Added live preview data loader and API proxy for preview modes.
- Studio now passes preview payload into rendered artifacts.

### In Progress

- Доводка Marketplace/Publish UI в Studio.
- Bitrix Connector runtime integration.

### Not Started

- Client-side `randee.update` compatibility migration.
- CI/CD pipeline for publish and release gates.

## Workstreams

### Phase 0. Discovery and Alignment

Goal: зафиксировать существующую архитектуру и правила совместимости.

Deliverables:

- карта компонентов и сервисов;
- перечень совместимых контрактов;
- список того, что нельзя ломать;
- список точек расширения.

Exit criteria:

- roadmap утвержден;
- выбран формат пакетов;
- согласован путь интеграции без breaking changes.

### Phase 1. Studio Scaffold

Goal: поднять отдельное `studio/` приложение как оркестратор разработки компонентов.

Deliverables:

- `studio/` app;
- left panel: Components / Modules / Templates;
- center panel: Desktop / Tablet / Mobile preview;
- right panel: Errors / Hints / Tests / Marketplace;
- live reload/hot refresh.

Exit criteria:

- `npm run studio slider` запускает UI;
- компонент можно открыть и увидеть в 3 viewport-ах;
- структура проекта не зависит от ручных правок в marketplace/admin.

### Phase 2. Component Builder Pipeline

Goal: собрать кодовый pipeline для компонентов.

Deliverables:

- `components-src/<code>/...`;
- `build:component <code>`;
- генерация `dist/packages/<code>`;
- сборка Bitrix-структуры:
  - `local/components/randee/<component>`;
  - `templates/.default/dist/app.js`;
  - `templates/.default/dist/app.css`;
- `component.config.json`;
- `studio.config.json`;
- `data.adapter.ts`.

Exit criteria:

- один demo-компонент `slider` собирается без ручной упаковки;
- Bitrix payload создается предсказуемо и повторяемо.

### Phase 3. Package Generator and Validator

Goal: создавать ZIP-пакеты и проверять их до публикации.

Deliverables:

- `package:component <code>`;
- `validate:package`;
- ZIP output `dist/zips/randee.<code>-<version>.zip`;
- проверка:
  - `package.json`;
  - `payload`;
  - `paths`;
  - semver;
  - ZIP security;
  - отсутствие `../`;
  - отсутствие absolute paths.

Exit criteria:

- пакет можно сгенерировать и провалидировать одной цепочкой;
- ошибка упаковки блокирует publish.

### Phase 4. Data Sources and Adapters

Goal: подключать данные из разных источников без переписывания компонента.

Deliverables:

- Mock datasource;
- JSON datasource;
- Bitrix Connector datasource;
- Real Bitrix site datasource;
- Real iblock datasource;
- `data.adapter.ts` на компонент.

Exit criteria:

- компонент работает с несколькими источниками данных;
- mapping данных прозрачен и изолирован от UI.

Current status:

- `slider/data.adapter.ts` поддерживает mock/json/connector/site/iblock контракты;
- Studio умеет переключать preview data source mode;
- scaffold-артефакты `menu` и `legacy` добавлены;
- live preview data path and connector proxy endpoint implemented;
- следующий шаг — добавить project-level Bitrix endpoint presets и preview profiles.

### Phase 5. QA and Auto-Fix

Goal: встроить проверку качества прямо в Studio.

Deliverables:

- `test:component <code>`;
- checks:
  - responsive;
  - accessibility;
  - overflow;
  - contrast;
  - spacing;
  - viewport;
  - TypeScript;
  - build;
  - Bitrix structure;
  - package validation;
- рекомендации по исправлению;
- автофиксы для lint/format/structure issues.

Exit criteria:

- Studio показывает не только ошибки, но и suggested fixes;
- часть простых проблем исправляется автоматически.

### Phase 6. Marketplace API Automation

Goal: убрать ручное создание products/packages/releases.

Deliverables:

- `POST /api/admin/products`;
- `POST /api/admin/packages`;
- `POST /api/admin/releases`;
- `POST /api/admin/releases/{id}/publish`;
- `POST /api/admin/packages/upload`;
- auth only via API token;
- server-side publish endpoint:
  - `POST /api/studio/publish`.

Exit criteria:

- product/package/release создаются без админки;
- токен не попадает в браузер;
- publish работает только через backend.

Current status:

- `POST /api/admin/products` implemented
- `POST /api/admin/packages` implemented
- `POST /api/admin/packages/upload` implemented
- `POST /api/admin/releases` implemented
- `POST /api/admin/releases/{id}/publish` implemented
- `POST /api/studio/publish` implemented
- `GET /api/studio/marketplace` implemented
- publish audits implemented

### Phase 7. Publish Pipeline

Goal: связать полный путь от кнопки `Publish to Marketplace` до клиента.

Flow:

1. Tests
2. Build
3. Package
4. Validate
5. Upload ZIP
6. Create Product
7. Create Package
8. Create Release
9. Publish Release

Exit criteria:

- publish запускается из Studio;
- статусы отражаются в UI;
- история публикаций доступна в Marketplace panel.

Current status:

- CLI publish command implemented
- Studio UI publish button implemented
- end-to-end HTTP publish flow verified locally
- Studio Marketplace history panel backed by backend snapshot
- publish pipeline verified for component, module, and template scaffolds
- live preview data and render path verified in Studio/backend

### Phase 8. Client Update Compatibility

Goal: довести `randee.update` до нового контракта без поломки текущих сайтов.

Deliverables:

- совместимость с новым `package.json`;
- совместимость с `component/module/template` типами;
- корректная установка ZIP payload;
- rollback-safe update flow;
- поддержка Bitrix component/module/template roots.

Exit criteria:

- клиентский сайт получает обновление из нового pipeline;
- старые инсталлы не ломаются.

### Phase 9. CI/CD and Hardening

Goal: автоматизировать проверки и публикации в репозитории и на сервере.

Deliverables:

- pipeline stages:
  - `test`
  - `build`
  - `package`
  - `validate`
  - `publish`
- минимальный release gate;
- visibility по build/validation status;
- regression protection.

Exit criteria:

- pipeline runs in CI and blocks broken releases;
- artifact history is visible end-to-end from Studio to Marketplace;
- publish automation is safe enough to hand over to product teams.

## Immediate Next Steps

1. Add project-level Bitrix endpoint presets and preview profiles.
2. Add server-side dry-run / preview endpoints for QA mode.
3. Start CI workflow for `test -> build -> package -> validate -> publish`.
4. Align `randee.update` docs with the new package/audit model.

- каждое изменение проходит через единый pipeline;
- publish можно запускать предсказуемо и воспроизводимо.

## Priority Order

1. Studio scaffold.
2. Component build/package/validate pipeline.
3. Demo `slider`.
4. Multi-device preview.
5. Publish backend.
6. Marketplace API automation.
7. Bitrix update compatibility.
8. CI/CD and hardening.

## Active Next Steps

- Add project-level Bitrix endpoint presets and preview profiles.
- Add server-side dry-run / preview endpoints for QA mode.
- Start CI workflow for `test -> build -> package -> validate -> publish`.
- Align `randee.update` docs with the new package/audit model.

## Risks

- Текущий `randee.update` валидатор ожидает более широкий пакетный контракт, чем тот, что указан в новом примере.
- Marketplace API сейчас частично локальный и требует аккуратного расширения без breaking changes.
- Studio должен быть оркестратором, а не альтернативной второй системой сборки.
