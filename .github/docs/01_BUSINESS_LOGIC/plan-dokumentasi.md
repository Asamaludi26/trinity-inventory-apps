<!-- 1. UI/UX Design Document (Wireframe & High-Fidelity Mockup)

Apa itu: Representasi visual dari aplikasi, mulai dari sketsa kasar (wireframe) hingga desain jadi (mockup) yang interaktif.

Kegunaan Detail:

PRD dan SDD tidak menjelaskan secara spesifik posisi tombol "Approve", bentuk dropdown kategori, atau tata letak grafik di Dashboard.

Mencegah Full Stack Developer membuang waktu memikirkan desain dan mengubah CSS berulang kali saat proses coding.

Menjadi acuan pasti untuk implementasi komponen Shadcn UI yang sudah Anda tulis di SDD. -->

2. Test Plan & UAT (User Acceptance Testing) Document

Apa itu: Dokumen skenario pengujian yang berisi langkah-langkah checklist untuk memastikan fitur berjalan sesuai dengan PRD.

Kegunaan Detail:

Aplikasi Anda memiliki matriks Approval Workflow yang sangat kompleks (hingga 4 layer persetujuan). Dokumen ini akan mendaftar setiap skenario (misal: "Apa yang terjadi jika Admin Logistik menolak (reject) saat Leader sudah setuju?").

Digunakan oleh tim (atau perwakilan user / QA) saat fase UAT di bulan April 2026 untuk memvalidasi apakah aplikasi sudah siap Go Live.

<!-- 3. API Contract & Documentation (Living Document)

Apa itu: Dokumentasi detail dari setiap endpoint API, request payload, dan response. Biasanya menggunakan tools seperti Swagger/OpenAPI atau Postman Collection.

Kegunaan Detail:

Meskipun SDD sudah memuat standar response, Anda memerlukan dokumentasi hidup (living document) yang bisa dieksekusi langsung untuk menguji endpoint tanpa harus membuka source code.

Sangat krusial untuk simulasi error handling (Layer 7 OSI) dan melihat bentuk response 400, 401, 404 secara real-time. -->

<!-- 4. User Manual & SOP (Standard Operating Procedure)

Apa itu: Panduan penggunaan aplikasi untuk end-user (Leader, Staff, Admin Logistik).

Kegunaan Detail:

Mendukung pencapaian KPI dari PRD Anda (Target 80% adopsi pengguna). Pengguna yang kebingungan akan kembali menggunakan kertas.

Dokumen ini digunakan sebagai materi Training & Onboarding sebelum Go Live tanggal 1 Mei 2026. -->

5. Infrastructure & Deployment Playbook: \* Dokumentasi spesifik mengenai environment variables (.env) untuk masing-masing stage (Development, Staging, Production).

Topologi container Docker (misalnya konfigurasi docker-compose untuk app, database, dan reverse proxy seperti Nginx/Traefik).

Alur pipeline CI/CD (kapan trigger run, linter, build, dan deploy).

6. Database Migration & Backup Strategy:

SOP untuk mengeksekusi migrasi Prisma ORM di production tanpa downtime.

Prosedur rollback jika terjadi kegagalan sistem, serta jadwal rutin untuk backup PostgreSQL.

7. Security & RBAC (Role-Based Access Control) Matrix:

Pemetaan spesifik mengenai role pengguna dan hak aksesnya ke berbagai endpoint RESTful API. Ini penting untuk menjamin keamanan dan akuntabilitas sistem.

8. Logging & Monitoring Plan:

Standar penulisan log (misalnya melacak error atau aktivitas pengguna) dan metrik kesehatan server/API.

<!-- 9. Standar Penulisan Kode (Coding Guidelines & Conventions)
   Dokumen ini wajib ada agar penulisan kode tetap DRY (Don't Repeat Yourself), bersih, terstruktur, dan mudah di-review oleh tim atau diri sendiri di masa depan.

Frontend (ReactJS & TypeScript):

Struktur Direktori: Apakah menggunakan Atomic Design (atoms, molecules, organisms) atau Feature-Based structuring?

State Management: Kapan harus menggunakan local state (useState), global state (Zustand/Redux/Context), atau server state (React Query/SWR).

Reusable Components & Hooks: Aturan tegas untuk mengekstrak logika yang berulang menjadi custom hooks agar prinsip DRY terjaga.

Backend (NestJS & TypeScript):

Pemisahan Tanggung Jawab (Separation of Concerns): Menegaskan aturan penggunaan Controllers (hanya untuk routing/request handling), Services (untuk business logic), dan Repositories/Prisma Client (untuk interaksi database).

Standar Validasi & DTO: Mewajibkan penggunaan Data Transfer Objects (DTO) dengan class-validator di setiap endpoint API.

Standar Linter & Formatter: Konfigurasi absolut untuk ESLint dan Prettier yang akan dijalankan otomatis (misalnya menggunakan Husky pre-commit hook) sebelum kode di-push ke repositori. -->

<!-- 10. Tech Stack & Environment
    Jangan hanya sekadar membuat daftar teknologi ("Kita pakai React, NestJS, dan PostgreSQL"). Dokumen ini harus lebih spesifik:

Detail Versi & Ekosistem: Cantumkan versi spesifik yang digunakan (misal: Node.js v20, NestJS v10, React v18, PostgreSQL 15, Prisma ORM versi terbaru). Ini mencegah masalah kompatibilitas di masa depan.

Architecture Decision Records (ADR): Penjelasan singkat mengapa teknologi tersebut dipilih. (Contoh: "Menggunakan Prisma karena type-safety bawaan yang meminimalisir kesalahan query, dan NestJS karena arsitekturnya yang tangguh untuk skala enterprise").

Containerization Details: Spesifikasi image Docker yang digunakan untuk development vs production. -->

<!-- 11. User Flow & System Flow
    Flow tidak cukup hanya dinarasikan; idealnya divisualisasikan agar tidak ada ambiguitas logika.

User Journey Map (UI/UX): Diagram (bisa berupa flowchart sederhana) yang menunjukkan langkah-langkah pengguna dari masuk halaman Login hingga berhasil melakukan aksi utama (misal: mencatat aset masuk atau keluar).

Sequence Diagrams (Backend/System): Sangat penting untuk memetakan bagaimana data mengalir. Misalnya: Client mengirim request -> Auth Guard di NestJS memvalidasi JWT -> Controller meneruskan ke Service -> Service memanggil Prisma -> Database merespons. -->

<!-- 12. Standar Penanganan Error (Error Handling & Response Format):
    Buat kontrak baku bagaimana struktur JSON saat terjadi error vs success.

Contoh Success: { "status": 200, "message": "OK", "data": {...} }

Contoh Error: { "status": 400, "error": "Bad Request", "details": ["Email is required"] }

Di NestJS, ini biasanya diimplementasikan menggunakan Global Exception Filters. -->

13. Git Workflow & CI/CD Triggers:
    Standarisasi cara pembuatan branch (misal: feature/nama-fitur, bugfix/nama-bug).

Conventional Commits: Mewajibkan pesan commit yang terstruktur (misal: feat: add inventory module, fix: resolve prisma connection pool).

Aturan kapan GitHub Actions akan di-trigger (misal: pipeline build & test berjalan setiap ada Pull Request ke branch main).
