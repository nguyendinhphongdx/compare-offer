import { Criterion, InterviewQuestion } from '@/types';

export const DEFAULT_CRITERIA: Criterion[] = [
  // Compensation
  { id: 'base_salary', name: 'Lương cơ bản (Gross)', category: 'compensation', description: 'Mức lương gross hàng tháng', type: 'salary' },
  { id: 'net_salary', name: 'Lương Net', category: 'compensation', description: 'Mức lương net sau thuế', type: 'salary' },
  { id: 'bonus_13th', name: 'Thưởng tháng 13', category: 'compensation', description: 'Có thưởng tháng 13 không', type: 'boolean' },
  { id: 'performance_bonus', name: 'Thưởng hiệu suất', category: 'compensation', description: 'Mức thưởng theo hiệu suất công việc', type: 'text' },
  { id: 'signing_bonus', name: 'Signing Bonus', category: 'compensation', description: 'Thưởng ký hợp đồng', type: 'salary' },
  { id: 'stock_options', name: 'Cổ phiếu/ESOP', category: 'compensation', description: 'Quyền chọn mua cổ phiếu', type: 'text' },
  { id: 'salary_review', name: 'Review lương', category: 'compensation', description: 'Chu kỳ xét tăng lương', type: 'text' },

  // Benefits
  { id: 'health_insurance', name: 'Bảo hiểm sức khỏe', category: 'benefits', description: 'Gói bảo hiểm sức khỏe cho nhân viên', type: 'text' },
  { id: 'annual_leave', name: 'Ngày phép/năm', category: 'benefits', description: 'Số ngày nghỉ phép hàng năm', type: 'number' },
  { id: 'remote_work', name: 'Làm việc từ xa', category: 'benefits', description: 'Chính sách work from home', type: 'text' },
  { id: 'lunch_allowance', name: 'Phụ cấp ăn trưa', category: 'benefits', description: 'Hỗ trợ tiền ăn trưa', type: 'text' },
  { id: 'parking', name: 'Phụ cấp gửi xe', category: 'benefits', description: 'Hỗ trợ phí gửi xe', type: 'text' },
  { id: 'phone_allowance', name: 'Phụ cấp điện thoại', category: 'benefits', description: 'Hỗ trợ cước điện thoại', type: 'text' },
  { id: 'training_budget', name: 'Ngân sách đào tạo', category: 'benefits', description: 'Kinh phí học tập và phát triển', type: 'text' },
  { id: 'equipment', name: 'Thiết bị làm việc', category: 'benefits', description: 'Laptop, màn hình, thiết bị được cấp', type: 'text' },

  // Work Culture
  { id: 'company_size', name: 'Quy mô công ty', category: 'work_culture', description: 'Số lượng nhân viên', type: 'text' },
  { id: 'team_size', name: 'Quy mô team', category: 'work_culture', description: 'Số người trong team trực tiếp', type: 'number' },
  { id: 'management_style', name: 'Phong cách quản lý', category: 'work_culture', description: 'Cách quản lý và lãnh đạo', type: 'text' },
  { id: 'company_culture', name: 'Văn hóa công ty', category: 'work_culture', description: 'Đánh giá văn hóa doanh nghiệp', type: 'rating' },
  { id: 'work_environment', name: 'Môi trường làm việc', category: 'work_culture', description: 'Không gian và điều kiện làm việc', type: 'rating' },
  { id: 'diversity', name: 'Đa dạng & Hòa nhập', category: 'work_culture', description: 'Chính sách D&I', type: 'rating' },

  // Career Growth
  { id: 'promotion_path', name: 'Lộ trình thăng tiến', category: 'career_growth', description: 'Cơ hội và lộ trình phát triển', type: 'rating' },
  { id: 'learning_opportunities', name: 'Cơ hội học hỏi', category: 'career_growth', description: 'Khả năng phát triển kỹ năng', type: 'rating' },
  { id: 'mentorship', name: 'Mentorship', category: 'career_growth', description: 'Chương trình hướng dẫn', type: 'rating' },
  { id: 'company_reputation', name: 'Uy tín công ty', category: 'career_growth', description: 'Thương hiệu và danh tiếng', type: 'rating' },
  { id: 'industry', name: 'Ngành nghề', category: 'career_growth', description: 'Lĩnh vực hoạt động của công ty', type: 'text' },

  // Work-Life Balance
  { id: 'working_hours', name: 'Giờ làm việc', category: 'work_life_balance', description: 'Thời gian làm việc hàng ngày', type: 'text' },
  { id: 'overtime', name: 'Overtime', category: 'work_life_balance', description: 'Tần suất và chính sách OT', type: 'text' },
  { id: 'flexibility', name: 'Linh hoạt giờ giấc', category: 'work_life_balance', description: 'Mức độ linh hoạt về thời gian', type: 'rating' },
  { id: 'commute_time', name: 'Thời gian đi lại', category: 'work_life_balance', description: 'Khoảng cách từ nhà đến văn phòng', type: 'text' },
  { id: 'wlb_rating', name: 'Work-Life Balance', category: 'work_life_balance', description: 'Đánh giá cân bằng công việc-cuộc sống', type: 'rating' },

  // Technical
  { id: 'tech_stack', name: 'Tech Stack', category: 'technical', description: 'Công nghệ sử dụng', type: 'text' },
  { id: 'project_type', name: 'Loại dự án', category: 'technical', description: 'Sản phẩm hay outsource, dự án mới hay maintain', type: 'text' },
  { id: 'code_quality', name: 'Chất lượng code', category: 'technical', description: 'Code review, CI/CD, testing', type: 'rating' },
  { id: 'tech_challenge', name: 'Thử thách kỹ thuật', category: 'technical', description: 'Mức độ thách thức về kỹ thuật', type: 'rating' },
  { id: 'agile_process', name: 'Quy trình Agile', category: 'technical', description: 'Phương pháp phát triển phần mềm', type: 'text' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  compensation: 'Thu nhập & Lương thưởng',
  benefits: 'Phúc lợi & Đãi ngộ',
  work_culture: 'Văn hóa công ty',
  career_growth: 'Phát triển sự nghiệp',
  work_life_balance: 'Cân bằng cuộc sống',
  technical: 'Kỹ thuật & Công nghệ',
  custom: 'Tiêu chí tùy chỉnh',
};

export const CATEGORY_COLORS: Record<string, string> = {
  compensation: '#10b981',
  benefits: '#6366f1',
  work_culture: '#f59e0b',
  career_growth: '#ec4899',
  work_life_balance: '#06b6d4',
  technical: '#8b5cf6',
  custom: '#64748b',
};

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // Compensation
  { id: 'iq1', category: 'Thu nhập', question: 'Cơ cấu lương như thế nào? (Gross/Net, thưởng, phụ cấp)', description: 'Hiểu rõ tổng thu nhập thực tế', importance: 'high' },
  { id: 'iq2', category: 'Thu nhập', question: 'Chu kỳ review lương là bao lâu? Mức tăng trung bình?', description: 'Đánh giá tiềm năng tăng trưởng thu nhập', importance: 'high' },
  { id: 'iq3', category: 'Thu nhập', question: 'Chính sách thưởng cuối năm/KPI như thế nào?', description: 'Biết rõ các khoản thưởng ngoài lương', importance: 'high' },

  // Team & Management
  { id: 'iq4', category: 'Team & Quản lý', question: 'Team hiện tại có bao nhiêu người? Cơ cấu team như thế nào?', description: 'Hiểu quy mô và cách tổ chức team', importance: 'high' },
  { id: 'iq5', category: 'Team & Quản lý', question: 'Phong cách quản lý của leader/manager như thế nào?', description: 'Đánh giá sự phù hợp về văn hóa làm việc', importance: 'medium' },
  { id: 'iq6', category: 'Team & Quản lý', question: 'Tỷ lệ nghỉ việc trong team/công ty gần đây?', description: 'Dấu hiệu về môi trường làm việc', importance: 'high' },
  { id: 'iq7', category: 'Team & Quản lý', question: 'Quy trình onboarding cho nhân viên mới?', description: 'Đánh giá sự đầu tư cho nhân viên mới', importance: 'medium' },

  // Work
  { id: 'iq8', category: 'Công việc', question: 'Mô tả cụ thể công việc hàng ngày?', description: 'Hiểu rõ nhiệm vụ thực tế', importance: 'high' },
  { id: 'iq9', category: 'Công việc', question: 'Dự án hiện tại đang ở giai đoạn nào? Mới hay maintain?', description: 'Đánh giá tính chất và thử thách của công việc', importance: 'high' },
  { id: 'iq10', category: 'Công việc', question: 'Tech stack chính là gì? Có kế hoạch thay đổi không?', description: 'Đánh giá sự phù hợp về kỹ thuật', importance: 'high' },
  { id: 'iq11', category: 'Công việc', question: 'Quy trình phát triển phần mềm (Agile/Scrum/Kanban)?', description: 'Hiểu cách làm việc của team', importance: 'medium' },

  // Benefits
  { id: 'iq12', category: 'Phúc lợi', question: 'Gói bảo hiểm sức khỏe bao gồm những gì?', description: 'Đánh giá chất lượng bảo hiểm', importance: 'high' },
  { id: 'iq13', category: 'Phúc lợi', question: 'Số ngày phép năm? Có tăng theo thâm niên không?', description: 'Đánh giá chính sách nghỉ phép', importance: 'medium' },
  { id: 'iq14', category: 'Phúc lợi', question: 'Chính sách work from home/hybrid?', description: 'Đánh giá sự linh hoạt', importance: 'high' },
  { id: 'iq15', category: 'Phúc lợi', question: 'Có ngân sách cho đào tạo, conference, certification không?', description: 'Đánh giá đầu tư cho phát triển nhân viên', importance: 'medium' },

  // Career
  { id: 'iq16', category: 'Sự nghiệp', question: 'Lộ trình thăng tiến cho vị trí này?', description: 'Hiểu rõ cơ hội phát triển', importance: 'high' },
  { id: 'iq17', category: 'Sự nghiệp', question: 'Có chương trình mentorship hay coaching không?', description: 'Đánh giá hỗ trợ phát triển cá nhân', importance: 'medium' },
  { id: 'iq18', category: 'Sự nghiệp', question: 'Tiêu chí đánh giá performance?', description: 'Hiểu cách công ty đánh giá nhân viên', importance: 'high' },

  // Company
  { id: 'iq19', category: 'Công ty', question: 'Tình hình tài chính và kế hoạch phát triển của công ty?', description: 'Đánh giá sự ổn định', importance: 'high' },
  { id: 'iq20', category: 'Công ty', question: 'Văn hóa công ty được thể hiện qua những hoạt động gì?', description: 'Hiểu văn hóa thực tế', importance: 'medium' },
  { id: 'iq21', category: 'Công ty', question: 'Tại sao vị trí này đang tuyển? Người trước nghỉ vì sao?', description: 'Hiểu bối cảnh tuyển dụng', importance: 'high' },

  // Work-Life Balance
  { id: 'iq22', category: 'Work-Life Balance', question: 'Giờ làm việc thực tế? Có thường xuyên OT không?', description: 'Đánh giá khối lượng công việc thực tế', importance: 'high' },
  { id: 'iq23', category: 'Work-Life Balance', question: 'Có on-call hay support ngoài giờ không?', description: 'Hiểu trách nhiệm ngoài giờ làm', importance: 'medium' },
  { id: 'iq24', category: 'Work-Life Balance', question: 'Deadline và pressure thường ở mức nào?', description: 'Đánh giá áp lực công việc', importance: 'medium' },
];

export const OFFER_COLORS = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4',
  '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#3b82f6',
];
