#!/usr/bin/env python3
import sys
sys.path.insert(0, 'src')
from appscript import app, k

outlook = app('Microsoft Outlook')

# List ALL folders named inbox with their parent and message count
print("All inbox folders:")
idx = 0
for folder in outlook.mail_folders():
    try:
        name = folder.name()
        count = folder.count(each=k.message)
        if name.lower() == "inbox":
            idx += 1
            # Try to read the first message if any
            first_subj = ""
            if count > 0:
                try:
                    first_subj = folder.messages[count].subject()
                except:
                    first_subj = "(can't read)"
            print(f"  #{idx} Inbox - {count} msgs - latest: {first_subj}")
            
            # Also check subfolders
            try:
                for sub in folder.mail_folders():
                    sname = sub.name()
                    scount = sub.count(each=k.message)
                    print(f"       └─ {sname}: {scount} msgs")
            except:
                pass
    except:
        continue
