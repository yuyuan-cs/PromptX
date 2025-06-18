/**
 * Calendar Action Module for DACP PromptX Service
 * 提供日历和会议管理功能
 */

// Schedule meeting action
async function schedule_meeting(parameters) {
  const { user_request, context = {} } = parameters;
  
  if (!user_request) {
    throw new Error('user_request is required for schedule_meeting action');
  }

  // 解析会议请求
  const meetingData = parseMeetingRequest(user_request, context);
  
  // 验证会议数据
  validateMeetingData(meetingData);
  
  // 执行日程安排（Demo模式）
  const result = await executeScheduleMeeting(meetingData, context);
  
  return result;
}

// 解析会议请求
function parseMeetingRequest(userRequest, context) {
  // 提取时间信息
  let meetingTime = '待定';
  let duration = 60; // 默认60分钟
  
  if (userRequest.includes('明天')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    meetingTime = tomorrow.toLocaleDateString('zh-CN');
  } else if (userRequest.includes('下周')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    meetingTime = nextWeek.toLocaleDateString('zh-CN');
  }
  
  // 提取参会人员
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const attendees = userRequest.match(emailRegex) || ['team@example.com'];
  
  // 分析会议类型
  let meetingType = '常规会议';
  let priority = 'normal';
  
  if (userRequest.includes('紧急')) {
    meetingType = '紧急会议';
    priority = 'high';
  } else if (userRequest.includes('周会')) {
    meetingType = '周例会';
  } else if (userRequest.includes('讨论')) {
    meetingType = '讨论会';
  } else if (userRequest.includes('评审')) {
    meetingType = '评审会议';
  }
  
  // 生成会议详情
  const meetingDetails = generateMeetingDetails(userRequest, meetingType, context);
  
  return {
    title: meetingDetails.title,
    time: meetingTime,
    duration: duration,
    attendees: attendees,
    type: meetingType,
    priority: priority,
    agenda: meetingDetails.agenda,
    location: context.location || '会议室A',
    originalRequest: userRequest,
    timestamp: new Date().toISOString()
  };
}

// 生成会议详情
function generateMeetingDetails(userRequest, meetingType, context) {
  let title = meetingType;
  let agenda = [];
  
  // 根据会议类型生成议程
  switch (meetingType) {
    case '紧急会议':
      title = '紧急事项讨论会';
      agenda = [
        '问题说明',
        '影响分析',
        '解决方案讨论',
        '行动计划制定'
      ];
      break;
    case '周例会':
      title = '团队周例会';
      agenda = [
        '上周工作总结',
        '本周工作计划',
        '问题与风险',
        '其他事项'
      ];
      break;
    case '评审会议':
      title = '项目评审会';
      agenda = [
        '项目进展汇报',
        '技术方案评审',
        '风险评估',
        '下一步计划'
      ];
      break;
    default:
      agenda = [
        '会议主题介绍',
        '讨论事项',
        '决议与行动项',
        'Q&A'
      ];
  }
  
  return { title, agenda };
}

// 验证会议数据
function validateMeetingData(meetingData) {
  const errors = [];
  
  if (!meetingData.title || meetingData.title.trim().length === 0) {
    errors.push('Meeting title cannot be empty');
  }
  
  if (meetingData.attendees.length === 0) {
    errors.push('At least one attendee is required');
  }
  
  if (meetingData.duration <= 0) {
    errors.push('Meeting duration must be positive');
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
}

// 执行会议安排
async function executeScheduleMeeting(meetingData, context) {
  // Demo模式：模拟日程安排
  console.log('📅 [DACP Demo] Simulating meeting schedule:');
  console.log(`   Title: ${meetingData.title}`);
  console.log(`   Time: ${meetingData.time}`);
  console.log(`   Attendees: ${meetingData.attendees.join(', ')}`);
  
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // 生成会议ID
  const meetingId = `meet_${Date.now()}`;
  
  return {
    meeting_id: meetingId,
    status: 'scheduled',
    title: meetingData.title,
    time: meetingData.time,
    duration: `${meetingData.duration}分钟`,
    attendees: meetingData.attendees,
    location: meetingData.location,
    agenda: meetingData.agenda,
    priority: meetingData.priority,
    calendar_link: `https://calendar.example.com/meeting/${meetingId}`,
    scheduled_at: meetingData.timestamp,
    demo_mode: true,
    execution_metrics: {
      parsing_time: '15ms',
      validation_time: '5ms',
      scheduling_time: '150ms'
    }
  };
}

// 导出所有calendar相关的actions
module.exports = {
  schedule_meeting
};