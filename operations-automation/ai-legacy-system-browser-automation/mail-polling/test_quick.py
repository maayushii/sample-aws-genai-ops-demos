#!/usr/bin/env python3
import sys
sys.path.insert(0, 'src')
from appscript import app, k

outlook = app('Microsoft Outlook')
for folder in outlook.mail_folders():
    try:
        if folder.name().lower() == "inbox" and folder.count(each=k.message) > 0:
            msgs = folder.messages()
            # Last 2 (most recent)
            total = len(msgs)
            for msg in msgs[total-1:total+1]:
                print(f"Subject: {msg.subject()}")
            break
    except:
        continue
