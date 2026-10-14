// Supabase opcional: la clave publishable es pública por diseño; NUNCA service_role ni secretos.
let client=null, modulePromise=null;
const CONFIG='kona2030_cloud_config';
export function config(){try{return JSON.parse(localStorage.getItem(CONFIG)||'null')}catch{return null}}
export function setConfig(url,key){if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url))throw Error('URL Supabase no válida.');if(!/^(sb_publishable_|eyJ)/.test(key))throw Error('Utiliza una clave publishable/anon, nunca service_role.');localStorage.setItem(CONFIG,JSON.stringify({url:url.replace(/\/$/,''),key}));client=null;}
export async function getClient(){let c=config();if(!c)return null;if(client)return client;if(!modulePromise)modulePromise=import('https://esm.sh/@supabase/supabase-js@2.47.0');let m=await modulePromise;client=m.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});return client;}
export async function user(){let sb=await getClient();if(!sb)return null;const {data,error}=await sb.auth.getUser();return error?null:data.user;}
export async function login(email,password){const sb=await getClient();if(!sb)throw Error('Configura Supabase primero.');const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;return data.user;}
export async function signup(email,password){const sb=await getClient();if(!sb)throw Error('Configura Supabase primero.');const {data,error}=await sb.auth.signUp({email,password});if(error)throw error;return data.user;}
export async function logout(){const sb=await getClient();if(sb)await sb.auth.signOut();}
export async function remoteRead(){const sb=await getClient(),u=await user();if(!u)throw Error('Necesitas iniciar sesión.');const {data,error}=await sb.from('athlete_state').select('payload,updated_at').eq('user_id',u.id).maybeSingle();if(error)throw error;return data;}
export async function remoteWrite(state){const sb=await getClient(),u=await user();if(!u)throw Error('Necesitas iniciar sesión.');const {error}=await sb.from('athlete_state').upsert({user_id:u.id,payload:state,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error;return true;}
