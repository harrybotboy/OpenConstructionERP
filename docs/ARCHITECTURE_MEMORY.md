# PROJECT ARCHITECTURE MEMORY
## OpenConstructionERP v4.1.0

> Tài liệu nội bộ dành cho Senior Dev mới join. Cập nhật mỗi khi có thay đổi kiến trúc lớn.

---

## 1. Mục tiêu & Phạm vi

Nền tảng ERP xây dựng mã nguồn mở (AGPL-3.0), self-hosted, AI-augmented. Mục tiêu cốt lõi: đưa dữ liệu CAD/BIM → dự toán chi phí (BOQ) → đấu thầu → công trường → tài chính trong một hệ thống thống nhất.

**Phạm vi**: Ước tính chi phí, quản lý BOQ, bóc tách khối lượng (PDF/DWG/CAD), đấu thầu, quản lý tài liệu (CDE/ISO 19650), lập lịch 4D, mô hình chi phí 5D, quản lý hiện trường, báo cáo. 55.000+ mục chi phí (CWICR), 24 ngôn ngữ, 20+ tiêu chuẩn khu vực (DIN 276, NRM, MasterFormat, GAEB, GESN…).

**Không phải**: phần mềm kế toán, ERP tổng hợp, hay BIM authoring tool.

---

## 2. Kiến trúc Tổng thể

**Monorepo** — 4 layer chính:

```
backend/        FastAPI (Python 3.12+) — 88 plugin module
frontend/       React 18 + TypeScript — SPA (Vite)
services/       Standalone: cad-converter, cv-pipeline, ai-service
deploy/         Docker Compose / Kubernetes / Terraform
```

Giao tiếp: Frontend → REST API (`/api/v1/<module>/`). Services giao tiếp với backend qua HTTP nội bộ. **Không có gRPC, không có GraphQL.**

**Database topology**: PostgreSQL duy nhất (prod). SQLite cho local dev. Redis optional (Celery jobs). MinIO/S3 cho file. Qdrant hoặc LanceDB cho vector search.

---

## 3. Các Module Chính & Trách nhiệm

**Core Framework** (`app/core/`):

| Component | Vai trò |
|-----------|---------|
| `module_loader` | Discover, resolve dependency graph (topological sort), auto-mount router |
| `events` + `hooks` | Pub/sub event bus và filter/action hooks — module KHÔNG query DB của nhau trực tiếp |
| `validation/engine` | Rule execution, sinh ValidationReport (🟢🟡🔴) |
| `validation/rules/__init__.py` | Toàn bộ built-in rules trong **một file duy nhất** |
| `match_service/` | Pipeline 7 bước matching cost items (vector + lexical + LLM re-rank) |
| `permissions` | RBAC engine |
| `audit_log` | Immutable who/what/when trail |
| `fsm/` | FSM cho workflow states (tender, approval, CDE) |

**Business Modules** (~88 tổng, tự động discover):

| Nhóm | Module tiêu biểu |
|------|-----------------|
| Core estimation | boq, costs, takeoff, assemblies, validation, catalog |
| Project & docs | projects, documents, cde, markups, collaboration |
| Field ops | tasks, punchlist, safety, inspections, ncr, fieldreports, daily_diary |
| Finance & tender | tendering, finance, changeorders, contracts, procurement |
| Planning | schedule, costmodel, risk, eac |
| BIM/CAD | cad, bim_hub, dwg_takeoff, bcf, clash, requirements |
| AI/Analytics | ai, ai_agents, match_elements, erp_chat, dashboards, bi_dashboards |
| Regional packs | dach_pack, uk_pack, us_pack, russia_pack, india_pack, middle_east_pack… |

**Convention mỗi module** (không được thiếu):
```
manifest.py   models.py   schemas.py   router.py   service.py
repository.py validators.py   hooks.py   events.py   permissions.py
migrations/   tests/
```

---

## 4. Luồng Dữ liệu Quan trọng

**Ingestion pipeline** (bắt buộc theo thứ tự, không được bypass):
```
Upload file
  → Magic byte detection (file_signature.py)
  → DDC cad2data pipeline → Canonical JSON
  → ValidationEngine → ValidationReport (🟢🟡🔴)
  → AI classification + Qdrant vector search → cost matching
  → BOQ Editor
  → Second validation pass (BOQ quality rules)
  → Tender / Export
```

**Canonical format** là nguồn sự thật duy nhất cho mọi CAD input. BOQ Position lưu `cad_element_ids[]` trỏ ngược về canonical.

**Match pipeline** cho cost items: BAAI/bge-m3 embeddings (384/3072-dim) → Qdrant/LanceDB → unit/region/classifier boosters → LLM re-ranking → confidence score → human review.

---

## 5. Công nghệ / Framework / Pattern Cốt lõi

**Backend**: FastAPI + SQLAlchemy async + Pydantic v2 + Alembic. ruff (line-length=100) + mypy strict + pytest (80% core / 60% modules).

**Frontend**: React 18 + TypeScript strict + Zustand (global state) + React Query (server state) + AG Grid (BOQ editor) + Three.js (3D viewer) + PDF.js (takeoff) + Yjs/WebSocket (CRDT collaboration). PWA với workbox caching.

**Patterns cốt lõi**:
- Plugin architecture (manifest-driven, topological sort)
- Event Bus + Hook Registry (cross-module communication)
- Repository pattern (tách data access khỏi business logic)
- Abstract Storage (local / S3 / MinIO cùng interface)
- FSM workflows (tender, approval, CDE states)
- CRDT real-time collaboration (Yjs)
- Vector search + semantic matching (Qdrant/LanceDB)
- Graceful degradation (AI/CV/Redis đều optional)

---

## 6. Quy ước & Nguyên tắc Thiết kế

1. **Module = self-contained** — cross-module communication chỉ qua events/hooks, không query DB chéo.
2. **Validation là mandatory** — không phải feature, là bước trong pipeline. Module mới bắt buộc có validation rules.
3. **AI augmented, human confirmed** — confidence score trên mọi AI output, không bao giờ auto-apply.
4. **i18n everywhere** — không có hardcoded string trong UI hay validation messages.
5. **No IfcOpenShell** — IFC xử lý qua DDC cad2data. BCF được phép làm I/O format (decision 2026-04-26).
6. **Code = English** — biến, comment, docs. Lightweight core: chạy được trên VPS 2GB RAM.
7. **Commits**: Conventional Commits (`feat/fix/refactor/docs/test/chore`). PR: squash merge, min 1 approval.

---

## 7. Tech Debt & Rủi ro

| Rủi ro | Mô tả |
|--------|-------|
| `validation/rules/__init__.py` | Tất cả built-in rules trong một file — sẽ phình nhanh khi thêm tiêu chuẩn |
| ~80 Alembic migration files | Module migrations độc lập → xung đột thứ tự khi merge nhiều branch |
| DDC cad2data là external dependency | Nếu API thay đổi, toàn bộ CAD ingestion vỡ |
| SQLite vs PostgreSQL drift | RLS, JSONB, pgvector không có trên SQLite — integration tests phải chạy trên PostgreSQL |
| 24 locale files | Translation debt tích lũy; không có CI check cho missing keys |
| 88 module × RBAC | Permission matrix phức tạp, không có single source of truth để audit |
| Celery fallback in-process | Dev mode bỏ qua Celery → behavior diverge cho heavy tasks |
| Embedding model lock | Đổi model → phải re-index toàn bộ 55K CWICR items |

---

## 8. Những Điều "Dễ Hiểu Sai"

1. **"IFC được parse natively"** — Sai. IFC xử lý qua DDC cad2data giống hệt DWG/RVT. Không có IfcOpenShell ở bất kỳ đâu.

2. **"BCF bị cấm"** — Sai. BCF được phép làm I/O format (issues, viewpoints, validation reports). Quyết định đảo ngược ngày 2026-04-26. Chỉ cấm IfcOpenShell runtime dependency.

3. **"Module có thể query DB của module khác"** — Sai. Cross-module data access chỉ qua event bus hoặc hook registry. Vi phạm tạo hidden coupling.

4. **"Validation là optional"** — Sai. Mandatory step trong import pipeline, không thể skip. Module mới bắt buộc phải có validation rules.

5. **"AI tự động apply kết quả"** — Sai. Mọi AI output đều có confidence score và chờ human review.

6. **"SQLite dev ≈ PostgreSQL prod"** — Không đúng. RLS, JSONB operators, pgvector vắng mặt trên SQLite. Luôn chạy integration tests trên PostgreSQL.

7. **"Module loader load theo alphabetical"** — Sai. Thứ tự load theo topological sort từ `depends` trong `manifest.py`. Khai báo sai dependency → module fail khởi động.

8. **"Frontend feature có thể gọi API của module khác"** — Không nên. Mỗi `features/<name>/` chỉ nên gọi API của module backend tương ứng.
