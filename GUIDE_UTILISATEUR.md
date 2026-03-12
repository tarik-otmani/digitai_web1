# DigitAI — Guide d'utilisation complet

> **Pour qui est ce guide ?**
> Ce document est destiné à toute personne utilisant DigitAI sans connaissance technique particulière. Aucun terme informatique complexe n'est nécessaire pour suivre ce guide.

---

## Table des matières

1. [Qu'est-ce que DigitAI ?](#1-quest-ce-que-digitai)
2. [Créer un compte](#2-créer-un-compte)
3. [Le tableau de bord](#3-le-tableau-de-bord)
4. [Créer un cours avec l'IA](#4-créer-un-cours-avec-lia)
5. [Importer un document existant](#5-importer-un-document-existant)
6. [Créer un examen](#6-créer-un-examen)
7. [Modifier et améliorer un cours](#7-modifier-et-améliorer-un-cours)
8. [Modifier et améliorer un examen](#8-modifier-et-améliorer-un-examen)
9. [Exporter en PDF](#9-exporter-en-pdf)
10. [Consulter sa consommation IA](#10-consulter-sa-consommation-ia)
11. [Espace Administrateur](#11-espace-administrateur)
12. [Questions fréquentes](#12-questions-fréquentes)

---

## 1. Qu'est-ce que DigitAI ?

DigitAI est une plateforme en ligne qui permet à des enseignants, formateurs et créateurs de contenu de **générer des cours complets et des examens automatiquement grâce à l'intelligence artificielle**.

### Ce que vous pouvez faire avec DigitAI

| Fonctionnalité | Description |
|---|---|
| 🎓 **Générer un cours** | Entrez un sujet, l'IA crée un plan puis rédige tout le contenu section par section |
| 📤 **Importer un document** | Envoyez un PDF, Word ou texte existant — l'IA le structure en cours |
| 📝 **Créer un examen** | Générez automatiquement des questions à partir d'un cours |
| ✏️ **Modifier le contenu** | Retouchez chaque section à la main ou demandez à l'IA de la réécrire |
| 📄 **Exporter en PDF** | Téléchargez votre cours ou votre examen en fichier PDF prêt à imprimer |
| 💰 **Suivre les coûts IA** | Consultez combien de tokens et d'argent vous avez consommés |

---

## 2. Créer un compte

### Inscription

1. Rendez-vous sur la page d'accueil de DigitAI
2. Cliquez sur **"Get Started"** ou **"Sign Up"**
3. Remplissez le formulaire :
   - **Nom** (optionnel)
   - **Adresse e-mail** (sera votre identifiant)
   - **Mot de passe** (minimum 6 caractères)
   - **Confirmer le mot de passe**
4. Cliquez sur **"Create Account"**
5. Vous êtes connecté automatiquement et redirigé vers votre tableau de bord

### Connexion

1. Cliquez sur **"Sign In"**
2. Entrez votre e-mail et votre mot de passe
3. Cliquez sur **"Login"**

> ⚠️ **Compte désactivé ?** Si vous ne pouvez pas vous connecter et voyez un message indiquant que votre compte est désactivé, contactez votre administrateur.

---

## 3. Le tableau de bord

Le tableau de bord est votre page principale après la connexion. Il vous donne une vue d'ensemble rapide.

### Ce que vous y trouvez

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard                               💰 $0.0024  + New Course │
├──────────┬──────────┬──────────┬────────────────────────┤
│ Générer  │ Importer │ Générer  │       Exporter         │
│  cours   │ document │  examen  │         PDF            │
├──────────┴──────────┴──────────┴────────────────────────┤
│ Cours récents              │ Examens récents            │
│ • Introduction au Python   │ • Examen Python — 20 Qs   │
│ • Marketing Digital        │ • Quiz Marketing — 10 Qs  │
│ • ...                      │ • ...                     │
└────────────────────────────┴───────────────────────────┘
```

### La pastille de coût IA

En haut à droite, à côté du bouton **"New Course"**, une petite pastille verte affiche votre **coût total estimé en dollars** depuis la création de votre compte (ex : `$0.0024`). Cliquez dessus pour voir le détail complet de votre consommation.

### Navigation dans la barre latérale

| Icône | Menu | Rôle |
|---|---|---|
| 🏠 | Dashboard | Retour à l'accueil |
| 📚 | Courses | Liste de tous vos cours |
| 📋 | Exams | Liste de tous vos examens |
| ⚡ | My Usage | Votre consommation de tokens IA |
| 🛡️ | Admin | Panneau d'administration (admins uniquement) |

---

## 4. Créer un cours avec l'IA

La création d'un cours se fait en **3 étapes** guidées.

### Étape 1 — Configurer le cours

Allez dans **"Generate Course"** depuis le tableau de bord.

Remplissez le formulaire :

| Champ | Obligatoire | Description |
|---|---|---|
| **Sujet du cours** | ✅ Oui | Ex : « Introduction au Machine Learning », « Histoire de la Rome Antique » |
| **Mots-clés** | Non | Mots séparés par des virgules pour guider l'IA. Ex : « deep learning, réseaux de neurones » |
| **Niveau** | Non | Débutant / Intermédiaire / Avancé (défaut : Intermédiaire) |
| **Ton** | Non | Académique / Décontracté / Professionnel (défaut : Professionnel) |
| **Instructions supplémentaires** | Non | Ex : « Inclure des exemples pratiques » ou « Eviter les formules mathématiques » |

Cliquez sur **"Generate Outline"**. L'IA va créer le plan du cours en quelques secondes.

---

### Étape 2 — Réviser et modifier le plan

Vous arrivez sur la page **"Review & Edit Outline"**.

L'IA vous propose :
- Un **titre de cours**
- Une liste de **sections** avec leur description

**Ce que vous pouvez faire ici :**
- ✏️ **Modifier** le titre du cours
- ✏️ **Modifier** le titre et la description de chaque section
- ➕ **Ajouter** une section (bouton "+ Add Section" en bas)
- 🗑️ **Supprimer** une section (icône poubelle qui apparaît au survol)
- 💾 **Sauvegarder** le plan sans lancer la génération (bouton "Save outline")

Quand le plan vous convient, cliquez sur **"Continue to Content"**.

> ⏱️ **Durée estimée :** La durée est affichée sous le bouton. Comptez environ 1 à 2 minutes par section.

---

### Étape 3 — Génération en direct

Vous êtes redirigé vers la page de **génération en direct**. C'est là que la magie opère !

**Ce que vous voyez :**
- Une **barre de progression** avec le pourcentage d'avancement
- La liste de toutes les sections avec leur statut :
  - ⭕ **En attente** — pas encore commencé (cercle vide grisé)
  - 🔄 **En cours** — l'IA rédige cette section en ce moment (icône tournante + animation)
  - ✅ **Terminée** — section prête (cercle vert)
- **Cliquez sur une section terminée** pour voir un aperçu du contenu et des points clés

Quand toutes les sections sont générées, une bannière verte apparaît :
> **"Your course is ready!"**

Cliquez sur **"Open Course"** pour accéder à votre cours.

> ⚠️ **Important :** Restez sur cette page pendant la génération. Si vous la quittez, la génération continue en arrière-plan mais vous ne verrez plus la progression en direct.

---

## 5. Importer un document existant

Vous avez déjà un cours, un polycopié ou un support sous forme de fichier ? DigitAI peut le transformer en cours structuré.

### Formats acceptés

| Format | Extension |
|---|---|
| PDF | `.pdf` |
| Word | `.docx`, `.doc` |
| Texte brut | `.txt` |
| Markdown | `.md` |

**Taille maximale : 25 Mo**

### Procédure

1. Cliquez sur **"Upload Material"** depuis le tableau de bord
2. **Déposez votre fichier** dans la zone prévue (glisser-déposer) ou cliquez pour parcourir vos dossiers
3. Vous pouvez modifier le **titre du cours** (par défaut, le nom du fichier est utilisé)
4. Cliquez sur **"Upload & Structure"**
5. L'IA analyse le document et crée automatiquement les sections
6. Vous êtes redirigé vers l'aperçu du cours une fois terminé

> 💡 **Conseil :** Si votre document est très long, l'IA peut le tronquer à environ 120 000 caractères pour l'analyse. Privilégiez des documents bien structurés avec des titres clairs pour un meilleur résultat.

---

## 6. Créer un examen

Les examens sont générés **à partir d'un cours existant**. Assurez-vous d'avoir au moins un cours dans votre espace avant de commencer.

### Procédure

1. Cliquez sur **"Generate Exam"** depuis le tableau de bord
2. Remplissez le formulaire :

| Champ | Description |
|---|---|
| **Cours source** | Sélectionnez un de vos cours dans la liste déroulante |
| **Nombre de questions** | Entre 5 et 50 (défaut : 20) |
| **Difficulté** | Facile / Moyen / Difficile / Mixte |
| **Répartition des types** | Pourcentage de chaque type (voir tableau ci-dessous) |
| **Questions exemples** | Collez des exemples pour que l'IA imite votre style |

### Types de questions disponibles

| Type | Description | % par défaut |
|---|---|---|
| **QCM** (Choix multiple) | 4 options, une seule bonne réponse | 50% |
| **Vrai/Faux** | Affirmation à valider | 20% |
| **Réponse courte** | Réponse en quelques mots | 20% |
| **Dissertation** | Développement argumenté | 10% |

> 💡 Les pourcentages doivent totaliser 100%. Si vous changez une valeur, les autres s'ajustent automatiquement.

3. Cliquez sur **"Generate Exam"**
4. L'IA génère toutes les questions et vous redirige vers l'aperçu de l'examen

---

## 7. Modifier et améliorer un cours

Après la génération, vous pouvez retoucher chaque section de votre cours à tout moment.

### Accéder à l'éditeur

Depuis la liste de vos cours, cliquez sur **"Edit"** à côté du cours voulu. Ou depuis l'aperçu, cliquez sur **"Full Editor"**.

### Ce que vous pouvez faire

#### Modifier le contenu manuellement
- Cliquez sur une section pour la déplier
- Le contenu s'affiche dans une zone de texte modifiable
- Modifiez directement le texte
- Cliquez **"Save"** pour enregistrer toutes les modifications

#### Demander à l'IA de réécrire une section
Chaque section dispose d'un bouton **"Regenerate"** :
1. Cliquez sur **"Regenerate"**
2. Une zone de commentaire apparaît (optionnel) — vous pouvez écrire des instructions comme :
   - *"Ajouter plus d'exemples concrets"*
   - *"Simplifier le langage pour des débutants"*
   - *"Inclure des exercices pratiques"*
3. Cliquez sur **"Regenerate Section"**
4. L'IA réécrit uniquement cette section en tenant compte de vos remarques

#### Basculer entre édition et aperçu
L'icône 👁️ (œil) bascule entre la vue d'édition (texte brut) et l'**aperçu rendu** (mise en forme avec titres, listes, etc.).

---

## 8. Modifier et améliorer un examen

### Accéder à un examen

Depuis le tableau de bord ou la liste des examens, cliquez sur **"View"** à côté d'un examen.

### Ce que vous pouvez faire

#### Modifier une question manuellement
1. Cliquez sur l'icône ✏️ à côté d'une question
2. Modifiez :
   - Le texte de la question
   - Les options de réponse (pour les QCM)
   - La bonne réponse
   - L'explication
3. Cliquez **"Save"** pour enregistrer

#### Régénérer une question avec l'IA
1. Cliquez sur le bouton **"Regenerate"** de la question
2. L'IA génère une nouvelle question du même type à partir du contenu du cours
3. L'ancienne question est remplacée automatiquement

#### Points importants sur l'affichage
- Les **bonnes réponses** sont visibles — c'est la vue **instructeur**
- Les **explications** aident à comprendre pourquoi une réponse est correcte
- Les **badges de type** indiquent clairement QCM, Vrai/Faux, etc.

---

## 9. Exporter en PDF

Tous vos cours et examens peuvent être téléchargés en PDF.

### Depuis un cours

- Dans l'aperçu du cours (`/course/:id`) : bouton **"Export PDF"** en haut à droite
- Dans la liste des cours : icône de téléchargement 📥 sur chaque ligne

### Depuis un examen

- Dans l'aperçu de l'examen : bouton **"Export PDF"**

### Page d'export dédiée

Accessible via **"Export Course"** sur le tableau de bord :
1. Sélectionnez un cours dans la liste déroulante
2. Cliquez sur **"Export PDF"**
3. Le fichier se télécharge avec le nom du cours comme nom de fichier

> ✅ Le PDF généré inclut le titre du cours, toutes les sections et leur contenu, les points clés, ainsi que la numérotation des pages.

---

## 10. Consulter sa consommation IA

Chaque fois que vous demandez à l'IA de générer du contenu, cela consomme des **tokens** (unités de texte traitées). Cette consommation a un coût.

### Accéder à la page de consommation

Cliquez sur **"My Usage"** dans la barre latérale, ou sur la **pastille verte** en haut du tableau de bord.

### Ce que vous y voyez

#### Cartes récapitulatives

| Carte | Description |
|---|---|
| **Total Tokens** | Nombre total de tokens utilisés |
| **Input Tokens** | Tokens envoyés à l'IA (vos prompts et le contenu) |
| **Output Tokens** | Tokens générés par l'IA (le contenu produit) |
| **Est. Cost** | Coût total estimé en dollars américains |

#### Tableau des opérations récentes

Les 50 dernières opérations sont listées avec :
- Le **type d'opération** (voir tableau ci-dessous)
- Les tokens d'entrée, de sortie et le total
- La **date et heure**

| Type d'opération | Ce que c'était |
|---|---|
| Course Outline | Génération du plan de cours |
| Course Section | Génération d'une section de cours |
| Full Course | Génération complète d'un cours |
| Section Regeneration | Réécriture d'une section |
| Upload Analysis | Analyse d'un document importé |
| Exam Generation | Génération d'un examen |
| Question Regeneration | Réécriture d'une question |

> 💡 **Note sur les coûts :** Les tarifs utilisés sont ceux de **Gemini 2.5 Pro** : $1,25 par million de tokens en entrée et $10,00 par million de tokens en sortie. La génération d'un cours complet de 6 sections consomme en moyenne entre 50 000 et 150 000 tokens.

---

## 11. Espace Administrateur

> 🔒 Cette section est **réservée aux comptes administrateurs**. Si vous n'avez pas le rôle Admin, ce menu n'apparaîtra pas dans votre barre latérale.

### Accéder au panneau admin

Cliquez sur **"Admin"** (icône bouclier 🛡️) dans la barre latérale.

---

### Section 1 — Clé API Gemini

C'est ici que se configure la clé d'accès à l'intelligence artificielle. **Sans cette clé, aucune génération de contenu n'est possible pour tous les utilisateurs.**

| Élément | Description |
|---|---|
| **Badge "Configured"** | La clé est bien renseignée et active |
| **Badge "Not set"** | Aucune clé n'est configurée — les générations échoueront |
| **Clé masquée** | La clé existante est affichée partiellement (ex : `AIza••••••••abcd`) |
| **Champ de saisie** | Pour entrer ou remplacer la clé |
| **Bouton œil** | Afficher/masquer la clé en cours de saisie |
| **Bouton "Save Key"** | Enregistre la nouvelle clé immédiatement |

> ⚠️ **La clé API est sensible.** Ne la partagez jamais. Elle est stockée de façon sécurisée côté serveur et n'est jamais transmise aux utilisateurs.

---

### Section 2 — Statistiques globales

Quatre chiffres clés sur l'ensemble de la plateforme :

| Stat | Description |
|---|---|
| **Users** | Nombre total de comptes inscrits |
| **Courses** | Nombre total de cours générés |
| **Exams** | Nombre total d'examens générés |
| **Total Tokens** | Tokens IA consommés par tous les utilisateurs |

---

### Section 3 — Gestion des utilisateurs

Un tableau listant tous les comptes avec :

| Colonne | Description |
|---|---|
| **Email** | Adresse e-mail de l'utilisateur |
| **Name** | Nom (si renseigné) |
| **Role** | `Admin` ou `User` |
| **Courses** | Nombre de cours créés |
| **Exams** | Nombre d'examens créés |
| **Tokens** | Tokens consommés par cet utilisateur |
| **Est. Cost** | Coût estimé pour cet utilisateur |
| **Status** | `Active` (vert) ou `Disabled` (gris) |
| **Toggle** | Bouton pour activer/désactiver le compte |

#### Activer ou désactiver un compte

1. Repérez l'utilisateur dans le tableau
2. Cliquez sur le **bouton toggle** (interrupteur) à droite de sa ligne
3. Le statut change immédiatement

> ℹ️ Un utilisateur **désactivé** ne peut plus se connecter ni utiliser l'application. Ses données sont conservées.

---

### Section 4 — Cours et examens récents

Listes rapides des dernières créations sur la plateforme pour surveiller l'activité globale.

---

## 12. Questions fréquentes

**Q : Combien de temps prend la génération d'un cours ?**
> Environ 1 à 2 minutes par section. Un cours de 6 sections prendra donc entre 6 et 12 minutes. Vous pouvez suivre l'avancement en temps réel sur la page de génération.

**Q : Puis-je modifier un cours après sa génération ?**
> Oui, à tout moment. Chaque section est modifiable manuellement ou régénérable par l'IA avec des instructions personnalisées.

**Q : Mes cours sont-ils sauvegardés automatiquement ?**
> La génération sauvegarde automatiquement. Pour les modifications manuelles dans l'éditeur, pensez à cliquer sur **"Save"** pour ne pas perdre vos changements.

**Q : Puis-je utiliser DigitAI sans connexion internet ?**
> Non. DigitAI est une application en ligne et nécessite une connexion internet, notamment pour communiquer avec l'IA.

**Q : Pourquoi ma génération échoue-t-elle ?**
> Les raisons les plus courantes sont :
> - La clé API Gemini n'est pas configurée (contacter l'administrateur)
> - Votre compte a été désactivé (contacter l'administrateur)
> - Problème réseau temporaire (réessayez dans quelques minutes)

**Q : Quelle est la différence entre "Preview" et "Course Editor" ?**
> - **Preview** (`/course/:id`) : vue de lecture avec options d'édition légère, idéale pour consulter et faire des retouches rapides
> - **Course Editor** (`/course-editor/:id`) : éditeur avancé section par section, idéal pour des modifications profondes

**Q : L'examen montre les bonnes réponses — est-ce normal ?**
> Oui. DigitAI est un outil pour les **créateurs de contenu** (enseignants, formateurs). La vue examen est une vue instructeur. Il n'existe pas de vue "étudiant" qui cacherait les réponses.

**Q : Puis-je exporter un examen avec les réponses masquées ?**
> Pas encore. Cette fonctionnalité pourrait être ajoutée dans une future version.

**Q : Puis-je partager un cours avec quelqu'un d'autre ?**
> Actuellement, chaque cours appartient à votre compte. Pour partager, exportez-le en PDF et envoyez le fichier.

---

*Document rédigé pour la version actuelle de DigitAI — Mars 2026*
