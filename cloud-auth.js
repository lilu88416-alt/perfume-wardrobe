/* Personal cloud sync. Original localStorage remains an offline backup. */
(()=>{
const URL='https://hmaasdltxjtfvwerdxfj.supabase.co';
const KEY='sb_publishable_F2d-pxCZalVomeMldAVENg_BSUGqm_9';
const status=document.getElementById('accountStatus');
const email=document.getElementById('accountEmail');
const otp=document.getElementById('accountOtp');
const send=document.getElementById('sendCode');
const verify=document.getElementById('verifyCode');
const logout=document.getElementById('logout');
const google=document.getElementById('googleSignIn');
if(!window.supabase?.createClient){status.textContent='登录组件未加载，当前仍可离线使用';return;}
const db=window.supabase.createClient(URL,KEY);
let user=null,ready=false,loading=false,timer=null;
const setStatus=t=>status.textContent=t;
const write=async()=>{
 if(!user||!ready||loading)return;
 const {error}=await db.from('perfume_wardrobes').upsert({user_id:user.id,items:items,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 if(error)setStatus('云端同步失败：'+error.message+'（本地记录已保留）');
 else setStatus('已登录：'+user.email+' · 已同步');
};
window.cloudSync=()=>{if(!user||!ready)return;clearTimeout(timer);timer=setTimeout(write,800)};
const login=async(u)=>{
 user=u;ready=false;loading=true;
 email.style.display='none';otp.style.display='none';send.style.display='none';verify.style.display='none';google.style.display='none';logout.style.display='';
 setStatus('正在读取你的私人衣橱…');
 const {data,error}=await db.from('perfume_wardrobes').select('items').eq('user_id',u.id).maybeSingle();
 if(error){loading=false;setStatus('云端数据库尚未配置：'+error.message+'；本地记录未改变');return;}
 const remote=Array.isArray(data?.items)?data.items:null;
 if(remote&&remote.length){
   const localOnly=items.filter(x=>!remote.some(y=>y.id===x.id||y.brand===x.brand&&y.name===x.name));
   if(localOnly.length&&confirm('云端已有衣橱，当前设备另有 '+localOnly.length+' 瓶。要把这些本地香水合并到云端吗？'))items=[...remote,...localOnly];
   else items=remote;
 }else if(remote){ // Empty cloud collection: ask before uploading device data.
   if(items.length&&!confirm('云端衣橱为空。要把这台设备的 '+items.length+' 瓶香水上传到你的账号吗？')){loading=false;ready=true;setStatus('已登录，暂未上传本地记录');return;}
 }else if(items.length){
   if(!confirm('第一次登录：要把这台设备的 '+items.length+' 瓶香水及试香记录安全保存到云端吗？')){loading=false;ready=true;setStatus('已登录，暂未上传本地记录');return;}
 }
 localStorage.setItem('perfume-wardrobe-v1',JSON.stringify(items));render();
 loading=false;ready=true;await write();
};
google.onclick=async()=>{
 google.disabled=true;setStatus('正在跳转 Google 登录…');
 const {error}=await db.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});
 if(error){setStatus('Google 登录失败：'+error.message);google.disabled=false;}
};
send.onclick=async()=>{
 const e=email.value.trim();if(!e){setStatus('请输入邮箱');return;}
 send.disabled=true;setStatus('正在发送登录邮件…');
 const {error}=await db.auth.signInWithOtp({email:e,options:{shouldCreateUser:true,emailRedirectTo:location.origin+location.pathname}});
 send.disabled=false;
 if(error)setStatus('发送失败：'+error.message);
 else {otp.style.display='';verify.style.display='';setStatus('邮件已发送。可输入邮件中的验证码；如收到登录链接，也可以直接点击。');}
};
verify.onclick=async()=>{
 const token=otp.value.trim();if(!token){setStatus('请输入邮件中的验证码');return;}
 verify.disabled=true;
 const {data,error}=await db.auth.verifyOtp({email:email.value.trim(),token,type:'email'});
 verify.disabled=false;
 if(error)setStatus('验证码无效：'+error.message);
 else if(data.user)await login(data.user);
};
logout.onclick=async()=>{
 clearTimeout(timer);await db.auth.signOut();user=null;ready=false;
 email.style.display='';otp.style.display='none';send.style.display='';verify.style.display='none';google.style.display='';google.disabled=false;logout.style.display='none';
 setStatus('已退出云端账号。本机保留当前衣橱，请勿在共用设备上留下私人记录。');
};
db.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')return;if(session?.user&&session.user.id!==user?.id)setTimeout(()=>login(session.user),0)});
db.auth.getSession().then(({data})=>{if(data.session?.user)login(data.session.user);else setStatus('未登录 · 数据暂存在此设备')});
})();
