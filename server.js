const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const db = require('./db');
const { hashPassword, verifyPassword, createToken, verifyToken } = require('./auth');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = { '.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.ico':'image/x-icon','.svg':'image/svg+xml' };

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization' });
  res.end(JSON.stringify(data));
}
const ok=(r,d)=>{send(r,200,d);return true;};
const created=(r,d)=>{send(r,201,d);return true;};
const notFound=(r,m='Not found')=>{send(r,404,{error:m});return true;};
const badReq=(r,m)=>{send(r,400,{error:m});return true;};
const unauth=(r,m='Unauthorized')=>{send(r,401,{error:m});return true;};
const forbidden=(r,m='Forbidden')=>{send(r,403,{error:m});return true;};
const serverErr=(r,e)=>{send(r,500,{error:e.message||'Error'});return true;};

function body(req) {
  return new Promise((res,rej)=>{let b='';req.on('data',c=>b+=c);req.on('end',()=>{try{res(b?JSON.parse(b):{});}catch(e){rej(new Error('Invalid JSON'));}});req.on('error',rej);});
}
function getUser(req){return verifyToken(req.headers['authorization']||'');}
function requireAuth(req,res){const u=getUser(req);if(!u){unauth(res);return null;}return u;}
function safeUser(u){if(!u)return null;const{password:_,...s}=u;return s;}
function notify(userId, type, message, fromId, fromName, link) {
  if(!userId) return;
  db.insert('notifications',{userId,type,message,fromId:fromId||0,fromName:fromName||'System',read:false,link:link||''});
}

// AUTH
async function handleAuth(method,p,req,res){
  if(method==='POST'&&p==='/api/auth/register'){
    const b=await body(req);
    if(!b.name||!b.email||!b.password)return badReq(res,'Name, email and password required');
    if(db.findOne('users',{email:b.email}))return badReq(res,'Email already registered');
    const role=b.role||'student';
    const user=db.insert('users',{name:b.name,email:b.email,password:hashPassword(b.password),role,department:b.department||'',year:b.year||'',academicTitle:b.academicTitle||'',about:'',skills:'',interests:'',expertise:'',researchInterests:'',supervisedTypes:'',availableForAdvising:true,githubLink:'',linkedinLink:'',status:'active',firstLogin:true});
    return created(res,{token:createToken(user),user:safeUser(user)});
  }
  if(method==='POST'&&p==='/api/auth/login'){
    const b=await body(req);
    const user=db.findOne('users',{email:b.email});
    if(!user||!verifyPassword(b.password,user.password))return unauth(res,'Invalid credentials');
    if(user.status==='inactive')return unauth(res,'Account deactivated. Contact admin.');
    const isFirst=user.firstLogin===true;
    if(isFirst) db.update('users',user.id,{firstLogin:false});
    return ok(res,{token:createToken(user),user:safeUser(user),firstLogin:isFirst});
  }
  return null;
}

// USERS
async function handleUsers(method,p,req,res){
  const meM=p==='/api/users/me';
  const searchM=p.startsWith('/api/users/search');
  const instructorsM=p==='/api/users/instructors';
  const idM=p.match(/^\/api\/users\/(\d+)$/);

  if(method==='GET'&&meM){const u=requireAuth(req,res);if(!u)return true;return ok(res,safeUser(db.findById('users',u.id)));}
  if((method==='PUT'||method==='PATCH')&&meM){
    const u=requireAuth(req,res);if(!u)return true;
    const b=await body(req);
    const allowed=['name','department','year','about','skills','interests','expertise','researchInterests','supervisedTypes','availableForAdvising','githubLink','linkedinLink','academicTitle'];
    const upd={};allowed.forEach(k=>{if(b[k]!==undefined)upd[k]=b[k];});
    return ok(res,safeUser(db.update('users',u.id,upd)));
  }
  if(method==='GET'&&instructorsM){
    const {query}=url.parse(req.url,true);
    let instructors=db.findAll('users',{role:'instructor'}).filter(u=>u.status!=='inactive');
    if(query.q){const q=query.q.toLowerCase();instructors=instructors.filter(u=>u.name.toLowerCase().includes(q)||(u.department||'').toLowerCase().includes(q)||(u.expertise||'').toLowerCase().includes(q)||(u.researchInterests||'').toLowerCase().includes(q));}
    if(query.available==='true')instructors=instructors.filter(u=>u.availableForAdvising===true||u.availableForAdvising==='true');
    return ok(res,instructors.map(safeUser));
  }
  if(method==='GET'&&searchM){
    const {query}=url.parse(req.url,true);
    const q=(query.q||'').toLowerCase();
    let users=db.findAll('users').filter(u=>u.role!=='admin'&&u.status!=='inactive');
    if(q)users=users.filter(u=>u.name.toLowerCase().includes(q)||(u.department||'').toLowerCase().includes(q)||(u.skills||'').toLowerCase().includes(q)||(u.expertise||'').toLowerCase().includes(q));
    return ok(res,users.map(safeUser).slice(0,20));
  }
  if(method==='GET'&&idM){const found=db.findById('users',idM[1]);if(!found)return notFound(res);return ok(res,safeUser(found));}
  return null;
}

// CATEGORIES
async function handleCategories(method,p,req,res){
  const listM=p==='/api/categories';
  const oneM=p.match(/^\/api\/categories\/(\d+)$/);
  if(method==='GET'&&listM)return ok(res,db.findAll('categories'));
  if(method==='POST'&&listM){const u=requireAuth(req,res);if(!u)return true;if(u.role!=='admin')return forbidden(res);const b=await body(req);if(!b.name)return badReq(res,'Name required');return created(res,db.insert('categories',{name:b.name,description:b.description||''}));}
  if(method==='PUT'&&oneM){const u=requireAuth(req,res);if(!u)return true;if(u.role!=='admin')return forbidden(res);const b=await body(req);const up=db.update('categories',oneM[1],{name:b.name,description:b.description});if(!up)return notFound(res);return ok(res,up);}
  if(method==='DELETE'&&oneM){const u=requireAuth(req,res);if(!u)return true;if(u.role!=='admin')return forbidden(res);db.delete('categories',oneM[1]);return ok(res,{success:true});}
  return null;
}

// ANNOUNCEMENTS
async function handleAnnouncements(method,p,req,res){
  const listM=p==='/api/announcements';
  const oneM=p.match(/^\/api\/announcements\/(\d+)$/);
  if(method==='GET'&&listM){requireAuth(req,res);return ok(res,db.findAll('announcements').reverse());}
  if(method==='POST'&&listM){const u=requireAuth(req,res);if(!u)return true;if(u.role!=='admin')return forbidden(res);const b=await body(req);if(!b.title||!b.content)return badReq(res,'Title and content required');return created(res,db.insert('announcements',{title:b.title,content:b.content,relatedCategory:b.relatedCategory||'',deadline:b.deadline||'',authorId:u.id,authorName:u.name}));}
  if(method==='PUT'&&oneM){const u=requireAuth(req,res);if(!u)return true;if(u.role!=='admin')return forbidden(res);const b=await body(req);const up=db.update('announcements',oneM[1],{title:b.title,content:b.content,relatedCategory:b.relatedCategory,deadline:b.deadline});if(!up)return notFound(res);return ok(res,up);}
  if(method==='DELETE'&&oneM){const u=requireAuth(req,res);if(!u)return true;if(u.role!=='admin')return forbidden(res);db.delete('announcements',oneM[1]);return ok(res,{success:true});}
  return null;
}

// PROJECTS
async function handleProjects(method,p,req,res){
  const listM=p==='/api/projects';
  const myM=p==='/api/projects/my';
  const oneM=p.match(/^\/api\/projects\/(\d+)$/);
  const membersM=p.match(/^\/api\/projects\/(\d+)\/members$/);

  if(method==='GET'&&membersM){
    const u=requireAuth(req,res);if(!u)return true;
    const proj=db.findById('projects',membersM[1]);if(!proj)return notFound(res);
    const approved=db.findAll('applications',{projectId:Number(membersM[1]),status:'approved'});
    const members=approved.map(a=>{const user=db.findById('users',a.applicantId);return{...safeUser(user),roleApplied:a.roleApplied};});
    const owner=safeUser(db.findById('users',proj.ownerId));
    if(owner) members.unshift({...owner,roleApplied:'Project Owner'});
    return ok(res,members);
  }
  if(method==='GET'&&myM){const u=requireAuth(req,res);if(!u)return true;return ok(res,db.findAll('projects',{ownerId:u.id}));}
  if(method==='GET'&&listM){
    const {query}=url.parse(req.url,true);
    let projects=db.findAll('projects');
    if(query.type)projects=projects.filter(p=>p.projectType===query.type);
    if(query.status)projects=projects.filter(p=>p.status===query.status);
    if(query.q){const q=query.q.toLowerCase();projects=projects.filter(p=>p.title.toLowerCase().includes(q)||(p.description||'').toLowerCase().includes(q)||(p.requiredSkills||'').toLowerCase().includes(q)||(p.ownerName||'').toLowerCase().includes(q));}
    return ok(res,projects.reverse());
  }
  if(method==='POST'&&listM){
    const u=requireAuth(req,res);if(!u)return true;
    if(u.role!=='student')return forbidden(res,'Only students can create projects');
    const b=await body(req);
    if(!b.title||!b.description||!b.projectType)return badReq(res,'Title, description and project type required');
    const ts=parseInt(b.teamSize)||4;
    return created(res,db.insert('projects',{title:b.title,projectType:b.projectType,description:b.description,requiredSkills:b.requiredSkills||'',rolesNeeded:b.rolesNeeded||'',teamSize:ts,currentMembers:1,budget:b.budget||'',ownerId:u.id,ownerName:u.name,advisorId:null,advisorName:null,advisorAssigned:false,status:'open'}));
  }
  if(method==='GET'&&oneM){
    const proj=db.findById('projects',oneM[1]);if(!proj)return notFound(res);
    const owner=safeUser(db.findById('users',proj.ownerId));
    const advisor=proj.advisorId?safeUser(db.findById('users',proj.advisorId)):null;
    return ok(res,{...proj,ownerProfile:owner,advisorProfile:advisor});
  }
  if((method==='PUT'||method==='PATCH')&&oneM){
    const u=requireAuth(req,res);if(!u)return true;
    const proj=db.findById('projects',oneM[1]);if(!proj)return notFound(res);
    if(proj.ownerId!==u.id&&u.role!=='admin')return forbidden(res);
    const b=await body(req);
    const ts=b.teamSize||proj.teamSize;
    const cm=proj.currentMembers||1;
    let status=proj.status;
    if(b.status)status=b.status;
    else if(cm>=ts)status='full';
    else if(status==='full'&&cm<ts)status='open';
    return ok(res,db.update('projects',oneM[1],{title:b.title||proj.title,description:b.description||proj.description,projectType:b.projectType||proj.projectType,requiredSkills:b.requiredSkills!==undefined?b.requiredSkills:proj.requiredSkills,rolesNeeded:b.rolesNeeded!==undefined?b.rolesNeeded:proj.rolesNeeded,teamSize:ts,budget:b.budget!==undefined?b.budget:proj.budget,status}));
  }
  if(method==='DELETE'&&oneM){
    const u=requireAuth(req,res);if(!u)return true;
    const proj=db.findById('projects',oneM[1]);if(!proj)return notFound(res);
    if(proj.ownerId!==u.id&&u.role!=='admin')return forbidden(res);
    db.delete('projects',oneM[1]);return ok(res,{success:true});
  }
  return null;
}

// APPLICATIONS
async function handleApplications(method,p,req,res){
  const listM=p==='/api/applications';
  const projAppsM=p.match(/^\/api\/projects\/(\d+)\/applications$/);
  const approveM=p.match(/^\/api\/applications\/(\d+)\/(approve|reject)$/);
  const myM=p==='/api/applications/my';

  if(method==='GET'&&myM){const u=requireAuth(req,res);if(!u)return true;return ok(res,db.findAll('applications',{applicantId:u.id}));}
  if(method==='GET'&&projAppsM){
    const u=requireAuth(req,res);if(!u)return true;
    const proj=db.findById('projects',projAppsM[1]);if(!proj)return notFound(res);
    if(proj.ownerId!==u.id&&u.role!=='admin')return forbidden(res);
    const apps=db.findAll('applications',{projectId:Number(projAppsM[1])});
    return ok(res,apps.map(a=>({...a,applicant:safeUser(db.findById('users',a.applicantId))})));
  }
  if(method==='POST'&&listM){
    const u=requireAuth(req,res);if(!u)return true;
    if(u.role!=='student')return forbidden(res);
    const b=await body(req);if(!b.projectId)return badReq(res,'projectId required');
    const proj=db.findById('projects',b.projectId);if(!proj)return notFound(res,'Project not found');
    if(proj.ownerId===u.id)return badReq(res,'Cannot apply to your own project');
    if(proj.status==='full')return badReq(res,'Project team is full');
    if(db.findOne('applications',{projectId:Number(b.projectId),applicantId:u.id}))return badReq(res,'Already applied');
    const app=db.insert('applications',{projectId:Number(b.projectId),projectTitle:proj.title,projectType:proj.projectType,applicantId:u.id,applicantName:u.name,ownerId:proj.ownerId,status:'pending',roleApplied:b.roleApplied||'',message:b.message||''});
    notify(proj.ownerId,'application',`${u.name} applied to your project "${proj.title}"`,u.id,u.name,'/projects-mine');
    return created(res,app);
  }
  if(method==='PATCH'&&approveM){
    const u=requireAuth(req,res);if(!u)return true;
    const app=db.findById('applications',approveM[1]);if(!app)return notFound(res);
    const proj=db.findById('projects',app.projectId);
    if(!proj||proj.ownerId!==u.id)return forbidden(res);
    const newStatus=approveM[2]==='approve'?'approved':'rejected';
    const updated=db.update('applications',approveM[1],{status:newStatus});
    if(newStatus==='approved'){
      const newCount=(proj.currentMembers||1)+1;
      const newProjStatus=newCount>=(proj.teamSize||4)?'full':'open';
      db.update('projects',proj.id,{currentMembers:newCount,status:newProjStatus});
      notify(app.applicantId,'approved',`Your application to "${proj.title}" was approved! 🎉`,u.id,u.name,'/my-applications');
    } else {
      notify(app.applicantId,'rejected',`Your application to "${proj.title}" was not accepted`,u.id,u.name,'/my-applications');
    }
    return ok(res,updated);
  }
  return null;
}

// ADVISOR REQUESTS
async function handleAdvisorRequests(method,p,req,res){
  const listM=p==='/api/advisor-requests';
  const myM=p==='/api/advisor-requests/my';
  const inboxM=p==='/api/advisor-requests/inbox';
  const statusM=p.match(/^\/api\/advisor-requests\/(\d+)\/(accept|reject)$/);

  if(method==='GET'&&myM){const u=requireAuth(req,res);if(!u)return true;return ok(res,db.findAll('advisor_requests',{studentId:u.id}));}
  if(method==='GET'&&inboxM){const u=requireAuth(req,res);if(!u)return true;if(u.role!=='instructor')return forbidden(res);return ok(res,db.findAll('advisor_requests',{instructorId:u.id}));}
  if(method==='POST'&&listM){
    const u=requireAuth(req,res);if(!u)return true;
    if(u.role!=='student')return forbidden(res);
    const b=await body(req);if(!b.instructorId||!b.projectId)return badReq(res,'instructorId and projectId required');
    const instructor=db.findById('users',b.instructorId);
    if(!instructor||instructor.role!=='instructor')return notFound(res,'Instructor not found');
    if(instructor.availableForAdvising===false||instructor.availableForAdvising==='false')return badReq(res,'Instructor is not available for advising');
    const proj=db.findById('projects',b.projectId);if(!proj)return notFound(res,'Project not found');
    if(proj.ownerId!==u.id)return forbidden(res,'Not your project');
    if(db.findOne('advisor_requests',{studentId:u.id,instructorId:Number(b.instructorId),projectId:Number(b.projectId)}))return badReq(res,'Request already sent');
    const req2=db.insert('advisor_requests',{studentId:u.id,studentName:u.name,instructorId:Number(b.instructorId),instructorName:instructor.name,projectId:Number(b.projectId),projectTitle:proj.title,projectType:proj.projectType,status:'pending',message:b.message||''});
    notify(instructor.id,'advisor_request',`${u.name} wants you to advise their project "${proj.title}"`,u.id,u.name,'/advisor-inbox');
    return created(res,req2);
  }
  if(method==='PATCH'&&statusM){
    const u=requireAuth(req,res);if(!u)return true;
    if(u.role!=='instructor')return forbidden(res);
    const req2=db.findById('advisor_requests',statusM[1]);
    if(!req2||req2.instructorId!==u.id)return forbidden(res);
    const newStatus=statusM[2]==='accept'?'accepted':'rejected';
    const updated=db.update('advisor_requests',statusM[1],{status:newStatus});
    if(newStatus==='accepted'){
      db.update('projects',req2.projectId,{advisorId:u.id,advisorName:u.name,advisorAssigned:true});
      notify(req2.studentId,'advisor_accepted',`${u.name} accepted your advisor request for "${req2.projectTitle}" 🎉`,u.id,u.name,'/my-advisor-requests');
    } else {
      notify(req2.studentId,'advisor_rejected',`${u.name} declined your advisor request for "${req2.projectTitle}"`,u.id,u.name,'/my-advisor-requests');
    }
    return ok(res,updated);
  }
  return null;
}

// NOTIFICATIONS
async function handleNotifications(method,p,req,res){
  const listM=p==='/api/notifications';
  const countM=p==='/api/notifications/count';
  const readAllM=p==='/api/notifications/read-all';
  const readOneM=p.match(/^\/api\/notifications\/(\d+)\/read$/);

  if(method==='GET'&&countM){
    const u=requireAuth(req,res);if(!u)return true;
    return ok(res,{count:db.findAll('notifications',{userId:u.id,read:false}).length});
  }
  if(method==='GET'&&listM){
    const u=requireAuth(req,res);if(!u)return true;
    return ok(res,db.findAll('notifications',{userId:u.id}).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,30));
  }
  if(method==='POST'&&readAllM){
    const u=requireAuth(req,res);if(!u)return true;
    db.findAll('notifications',{userId:u.id,read:false}).forEach(n=>db.update('notifications',n.id,{read:true}));
    return ok(res,{success:true});
  }
  if(method==='PATCH'&&readOneM){
    const u=requireAuth(req,res);if(!u)return true;
    db.update('notifications',readOneM[1],{read:true});
    return ok(res,{success:true});
  }
  return null;
}

// ADMIN
async function handleAdmin(method,p,req,res){
  const usersM=p==='/api/admin/users';
  const statsM=p==='/api/admin/stats';
  const exportM=p==='/api/admin/export';
  const roleM=p.match(/^\/api\/admin\/users\/(\d+)\/role$/);
  const statusM=p.match(/^\/api\/admin\/users\/(\d+)\/status$/);
  const deleteUserM=p.match(/^\/api\/admin\/users\/(\d+)$/);

  if(method==='GET'&&exportM){
    const u=requireAuth(req,res);if(!u)return true;if(u.role!=='admin')return forbidden(res);
    const projects=db.findAll('projects');
    const users=db.findAll('users').map(safeUser);
    const applications=db.findAll('applications');
    const advisorReqs=db.findAll('advisor_requests');
    return ok(res,{projects,users,applications,advisorRequests:advisorReqs,exportedAt:new Date().toISOString()});
  }
  if(method==='GET'&&usersM){const u=requireAuth(req,res);if(!u)return true;if(u.role!=='admin')return forbidden(res);return ok(res,db.findAll('users').map(safeUser));}
  if(method==='GET'&&statsM){
    const u=requireAuth(req,res);if(!u)return true;if(u.role!=='admin')return forbidden(res);
    return ok(res,{users:db.findAll('users').length,students:db.findAll('users',{role:'student'}).length,instructors:db.findAll('users',{role:'instructor'}).length,projects:db.findAll('projects').length,openProjects:db.findAll('projects',{status:'open'}).length,fullProjects:db.findAll('projects',{status:'full'}).length,applications:db.findAll('applications').length,advisorRequests:db.findAll('advisor_requests').length,categories:db.findAll('categories').length,announcements:db.findAll('announcements').length});
  }
  if(method==='PATCH'&&roleM){const u=requireAuth(req,res);if(!u)return true;if(u.role!=='admin')return forbidden(res);const b=await body(req);if(!b.role)return badReq(res,'Role required');const updated=db.update('users',roleM[1],{role:b.role});if(!updated)return notFound(res);return ok(res,safeUser(updated));}
  if(method==='PATCH'&&statusM){const u=requireAuth(req,res);if(!u)return true;if(u.role!=='admin')return forbidden(res);const b=await body(req);const updated=db.update('users',statusM[1],{status:b.status});if(!updated)return notFound(res);return ok(res,safeUser(updated));}
  if(method==='DELETE'&&deleteUserM){const u=requireAuth(req,res);if(!u)return true;if(u.role!=='admin')return forbidden(res);const uid=Number(deleteUserM[1]);if(uid===u.id)return badReq(res,'Cannot delete yourself');const target=db.findById('users',uid);if(!target)return notFound(res);db.delete('users',uid);db.findAll('projects',{ownerId:uid}).forEach(p=>db.delete('projects',p.id));db.findAll('applications',{applicantId:uid}).forEach(a=>db.delete('applications',a.id));db.findAll('advisor_requests',{studentId:uid}).forEach(r=>db.delete('advisor_requests',r.id));db.findAll('advisor_requests',{instructorId:uid}).forEach(r=>db.delete('advisor_requests',r.id));return ok(res,{success:true});}
  return null;
}

// ROUTER
async function router(req,res){
  const {pathname}=url.parse(req.url);
  const method=req.method;
  if(method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'});return res.end();}
  if(pathname.startsWith('/api/')){
    try{
      for(const handler of [handleAuth,handleNotifications,handleAdmin,handleAdvisorRequests,handleApplications,handleProjects,handleAnnouncements,handleCategories,handleUsers]){
        const r=await handler(method,pathname,req,res);if(r)return;
      }
      return notFound(res,'API endpoint not found');
    }catch(e){console.error(e);return serverErr(res,e);}
  }
  let filePath=pathname==='/'?'/index.html':pathname;
  filePath=path.join(PUBLIC_DIR,filePath);
  fs.readFile(filePath,(err,data)=>{
    if(err){fs.readFile(path.join(PUBLIC_DIR,'index.html'),(e,html)=>{if(e){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':'text/html'});res.end(html);});return;}
    res.writeHead(200,{'Content-Type':MIME[path.extname(filePath)]||'application/octet-stream'});res.end(data);
  });
}

require('./seed');
const server=http.createServer(router);
server.listen(PORT,()=>{console.log(`\n🎓 Saving Private Öğrenci → http://localhost:${PORT}\n`);});
