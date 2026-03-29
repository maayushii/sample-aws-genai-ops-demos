#!/usr/bin/env python3
import sys
sys.path.insert(0, 'src')
from appscript import app, k

outlook = app('Microsoft Outlook')

# Find real inbox
for folder in outlook.mail_folders():
    try:
        if folder.name().lower() == "inbox" and folder.count(each=k.message) > 0:
            total = folder.count(each=k.message)
            print(f"Inbox has {total} messages")
            
            # Test: message[1] = first or last?
            msg1 = folder.messages[1]
            print(f"  messages[1] subject: {msg1.subject()}")
            
            msg_last = folder.messages[total]
            print(f"  messages[{total}] subject: {msg_last.subject()}")
            break
    except Exception as e:
        print(f"Error: {e}")
        continue
