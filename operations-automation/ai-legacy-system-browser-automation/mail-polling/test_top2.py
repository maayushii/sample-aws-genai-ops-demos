#!/usr/bin/env python3
import sys
sys.path.insert(0, 'src')
from appscript import app, k

outlook = app('Microsoft Outlook')

# Go into maayushi@amazon.com account, then Inbox
for folder in outlook.mail_folders():
    try:
        name = folder.name()
        if name == "maayushi@amazon.com":
            # Found the account folder, now find Inbox inside it
            for subfolder in folder.mail_folders():
                try:
                    subname = subfolder.name()
                    if subname.lower() == "inbox":
                        total = subfolder.count(each=k.message)
                        print(f"maayushi@amazon.com > Inbox: {total} messages")
                        # Read top 2 (most recent = highest index)
                        for i in range(total, max(total-2, 0), -1):
                            msg = subfolder.messages[i]
                            print(f"  {msg.subject()}")
                        break
                except:
                    continue
            break
    except:
        continue
