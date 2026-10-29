export const contactRecipient = 'y.faraj@esisa.ac.ma';
export const contactEndpoint = '/api/contact';

export type ContactInput = { name: string; email: string; message: string; website: string };
export type ContactResult = { kind: 'sent' };

let pending: {fingerprint:string;id:string}|undefined;

export async function submitContact(input: ContactInput): Promise<ContactResult> {
 const name=input.name.trim(),email=input.email.trim(),message=input.message.trim();
 if(input.website.trim())throw new Error('L’envoi a été bloqué. Réessaie sans remplir le champ automatique.');
 if(name.length<2||name.length>100)throw new Error('Indique un nom de 2 à 100 caractères.');
 if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Indique une adresse e-mail valide.');
 if(message.length<10||message.length>5000)throw new Error('Ton message doit contenir entre 10 et 5 000 caractères.');
 const fingerprint=JSON.stringify({name,email,message});
 if(!pending||pending.fingerprint!==fingerprint)pending={fingerprint,id:crypto.randomUUID()};
 const controller=new AbortController();
 const timeout=window.setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(contactEndpoint,{
   method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},signal:controller.signal,
   body:JSON.stringify({name,email,message,website:input.website,submissionId:pending.id}),
  });
  if(!response.ok)throw new Error(response.status===429?'Trop de tentatives. Patiente une minute avant de réessayer.':response.status===503?'Le formulaire est temporairement indisponible. Ton message est conservé ; réessaie plus tard.':'Le service d’envoi est momentanément indisponible. Ton message est conservé ; réessaie dans quelques instants.');
  const data:unknown=await response.json();
  if(!data||typeof data!=='object')throw new Error('Le service n’a pas confirmé l’envoi. Réessaie dans quelques instants.');
  const result=data as {ok?:unknown};
  if(result.ok!==true)throw new Error('Le service n’a pas accepté le message. Tes informations sont conservées ; réessaie plus tard.');
  pending=undefined;
  return {kind:'sent'};
 }catch(error){
  if(error instanceof DOMException&&error.name==='AbortError')throw new Error('Le service met trop de temps à répondre. Ton message est conservé ; réessaie.');
  if(error instanceof TypeError)throw new Error('Connexion au service d’envoi impossible. Vérifie ta connexion ou réessaie plus tard.');
  throw error;
 }finally{window.clearTimeout(timeout)}
}
