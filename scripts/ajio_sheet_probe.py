"""TEMP read-only: where does AJIO's 'Download Here' offer-sheet link lead, and what does it contain?"""
import email, imaplib, os, re, urllib.request
from email.header import decode_header, make_header
def note(m): print("::notice title=AJIO sheet::" + re.sub(r"[\r\n%]", " ", m)[:900])
pw = (os.environ.get("AJIO_MAIL_FETCH") or os.environ.get("GMAIL_APP_PASSWORD") or "").replace(" ", "")
imap = imaplib.IMAP4_SSL("imap.gmail.com"); imap.login("contact.offerloom@gmail.com", pw)
imap.select('"[Gmail]/All Mail"', readonly=True)
_, data = imap.search(None, '(FROM "mailer.ajio.in" SINCE 01-Oct-2026)')
seen = set()
for mid in data[0].split()[::-1]:
    _, raw = imap.fetch(mid, "(BODY.PEEK[])"); msg = email.message_from_bytes(raw[0][1])
    for part in msg.walk():
        if part.get_content_type() != "text/html": continue
        html = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", "replace")
        for href, text in re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', html, re.S | re.I):
            if "download" not in re.sub(r"<[^>]+>", "", text).lower() or href in seen: continue
            seen.add(href)
            req = urllib.request.Request(href, headers={"User-Agent": "Mozilla/5.0"})
            try:
                with urllib.request.urlopen(req, timeout=30) as r:
                    body = r.read(400000); ctype = r.headers.get("content-type", "")
                    final = r.geturl()
                text = body.decode("utf-8", "replace")
                links = sorted(set(re.findall(r"https?://(?:www\.)?ajio\.com/[^\s\"'<>\\]+", text)))[:8]
                note(f"subject={str(make_header(decode_header(msg.get('Subject',''))))[:60]} final={final[:120]} type={ctype} size={len(body)} ajioLinks={len(set(re.findall(r'ajio\.com/[^\s\"<>]+', text)))} sample={' '.join(links)}")
            except Exception as e:
                note(f"download link error {e}")
    if len(seen) >= 2: break
imap.logout()
