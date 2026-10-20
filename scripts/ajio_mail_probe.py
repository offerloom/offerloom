"""Read-only probe: describe the structure of recent AJIO affiliate emails (no content stored)."""
import email, imaplib, os, re
from email.header import decode_header, make_header

user = os.environ.get("GMAIL_USER", "contact.offerloom@gmail.com")
password = (os.environ.get("AJIO_MAIL_FETCH") or os.environ.get("GMAIL_APP_PASSWORD") or "").replace(" ", "")
if not password:
    print("::error::No Gmail app password secret available"); raise SystemExit(1)
def note(msg): print("::notice title=AJIO probe::" + re.sub(r"[\r\n%]", " ", msg)[:900])
imap = imaplib.IMAP4_SSL("imap.gmail.com")
imap.login(user, password)
imap.select('"[Gmail]/All Mail"', readonly=True)
_, data = imap.search(None, '(FROM "mailer.ajio.in" SINCE 01-Oct-2026)')
ids = data[0].split()
note(f"{len(ids)} AJIO emails since 1 Oct")
for mid in ids[-4:]:
    _, raw = imap.fetch(mid, "(BODY.PEEK[])")
    msg = email.message_from_bytes(raw[0][1])
    subject = str(make_header(decode_header(msg.get("Subject", ""))))
    auth = " ".join(msg.get_all("Authentication-Results", []))
    dkim = re.findall(r"dkim=(\w+) header\.(?:i|d)=@?([\w.-]+)", auth)
    parts, links = [], []
    for part in msg.walk():
        ctype = part.get_content_type(); fname = part.get_filename()
        parts.append(f"{ctype}{':' + fname if fname else ''}")
        if ctype == "text/html":
            html = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", "replace")
            for href, text in re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', html, re.S | re.I):
                text = re.sub(r"<[^>]+>|\s+", " ", text).strip()
                host = re.sub(r"^https?://([^/]+).*", r"\1", href)
                links.append(f"{host}{re.sub(r'^https?://[^/]+', '', href)[:60]} [{text[:40]}]")
    note(f"SUBJECT {subject} | DATE {msg.get('Date')} | DKIM {dkim} | PARTS {parts}")
    for part in msg.walk():
        if part.get_content_type() != "text/html": continue
        html = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", "replace")
        rows = re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.S | re.I)
        shown = 0
        for row in rows:
            if "ajio.com/s/" in row and row.count("<tr") == 0:
                note("ROW " + re.sub(r"<[^>]+>|&nbsp;|\s+", " ", row).strip()[:300]); shown += 1
                if shown >= 4: break
        if not shown:
            i = html.find("ajio.com/s/")
            if i > 0: note("CTX " + re.sub(r"<[^>]+>|&nbsp;|\s+", " ", html[i-600:i+80])[-400:])
imap.logout()
