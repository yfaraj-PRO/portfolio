export const contactRecipient = 'y.faraj@esisa.ac.ma';
export const contactEndpoint = import.meta.env.VITE_CONTACT_ENDPOINT?.trim()
 || `https://formsubmit.co/ajax/${contactRecipient}`;

export type ContactInput = { name: string; email: string; message: string; website: string };
export type ContactResult = { kind: 'sent' | 'activation' };

export async function submitContact(input: ContactInput): Promise<ContactResult> {
 const name=input.name.trim(),email=input.email.trim(),message=input.message.trim();
 if(input.website.trim())throw new Error('L’envoi a été bloqué. Réessaie sans remplir le champ automatique.');
 if(name.length<2||name.length>100)throw new Error('Indique un nom de 2 à 100 caractères.');
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Indique une adresse e-mail valide.');
 if(message.length<10||message.length>5000)throw new Error('Ton message doit contenir entre 10 et 5 000 caractères.');
 const controller=new AbortController();
 const timeout=window.setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(contactEndpoint,{
   method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},signal:controller.signal,
   body:JSON.stringify({name,email,message,_replyto:email,_subject:'Nouveau message — Portfolio de Yassine Faraj',_template:'table',_captcha:'false',_honey:input.website,_url:window.location.href.split('#')[0]}),
  });
  if(!response.ok)throw new Error(response.status===429?'Trop de tentatives. Patiente quelques minutes avant de réessayer.':'Le service d’envoi est momentanément indisponible. Ton message est conservé ; réessaie dans quelques instants.');
  const data:unknown=await response.json();
  if(!data||typeof data!=='object')throw new Error('Le service n’a pas confirmé l’envoi. Réessaie dans quelques instants.');
  const result=data as {success?:unknown;message?:unknown};
  const explanation=typeof result.message==='string'?result.message:'';
  if(/activat|actived|confirm.{0,40}email|verify.{0,40}email/i.test(explanation))return {kind:'activation'};
  // FormSubmit may return string booleans. "false" must never be treated as success.
  if(result.success!==true&&result.success!=='true')throw new Error('Le service n’a pas accepté le message. Tes informations sont conservées ; réessaie plus tard.');
  return {kind:'sent'};
 }catch(error){
  if(error instanceof DOMException&&error.name==='AbortError')throw new Error('Le service met trop de temps à répondre. Ton message est conservé ; réessaie.');
  if(error instanceof TypeError)throw new Error('Connexion au service d’envoi impossible. Vérifie ta connexion ou réessaie plus tard.');
  throw error;
 }finally{window.clearTimeout(timeout)}
}
