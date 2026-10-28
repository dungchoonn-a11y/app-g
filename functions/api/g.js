export async function onRequestPost({request,env}){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
 const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
 const endpoint=env.APP_G_API_URL||'https://script.google.com/macros/s/AKfycbxOnwpcEzEp6NS2TP872g6xvtsaRhpwIOH6XHvAJWX-6QKwlWX_g0ionepiNa9w1hRvjw/exec';
 try{
  if(request.headers.get('Origin')!==new URL(request.url).origin)return reply({ok:false,error:{message:'Nguồn yêu cầu không hợp lệ.'}},403);
  if(!env.APP_G_PROXY_SECRET)return reply({ok:false,error:{message:'Chưa cấu hình kết nối App G trong Cloudflare.'}},503);
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint))throw Error('config');
  if(Number(request.headers.get('Content-Length')||0)>3000000)return reply({ok:false,error:{message:'Dữ liệu quá lớn.'}},413);
  const reader=request.body.getReader();let size=0;const chunks=[];
  for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>3000000){await reader.cancel();return reply({ok:false,error:{message:'Dữ liệu quá lớn.'}},413)}chunks.push(value)}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}
  const body=JSON.parse(new TextDecoder().decode(bytes));
  if(!['login','logout','session','list','save','review','upload','image','schedules','schedule'].includes(body.action))return reply({ok:false,error:{message:'Thao tác không hợp lệ.'}},400);
  const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.APP_G_PROXY_SECRET,request:body}),redirect:'follow',signal:AbortSignal.timeout(45000)});
  if(!res.ok)throw Error('upstream');const data=await res.json();return reply(data);
 }catch(_){return reply({ok:false,error:{message:'Không kết nối được Apps Script. Kiểm tra URL triển khai, quyền truy cập và khóa kết nối.'}},502)}
}
