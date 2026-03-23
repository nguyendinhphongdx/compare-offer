import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest } from 'next/server';

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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return new Response(
      JSON.stringify({ error: 'Chưa cấu hình GEMINI_API_KEY. Thêm API key vào file .env.local' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { message, context, history } = await req.json();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build chat history: system prompt + optional context + previous messages
    const chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Tôi là OfferLens AI, sẵn sàng tư vấn về các offer của bạn!' }] },
    ];

    // Add offers data context on first message
    if (context) {
      chatHistory.push(
        { role: 'user', parts: [{ text: `[DỮ LIỆU OFFERS HIỆN TẠI]\n${context}` }] },
        { role: 'model', parts: [{ text: 'Đã nhận dữ liệu offers. Tôi sẵn sàng phân tích!' }] },
      );
    }

    // Append previous conversation history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        chatHistory.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    const chat = model.startChat({ history: chatHistory });

    const result = await chat.sendMessageStream(message);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Gemini API error:', errMsg);
    return new Response(
      JSON.stringify({ error: `Lỗi khi gọi Gemini API: ${errMsg}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
