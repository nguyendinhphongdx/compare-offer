# OfferLens - So sánh Offer thông minh

OfferLens là nền tảng giúp bạn so sánh, phân tích và đánh giá nhiều job offer cùng lúc, hỗ trợ đưa ra quyết định nghề nghiệp tốt nhất.

## Tính năng chính

### Dashboard
Tổng quan toàn bộ offers: tổng số offer, trạng thái thương lượng, offer cao nhất, tiến độ đánh giá theo từng nhóm tiêu chí.

### Quản lý Offers
- Thêm / sửa / xóa offer với đầy đủ thông tin: công ty, vị trí, lương, phúc lợi, văn hóa...
- Theo dõi trạng thái: Đang chờ, Thương lượng, Đã chấp nhận, Đã từ chối, Công việc hiện tại
- **39 tiêu chí đánh giá mặc định** chia thành 6 nhóm + khả năng tạo tiêu chí tùy chỉnh
- Hỗ trợ nhiều loại input: lương, text, rating sao, boolean, lịch làm việc

### So sánh Offers
- Bảng so sánh side-by-side với sticky header
- **Tính tổng gói thu nhập hàng năm** (lương x số tháng + thưởng)
- Tự động highlight giá trị cao nhất
- Chia sẻ bài so sánh qua public link (không cần đăng nhập để xem)

### Biểu đồ & Phân tích
- Biểu đồ cột so sánh lương Gross / Net / Signing Bonus
- Radar chart so sánh các tiêu chí đánh giá rating
- **Dự phóng tăng trưởng lương** theo thời gian (tùy chỉnh số năm & % tăng)
- Donut chart phúc lợi theo từng offer

### Hướng dẫn Phỏng vấn
24 câu hỏi quan trọng nên hỏi khi phỏng vấn, chia theo 7 nhóm (Thu nhập, Team, Công việc, Phúc lợi, Sự nghiệp, Công ty, Work-Life Balance). Đánh dấu mức độ quan trọng và hỗ trợ tìm kiếm.

### AI Tư vấn
Chat với AI (Google Gemini) để phân tích offers. AI tự động nhận toàn bộ dữ liệu offers của bạn để đưa ra tư vấn cá nhân hóa: so sánh tổng quan, chiến lược thương lượng, ưu/nhược điểm từng offer.

## 6 nhóm tiêu chí đánh giá

| Nhóm | Tiêu chí |
|------|----------|
| **Thu nhập & Lương thưởng** | Lương Gross/Net, thưởng tháng 13, thưởng hiệu suất, Signing Bonus, ESOP, review lương |
| **Phúc lợi & Đãi ngộ** | Bảo hiểm sức khỏe, ngày phép, remote work, phụ cấp ăn/xe/điện thoại, đào tạo, thiết bị |
| **Văn hóa công ty** | Quy mô công ty/team, phong cách quản lý, văn hóa, môi trường, D&I |
| **Phát triển sự nghiệp** | Lộ trình thăng tiến, cơ hội học hỏi, mentorship, uy tín công ty, ngành nghề |
| **Cân bằng cuộc sống** | Lịch làm việc, giờ làm, OT, linh hoạt, thời gian đi lại, WLB rating |
| **Kỹ thuật & Công nghệ** | Tech stack, loại dự án, chất lượng code, thử thách kỹ thuật, quy trình Agile |

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Next.js API Routes, Prisma ORM, PostgreSQL
- **Auth:** Supabase Auth (Email/Password + Google + GitHub OAuth)
- **AI:** Google Gemini API
- **Charts:** Recharts
- **State:** Zustand
- **UI:** shadcn/ui, Lucide Icons

## Cài đặt

```bash
# Clone repo
git clone <repo-url>
cd compare-offer

# Cài dependencies
pnpm install

# Tạo file .env.local từ .env.example
cp .env.example .env.local
# Điền các biến môi trường
```

## Biến môi trường

```env
GEMINI_API_KEY=your_gemini_api_key

# Supabase PostgreSQL
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Chạy ứng dụng

```bash
# Migration database
pnpm prisma migrate dev

# Dev server
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) để sử dụng.
