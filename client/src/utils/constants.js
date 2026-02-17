export const ROLES = [
  { id: 'frontend', label: 'Frontend Developer', icon: '💻' },
  { id: 'backend', label: 'Backend Developer', icon: '⚙️' },
  { id: 'fullstack', label: 'Full Stack Developer', icon: '🔧' },
  { id: 'data-analyst', label: 'Data Analyst', icon: '📊' },
  { id: 'devops', label: 'DevOps Engineer', icon: '🚀' },
  { id: 'mobile', label: 'Mobile Developer', icon: '📱' },
  { id: 'ml-engineer', label: 'ML Engineer', icon: '🤖' },
  { id: 'product-manager', label: 'Product Manager', icon: '📋' },
  { id: 'ui-ux', label: 'UI/UX Designer', icon: '🎨' },
  { id: 'qa', label: 'QA Engineer', icon: '🧪' },
  { id: 'cybersecurity', label: 'Cybersecurity Analyst', icon: '🔒' },
  { id: 'cloud', label: 'Cloud Architect', icon: '☁️' },
];

export const INTERVIEW_TYPES = [
  { id: 'technical', label: 'Technical', description: 'Coding, architecture, and technical concepts' },
  { id: 'behavioral', label: 'Behavioral', description: 'Situation-based questions and soft skills' },
  { id: 'hr', label: 'HR', description: 'General HR questions, culture fit' },
  { id: 'system-design', label: 'System Design', description: 'Architecture and scalability discussions' },
  { id: 'mixed', label: 'Mixed', description: 'Combination of all types' },
];

export const DIFFICULTY_LEVELS = [
  { id: 'easy', label: 'Easy', color: 'text-accent-green' },
  { id: 'medium', label: 'Medium', color: 'text-accent-yellow' },
  { id: 'hard', label: 'Hard', color: 'text-accent-red' },
  { id: 'expert', label: 'Expert', color: 'text-accent-purple' },
];

export const EXPERIENCE_LEVELS = [
  { id: 'fresher', label: 'Fresher', subtitle: '0-1 years' },
  { id: 'junior', label: 'Junior', subtitle: '1-2 years' },
  { id: 'mid', label: 'Mid-Level', subtitle: '2-4 years' },
  { id: 'senior', label: 'Senior', subtitle: '4+ years' },
];

export const DURATIONS = [
  { value: 5, label: '5 min', description: 'Quick practice' },
  { value: 10, label: '10 min', description: 'Standard session' },
  { value: 15, label: '15 min', description: 'Extended session' },
  { value: 20, label: '20 min', description: 'Full interview' },
];

export const INTERVIEW_STYLES = [
  { id: 'friendly', label: 'Friendly', description: 'Warm and encouraging' },
  { id: 'neutral', label: 'Neutral', description: 'Professional and balanced' },
  { id: 'challenging', label: 'Challenging', description: 'Rigorous and direct' },
];

export const COMPANY_STYLES = [
  { id: 'faang', label: 'FAANG', description: 'Big tech style' },
  { id: 'startup', label: 'Startup', description: 'Fast-paced and practical' },
  { id: 'corporate', label: 'Corporate', description: 'Formal and structured' },
  { id: 'general', label: 'General', description: 'Balanced approach' },
];

export const FOCUS_AREAS = {
  frontend: ['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML', 'Next.js', 'Performance', 'Accessibility', 'Testing'],
  backend: ['Node.js', 'Express', 'APIs', 'Databases', 'SQL', 'Authentication', 'Microservices', 'Caching'],
  fullstack: ['React', 'Node.js', 'Databases', 'APIs', 'DevOps', 'System Design', 'Testing', 'Security'],
  'data-analyst': ['SQL', 'Python', 'Statistics', 'Data Visualization', 'Excel', 'Machine Learning', 'ETL'],
  devops: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux', 'Monitoring', 'Infrastructure as Code'],
  mobile: ['React Native', 'Flutter', 'iOS', 'Android', 'Mobile UI', 'Performance', 'Push Notifications'],
  'ml-engineer': ['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'Statistics', 'MLOps'],
  'product-manager': ['User Research', 'Roadmapping', 'Analytics', 'Stakeholder Management', 'Agile', 'Prioritization'],
  'ui-ux': ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Usability', 'Visual Design'],
  qa: ['Test Planning', 'Automation', 'Manual Testing', 'API Testing', 'Performance Testing', 'Bug Tracking'],
  cybersecurity: ['Network Security', 'Encryption', 'Vulnerability Assessment', 'Compliance', 'Incident Response'],
  cloud: ['AWS', 'Azure', 'GCP', 'Serverless', 'Networking', 'Security', 'Cost Optimization'],
};

export const ACHIEVEMENT_INFO = {
  first_interview: { title: 'First Steps', description: 'Completed your first mock interview', icon: '🏆' },
  five_interviews: { title: 'Getting Serious', description: 'Completed 5 mock interviews', icon: '🔥' },
  ten_interviews: { title: 'Interview Pro', description: 'Completed 10 mock interviews', icon: '⭐' },
  score_70: { title: 'Good Performance', description: 'Scored 70+ in an interview', icon: '🏅' },
  score_85: { title: 'Excellent', description: 'Scored 85+ in an interview', icon: '💎' },
  score_95: { title: 'Near Perfect', description: 'Scored 95+ in an interview', icon: '👑' },
  streak_3: { title: 'Consistent', description: 'Practiced 3 days in a row', icon: '🔥' },
  streak_7: { title: 'Dedicated', description: 'Practiced 7 days in a row', icon: '🚀' },
  streak_30: { title: 'Unstoppable', description: 'Practiced 30 days in a row', icon: '⚡' },
};

export const COMMUNITY_CATEGORIES = [
  { id: 'interview-experience', label: 'Interview Experiences' },
  { id: 'tips-tricks', label: 'Tips & Tricks' },
  { id: 'technical-questions', label: 'Technical Questions' },
  { id: 'company-specific', label: 'Company Specific' },
  { id: 'general-discussion', label: 'General Discussion' },
];

export const LEADERBOARD_TYPES = [
  { id: 'score', label: 'Top Scores' },
  { id: 'interviews', label: 'Most Interviews' },
  { id: 'streak', label: 'Longest Streaks' },
  { id: 'improvement', label: 'Most Improved' },
];
