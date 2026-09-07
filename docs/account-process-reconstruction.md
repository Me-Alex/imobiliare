# Parcursul vizionare → tranzacție

Scop: fiecare dosar răspunde la trei întrebări: unde suntem, cine acționează, ce se întâmplă după.

1. **Programarea**: clientul solicită; agentul confirmă; la întâlnire agentul înregistrează prezența și finalizarea.
2. **Decizia după vizită**: vizionarea finalizată rămâne vizibilă în „După vizită”. Clientul exprimă interesul; lipsa unei decizii nu devine automat negociere.
3. **Negocierea**: interesul exprimat sau o ofertă existentă deschide această etapă. Oferta și contraoferta arată cine trebuie să răspundă. Un document încă necerut în această etapă nu înlocuiește arbitrar negocierea.
4. **Contractul**: după oferta acceptată, documentele și semnăturile au prioritate. Un document primit este o verificare pentru agent, nu o nouă încărcare pentru client. Se păstrează condițiile serverului pentru încheiere.
5. **Închiderea**: dosarul închis este consultabil; nu mai prezintă acțiuni curente de negociere sau încărcare.

Tranzacții pornește din lista de dosare. Alegerea unui dosar și legătura dintr-o vizionare păstrează identificatorii în URL. Un identificator invalid nu deschide alt dosar.

Un singur model derivă etapa și acțiunea principală din programări, decizie, oferte și documente. Interfața pornește în secțiunea relevantă. Participanții și jurnalul sunt informații de context, nu etape obligatorii separate. Stadiul administrativ nu presupune că toate etapele precedente au fost efectuate.

Verificare înainte de commit: scenarii de proces (inclusiv reprogramare anulată urmată de vizită finalizată, document primit, lipsă decizie, ofertă acceptată și dosar închis), selecție explicită a dosarului, navigare din vizionare și desktop/mobil. Commit direct în main; fără verificări după commit.
