# Comment mettre ton site en ligne (Sur le Web) 🌍

Pour que les étudiants puissent accéder au site depuis leur téléphone, tu dois l'héberger. Voici les deux méthodes les plus simples et gratuites.

## Méthode 1 : Netlify Drop (Le plus simple et rapide) ⚡
Idéal pour un test immédiat.

1.  Ouvre ce lien : [https://app.netlify.com/drop](https://app.netlify.com/drop) ou ta page d'accueil Netlify.
2.  **Scrolle tout en bas de la page**.
3.  Cherche la zone en pointillés avec écrit : **"Want to deploy a new project without connecting to Git? Drag and drop your project folder here."**
4.  Prends ton dossier **`cap-icam-rallye`** depuis ton ordi et **glisse-le** dans cette zone.
5.  BOUM ! Le site est en ligne.

## Méthode 2 : GitHub Pages (Plus "Pro") 🛠️
Si tu as un compte GitHub, c'est mieux pour gérer les mises à jour.

1.  Crée un nouveau "Repository" sur GitHub (ex: `cap-icam-site`).
2.  Ouvre un terminal sur ton ordinateur (dans VS Code, fais `Ctrl + J` ou va dans le menu **Terminal** -> **New Terminal**). C'est l'endroit où tu vas taper les commandes pour envoyer ton code sur GitHub.
3.  Lance ces commandes (remplace l'URL par la tienne) :
    ```bash
    git init
git add .
git commit -m "Premier envoi"
git branch -M master
git remote add origin https://github.com/TON_USER/cap-icam-site.git
git push -u origin master
# Si tu as une erreur "remote origin already exists", tape :
# git remote set-url origin https://github.com/TON_USER/cap-icam-site.git
    ```
4.  Dans les paramètres du repo GitHub -> rubrique "Pages" -> Choisis la branche "master".
5.  Ton site sera en ligne sur `https://TON_USER.github.io/cap-icam-site`.

---
> [!TIP]
> **Pour les Rallyes** : Une fois le site en ligne, on pourra connecter un vrai système de commande (Google Sheets ou Twitter/Telegram) pour que tu reçoives les notifs sur ton tel ! Dis-moi quand le site est en ligne.
