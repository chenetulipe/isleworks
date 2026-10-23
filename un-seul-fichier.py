#!/usr/bin/env python3
"""Assemble tout le jeu en UN seul fichier HTML (pratique pour l'envoyer à un testeur
ou pour l'appli Android). Résultat : isleworks-un-fichier.html à la racine.
Utilisation :  python3 un-seul-fichier.py"""
import re,os
root=os.path.dirname(os.path.abspath(__file__))
s=open(os.path.join(root,'index.html'),encoding='utf-8').read()
s=re.sub(r'<link rel="stylesheet" href="style\.css[^"]*">',lambda m:'<style>'+open(os.path.join(root,'style.css'),encoding='utf-8').read()+'</style>',s)
s=re.sub(r'<script src="([0-9][^"?]+\.js)[^"]*"></script>',lambda m:'<script>'+open(os.path.join(root,m.group(1)),encoding='utf-8').read()+'</script>',s)
s=re.sub(r'<link rel="manifest"[^>]*>|<link rel="(icon|apple-touch-icon)"[^>]*>','',s)
open(os.path.join(root,'isleworks-un-fichier.html'),'w',encoding='utf-8').write(s)
print('isleworks-un-fichier.html créé')
