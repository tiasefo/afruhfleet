// Provision controlled external mailboxes (mail.tm) for UAT personas.
const { createMailbox } = require('./mailbox');
const { saveState, loadState } = require('./harness');

(async () => {
  const st = loadState();
  if (!st.mailboxes) st.mailboxes = {};
  const wanted = { tenantA: 'uata', tenantB: 'uatb', invitee: 'uati', vendor: 'uatv', support: 'uats' };
  for (const [w, prefix] of Object.entries(wanted)) {
    if (st.mailboxes[w]) { console.log(`${w}: ${st.mailboxes[w].address} (exists)`); continue; }
    const box = await createMailbox(prefix);
    st.mailboxes[w] = box;
    saveState({ mailboxes: st.mailboxes });
    console.log(`${w}: ${box.address}`);
  }
  saveState({ mailboxes: st.mailboxes });
})().catch(e => { console.error(e); process.exit(1); });
