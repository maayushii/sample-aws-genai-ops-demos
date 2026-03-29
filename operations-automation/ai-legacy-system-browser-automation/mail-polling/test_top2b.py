#!/usr/bin/env python3
import sys
sys.path.insert(0, 'src')
from appscript import app, k

outlook = app('Microsoft Outlook')

# Find the inbox with 27k messages and read from index 1 (newest)
for folder in outlook.mail_folders():
    try:
        name = folder.name()
        count = folder.count(each=k.message)
        if name.lower() == "inbox" and count > 100:
            print(f"Inbox with {count} messages")
            for i in range(1, 4):
                msg = folder.messages[i]
                print(f"  {i}. {msg.subject()}")
            break
    except:
        continue
