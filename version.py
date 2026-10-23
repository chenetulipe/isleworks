#!/usr/bin/env python3
"""Change le numéro de version partout (index.html et sw.js) pour que les joueurs
reçoivent la mise à jour. Utilisation :  python3 version.py 3.0.1"""
import re,sys,os
v=sys.argv[1] if len(sys.argv)>1 else input('Nouvelle version (ex. 3.0.1) : ')
root=os.path.dirname(os.path.abspath(__file__))
for f in ['index.html','sw.js']:
    p=os.path.join(root,f);s=open(p,encoding='utf-8').read()
    s=re.sub(r'\?v=[0-9.]+','?v='+v,s);s=re.sub(r"isleworks-[0-9.]+","isleworks-"+v,s)
    open(p,'w',encoding='utf-8').write(s)
print('Version',v,'appliquée à index.html et sw.js')
