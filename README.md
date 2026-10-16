# ExporterCalques.jsx — Export par lot des calques (Illustrator)

**v1.0.0** · Adobe Illustrator **CC 2018 – 2026** · ExtendScript (ES3) · Licence MIT · FR / EN

> **Statut de test : non testé dans Illustrator.** La syntaxe a été vérifiée avec
> [acorn](https://github.com/acornjs/acorn) (ECMAScript 5). Merci de signaler tout
> problème via les *Issues*.
>
> **Test status: not tested in Illustrator.** Syntax checked with acorn (ES5).

---

## 🇫🇷 Français

Exporte chaque calque (et optionnellement chaque sous-calque) en **fichier séparé** :
**PNG-24**, **JPEG**, **SVG** et/ou **PDF**. Pour chaque cible, le script masque
temporairement les autres calques, exporte le document, puis **restaure toujours**
la visibilité — même en cas d’erreur.

> **Conseil : travaillez sur une copie du document.** Le script restaure la
> visibilité, mais un export PDF passe par « Enregistrer sous » (fermeture /
> réouverture du fichier d’origine).

### Fonctionnalités

- **Portée** :
  - tous les calques de premier niveau ;
  - calque actif (+ sous-calques en option) ;
  - calques visibles seulement ;
  - calques liés à la sélection (sinon repli sur visibles + non verrouillés).
- **Sous-calques** : fichiers séparés, ou un seul fichier par calque parent
  (contenu des sous-calques inclus / « aplati » à l’export).
- **Filtres** (cases à cocher) : ignorer vides, masqués, verrouillés.
- **Plan de travail** : plan actif uniquement, ou tous les plans (contenu global).
- **Formats** (cumulables) : PNG-24 (transparence), JPEG (qualité 0–100), SVG
  (texte vectorisé / images incorporées), PDF (paramètre prédéfini au choix).
- **Résolution** : 72 / 150 / 300 ppp ou personnalisée (max 558 ppp).
- **Fond** : transparent (PNG) ou couleur hex (JPEG / PNG non transparent).
- **Modèle de nom** :

  | Balise | Remplacée par |
  |---|---|
  | `{doc}` | nom du document |
  | `{layer}` | nom du calque |
  | `{parent}` | nom du calque parent (`root` si aucun) |
  | `{n}` / `{nn}` / `{nnn}` | numéro (1, 01, 001) |
  | `{i}` | rang dans l’export |
  | `{dpi}` | résolution |
  | `{date}` | date `AAAA-MM-JJ` |

  Par défaut : `{doc}_{layer}_{nn}`. Pas d’écrasement par défaut (`_2`, `_3`…).
- **Bouton Analyser** : liste les calques et chemins prévus **sans écrire** de fichier.
- **Résumé final** : nombre de fichiers, erreurs.
- **Interface FR / EN** (détection locale + sélecteur).

### Méthode sûre

1. Instantané de la visibilité de **tous** les calques / sous-calques.
2. Pour chaque cible : masquer le reste, afficher la cible (+ ancêtres ;
   descendants si mode parent « aplati »).
3. Exporter (PNG / JPEG / SVG / PDF).
4. Dans un `finally` : **toujours** restaurer la visibilité.

Le fichier source n’est pas modifié de façon permanente (hors cycle PDF
enregistrer-sous → fermer → rouvrir).

### Installation

1. Téléchargez `ExporterCalques.jsx`.
2. **Usage ponctuel** : **Fichier > Scripts > Autre script…** (`Ctrl/Cmd + F12`).
3. **Installation permanente** : copiez dans `Presets/<langue>/Scripts` puis
   redémarrez Illustrator :
   - Windows : `C:\Program Files\Adobe\Adobe Illustrator <version>\Presets\fr_FR\Scripts\`
   - macOS : `/Applications/Adobe Illustrator <version>/Presets/fr_FR/Scripts/`

### Usage

1. Ouvrez un document (de préférence une **copie**).
2. Lancez le script.
3. Choisissez portée, filtres, formats, dossier.
4. **Analyser** pour prévisualiser, puis **Exporter**.

### Licence

MIT — Copyright (c) 2026 Amirouche Amwanes. Voir [LICENSE](LICENSE).

Aucun appel réseau, aucune collecte de données. Code 100 % original.

---

## 🇬🇧 English

Batch-exports each layer (and optionally each sublayer) to a **separate file**:
**PNG-24**, **JPEG**, **SVG** and/or **PDF**. For every target the script
temporarily hides other layers, exports, then **always restores** visibility —
even if an error occurs.

> **Tip: work on a copy of the document.** Visibility is restored, but PDF export
> uses “Save As” (close / reopen of the original file).

### Features

- **Scope**: all top-level layers, active layer (+ optional sublayers), visible
  only, or layers tied to the selection (fallback: visible + unlocked).
- **Sublayers**: separate files, or one file per parent (subtree included).
- **Filters**: skip empty / hidden / locked.
- **Artboard**: active only, or all artboards.
- **Formats**: PNG-24, JPEG, SVG, PDF (stackable in one run).
- **Resolution**, hex background, naming template `{doc} {layer} {nn} {date}`…
- **Analyze** button (no files written), final summary, FR/EN UI.

### Safe method

Snapshot → isolate each layer → export → **always** restore in `finally`.

### Install

**File > Scripts > Other Script…** or copy into `Presets/<locale>/Scripts`.

### Licence

MIT — Copyright (c) 2026 Amirouche Amwanes. See [LICENSE](LICENSE).

No network access, no data collection. 100% original code.
