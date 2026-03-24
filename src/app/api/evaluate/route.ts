import { NextRequest } from 'next/server';
import { resolveProvider } from '@/lib/ai';

const EVALUATE_PROMPT = `Bạn là OfferLens AI - chuyên gia đánh giá và so sánh job offers.

Nhiệm vụ: Phân tích toàn diện các offers dựa trên DỮ LIỆU THỰC TẾ được cung cấp.

Yêu cầu output (tiếng Việt, markdown):
1. **Tổng quan** — Đánh giá nhanh 2-3 câu
2. **So sánh chi tiết** — Bảng markdown so sánh điểm mạnh/yếu từng offer
3. **Phân tích tài chính** — So sánh tổng thu nhập, đánh giá chênh lệch có đáng không
4. **Phúc lợi & Văn hóa** — Nếu có dữ liệu
5. **Ghi chú đáng lưu ý** — Phân tích các ghi chú người dùng đã nhập
6. **Khuyến nghị** — Offer nào phù hợp nhất và tại sao, kèm điều kiện

Quy tắc:
- CHỈ dùng dữ liệu được cung cấp, không bịa
- Ngắn gọn, đi thẳng vào vấn đề
- Dùng emoji phù hợp
- Nếu thiếu dữ liệu, nhắc bổ sung`;

export async function POST(req: NextRequest) {
  const resolved = await resolveProvider();
  if ('error' in resolved) {
    return new Response(
      JSON.stringify({ error: resolved.error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { context } = await req.json();

    const messages = [
      { role: 'user' as const, content: `Hãy đánh giá toàn diện các offers sau:\n\n${context}` },
    ];

    const { stream } = await resolved.strategy.chat(messages, EVALUATE_PROMPT);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: `Lỗi AI: ${errMsg}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
