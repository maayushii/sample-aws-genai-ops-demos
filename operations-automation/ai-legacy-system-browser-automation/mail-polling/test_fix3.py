#!/usr/bin/env python3
import sys
sys.path.insert(0, 'src')
from mail_monkey.mailclient import get_mailclient

print("Connecting...")
client = get_mailclient()
inbox = client.get_folder("inbox")
print(f"Inbox: {inbox.get_name()}")

count = 0
for msg in inbox.get_messages():
    count += 1
    if count > 5:
        break
    subj = msg.get_subject()
    match = " <<< MATCH" if "NEW EMPLOYEE ORDER" in (subj or "").upper() else ""
    print(f"  {count}. {subj}{match}")

print(f"\nDone - showed {min(count,5)} most recent emails")
