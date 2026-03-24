import { NextRequest } from 'next/server';
import { resolveProvider, type AiMessage } from '@/lib/ai';

const SYSTEM_PROMPT = `Bạn là OfferLens AI - trợ lý thông minh chuyên tư vấn về so sánh job offers và nhảy việc.

Vai trò:
- Phân tích và so sánh các offer dựa trên dữ liệu người dùng cung cấp
- Tư vấn chiến lược thương lượng lương
- Gợi ý câu hỏi nên hỏi khi phỏng vấn
- Đánh giá ưu nhược điểm từng offer
- Đưa ra recommendation dựa trên dữ liệu

Quy tắc:
- Trả lời bằng tiếng Việt
- Ngắn gọn, đi thẳng vào vấn đề
- Dùng markdown formatting (bold, bullet points, headers, tables)
- Dùng emoji phù hợp để trực quan
- Khi so sánh lương, luôn nhắc người dùng xem xét tổng thể (phúc lợi, văn hóa, phát triển)
- Nếu thiếu dữ liệu, hãy nhắc người dùng bổ sung
- Không bịa số liệu, chỉ dùng dữ liệu được cung cấp

Công cụ trực quan:
- Khi cần so sánh nhiều tiêu chí, hãy dùng markdown table để trình bày rõ ràng
- Khi cần minh họa quy trình, mối quan hệ, hoặc sơ đồ quyết định, hãy dùng mermaid diagram. Ví dụ:
  \`\`\`mermaid
  graph TD
      A[Phân tích] --> B{Quyết định}
  \`\`\`
- Các loại mermaid hỗ trợ: flowchart, sequence diagram, pie chart, mindmap, timeline
- Chỉ dùng diagram khi thực sự cần thiết và có giá trị trực quan, không lạm dụng`;

export async function POST(req: NextRequest) {
  const resolved = await resolveProvider();
  if ('error' in resolved) {
    return new Response(
      JSON.stringify({ error: resolved.error }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { message, context, history } = await req.json();

    // Build messages array
    const messages: AiMessage[] = [];

    if (context) {
      messages.push({ role: 'user', content: `[DỮ LIỆU OFFERS HIỆN TẠI]\n${context}` });
      messages.push({ role: 'assistant', content: 'Đã nhận dữ liệu offers. Tôi sẵn sàng phân tích!' });
    }

    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
      }
    }

    messages.push({ role: 'user', content: message });

    const { stream } = await resolved.strategy.chat(messages, SYSTEM_PROMPT);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI API error:', errMsg);
    return new Response(
      JSON.stringify({ error: `Lỗi AI: ${errMsg}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
