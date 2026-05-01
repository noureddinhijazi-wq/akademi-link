const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const db = require('./db');
const { hashPassword, verifyPassword, createToken, verifyToken } = require('./auth');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = { '.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.ico':'image/x-icon','.svg':'image/svg+xml' };

// ── Helpers ──────────────────────────────────────────────────
function send(res, status, data) {
  res.writeHead(status, { 'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization' });
  res.end(JSON.stringify(data));
}
const ok = (r,d) => { send(r,200,d); return true; };
const created = (r,d) => { send(r,201,d); return true; };
const notFound = (r,m='Not found') => { send(r,404,{error:m}); return true; };
const badReq = (r,m) => { send(r,400,{error:m}); return true; };
const unauth = (r,m='Unauthorized') => { send(r,401,{error:m}); return true; };
const forbidden = (r,m='Forbidden') => { send(r,403,{error:m}); return true; };
const serverErr = (r,e) => { send(r,500,{error:e.message||'Error'}); return true; };

function body(req) {
  return new Promise((res,rej) => {
    let b=''; req.on('data',c=>b+=c); req.on('end',()=>{ try{res(b?JSON.parse(b):{});}catch(e){rej(new Error('Invalid JSON'));} }); req.on('error',rej);
  });
}
function getUser(req) { return verifyToken(req.headers['authorization']||''); }
function requireAuth(req,res) { const u=getUser(req); if(!u){unauth(res); return null;} return u; }
function safeUser(u) { if(!u) return null; const {password:_,...s}=u; return s; }

// ── AUTH ─────────────────────────────────────────────────────
async function handleAuth(method, p, req, res) {
  if(method==='POST' && p==='/api/auth/register') {
    const b=await body(req);
    if(!b.name||!b.email||!b.password) return badReq(res,'Name, email and password required');
    if(db.findOne('users',{email:b.email})) return badReq(res,'Email already registered');
    const user=db.insert('users',{name:b.name,email:b.email,password:hashPassword(b.password),headline:b.headline||'',location:b.location||'',about:'',skills:'',experience:'[]',education:'[]',connections:0,avatar:''});
    return created(res,{token:createToken(user),user:safeUser(user)});
  }
  if(method==='POST' && p==='/api/auth/login') {
    const b=await body(req);
    const user=db.findOne('users',{email:b.email});
    if(!user||!verifyPassword(b.password,user.password)) return unauth(res,'Invalid credentials');
    return ok(res,{token:createToken(user),user:safeUser(user)});
  }
  return null;
}

// ── USERS ─────────────────────────────────────────────────────
async function handleUsers(method, p, req, res) {
  const meM=p==='/api/users/me';
  const searchM=p.startsWith('/api/users/search');
  const idM=p.match(/^\/api\/users\/(\d+)$/);

  if(method==='GET' && meM) {
    const u=requireAuth(req,res); if(!u) return true;
    const found=db.findById('users',u.id); if(!found) return notFound(res);
    return ok(res,safeUser(found));
  }
  if((method==='PUT'||method==='PATCH') && meM) {
    const u=requireAuth(req,res); if(!u) return true;
    const b=await body(req);
    const allowed=['name','headline','location','about','skills','experience','education'];
    const upd={}; allowed.forEach(k=>{if(b[k]!==undefined)upd[k]=b[k];});
    return ok(res,safeUser(db.update('users',u.id,upd)));
  }
  if(method==='GET' && searchM) {
    const {query}=url.parse(req.url,true);
    const q=(query.q||'').toLowerCase();
    let users=db.findAll('users');
    if(q) users=users.filter(u=>u.name.toLowerCase().includes(q)||(u.headline||'').toLowerCase().includes(q)||(u.location||'').toLowerCase().includes(q));
    return ok(res,users.map(safeUser).slice(0,20));
  }
  if(method==='GET' && idM) {
    const found=db.findById('users',idM[1]); if(!found) return notFound(res);
    return ok(res,safeUser(found));
  }
  return null;
}

// ── FEED & POSTS ──────────────────────────────────────────────
async function handlePosts(method, p, req, res) {
  const feedM=p==='/api/feed';
  const postsM=p==='/api/posts';
  const likeM=p.match(/^\/api\/posts\/(\d+)\/like$/);
  const commentsM=p.match(/^\/api\/posts\/(\d+)\/comments$/);
  const deleteM=p.match(/^\/api\/posts\/(\d+)$/);
  const userPostsM=p.match(/^\/api\/users\/(\d+)\/posts$/);

  if(method==='GET' && feedM) {
    const u=requireAuth(req,res); if(!u) return true;
    const myConns=db.findAll('connections',{status:'connected'}).filter(c=>c.requesterId===u.id||c.receiverId===u.id);
    const connIds=new Set(myConns.map(c=>c.requesterId===u.id?c.receiverId:c.requesterId));
    connIds.add(u.id);
    let posts=db.findAll('posts').filter(p=>connIds.has(p.authorId));
    posts=posts.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    posts=posts.map(p=>({...p,liked:!!db.findOne('likes',{postId:p.id,userId:u.id})}));
    return ok(res,posts);
  }
  if(method==='GET' && userPostsM) {
    const u=requireAuth(req,res); if(!u) return true;
    const posts=db.findAll('posts',{authorId:Number(userPostsM[1])})
      .sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))
      .map(p=>({...p,liked:!!db.findOne('likes',{postId:p.id,userId:u.id})}));
    return ok(res,posts);
  }
  if(method==='POST' && postsM) {
    const u=requireAuth(req,res); if(!u) return true;
    const b=await body(req); if(!b.content||!b.content.trim()) return badReq(res,'Content required');
    const author=db.findById('users',u.id);
    const post=db.insert('posts',{authorId:u.id,authorName:u.name,authorHeadline:author?.headline||'',content:b.content.trim(),likes:0,commentsCount:0});
    return created(res,{...post,liked:false});
  }
  if(method==='DELETE' && deleteM) {
    const u=requireAuth(req,res); if(!u) return true;
    const post=db.findById('posts',deleteM[1]); if(!post) return notFound(res);
    if(post.authorId!==u.id) return forbidden(res);
    db.delete('posts',deleteM[1]);
    return ok(res,{success:true});
  }
  if(method==='POST' && likeM) {
    const u=requireAuth(req,res); if(!u) return true;
    const postId=Number(likeM[1]);
    const post=db.findById('posts',postId); if(!post) return notFound(res);
    const existing=db.findOne('likes',{postId,userId:u.id});
    if(existing) { db.delete('likes',existing.id); db.update('posts',postId,{likes:Math.max(0,post.likes-1)}); return ok(res,{liked:false,likes:Math.max(0,post.likes-1)}); }
    db.insert('likes',{postId,userId:u.id});
    db.update('posts',postId,{likes:post.likes+1});
    db.insert('notifications',{userId:post.authorId,type:'like',message:`${u.name} liked your post`,fromId:u.id,fromName:u.name,read:false,link:`/posts/${postId}`});
    return ok(res,{liked:true,likes:post.likes+1});
  }
  if(method==='GET' && commentsM) {
    const u=requireAuth(req,res); if(!u) return true;
    return ok(res,db.findAll('comments',{postId:Number(commentsM[1])}).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)));
  }
  if(method==='POST' && commentsM) {
    const u=requireAuth(req,res); if(!u) return true;
    const b=await body(req); if(!b.content||!b.content.trim()) return badReq(res,'Content required');
    const postId=Number(commentsM[1]);
    const post=db.findById('posts',postId); if(!post) return notFound(res);
    const author=db.findById('users',u.id);
    const comment=db.insert('comments',{postId,authorId:u.id,authorName:u.name,authorHeadline:author?.headline||'',content:b.content.trim()});
    db.update('posts',postId,{commentsCount:(post.commentsCount||0)+1});
    db.insert('notifications',{userId:post.authorId,type:'comment',message:`${u.name} commented on your post`,fromId:u.id,fromName:u.name,read:false,link:`/posts/${postId}`});
    return created(res,comment);
  }
  return null;
}

// ── CONNECTIONS ───────────────────────────────────────────────
async function handleConnections(method, p, req, res) {
  const listM=p==='/api/connections';
  const pendingM=p==='/api/connections/pending';
  const suggestM=p==='/api/connections/suggestions';
  const requestM=p.match(/^\/api\/connections\/request\/(\d+)$/);
  const acceptM=p.match(/^\/api\/connections\/(\d+)\/accept$/);
  const declineM=p.match(/^\/api\/connections\/(\d+)\/decline$/);
  const removeM=p.match(/^\/api\/connections\/(\d+)\/remove$/);
  const statusM=p.match(/^\/api\/connections\/status\/(\d+)$/);

  if(method==='GET' && statusM) {
    const u=requireAuth(req,res); if(!u) return true;
    const otherId=Number(statusM[1]);
    const conn=db.findAll('connections').find(c=>(c.requesterId===u.id&&c.receiverId===otherId)||(c.requesterId===otherId&&c.receiverId===u.id));
    return ok(res,{status:conn?conn.status:'none',connId:conn?conn.id:null,isSender:conn?conn.requesterId===u.id:false});
  }
  if(method==='GET' && pendingM) {
    const u=requireAuth(req,res); if(!u) return true;
    const pending=db.findAll('connections',{status:'pending',receiverId:u.id});
    const enriched=pending.map(c=>{const sender=db.findById('users',c.requesterId);return{...c,sender:safeUser(sender)};});
    return ok(res,enriched);
  }
  if(method==='GET' && suggestM) {
    const u=requireAuth(req,res); if(!u) return true;
    const myConns=db.findAll('connections').filter(c=>(c.requesterId===u.id||c.receiverId===u.id));
    const connectedIds=new Set(myConns.map(c=>c.requesterId===u.id?c.receiverId:c.requesterId));
    connectedIds.add(u.id);
    const suggestions=db.findAll('users').filter(x=>!connectedIds.has(x.id)).slice(0,8).map(safeUser);
    return ok(res,suggestions);
  }
  if(method==='GET' && listM) {
    const u=requireAuth(req,res); if(!u) return true;
    const conns=db.findAll('connections',{status:'connected'}).filter(c=>c.requesterId===u.id||c.receiverId===u.id);
    const enriched=conns.map(c=>{const otherId=c.requesterId===u.id?c.receiverId:c.requesterId;return{...c,user:safeUser(db.findById('users',otherId))};});
    return ok(res,enriched);
  }
  if(method==='POST' && requestM) {
    const u=requireAuth(req,res); if(!u) return true;
    const targetId=Number(requestM[1]);
    if(targetId===u.id) return badReq(res,'Cannot connect with yourself');
    const exists=db.findAll('connections').find(c=>(c.requesterId===u.id&&c.receiverId===targetId)||(c.requesterId===targetId&&c.receiverId===u.id));
    if(exists) return badReq(res,'Connection already exists');
    const conn=db.insert('connections',{requesterId:u.id,receiverId:targetId,status:'pending'});
    db.insert('notifications',{userId:targetId,type:'connection',message:`${u.name} sent you a connection request`,fromId:u.id,fromName:u.name,read:false,link:`/network`});
    return created(res,conn);
  }
  if(method==='PATCH' && acceptM) {
    const u=requireAuth(req,res); if(!u) return true;
    const conn=db.findById('connections',acceptM[1]);
    if(!conn||conn.receiverId!==u.id) return forbidden(res);
    const updated=db.update('connections',acceptM[1],{status:'connected'});
    db.insert('notifications',{userId:conn.requesterId,type:'connection',message:`${u.name} accepted your connection request`,fromId:u.id,fromName:u.name,read:false,link:`/profile/${u.id}`});
    return ok(res,updated);
  }
  if(method==='PATCH' && declineM) {
    const u=requireAuth(req,res); if(!u) return true;
    const conn=db.findById('connections',declineM[1]);
    if(!conn||conn.receiverId!==u.id) return forbidden(res);
    db.delete('connections',declineM[1]);
    return ok(res,{success:true});
  }
  if(method==='DELETE' && removeM) {
    const u=requireAuth(req,res); if(!u) return true;
    const conn=db.findById('connections',removeM[1]);
    if(!conn||(conn.requesterId!==u.id&&conn.receiverId!==u.id)) return forbidden(res);
    db.delete('connections',removeM[1]);
    return ok(res,{success:true});
  }
  return null;
}

// ── JOBS ──────────────────────────────────────────────────────
async function handleJobs(method, p, req, res) {
  const listM=p==='/api/jobs';
  const applyM=p.match(/^\/api\/jobs\/(\d+)\/apply$/);
  const deleteM=p.match(/^\/api\/jobs\/(\d+)$/);
  const myAppsM=p==='/api/jobs/applications';

  if(method==='GET' && myAppsM) {
    const u=requireAuth(req,res); if(!u) return true;
    const apps=db.findAll('job_applications',{userId:u.id});
    return ok(res,apps);
  }
  if(method==='GET' && listM) {
    const {query}=url.parse(req.url,true);
    let jobs=db.findAll('jobs').reverse();
    if(query.q){const q=query.q.toLowerCase();jobs=jobs.filter(j=>j.title.toLowerCase().includes(q)||j.company.toLowerCase().includes(q)||(j.location||'').toLowerCase().includes(q));}
    return ok(res,jobs);
  }
  if(method==='POST' && listM) {
    const u=requireAuth(req,res); if(!u) return true;
    const b=await body(req);
    if(!b.title||!b.company) return badReq(res,'Title and company required');
    return created(res,db.insert('jobs',{...b,postedBy:u.id,postedByName:u.name,applicants:0}));
  }
  if(method==='POST' && applyM) {
    const u=requireAuth(req,res); if(!u) return true;
    const job=db.findById('jobs',applyM[1]); if(!job) return notFound(res);
    const existing=db.findOne('job_applications',{jobId:Number(applyM[1]),userId:u.id});
    if(existing) return badReq(res,'Already applied');
    const app=db.insert('job_applications',{jobId:Number(applyM[1]),jobTitle:job.title,company:job.company,userId:u.id,userName:u.name,status:'applied'});
    db.update('jobs',applyM[1],{applicants:(job.applicants||0)+1});
    return created(res,app);
  }
  if(method==='DELETE' && deleteM) {
    const u=requireAuth(req,res); if(!u) return true;
    const job=db.findById('jobs',deleteM[1]); if(!job) return notFound(res);
    if(job.postedBy!==u.id) return forbidden(res);
    db.delete('jobs',deleteM[1]);
    return ok(res,{success:true});
  }
  return null;
}

// ── MESSAGES ──────────────────────────────────────────────────
async function handleMessages(method, p, req, res) {
  const convsM=p==='/api/conversations';
  const convM=p.match(/^\/api\/conversations\/(\d+)$/);

  if(method==='GET' && convsM) {
    const u=requireAuth(req,res); if(!u) return true;
    const msgs=db.findAll('messages').filter(m=>m.senderId===u.id||m.receiverId===u.id);
    const seen=new Set(); const convs=[];
    msgs.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    msgs.forEach(m=>{
      const otherId=m.senderId===u.id?m.receiverId:m.senderId;
      if(seen.has(otherId)) return; seen.add(otherId);
      const other=db.findById('users',otherId);
      const unread=db.findAll('messages').filter(x=>x.senderId===otherId&&x.receiverId===u.id&&!x.read).length;
      convs.push({userId:otherId,name:other?.name||'Unknown',headline:other?.headline||'',lastMessage:m.content,lastTime:m.createdAt,unread});
    });
    return ok(res,convs);
  }
  if(method==='GET' && convM) {
    const u=requireAuth(req,res); if(!u) return true;
    const otherId=Number(convM[1]);
    const msgs=db.findAll('messages').filter(m=>(m.senderId===u.id&&m.receiverId===otherId)||(m.senderId===otherId&&m.receiverId===u.id)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
    // Mark as read
    msgs.filter(m=>m.senderId===otherId&&!m.read).forEach(m=>db.update('messages',m.id,{read:true}));
    const other=safeUser(db.findById('users',otherId));
    return ok(res,{messages:msgs,other});
  }
  if(method==='POST' && convM) {
    const u=requireAuth(req,res); if(!u) return true;
    const otherId=Number(convM[1]);
    const b=await body(req); if(!b.content||!b.content.trim()) return badReq(res,'Content required');
    const msg=db.insert('messages',{senderId:u.id,senderName:u.name,receiverId:otherId,content:b.content.trim(),read:false});
    db.insert('notifications',{userId:otherId,type:'message',message:`${u.name} sent you a message`,fromId:u.id,fromName:u.name,read:false,link:`/messages`});
    return created(res,msg);
  }
  return null;
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
async function handleNotifications(method, p, req, res) {
  const listM=p==='/api/notifications';
  const readAllM=p==='/api/notifications/read-all';

  if(method==='GET' && listM) {
    const u=requireAuth(req,res); if(!u) return true;
    const notifs=db.findAll('notifications',{userId:u.id}).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,30);
    return ok(res,notifs);
  }
  if(method==='POST' && readAllM) {
    const u=requireAuth(req,res); if(!u) return true;
    db.findAll('notifications',{userId:u.id,read:false}).forEach(n=>db.update('notifications',n.id,{read:true}));
    return ok(res,{success:true});
  }
  return null;
}

// ── MAIN ROUTER ────────────────────────────────────────────────
async function router(req, res) {
  const { pathname } = url.parse(req.url);
  const method = req.method;

  if(method==='OPTIONS') {
    res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,Authorization'});
    return res.end();
  }

  if(pathname.startsWith('/api/')) {
    try {
      for(const handler of [handleAuth,handleNotifications,handleMessages,handleConnections,handleJobs,handlePosts,handleUsers]) {
        const r=await handler(method,pathname,req,res);
        if(r) return;
      }
      return notFound(res,'API endpoint not found');
    } catch(e) { console.error(e); return serverErr(res,e); }
  }

  // Static files
  let filePath=pathname==='/'?'/index.html':pathname;
  filePath=path.join(PUBLIC_DIR,filePath);
  fs.readFile(filePath,(err,data)=>{
    if(err) {
      fs.readFile(path.join(PUBLIC_DIR,'index.html'),(e,html)=>{
        if(e){res.writeHead(404);return res.end('Not found');}
        res.writeHead(200,{'Content-Type':'text/html'}); res.end(html);
      }); return;
    }
    res.writeHead(200,{'Content-Type':MIME[path.extname(filePath)]||'application/octet-stream'});
    res.end(data);
  });
}

// Auto-seed on first run
require('./seed');

const server = http.createServer(router);
server.listen(PORT,()=>{
  console.log(`\n🔗 AkademiLink running → http://localhost:${PORT}`);
  console.log('\n📋 Accounts (all passwords: pass123)');
  console.log('   mehmet@email.com  – Software Engineer');
  console.log('   ali@email.com     – Student Developer');
  console.log('   zeynep@email.com  – HR Manager\n');
});
