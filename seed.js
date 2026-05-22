const db = require('./db');
const { hashPassword } = require('./auth');

function seed() {
  // Always ensure default categories exist (in case they were deleted or never seeded)
  const existingCats = db.findAll('categories').map(c => c.name);
  const defaultCats = [
    { name: 'Course Project', description: 'University course-based projects for academic credit.' },
    { name: 'TÜBİTAK Student Project', description: 'Scientific research projects funded by TÜBİTAK (2209-A/B programs).' },
    { name: 'Teknofest Student Project', description: 'Technology competition projects for Teknofest festival.' },
  ];
  defaultCats.forEach(cat => {
    if (!existingCats.includes(cat.name)) {
      db.insert('categories', cat);
      console.log('Added missing category:', cat.name);
    }
  });

  if (db.findAll('users').length > 0) { console.log('Already seeded.'); return; }
  console.log('Seeding...');

  const admin = db.insert('users', { name: 'Admin User', email: 'admin@uskudar.edu.tr', password: hashPassword('admin123'), role: 'admin', department: 'Administration', status: 'active' });

  const i1 = db.insert('users', { name: 'Dr. Kristin Surpuhi BENLİ', email: 'kristin@uskudar.edu.tr', password: hashPassword('advisor123'), role: 'instructor', department: 'Software Engineering', academicTitle: 'Dr.', about: 'Associate Professor specializing in Software Engineering and AI.', expertise: 'Artificial Intelligence,Software Engineering,Machine Learning', researchInterests: 'Deep Learning, NLP, Software Architecture', supervisedTypes: 'Course Project,TÜBİTAK Student Project', availableForAdvising: true, status: 'active' });
  const i2 = db.insert('users', { name: 'Prof. Mehmet YILMAZ', email: 'mehmet@uskudar.edu.tr', password: hashPassword('advisor123'), role: 'instructor', department: 'Computer Science', academicTitle: 'Prof.', about: 'Professor with expertise in Cybersecurity and Distributed Systems.', expertise: 'Cybersecurity,Networking,Cloud Computing', researchInterests: 'Network Security, Cryptography, IoT Security', supervisedTypes: 'TÜBİTAK Student Project,Teknofest Student Project', availableForAdvising: true, status: 'active' });
  const i3 = db.insert('users', { name: 'Assoc. Prof. Ayşe KAYA', email: 'ayse@uskudar.edu.tr', password: hashPassword('advisor123'), role: 'instructor', department: 'Software Engineering', academicTitle: 'Assoc. Prof.', about: 'Researcher in Web Technologies and HCI.', expertise: 'Web Development,HCI,UX Design', researchInterests: 'User Experience, Accessibility, Mobile Computing', supervisedTypes: 'Course Project,Teknofest Student Project', availableForAdvising: false, status: 'active' });

  const s1 = db.insert('users', { name: 'Ali ÖZTÜRK', email: 'ali@student.uskudar.edu.tr', password: hashPassword('student123'), role: 'student', department: 'Software Engineering', year: '4th Year', about: 'Senior year student passionate about web development.', skills: 'React,Node.js,PostgreSQL,Docker,Git', interests: 'Web Development, Open Source, DevOps', githubLink: 'https://github.com/aliozturk', linkedinLink: 'https://linkedin.com/in/aliozturk', status: 'active' });
  const s2 = db.insert('users', { name: 'Zeynep ARSLAN', email: 'zeynep@student.uskudar.edu.tr', password: hashPassword('student123'), role: 'student', department: 'Software Engineering', year: '3rd Year', about: 'Interested in mobile apps and AI research.', skills: 'Flutter,Python,TensorFlow,Firebase', interests: 'Mobile Development, Machine Learning', githubLink: 'https://github.com/zeyneparslan', linkedinLink: '', status: 'active' });
  const s3 = db.insert('users', { name: 'Burak DEMİR', email: 'burak@student.uskudar.edu.tr', password: hashPassword('student123'), role: 'student', department: 'Computer Science', year: '4th Year', about: 'Backend developer and database enthusiast.', skills: 'Java,Spring Boot,PostgreSQL,Redis', interests: 'Backend Development, Distributed Systems', githubLink: 'https://github.com/burakdemir', linkedinLink: 'https://linkedin.com/in/burakdemir', status: 'active' });
  const s4 = db.insert('users', { name: 'Elif ŞAHİN', email: 'elif@student.uskudar.edu.tr', password: hashPassword('student123'), role: 'student', department: 'Software Engineering', year: '2nd Year', about: 'UI/UX designer who codes.', skills: 'Figma,Vue.js,CSS,JavaScript', interests: 'UI/UX Design, Frontend Development', githubLink: '', linkedinLink: 'https://linkedin.com/in/elifsahin', status: 'active' });

  const cat1 = db.insert('categories', { name: 'Course Project', description: 'University course-based projects for academic credit.' });
  const cat2 = db.insert('categories', { name: 'TÜBİTAK Student Project', description: 'Scientific research projects funded by TÜBİTAK (2209-A/B programs).' });
  const cat3 = db.insert('categories', { name: 'Teknofest Student Project', description: 'Technology competition projects for Teknofest festival.' });

  db.insert('announcements', { title: 'TÜBİTAK 2209-A Application Deadline', content: 'The application period for TÜBİTAK 2209-A Undergraduate Research Projects Support Program is now open. Students must submit proposals through the TÜBİTAK portal. Advisor approval is required before submission.', relatedCategory: 'TÜBİTAK Student Project', deadline: '2026-06-15', authorId: admin.id, authorName: admin.name });
  db.insert('announcements', { title: 'Teknofest 2026 Registration Open', content: 'Teknofest 2026 applications are now open. Students can register teams and projects in various categories including AI, Robotics, and Software. Teams must have an assigned instructor advisor.', relatedCategory: 'Teknofest Student Project', deadline: '2026-05-30', authorId: admin.id, authorName: admin.name });
  db.insert('announcements', { title: 'SE302 Course Project Submission Deadline', content: 'All SE302 Software Engineering course project teams must finalize team formation by end of this week. Projects must be registered in the system with all team members listed.', relatedCategory: 'Course Project', deadline: '2026-05-10', authorId: admin.id, authorName: admin.name });

  const p1 = db.insert('projects', { title: 'Student Project Management System', projectType: 'Course Project', description: 'A web-based platform for managing student projects, team formation, and advisor assignment at Uskudar University.', requiredSkills: 'React,Node.js,PostgreSQL', rolesNeeded: 'Frontend Developer,Backend Developer,UI/UX Designer', teamSize: 4, currentMembers: 2, budget: '', ownerId: s1.id, ownerName: s1.name, advisorId: i1.id, advisorName: i1.name, advisorAssigned: true, status: 'active' });
  const p2 = db.insert('projects', { title: 'AI-Powered Exam Monitoring System', projectType: 'TÜBİTAK Student Project', description: 'Using computer vision and ML to detect suspicious behavior during online exams. Applying for TÜBİTAK 2209-A funding.', requiredSkills: 'Python,TensorFlow,OpenCV', rolesNeeded: 'ML Engineer,Backend Developer', teamSize: 3, currentMembers: 1, budget: '₺15,000', ownerId: s2.id, ownerName: s2.name, advisorId: null, advisorName: null, advisorAssigned: false, status: 'active' });
  const p3 = db.insert('projects', { title: 'Smart Campus Navigation Robot', projectType: 'Teknofest Student Project', description: 'An autonomous robot for navigating university campus using computer vision and ROS.', requiredSkills: 'ROS,Python,Computer Vision,Arduino', rolesNeeded: 'Robotics Engineer,Software Developer,Hardware Engineer', teamSize: 4, currentMembers: 2, budget: '₺25,000', ownerId: s3.id, ownerName: s3.name, advisorId: i2.id, advisorName: i2.name, advisorAssigned: true, status: 'active' });
  const p4 = db.insert('projects', { title: 'University Event Management App', projectType: 'Course Project', description: 'A mobile application for managing and discovering university events, clubs and activities.', requiredSkills: 'Flutter,Firebase,Figma', rolesNeeded: 'Mobile Developer,UI/UX Designer,Backend Developer', teamSize: 3, currentMembers: 1, budget: '', ownerId: s4.id, ownerName: s4.name, advisorId: null, advisorName: null, advisorAssigned: false, status: 'active' });

  db.insert('applications', { projectId: p1.id, projectTitle: p1.title, projectType: p1.projectType, applicantId: s3.id, applicantName: s3.name, ownerId: s1.id, status: 'approved', roleApplied: 'Backend Developer', message: 'I have strong backend skills and would love to contribute.' });
  db.insert('applications', { projectId: p2.id, projectTitle: p2.title, projectType: p2.projectType, applicantId: s4.id, applicantName: s4.name, ownerId: s2.id, status: 'pending', roleApplied: 'ML Engineer', message: 'I have been studying TensorFlow and want to join this research.' });
  db.insert('applications', { projectId: p4.id, projectTitle: p4.title, projectType: p4.projectType, applicantId: s1.id, applicantName: s1.name, ownerId: s4.id, status: 'pending', roleApplied: 'Backend Developer', message: 'I can build the backend API for this app.' });

  db.insert('advisor_requests', { studentId: s2.id, studentName: s2.name, instructorId: i1.id, instructorName: i1.name, projectId: p2.id, projectTitle: p2.title, projectType: p2.projectType, status: 'pending', message: 'I would like you to supervise my TÜBİTAK project on AI exam monitoring.' });
  db.insert('advisor_requests', { studentId: s4.id, studentName: s4.name, instructorId: i3.id, instructorName: i3.name, projectId: p4.id, projectTitle: p4.title, projectType: p4.projectType, status: 'pending', message: 'Your expertise in UX would be perfect for our event app.' });
  db.insert('advisor_requests', { studentId: s3.id, studentName: s3.name, instructorId: i2.id, instructorName: i2.name, projectId: p3.id, projectTitle: p3.title, projectType: p3.projectType, status: 'accepted', message: 'We need your guidance for our Teknofest robotics project.' });

  console.log('\n✅ Seeded!\nAdmin: admin@uskudar.edu.tr / admin123\nInstructor: kristin@uskudar.edu.tr / advisor123\nStudent: ali@student.uskudar.edu.tr / student123\n');
}
seed();