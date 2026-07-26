import { LessonSet } from '../types';

export const SAMPLE_LESSONS: LessonSet[] = [
  {
    id: 'sample-business-1',
    title: 'Giao Tiếp Công Sở & Họp Hành',
    category: 'Tiếng Anh Công Sở',
    description: 'Ôn tập các mẫu câu thông dụng khi báo cáo công việc, xử lý trễ hạn và đề xuất giải pháp trong các cuộc họp.',
    createdAt: new Date().toISOString(),
    isPreMade: true,
    situationPairs: [
      {
        id: 's1',
        situation: 'Muốn xin lỗi vì chưa thể hoàn thành báo cáo đúng hạn do phát sinh sự cố',
        targetPhrase: 'fall behind schedule',
        explanation: 'Cụm từ "fall behind schedule" nghĩa là bị chậm tiến độ, trễ hạn so với kế hoạch đã đề ra.'
      },
      {
        id: 's2',
        situation: 'Đề xuất giải pháp dự phòng khi phương án chính gặp rủi ro',
        targetPhrase: 'contingency plan',
        explanation: '"Contingency plan" là kế hoạch dự phòng được chuẩn bị trước cho các tình huống khẩn cấp.'
      },
      {
        id: 's3',
        situation: 'Nói rằng bạn sẽ chủ động liên lạc lại với đối tác để cập nhật thông tin',
        targetPhrase: 'follow up with',
        explanation: '"Follow up with someone" là theo dõi, liên lạc lại để kiểm tra tiến độ hoặc cập nhật tình hình.'
      },
      {
        id: 's4',
        situation: 'Muốn tóm tắt lại các điểm chính trước khi kết thúc cuộc họp',
        targetPhrase: 'wrap up the meeting',
        explanation: '"Wrap up" nghĩa là hoàn tất, kết thúc một hoạt động hay cuộc họp.'
      },
      {
        id: 's5',
        situation: 'Yêu cầu đồng nghiệp cho biết quan điểm hoặc góc nhìn của họ',
        targetPhrase: 'weigh in on this',
        explanation: '"Weigh in on" là đóng góp ý kiến hoặc đưa ra nhận xét cá nhân vào một cuộc thảo luận.'
      }
    ],
    rawDialogue: `Boss: Good morning team, let's start our weekly meeting. Alex, how is the quarterly report coming along?
Alex: I apologize, but we have [blank_1] due to some technical issues with data collection.
Boss: I see. Do we have a [blank_2] in case the server maintenance takes longer?
Alex: Yes, Sarah is helping us process the raw files manually as backup.
Boss: Great. Sarah, could you [blank_3] the client today regarding their feedback?
Sarah: Absolutely, I will call them right after we [blank_4] today.
Boss: Perfect. Before we finish, does anyone else want to [blank_5] the budget proposal?`,
    rawAnswers: [
      'fallen behind schedule',
      'contingency plan',
      'follow up with',
      'wrap up the meeting',
      'weigh in on'
    ],
    dialogueItems: [
      {
        speaker: 'Boss',
        textWithBlanks: "Good morning team, let's start our weekly meeting. Alex, how is the quarterly report coming along?",
        blankIds: []
      },
      {
        speaker: 'Alex',
        textWithBlanks: 'I apologize, but we have [blank_1] due to some technical issues with data collection.',
        blankIds: ['blank_1']
      },
      {
        speaker: 'Boss',
        textWithBlanks: 'I see. Do we have a [blank_2] in case the server maintenance takes longer?',
        blankIds: ['blank_2']
      },
      {
        speaker: 'Alex',
        textWithBlanks: 'Yes, Sarah is helping us process the raw files manually as backup.',
        blankIds: []
      },
      {
        speaker: 'Boss',
        textWithBlanks: 'Great. Sarah, could you [blank_3] the client today regarding their feedback?',
        blankIds: ['blank_3']
      },
      {
        speaker: 'Sarah',
        textWithBlanks: 'Absolutely, I will call them right after we [blank_4] today.',
        blankIds: ['blank_4']
      },
      {
        speaker: 'Boss',
        textWithBlanks: 'Perfect. Before we finish, does anyone else want to [blank_5] the budget proposal?',
        blankIds: ['blank_5']
      }
    ],
    dialogueBlanks: {
      blank_1: {
        id: 'blank_1',
        correctAnswer: 'fallen behind schedule',
        options: ['fallen behind schedule', 'wrapped up the meeting', 'followed up with', 'weighed in on'],
        explanation: 'Alex dùng "fallen behind schedule" để giải thích lý do báo cáo bị chậm trễ so với kế hoạch.'
      },
      blank_2: {
        id: 'blank_2',
        correctAnswer: 'contingency plan',
        options: ['contingency plan', 'scheduled meeting', 'client feedback', 'weekly agenda'],
        explanation: 'Boss hỏi về "contingency plan" (kế hoạch dự phòng) phòng trường hợp bảo trì máy chủ kéo dài.'
      },
      blank_3: {
        id: 'blank_3',
        correctAnswer: 'follow up with',
        options: ['follow up with', 'take care of', 'look down on', 'wrap up with'],
        explanation: '"follow up with" nghĩa là liên hệ lại với khách hàng để nắm tình hình phản hồi.'
      },
      blank_4: {
        id: 'blank_4',
        correctAnswer: 'wrap up the meeting',
        options: ['wrap up the meeting', 'fall behind schedule', 'cut down costs', 'sign the contract'],
        explanation: 'Sarah hứa sẽ gọi cho khách hàng ngay sau khi "wrap up the meeting" (kết thúc cuộc họp).'
      },
      blank_5: {
        id: 'blank_5',
        correctAnswer: 'weigh in on',
        options: ['weigh in on', 'step away from', 'give up on', 'carry out for'],
        explanation: 'Boss hỏi xem có ai muốn "weigh in on" (đóng góp ý kiến) về bản đề xuất ngân sách hay không.'
      }
    }
  },
  {
    id: 'sample-travel-2',
    title: 'Đặt Phòng Khách Sạn & Du Lịch',
    category: 'Giao Tiếp Du Lịch',
    description: 'Các cấu trúc và cụm từ hữu ích khi nhận phòng khách sạn, yêu cầu nâng hạng phòng hoặc giải quyết sự cố.',
    createdAt: new Date().toISOString(),
    isPreMade: true,
    situationPairs: [
      {
        id: 's10',
        situation: 'Khi bạn muốn làm thủ tục nhận phòng tại quầy lễ tân khách sạn',
        targetPhrase: 'check in',
        explanation: '"Check in" là thủ tục đăng ký nhận phòng hoặc làm thủ tục trước chuyến bay.'
      },
      {
        id: 's11',
        situation: 'Yêu cầu chuyển sang phòng tốt hơn, đẹp hơn nếu còn trống',
        targetPhrase: 'room upgrade',
        explanation: '"Room upgrade" là việc nâng cấp lên hạng phòng cao cấp hơn.'
      },
      {
        id: 's12',
        situation: 'Hỏi xem khách sạn có hỗ trợ dịch vụ đưa đón sân bay miễn phí không',
        targetPhrase: 'complimentary shuttle',
        explanation: '"Complimentary shuttle" nghĩa là xe đưa đón miễn phí do khách sạn cung cấp.'
      },
      {
        id: 's13',
        situation: 'Muốn biết chính xác thời gian trả phòng trước khi rời đi',
        targetPhrase: 'check-out time',
        explanation: '"Check-out time" là giờ trả phòng quy định của khách sạn.'
      }
    ],
    rawDialogue: `Guest: Good afternoon! I would like to [blank_1] for my reservation under the name Wilson.
Receptionist: Welcome Mr. Wilson! Let me pull up your booking. You have booked a Deluxe Sea View room.
Guest: Wonderful! Is there any possibility of a complimentary [blank_2] to a suite?
Receptionist: Let me check our availability... Yes! We can offer that for you today.
Guest: That is amazing! Also, do you offer a [blank_3] to the airport tomorrow morning?
Receptionist: Yes, our bus runs every hour. Please remember our standard [blank_4] is 11:00 AM.`,
    rawAnswers: [
      'check in',
      'room upgrade',
      'complimentary shuttle',
      'check-out time'
    ],
    dialogueItems: [
      {
        speaker: 'Guest',
        textWithBlanks: 'Good afternoon! I would like to [blank_1] for my reservation under the name Wilson.',
        blankIds: ['blank_1']
      },
      {
        speaker: 'Receptionist',
        textWithBlanks: 'Welcome Mr. Wilson! Let me pull up your booking. You have booked a Deluxe Sea View room.',
        blankIds: []
      },
      {
        speaker: 'Guest',
        textWithBlanks: 'Wonderful! Is there any possibility of a complimentary [blank_2] to a suite?',
        blankIds: ['blank_2']
      },
      {
        speaker: 'Receptionist',
        textWithBlanks: 'Let me check our availability... Yes! We can offer that for you today.',
        blankIds: []
      },
      {
        speaker: 'Guest',
        textWithBlanks: 'That is amazing! Also, do you offer a [blank_3] to the airport tomorrow morning?',
        blankIds: ['blank_3']
      },
      {
        speaker: 'Receptionist',
        textWithBlanks: 'Yes, our bus runs every hour. Please remember our standard [blank_4] is 11:00 AM.',
        blankIds: ['blank_4']
      }
    ],
    dialogueBlanks: {
      blank_1: {
        id: 'blank_1',
        correctAnswer: 'check in',
        options: ['check in', 'check out', 'look around', 'drop off'],
        explanation: 'Khách muốn "check in" (làm thủ tục nhận phòng).'
      },
      blank_2: {
        id: 'blank_2',
        correctAnswer: 'room upgrade',
        options: ['room upgrade', 'room service', 'late checkout', 'extra key'],
        explanation: 'Khách hỏi nâng hạng phòng miễn phí ("complimentary room upgrade").'
      },
      blank_3: {
        id: 'blank_3',
        correctAnswer: 'complimentary shuttle',
        options: ['complimentary shuttle', 'private taxi', 'public bus ticket', 'rental car'],
        explanation: 'Khách hỏi xe đưa đón sân bay miễn phí ("complimentary shuttle").'
      },
      blank_4: {
        id: 'blank_4',
        correctAnswer: 'check-out time',
        options: ['check-out time', 'breakfast time', 'swimming hours', 'closing time'],
        explanation: 'Lễ tân nhắc nhở giờ trả phòng tiêu chuẩn ("check-out time").'
      }
    }
  }
];
