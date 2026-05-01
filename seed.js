const db = require('./db');
const { hashPassword } = require('./auth');

function seed() {
  if (db.findAll('users').length > 0) { console.log('Already seeded.'); return; }
  console.log('Seeding AkademiLink...');

  const u1 = db.insert('users', { name: 'Mehmet Yılmaz', email: 'mehmet@email.com', password: hashPassword('pass123'), headline: 'Senior Software Engineer @ Uskudar Tech', location: 'Istanbul, Turkey', about: 'Passionate software engineer with 8 years of experience building scalable web applications. I love open source and clean architecture.', skills: 'JavaScript,React,Node.js,PostgreSQL,Docker', experience: JSON.stringify([{title:'Senior Software Engineer',company:'Uskudar Tech',duration:'2021–Present'},{title:'Frontend Developer',company:'StartupX',duration:'2018–2021'}]), education: JSON.stringify([{school:'Uskudar University',degree:'BSc Computer Science','year':'2018'}]), connections: 0, avatar: '' });
  const u2 = db.insert('users', { name: 'Ayşe Kaya', email: 'ayse@email.com', password: hashPassword('pass123'), headline: 'Product Designer @ Creative Studio | UX Enthusiast', location: 'Ankara, Turkey', about: 'I design digital products that people love to use. Focused on user research, interaction design, and design systems.', skills: 'Figma,UX Design,User Research,Prototyping,Design Systems', experience: JSON.stringify([{title:'Product Designer',company:'Creative Studio',duration:'2020–Present'}]), education: JSON.stringify([{school:'METU',degree:'BSc Industrial Design','year':'2020'}]), connections: 0, avatar: '' });
  const u3 = db.insert('users', { name: 'Ali Öztürk', email: 'ali@email.com', password: hashPassword('pass123'), headline: 'Fullstack Developer | React & Node.js | Open to Opportunities', location: 'Istanbul, Turkey', about: 'Final year CS student building cool stuff with React and Node. Currently looking for my first full-time role.', skills: 'React,Node.js,MongoDB,TypeScript,Git', experience: JSON.stringify([{title:'Frontend Intern',company:'TechStartup',duration:'2025–Present'}]), education: JSON.stringify([{school:'Uskudar University',degree:'BSc Software Engineering','year':'2026'}]), connections: 0, avatar: '' });
  const u4 = db.insert('users', { name: 'Zeynep Arslan', email: 'zeynep@email.com', password: hashPassword('pass123'), headline: 'HR Manager @ TechCorp Turkey | Talent Acquisition', location: 'Istanbul, Turkey', about: 'Helping great companies find great engineers. Passionate about building diverse and inclusive tech teams.', skills: 'Recruitment,Talent Acquisition,HR Strategy,LinkedIn Recruiting', experience: JSON.stringify([{title:'HR Manager',company:'TechCorp Turkey',duration:'2019–Present'},{title:'HR Specialist',company:'Global Corp',duration:'2016–2019'}]), education: JSON.stringify([{school:'Bogazici University',degree:'BA Psychology','year':'2016'}]), connections: 0, avatar: '' });
  const u5 = db.insert('users', { name: 'Burak Demir', email: 'burak@email.com', password: hashPassword('pass123'), headline: 'Data Scientist @ Türk Telekom | ML & AI', location: 'Ankara, Turkey', about: 'Turning data into actionable insights. Working on NLP and recommendation systems. PhD candidate at METU.', skills: 'Python,TensorFlow,PyTorch,SQL,Machine Learning,NLP', experience: JSON.stringify([{title:'Data Scientist',company:'Türk Telekom',duration:'2022–Present'}]), education: JSON.stringify([{school:'METU',degree:'MSc Artificial Intelligence','year':'2022'}]), connections: 0, avatar: '' });
  const u6 = db.insert('users', { name: 'Elif Şahin', email: 'elif@email.com', password: hashPassword('pass123'), headline: 'CTO @ MobilApp | Entrepreneur | Angel Investor', location: 'Istanbul, Turkey', about: 'Built and scaled 3 tech startups. Currently building MobilApp, a B2B SaaS company serving 500+ businesses.', skills: 'Leadership,Product Strategy,B2B SaaS,Fundraising,Team Building', experience: JSON.stringify([{title:'CTO',company:'MobilApp',duration:'2020–Present'},{title:'Co-founder',company:'Fintech Startup',duration:'2017–2020'}]), education: JSON.stringify([{school:'Bilkent University',degree:'BSc Computer Engineering','year':'2015'}]), connections: 0, avatar: '' });
  const u7 = db.insert('users', { name: 'Hasan Çelik', email: 'hasan@email.com', password: hashPassword('pass123'), headline: 'Backend Engineer @ Trendyol | Go & Distributed Systems', location: 'Istanbul, Turkey', about: 'Backend engineer specializing in high-performance distributed systems and microservices architecture at scale.', skills: 'Go,Kubernetes,Kafka,Redis,gRPC,PostgreSQL', experience: JSON.stringify([{title:'Backend Engineer',company:'Trendyol',duration:'2021–Present'}]), education: JSON.stringify([{school:'ITU',degree:'BSc Computer Engineering','year':'2021'}]), connections: 0, avatar: '' });
  const u8 = db.insert('users', { name: 'Fatma Yıldız', email: 'fatma@email.com', password: hashPassword('pass123'), headline: 'DevOps Engineer | Cloud Architecture | AWS Certified', location: 'Izmir, Turkey', about: 'AWS certified DevOps engineer building resilient cloud infrastructure. Passionate about automation and SRE practices.', skills: 'AWS,Terraform,Docker,Kubernetes,CI/CD,Linux', experience: JSON.stringify([{title:'DevOps Engineer',company:'CloudSystems',duration:'2020–Present'}]), education: JSON.stringify([{school:'Ege University',degree:'BSc Computer Engineering','year':'2020'}]), connections: 0, avatar: '' });

  // Connections (connected)
  const conn = (a, b) => { db.insert('connections', { requesterId: a.id, receiverId: b.id, status: 'connected', createdAt: new Date().toISOString() }); };
  conn(u1, u2); conn(u1, u3); conn(u1, u5); conn(u1, u6);
  conn(u2, u3); conn(u2, u4); conn(u3, u7); conn(u4, u5);
  conn(u5, u6); conn(u6, u7); conn(u7, u8); conn(u3, u8);
  // Pending
  db.insert('connections', { requesterId: u4.id, receiverId: u1.id, status: 'pending' });
  db.insert('connections', { requesterId: u8.id, receiverId: u2.id, status: 'pending' });

  // Posts
  const p1 = db.insert('posts', { authorId: u1.id, authorName: u1.name, authorHeadline: u1.headline, content: '🚀 Just shipped a new feature that reduced our API response time by 60%! The key was moving from REST polling to WebSocket streams and adding Redis caching at the edge layer.\n\nLessons learned:\n✅ Profile before you optimize\n✅ Caching is your best friend\n✅ WebSockets aren\'t scary\n\nWhat performance wins have you achieved lately? Drop them below 👇', likes: 0, commentsCount: 0 });
  const p2 = db.insert('posts', { authorId: u2.id, authorName: u2.name, authorHeadline: u2.headline, content: '💡 Hot take: The best UX is the one the user never notices.\n\nAfter 4 years in product design, I\'ve learned that great design is invisible. Users should be focused on their task, not your UI.\n\nSigns your design is working:\n→ Users complete tasks without thinking\n→ Zero support tickets about confusion\n→ Users thank you for the product, not the design\n\nKeep it simple. Keep it purposeful. 🎯', likes: 0, commentsCount: 0 });
  const p3 = db.insert('posts', { authorId: u4.id, authorName: u4.name, authorHeadline: u4.headline, content: '🔥 We\'re HIRING at TechCorp Turkey!\n\n📌 Senior React Developer — Istanbul (Hybrid)\n📌 Node.js Backend Engineer — Remote\n📌 Product Manager — Istanbul\n\nWhat we offer:\n✨ Competitive salary + equity\n✨ Remote-first culture\n✨ Learning budget €2,000/year\n✨ Top-tier health insurance\n\nDM me or apply through our website. RT to help someone find their dream job! 🙏\n\n#hiring #techjobs #istanbul #react #nodejs', likes: 0, commentsCount: 0 });
  const p4 = db.insert('posts', { authorId: u5.id, authorName: u5.name, authorHeadline: u5.headline, content: 'Excited to share that our NLP model for Turkish text classification just hit 94.2% accuracy on the benchmark dataset! 🎉\n\nKey improvements that got us there:\n• Custom tokenizer for Turkish morphology\n• Domain-specific pre-training on 2M Turkish documents  \n• Ensemble of BERT + XGBoost for edge cases\n\nOpen sourcing the model weights next week. Follow for updates!\n\n#machinelearning #nlp #turkish #ai #datascience', likes: 0, commentsCount: 0 });
  const p5 = db.insert('posts', { authorId: u6.id, authorName: u6.name, authorHeadline: u6.headline, content: '3 years ago I quit my stable job to start MobilApp with €50K in savings and zero customers.\n\nToday we have:\n→ 500+ paying customers\n→ 12-person team\n→ €2.1M ARR\n→ Profitable since month 18\n\nThe hardest part wasn\'t the code or the product. It was the 6 months where nothing worked and I questioned everything every single day.\n\nTo every founder struggling right now: the compounding starts slowly. Keep going. 💪', likes: 0, commentsCount: 0 });
  const p6 = db.insert('posts', { authorId: u3.id, authorName: u3.name, authorHeadline: u3.headline, content: 'Just deployed my first production app! 🎉 Built a full-stack project management tool using React + Node.js + PostgreSQL as part of my university capstone.\n\nWhat I learned building it solo:\n• Database design is HARD (do it right the first time)\n• Error handling is half the code\n• Writing tests actually saves time in the long run\n• Deploy early, deploy often\n\nSearching for my first full-time role. Open to SWE opportunities! Check my profile 👆\n\n#firstjob #react #nodejs #studentdeveloper', likes: 0, commentsCount: 0 });
  const p7 = db.insert('posts', { authorId: u7.id, authorName: u7.name, authorHeadline: u7.headline, content: 'We process 2 million orders/day at Trendyol. Here\'s what I wish I knew about distributed systems before joining:\n\n1. Eventual consistency is not eventual inconsistency\n2. Your network WILL fail — design for it\n3. Idempotency is not optional\n4. Observability > debugging after the fact\n5. Kafka is not a database (but it can feel like one)\n\nAnything you\'d add to this list? 👇\n\n#backend #distributedsystems #golang #kafka', likes: 0, commentsCount: 0 });
  const p8 = db.insert('posts', { authorId: u8.id, authorName: u8.name, authorHeadline: u8.headline, content: '📊 AWS cost optimization thread 🧵\n\nReduced our monthly AWS bill by 43% ($18K → $10K) without dropping any features. Here\'s exactly what we did:\n\n1️⃣ Reserved instances for predictable workloads: -35%\n2️⃣ S3 Intelligent-Tiering for media storage: -20%\n3️⃣ Right-sized EC2 instances after profiling: -15%\n4️⃣ Moved batch jobs to Spot instances: -60% on compute\n5️⃣ CloudFront caching → fewer Lambda invocations: -25%\n\nCloud costs are engineering problems. Treat them like bugs. 🐛\n\n#aws #devops #cloudcost #terraform', likes: 0, commentsCount: 0 });

  // Likes
  const like = (userId, postId) => db.insert('likes', { userId, postId });
  like(u2.id, p1.id); like(u3.id, p1.id); like(u5.id, p1.id); like(u6.id, p1.id); like(u7.id, p1.id);
  like(u1.id, p2.id); like(u3.id, p2.id); like(u4.id, p2.id);
  like(u1.id, p3.id); like(u2.id, p3.id); like(u3.id, p3.id); like(u5.id, p3.id); like(u7.id, p3.id); like(u8.id, p3.id);
  like(u1.id, p4.id); like(u2.id, p4.id); like(u6.id, p4.id); like(u7.id, p4.id);
  like(u1.id, p5.id); like(u2.id, p5.id); like(u3.id, p5.id); like(u4.id, p5.id); like(u7.id, p5.id); like(u8.id, p5.id);
  like(u1.id, p6.id); like(u2.id, p6.id); like(u4.id, p6.id); like(u5.id, p6.id);
  like(u1.id, p7.id); like(u5.id, p7.id); like(u8.id, p7.id);
  like(u1.id, p8.id); like(u5.id, p8.id); like(u7.id, p8.id);

  // Update like counts
  [p1,p2,p3,p4,p5,p6,p7,p8].forEach(p => {
    const count = db.findAll('likes', { postId: p.id }).length;
    db.update('posts', p.id, { likes: count });
  });

  // Comments
  db.insert('comments', { postId: p1.id, authorId: u3.id, authorName: u3.name, authorHeadline: u3.headline, content: 'This is amazing! Which Redis client are you using on the Node side?' });
  db.insert('comments', { postId: p1.id, authorId: u7.id, authorName: u7.name, authorHeadline: u7.headline, content: 'Great approach. We did similar at Trendyol but also added read replicas for the DB layer.' });
  db.insert('comments', { postId: p2.id, authorId: u1.id, authorName: u1.name, authorHeadline: u1.headline, content: 'Absolutely agree. The best button click is one the user does without thinking twice.' });
  db.insert('comments', { postId: p5.id, authorId: u3.id, authorName: u3.name, authorHeadline: u3.headline, content: 'This is inspiring! Bookmarking this for the days when I question everything 🙌' });
  db.insert('comments', { postId: p6.id, authorId: u4.id, authorName: u4.name, authorHeadline: u4.headline, content: 'Love this! DM me, we might have a spot for you at TechCorp 🚀' });
  db.insert('comments', { postId: p7.id, authorId: u1.id, authorName: u1.name, authorHeadline: u1.headline, content: 'I\'d add: circuit breakers are not optional in microservices. Saved us many times!' });

  // Update comment counts
  [p1,p2,p3,p4,p5,p6,p7,p8].forEach(p => {
    const count = db.findAll('comments', { postId: p.id }).length;
    db.update('posts', p.id, { commentsCount: count });
  });

  // Jobs
  db.insert('jobs', { title: 'Senior React Developer', company: 'TechCorp Turkey', location: 'Istanbul (Hybrid)', type: 'Full-time', salary: '₺80,000 – ₺120,000/mo', description: 'We are looking for a Senior React Developer to join our growing product team. You will be building next-generation fintech features used by millions of users.', requirements: 'React,TypeScript,Redux,GraphQL,3+ years experience', postedBy: u4.id, postedByName: u4.name, applicants: 0 });
  db.insert('jobs', { title: 'Node.js Backend Engineer', company: 'TechCorp Turkey', location: 'Remote', type: 'Full-time', salary: '₺70,000 – ₺100,000/mo', description: 'Join our backend team building robust APIs and microservices at scale. We handle millions of transactions daily.', requirements: 'Node.js,Express,PostgreSQL,Redis,Docker,2+ years experience', postedBy: u4.id, postedByName: u4.name, applicants: 0 });
  db.insert('jobs', { title: 'Data Scientist (NLP Focus)', company: 'Türk Telekom', location: 'Ankara (Hybrid)', type: 'Full-time', salary: '₺90,000 – ₺130,000/mo', description: 'Work on cutting-edge NLP models for Turkish language processing. You will research, develop and deploy ML models at scale.', requirements: 'Python,TensorFlow,PyTorch,NLP,BERT,SQL,PhD or MSc preferred', postedBy: u5.id, postedByName: u5.name, applicants: 0 });
  db.insert('jobs', { title: 'UX Designer', company: 'Creative Studio', location: 'Istanbul', type: 'Full-time', salary: '₺55,000 – ₺75,000/mo', description: 'We\'re looking for a passionate UX Designer to join our design team. You\'ll work closely with product and engineering to craft beautiful, user-centered experiences.', requirements: 'Figma,User Research,Prototyping,2+ years experience,Portfolio required', postedBy: u2.id, postedByName: u2.name, applicants: 0 });
  db.insert('jobs', { title: 'DevOps / Platform Engineer', company: 'MobilApp', location: 'Remote', type: 'Full-time', salary: '₺85,000 – ₺115,000/mo', description: 'Help us scale our cloud infrastructure. You\'ll own our AWS architecture, CI/CD pipelines, and reliability engineering.', requirements: 'AWS,Terraform,Kubernetes,Docker,CI/CD,3+ years experience', postedBy: u6.id, postedByName: u6.name, applicants: 0 });
  db.insert('jobs', { title: 'Junior Frontend Developer', company: 'StartupX', location: 'Istanbul (Hybrid)', type: 'Full-time', salary: '₺30,000 – ₺45,000/mo', description: 'Great opportunity for fresh graduates! Join our small but mighty team building consumer-facing web products. Full mentorship provided.', requirements: 'HTML,CSS,JavaScript,React basics,Fresh graduates welcome', postedBy: u1.id, postedByName: u1.name, applicants: 0 });

  // Messages (conversations between some users)
  const msg = (from, to, content) => db.insert('messages', { senderId: from.id, senderName: from.name, receiverId: to.id, content, read: false });
  msg(u3, u1, 'Hey Mehmet! I loved your post about Redis caching. I\'m building something similar. Do you have 20 mins to chat?');
  msg(u1, u3, 'Hey Ali! Sure, happy to help. What stack are you using?');
  msg(u3, u1, 'React + Node.js + PostgreSQL. The bottleneck seems to be on the DB queries side.');
  msg(u4, u1, 'Hi Mehmet! I noticed your profile and wanted to reach out. We have an open position at TechCorp that would be a great fit for you. Would you be interested in a chat?');

  console.log('\n✅ AkademiLink seeded!\n');
  console.log('Test accounts (all use: pass123)');
  console.log('  mehmet@email.com  – Senior Software Engineer');
  console.log('  ayse@email.com    – Product Designer');
  console.log('  ali@email.com     – Student Developer');
  console.log('  zeynep@email.com  – HR Manager');
  console.log('  burak@email.com   – Data Scientist');
}

seed();
