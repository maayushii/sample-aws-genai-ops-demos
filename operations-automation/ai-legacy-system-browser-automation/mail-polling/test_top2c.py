#!/usr/bin/env python3
import sys
sys.path.insert(0, 'src')
from appscript import app, k

outlook = app('Microsoft Outlook')

for folder in outlook.mail_folders():
    try:
        name = folder.name()
        count = folder.count(each=k.message)
        if name.lower() == "inbox" and count > 100:
            print(f"Inbox: {count} messages. Top 3 (newest):")
            for i in range(count, count - 3, -1):
                msg = folder.messages[i]
                subj = msg.subject()
                match = " <<< MATCH" if "NEW EMPLOYEE ORDER" in (subj or "").upper() else ""
                print(f"  {subj}{match}")
            break
    except:
        continue
