#!/usr/bin/env python3
import sys
sys.path.insert(0, 'src')
from mail_monkey.mailclient import get_mailclient

print("Connecting to Outlook...")
client = get_mailclient()
print("Getting inbox...")
inbox = client.get_folder("inbox")
print(f"Inbox folder: {inbox.get_name()}")

count = 0
for msg in inbox.get_messages():
    count += 1
    if count > 5:
        break
    subj = msg.get_subject()
    match = " *** MATCH ***" if "NEW EMPLOYEE ORDER" in (subj or "").upper() else ""
    print(f"  {count}. {subj}{match}")

if count == 0:
    print("  (still empty - fix didn't work)")
else:
    print(f"\nShowing {min(count,5)} of many. Fix is working!")
