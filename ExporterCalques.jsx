//@target illustrator
/*
 * ExporterCalques.jsx — v1.0.0
 * ---------------------------------------------------------------------------
 * FR : Export par lot de chaque calque (et optionnellement sous-calques) en
 *      fichiers séparés : PNG-24, JPEG, SVG, PDF. Masque temporairement les
 *      autres calques, exporte, puis restaure toujours la visibilité.
 * EN : Batch export of each layer (and optionally sublayers) to separate
 *      files: PNG-24, JPEG, SVG, PDF. Temporarily hides other layers,
 *      exports, then always restores visibility.
 *
 * Cible / Target : Adobe Illustrator CC 2018 – 2026 (ExtendScript, ES3)
 * Statut / Status : non testé dans Illustrator / not tested in Illustrator
 *                   (syntaxe vérifiée / syntax checked with acorn).
 *
 * Conseillé : travaillez sur une copie du document.
 * Recommended: work on a copy of the document.
 *
 * Aucun appel réseau, aucune collecte de données.
 * No network access, no data collection.
 *
 * © 2026 Amirouche Amwanes — Licence MIT / MIT License
 */

(function () {

    // =====================================================================
    // Constantes / Constants
    // =====================================================================
    var SCRIPT_NAME = "ExporterCalques";
    var SCRIPT_VERSION = "1.0.0";
    var MAX_SCALE = 776;
    var MAX_DPI = Math.floor(MAX_SCALE * 72 / 100); // = 558
    var DPI_PRESETS = [72, 150, 300];
    var MAX_ERRORS_SHOWN = 12;
    var MAX_ANALYZE_LINES = 40;

    // =====================================================================
    // Textes FR / EN — UI strings
    // =====================================================================
    var STR = {
        fr: {
            title: "Exporter les calques",
            noDoc: "Aucun document ouvert.\nOuvrez un document Illustrator puis relancez le script.",
            noLayer: "Le document actif ne contient aucun calque.",
            langLabel: "Langue / Language :",
            pnlScope: "Portée",
            scopeAll: "Tous les calques de premier niveau (%1)",
            scopeActive: "Calque actif : %1",
            scopeVisible: "Calques visibles seulement",
            scopeSelected: "Calques avec sélection (sinon visibles + non verrouillés)",
            includeSublayers: "Inclure les sous-calques comme fichiers séparés",
            flattenNote: "Sinon : un fichier = calque parent avec son contenu (sous-calques inclus)",
            pnlFilters: "Filtres",
            skipEmpty: "Ignorer les calques vides",
            skipHidden: "Ignorer les calques masqués",
            skipLocked: "Ignorer les calques verrouillés",
            pnlArtboard: "Plan de travail",
            abActive: "Plan de travail actif uniquement",
            abAll: "Tous les plans de travail (contenu global / plage complète)",
            pnlFormats: "Formats",
            fmtPng: "PNG-24",
            fmtJpg: "JPEG",
            fmtSvg: "SVG",
            fmtPdf: "PDF",
            pngTransparent: "Fond transparent",
            jpgQuality: "Qualité :",
            svgOutline: "Vectoriser le texte",
            svgEmbed: "Incorporer les images",
            pdfPreset: "Paramètre prédéfini :",
            pdfDefault: "(réglages par défaut)",
            pdfNote: "PDF : « Enregistrer sous ». Document enregistré requis ; fermeture puis réouverture.",
            pnlRaster: "Options raster (PNG / JPEG)",
            dpiLabel: "Résolution :",
            dpiCustom: "Personnalisée",
            dpiUnit: "ppp (max %1)",
            bgLabel: "Fond (hex) :",
            bgHint: "si pas de transparence",
            antiAlias: "Lissage (anticrénelage)",
            pnlNaming: "Nommage des fichiers",
            templateLabel: "Modèle :",
            tokens: "{doc} document · {layer} calque · {parent} parent\n{n}/{nn}/{nnn} numéro · {i} rang · {dpi} · {date}",
            previewLabel: "Aperçu : ",
            pnlOutput: "Dossier de sortie",
            browse: "Parcourir…",
            chooseFolder: "Choisissez le dossier de sortie",
            noFolder: "(aucun dossier choisi)",
            subfolders: "Un sous-dossier par format (PNG, JPG, SVG, PDF)",
            overwrite: "Écraser les fichiers existants",
            openFolder: "Ouvrir le dossier à la fin",
            btnAnalyze: "Analyser",
            btnExport: "Exporter",
            btnCancel: "Annuler",
            errNoFormat: "Cochez au moins un format d'export.",
            errDpi: "Résolution invalide. Entrez une valeur entre 1 et %1 ppp.",
            errQuality: "Qualité JPEG invalide (0 à 100).",
            errBg: "Couleur de fond invalide. Utilisez 6 chiffres hex, ex. FFFFFF.",
            errTemplate: "Le modèle de nom est vide.",
            errFolder: "Choisissez un dossier de sortie.",
            errFolderCreate: "Impossible de créer le dossier :\n%1",
            errNoLayers: "Aucun calque à exporter avec les filtres actuels.",
            errPdfUnsaved: "L'export PDF nécessite un document déjà enregistré, sans modifications en attente.\nEnregistrez (Fichier > Enregistrer) ou décochez PDF.",
            errNotCreated: "fichier non créé",
            errSvgMissing: "Illustrator n'a produit aucun fichier SVG",
            errMove: "impossible de déplacer le fichier temporaire",
            errRestore: "Restauration de la visibilité : %1",
            progressTitle: "Export en cours…",
            analyzeTitle: "Analyse — calques à exporter",
            analyzeHeader: "%1 calque(s), %2 fichier(s) prévu(s) :",
            analyzeMore: "… et %1 autre(s).",
            analyzeNone: "Aucun calque ne correspond aux critères.",
            summaryOk: "%1 fichier(s) exporté(s) dans :\n%2",
            summaryNone: "Aucun fichier n'a été exporté.",
            summaryErrors: "%1 erreur(s) :",
            summaryMore: "… et %1 autre(s).",
            reopenFail: "Le document n'a pas pu être rouvert automatiquement (%1). Rouvrez-le depuis : %2",
            fatal: "Erreur inattendue : %1",
            copyAdvice: "Conseil : travaillez sur une copie du document."
        },
        en: {
            title: "Export layers",
            noDoc: "No document is open.\nOpen an Illustrator document and run the script again.",
            noLayer: "The active document has no layer.",
            langLabel: "Langue / Language:",
            pnlScope: "Scope",
            scopeAll: "All top-level layers (%1)",
            scopeActive: "Active layer: %1",
            scopeVisible: "Visible layers only",
            scopeSelected: "Layers with selection (else visible + unlocked)",
            includeSublayers: "Include sublayers as separate files",
            flattenNote: "Otherwise: one file = parent layer with its content (sublayers included)",
            pnlFilters: "Filters",
            skipEmpty: "Skip empty layers",
            skipHidden: "Skip hidden layers",
            skipLocked: "Skip locked layers",
            pnlArtboard: "Artboard",
            abActive: "Active artboard only",
            abAll: "All artboards (full content / full range)",
            pnlFormats: "Formats",
            fmtPng: "PNG-24",
            fmtJpg: "JPEG",
            fmtSvg: "SVG",
            fmtPdf: "PDF",
            pngTransparent: "Transparent background",
            jpgQuality: "Quality:",
            svgOutline: "Convert text to outlines",
            svgEmbed: "Embed images",
            pdfPreset: "Preset:",
            pdfDefault: "(default settings)",
            pdfNote: "PDF uses \"Save As\". Saved document required; close then reopen.",
            pnlRaster: "Raster options (PNG / JPEG)",
            dpiLabel: "Resolution:",
            dpiCustom: "Custom",
            dpiUnit: "ppi (max %1)",
            bgLabel: "Background (hex):",
            bgHint: "when not transparent",
            antiAlias: "Anti-aliasing",
            pnlNaming: "File naming",
            templateLabel: "Template:",
            tokens: "{doc} document · {layer} layer · {parent} parent\n{n}/{nn}/{nnn} number · {i} rank · {dpi} · {date}",
            previewLabel: "Preview: ",
            pnlOutput: "Output folder",
            browse: "Browse…",
            chooseFolder: "Choose the output folder",
            noFolder: "(no folder selected)",
            subfolders: "One subfolder per format (PNG, JPG, SVG, PDF)",
            overwrite: "Overwrite existing files",
            openFolder: "Open the folder when done",
            btnAnalyze: "Analyze",
            btnExport: "Export",
            btnCancel: "Cancel",
            errNoFormat: "Tick at least one export format.",
            errDpi: "Invalid resolution. Enter a value between 1 and %1 ppi.",
            errQuality: "Invalid JPEG quality (0 to 100).",
            errBg: "Invalid background colour. Use 6 hex digits, e.g. FFFFFF.",
            errTemplate: "The file-name template is empty.",
            errFolder: "Choose an output folder.",
            errFolderCreate: "Cannot create the folder:\n%1",
            errNoLayers: "No layer to export with the current filters.",
            errPdfUnsaved: "PDF export needs a document that is already saved, with no pending changes.\nSave (File > Save) or untick PDF.",
            errNotCreated: "file not created",
            errSvgMissing: "Illustrator produced no SVG file",
            errMove: "cannot move the temporary file",
            errRestore: "Visibility restore: %1",
            progressTitle: "Exporting…",
            analyzeTitle: "Analyze — layers to export",
            analyzeHeader: "%1 layer(s), %2 planned file(s):",
            analyzeMore: "… and %1 more.",
            analyzeNone: "No layer matches the criteria.",
            summaryOk: "%1 file(s) exported to:\n%2",
            summaryNone: "No file was exported.",
            summaryErrors: "%1 error(s):",
            summaryMore: "… and %1 more.",
            reopenFail: "The document could not be reopened automatically (%1). Reopen it from: %2",
            fatal: "Unexpected error: %1",
            copyAdvice: "Tip: work on a copy of the document."
        }
    };

    var lang = detectLang();

    // Détecte la langue d'Illustrator / Detects Illustrator's UI language
    function detectLang() {
        var loc = "";
        try { loc = String(app.locale); } catch (e) { loc = ""; }
        if (loc === "" || loc === "undefined") {
            try { loc = String($.locale); } catch (e2) { loc = ""; }
        }
        return (loc.toLowerCase().indexOf("fr") === 0) ? "fr" : "en";
    }

    function tr(key) {
        var table = STR[lang] || STR.en;
        var s = table.hasOwnProperty(key) ? table[key] : (STR.en.hasOwnProperty(key) ? STR.en[key] : key);
        for (var a = 1; a < arguments.length; a++) {
            s = s.split("%" + a).join(String(arguments[a]));
        }
        return s;
    }

    // =====================================================================
    // Utilitaires / Utilities
    // =====================================================================
    function trim(s) {
        return String(s).replace(/^\s+/, "").replace(/\s+$/, "");
    }

    function pad(num, width) {
        var s = String(num);
        while (s.length < width) { s = "0" + s; }
        return s;
    }

    function replaceAll(s, find, rep) {
        return String(s).split(find).join(rep);
    }

    function todayString() {
        var d = new Date();
        return d.getFullYear() + "-" + pad(d.getMonth() + 1, 2) + "-" + pad(d.getDate(), 2);
    }

    function sanitizeFileName(s) {
        s = String(s).replace(/[\\\/:\*\?"<>\|%]/g, "_");
        s = s.replace(/[\x00-\x1F]/g, "");
        s = trim(s).replace(/[\. ]+$/, "");
        if (s.length > 180) { s = s.substring(0, 180); }
        return s;
    }

    function stripExtension(name) {
        return String(name).replace(/\.[A-Za-z0-9]{1,5}$/, "");
    }

    function isHex6(s) {
        return /^#?[0-9A-Fa-f]{6}$/.test(trim(s));
    }

    function hexToRGB(hex) {
        var h = trim(hex).replace(/^#/, "");
        var c = new RGBColor();
        c.red = parseInt(h.substring(0, 2), 16);
        c.green = parseInt(h.substring(2, 4), 16);
        c.blue = parseInt(h.substring(4, 6), 16);
        return c;
    }

    function numberFrom(s) {
        var t = trim(s).replace(",", ".");
        if (!/^\d+(\.\d+)?$/.test(t)) { return NaN; }
        return parseFloat(t);
    }

    function trySet(obj, prop, valueFn) {
        try {
            var v = valueFn();
            if (v !== undefined && v !== null) { obj[prop] = v; }
        } catch (e) { /* ignoré / ignored */ }
    }

    function errText(e) {
        if (!e) { return "?"; }
        return (e.message ? e.message : String(e)) + (e.line ? " (l. " + e.line + ")" : "");
    }

    function sameFile(f1, f2) {
        if (!f1 || !f2) { return false; }
        try {
            return String(f1.fsName).toLowerCase() === String(f2.fsName).toLowerCase();
        } catch (e) { return false; }
    }

    // =====================================================================
    // Vérifications initiales / Initial checks
    // =====================================================================
    if (app.documents.length === 0) {
        alert(tr("noDoc"), SCRIPT_NAME);
        return;
    }

    var doc = app.activeDocument;
    var topLayers = doc.layers;
    if (topLayers.length === 0) {
        alert(tr("noLayer"), SCRIPT_NAME);
        return;
    }

    var docState = (function () {
        var st = {
            file: null,
            folder: null,
            isSavedClean: false,
            activeIndex: 0,
            baseName: "",
            activeLayer: null
        };
        try { st.activeIndex = doc.artboards.getActiveArtboardIndex(); } catch (e) { st.activeIndex = 0; }
        try { st.activeLayer = doc.activeLayer; } catch (e2) { st.activeLayer = topLayers[0]; }
        try {
            var f = new File(doc.fullName);
            if (f.exists) { st.file = f; st.folder = f.parent; }
        } catch (e3) { st.file = null; }
        try { st.isSavedClean = (st.file !== null) && (doc.saved === true); } catch (e4) { st.isSavedClean = false; }
        st.baseName = sanitizeFileName(stripExtension(doc.name));
        if (st.baseName === "") { st.baseName = "document"; }
        return st;
    })();

    var pdfPresets = [];
    try {
        var pl = app.PDFPresetsList;
        for (var pi = 0; pi < pl.length; pi++) { pdfPresets.push(String(pl[pi])); }
    } catch (ePl) { pdfPresets = []; }

    function defaultPresetIndex() {
        for (var i = 0; i < pdfPresets.length; i++) {
            if (/High Quality|Qualit\u00e9 sup\u00e9rieure/i.test(pdfPresets[i])) { return i + 1; }
        }
        return 0;
    }

    var settings = {
        scope: "all",          // all | active | visible | selected
        includeSublayers: false,
        skipEmpty: true,
        skipHidden: true,
        skipLocked: true,
        artboardMode: "active", // active | all
        png: true,
        jpg: false,
        svg: false,
        pdf: false,
        pngTransparent: true,
        jpgQuality: 80,
        svgOutline: false,
        svgEmbed: true,
        pdfPresetIndex: defaultPresetIndex(),
        dpiChoice: 2,
        dpiCustomText: "200",
        dpi: 300,
        bgHex: "FFFFFF",
        antiAlias: true,
        template: "{doc}_{layer}_{nn}",
        folder: docState.folder,
        subfolders: false,
        overwrite: false,
        openFolder: false
    };

    // =====================================================================
    // Arbre des calques / Layer tree helpers
    // =====================================================================

    // Compte pageItems + sous-calques (récursif) / Counts pageItems + sublayers
    function layerItemCount(layer) {
        var n = 0;
        try { n += layer.pageItems.length; } catch (e) { /* */ }
        try {
            var i, sub = layer.layers;
            for (i = 0; i < sub.length; i++) { n += layerItemCount(sub[i]); }
        } catch (e2) { /* */ }
        return n;
    }

    function isLayerEmpty(layer) {
        return layerItemCount(layer) === 0;
    }

    // Parents d'un calque (de la racine vers le parent direct)
    // Ancestors of a layer (root → direct parent)
    function getAncestors(layer) {
        var chain = [];
        var p = null;
        try { p = layer.parent; } catch (e) { return chain; }
        while (p && p.typename === "Layer") {
            chain.unshift(p);
            try { p = p.parent; } catch (e2) { break; }
        }
        return chain;
    }

    function parentLayerName(layer) {
        try {
            if (layer.parent && layer.parent.typename === "Layer") {
                return String(layer.parent.name);
            }
        } catch (e) { /* */ }
        return "";
    }

    // Calques contenant au moins un objet sélectionné
    // Layers that contain at least one selected item
    function layersWithSelection() {
        var map = {};
        var out = [];
        var sel, i, item, lay, key;
        try { sel = doc.selection; } catch (e) { sel = null; }
        if (!sel || sel.length === 0) { return out; }
        for (i = 0; i < sel.length; i++) {
            try {
                item = sel[i];
                lay = item.layer;
                while (lay && lay.typename === "Layer") {
                    key = String(lay.name) + "@" + getLayerPath(lay);
                    if (!map[key]) {
                        map[key] = true;
                        out.push(lay);
                    }
                    try {
                        if (lay.parent && lay.parent.typename === "Layer") { lay = lay.parent; }
                        else { break; }
                    } catch (e2) { break; }
                }
            } catch (e3) { /* */ }
        }
        return out;
    }

    function getLayerPath(layer) {
        var parts = [String(layer.name)];
        var p;
        try { p = layer.parent; } catch (e) { return parts.join("/"); }
        while (p && p.typename === "Layer") {
            parts.unshift(String(p.name));
            try { p = p.parent; } catch (e2) { break; }
        }
        return parts.join("/");
    }

    function passesFilters(layer) {
        try {
            if (settings.skipHidden && layer.visible === false) { return false; }
        } catch (e) { /* */ }
        try {
            if (settings.skipLocked && layer.locked === true) { return false; }
        } catch (e2) { /* */ }
        if (settings.skipEmpty && isLayerEmpty(layer)) { return false; }
        return true;
    }

    // Collecte les cibles d'export / Collects export targets
    // Chaque entrée : { layer, name, parentName, path, index }
    function collectTargets() {
        var targets = [];
        var seen = {};
        var i, lay, list;

        function addLayer(layer) {
            var path, key;
            if (!layer) { return; }
            path = getLayerPath(layer);
            key = path;
            if (seen[key]) { return; }
            if (!passesFilters(layer)) { return; }
            seen[key] = true;
            targets.push({
                layer: layer,
                name: String(layer.name),
                parentName: parentLayerName(layer),
                path: path
            });
        }

        function walkSubtree(layer, includeSelf) {
            var j, subs;
            if (includeSelf) { addLayer(layer); }
            if (!settings.includeSublayers) { return; }
            try {
                subs = layer.layers;
                for (j = 0; j < subs.length; j++) {
                    walkSubtree(subs[j], true);
                }
            } catch (e) { /* */ }
        }

        if (settings.scope === "active") {
            walkSubtree(docState.activeLayer, true);
        } else if (settings.scope === "visible") {
            for (i = 0; i < topLayers.length; i++) {
                lay = topLayers[i];
                try {
                    if (lay.visible) { walkSubtree(lay, true); }
                } catch (eV) { walkSubtree(lay, true); }
            }
        } else if (settings.scope === "selected") {
            list = layersWithSelection();
            if (list.length === 0) {
                // Repli : visibles + non verrouillés / Fallback: visible + unlocked
                for (i = 0; i < topLayers.length; i++) {
                    lay = topLayers[i];
                    try {
                        if (lay.visible && !lay.locked) { walkSubtree(lay, true); }
                    } catch (eS) { walkSubtree(lay, true); }
                }
            } else {
                for (i = 0; i < list.length; i++) {
                    // Uniquement premier niveau ou sous-calques selon option
                    // Only top-level or sublayers depending on option
                    if (settings.includeSublayers) {
                        addLayer(list[i]);
                    } else {
                        try {
                            if (!list[i].parent || list[i].parent.typename !== "Layer") {
                                addLayer(list[i]);
                            }
                        } catch (eT) { addLayer(list[i]); }
                    }
                }
            }
        } else {
            // all top-level
            for (i = 0; i < topLayers.length; i++) {
                walkSubtree(topLayers[i], true);
            }
        }

        // Index 1-based for naming
        for (i = 0; i < targets.length; i++) {
            targets[i].index = i + 1;
        }
        return targets;
    }

    function currentDpi() {
        if (settings.dpiChoice < DPI_PRESETS.length) { return DPI_PRESETS[settings.dpiChoice]; }
        return numberFrom(settings.dpiCustomText);
    }

    function formatCount() {
        var n = 0;
        if (settings.png) { n++; }
        if (settings.jpg) { n++; }
        if (settings.svg) { n++; }
        if (settings.pdf) { n++; }
        return n;
    }

    function buildBaseName(template, ctx) {
        var s = String(template);
        s = replaceAll(s, "{doc}", ctx.docName);
        s = replaceAll(s, "{layer}", ctx.layerName);
        s = replaceAll(s, "{parent}", ctx.parentName);
        s = replaceAll(s, "{nnn}", pad(ctx.n, 3));
        s = replaceAll(s, "{nn}", pad(ctx.n, 2));
        s = replaceAll(s, "{n}", String(ctx.n));
        s = replaceAll(s, "{i}", String(ctx.i));
        s = replaceAll(s, "{dpi}", String(ctx.dpi));
        s = replaceAll(s, "{date}", ctx.date);
        s = sanitizeFileName(s);
        if (s === "") { s = docState.baseName + "_" + pad(ctx.n, 2); }
        return s;
    }

    function makeCtx(target, rank, dpi) {
        return {
            docName: docState.baseName,
            layerName: target.name,
            parentName: target.parentName || "root",
            n: target.index,
            i: rank + 1,
            dpi: isNaN(dpi) ? "" : Math.round(dpi),
            date: todayString()
        };
    }

    function validate(forExport) {
        var dpi;
        if (!settings.png && !settings.jpg && !settings.svg && !settings.pdf) {
            return tr("errNoFormat");
        }
        if (settings.png || settings.jpg) {
            dpi = currentDpi();
            if (isNaN(dpi) || dpi < 1 || dpi > MAX_DPI) { return tr("errDpi", MAX_DPI); }
            if (!isHex6(settings.bgHex)) { return tr("errBg"); }
        }
        if (settings.jpg && (isNaN(settings.jpgQuality) || settings.jpgQuality < 0 || settings.jpgQuality > 100)) {
            return tr("errQuality");
        }
        if (trim(settings.template) === "") { return tr("errTemplate"); }
        if (forExport && !settings.folder) { return tr("errFolder"); }
        if (forExport && settings.pdf && !docState.isSavedClean) { return tr("errPdfUnsaved"); }
        return "";
    }

    // =====================================================================
    // Snapshot / restauration visibilité
    // Visibility snapshot / restore — always restore, even on error
    // =====================================================================
    function snapshotAllVisibility() {
        var snap = [];
        function walk(layers) {
            var i, L;
            for (i = 0; i < layers.length; i++) {
                L = layers[i];
                try {
                    snap.push({ layer: L, visible: L.visible });
                } catch (e) { /* */ }
                try {
                    if (L.layers && L.layers.length > 0) { walk(L.layers); }
                } catch (e2) { /* */ }
            }
        }
        walk(topLayers);
        return snap;
    }

    function restoreVisibility(snap) {
        var i, errors = [];
        for (i = 0; i < snap.length; i++) {
            try {
                snap[i].layer.visible = snap[i].visible;
            } catch (e) {
                errors.push(errText(e));
            }
        }
        return errors;
    }

    // Masque tout, montre la cible (+ ancêtres ; descendants si aplatir)
    // Hides all, shows target (+ ancestors; descendants if flatten)
    function showOnlyTarget(snap, target, flatten) {
        var i, L, keep = {}, anc, j, k;

        function markKeep(layer) {
            try { keep[getLayerPath(layer)] = true; } catch (e) { /* */ }
        }

        function markDescendants(layer) {
            var d, sub;
            markKeep(layer);
            try {
                sub = layer.layers;
                for (d = 0; d < sub.length; d++) { markDescendants(sub[d]); }
            } catch (e2) { /* */ }
        }

        // Ancêtres toujours visibles / Ancestors always visible
        anc = getAncestors(target.layer);
        for (j = 0; j < anc.length; j++) { markKeep(anc[j]); }

        if (flatten || !settings.includeSublayers) {
            // Afficher toute la sous-arborescence de la cible
            // Show entire subtree of the target
            markDescendants(target.layer);
        } else {
            // Sous-calque seul : cible seule (+ ancêtres déjà marqués)
            // Sublayer alone: target only (+ ancestors already marked)
            markKeep(target.layer);
        }

        for (i = 0; i < snap.length; i++) {
            L = snap[i].layer;
            try {
                L.visible = (keep[getLayerPath(L)] === true);
            } catch (e3) { /* */ }
        }
    }

    // =====================================================================
    // Dialogue ScriptUI / ScriptUI dialog
    // Renvoie "ok", "cancel", "lang" ou "analyze"
    // =====================================================================
    function showDialog() {
        var w = new Window("dialog", tr("title") + " — v" + SCRIPT_VERSION);
        w.orientation = "column";
        w.alignChildren = ["fill", "top"];
        w.spacing = 8;
        w.margins = 14;

        var gLang = w.add("group");
        gLang.alignment = ["right", "top"];
        gLang.add("statictext", undefined, tr("langLabel"));
        var ddLang = gLang.add("dropdownlist", undefined, ["Français", "English"]);
        ddLang.selection = (lang === "fr") ? 0 : 1;

        var gCols = w.add("group");
        gCols.orientation = "row";
        gCols.alignChildren = ["fill", "top"];
        gCols.spacing = 12;

        var colL = gCols.add("group");
        colL.orientation = "column";
        colL.alignChildren = ["fill", "top"];
        colL.preferredSize.width = 340;

        var colR = gCols.add("group");
        colR.orientation = "column";
        colR.alignChildren = ["fill", "top"];
        colR.preferredSize.width = 340;

        // --- Portée / Scope ---
        var pScope = colL.add("panel", undefined, tr("pnlScope"));
        pScope.alignChildren = ["fill", "top"];
        pScope.margins = [12, 16, 12, 10];
        var activeName = "";
        try { activeName = String(docState.activeLayer.name); } catch (eA) { activeName = "?"; }
        var rbAll = pScope.add("radiobutton", undefined, tr("scopeAll", topLayers.length));
        var rbActive = pScope.add("radiobutton", undefined, tr("scopeActive", activeName));
        var rbVisible = pScope.add("radiobutton", undefined, tr("scopeVisible"));
        var rbSelected = pScope.add("radiobutton", undefined, tr("scopeSelected"));
        var cbSub = pScope.add("checkbox", undefined, tr("includeSublayers"));
        cbSub.value = settings.includeSublayers;
        pScope.add("statictext", undefined, tr("flattenNote"), { multiline: true }).preferredSize = [310, 28];

        var radios = [rbAll, rbActive, rbVisible, rbSelected];
        var scopes = ["all", "active", "visible", "selected"];
        function setScope(sc) {
            for (var r = 0; r < radios.length; r++) { radios[r].value = (scopes[r] === sc); }
        }
        function bindRadio(rb, sc) {
            rb.onClick = function () { setScope(sc); refresh(); };
        }
        for (var rr = 0; rr < radios.length; rr++) { bindRadio(radios[rr], scopes[rr]); }

        // --- Filtres / Filters ---
        var pFilt = colL.add("panel", undefined, tr("pnlFilters"));
        pFilt.alignChildren = ["fill", "top"];
        pFilt.margins = [12, 16, 12, 10];
        var cbEmpty = pFilt.add("checkbox", undefined, tr("skipEmpty"));
        var cbHidden = pFilt.add("checkbox", undefined, tr("skipHidden"));
        var cbLocked = pFilt.add("checkbox", undefined, tr("skipLocked"));
        cbEmpty.value = settings.skipEmpty;
        cbHidden.value = settings.skipHidden;
        cbLocked.value = settings.skipLocked;

        // --- Plan de travail / Artboard ---
        var pAb = colL.add("panel", undefined, tr("pnlArtboard"));
        pAb.alignChildren = ["fill", "top"];
        pAb.margins = [12, 16, 12, 10];
        var rbAbActive = pAb.add("radiobutton", undefined, tr("abActive"));
        var rbAbAll = pAb.add("radiobutton", undefined, tr("abAll"));
        rbAbActive.value = (settings.artboardMode === "active");
        rbAbAll.value = (settings.artboardMode === "all");

        // --- Nommage / Naming ---
        var pName = colL.add("panel", undefined, tr("pnlNaming"));
        pName.alignChildren = ["fill", "top"];
        pName.margins = [12, 16, 12, 10];
        var gTpl = pName.add("group");
        gTpl.add("statictext", undefined, tr("templateLabel"));
        var etTpl = gTpl.add("edittext", undefined, settings.template);
        etTpl.characters = 24;
        pName.add("statictext", undefined, tr("tokens"), { multiline: true }).preferredSize = [310, 40];
        var stPreview = pName.add("statictext", undefined, "", { truncate: "middle" });
        stPreview.preferredSize = [310, 18];

        // --- Sortie / Output ---
        var pOut = colL.add("panel", undefined, tr("pnlOutput"));
        pOut.alignChildren = ["fill", "top"];
        pOut.margins = [12, 16, 12, 10];
        var gFolder = pOut.add("group");
        var stFolder = gFolder.add("statictext", undefined, "", { truncate: "middle" });
        stFolder.preferredSize = [210, 18];
        var btBrowse = gFolder.add("button", undefined, tr("browse"));
        var cbSubfold = pOut.add("checkbox", undefined, tr("subfolders"));
        cbSubfold.value = settings.subfolders;
        var cbOver = pOut.add("checkbox", undefined, tr("overwrite"));
        cbOver.value = settings.overwrite;
        var cbOpen = pOut.add("checkbox", undefined, tr("openFolder"));
        cbOpen.value = settings.openFolder;

        function showFolder() {
            stFolder.text = settings.folder ? settings.folder.fsName : tr("noFolder");
            stFolder.helpTip = stFolder.text;
        }
        btBrowse.onClick = function () {
            var start = settings.folder || Folder.desktop;
            var chosen = null;
            try { chosen = start.selectDlg(tr("chooseFolder")); }
            catch (eS) { chosen = Folder.selectDialog(tr("chooseFolder")); }
            if (chosen) { settings.folder = chosen; showFolder(); }
        };

        // --- Formats ---
        var pFmt = colR.add("panel", undefined, tr("pnlFormats"));
        pFmt.alignChildren = ["fill", "top"];
        pFmt.margins = [12, 16, 12, 10];

        var gPng = pFmt.add("group");
        var cbPng = gPng.add("checkbox", undefined, tr("fmtPng"));
        cbPng.preferredSize.width = 70;
        var cbTransp = gPng.add("checkbox", undefined, tr("pngTransparent"));
        cbPng.value = settings.png;
        cbTransp.value = settings.pngTransparent;

        var gJpg = pFmt.add("group");
        var cbJpg = gJpg.add("checkbox", undefined, tr("fmtJpg"));
        cbJpg.preferredSize.width = 70;
        gJpg.add("statictext", undefined, tr("jpgQuality"));
        var slQ = gJpg.add("slider", undefined, settings.jpgQuality, 0, 100);
        slQ.preferredSize.width = 100;
        var etQ = gJpg.add("edittext", undefined, String(settings.jpgQuality));
        etQ.characters = 4;
        cbJpg.value = settings.jpg;

        var gSvg = pFmt.add("group");
        var cbSvg = gSvg.add("checkbox", undefined, tr("fmtSvg"));
        cbSvg.preferredSize.width = 70;
        var cbOutline = gSvg.add("checkbox", undefined, tr("svgOutline"));
        var cbEmbed = gSvg.add("checkbox", undefined, tr("svgEmbed"));
        cbSvg.value = settings.svg;
        cbOutline.value = settings.svgOutline;
        cbEmbed.value = settings.svgEmbed;

        var gPdf = pFmt.add("group");
        var cbPdf = gPdf.add("checkbox", undefined, tr("fmtPdf"));
        cbPdf.preferredSize.width = 70;
        gPdf.add("statictext", undefined, tr("pdfPreset"));
        var presetItems = [tr("pdfDefault")];
        for (var pp = 0; pp < pdfPresets.length; pp++) { presetItems.push(pdfPresets[pp]); }
        var ddPreset = gPdf.add("dropdownlist", undefined, presetItems);
        ddPreset.preferredSize.width = 160;
        ddPreset.selection = Math.min(settings.pdfPresetIndex, presetItems.length - 1);
        cbPdf.value = settings.pdf;
        var stPdfNote = pFmt.add("statictext", undefined, tr("pdfNote"), { multiline: true });
        stPdfNote.preferredSize = [310, 36];

        // --- Raster ---
        var pRas = colR.add("panel", undefined, tr("pnlRaster"));
        pRas.alignChildren = ["fill", "top"];
        pRas.margins = [12, 16, 12, 10];
        var gDpi = pRas.add("group");
        gDpi.add("statictext", undefined, tr("dpiLabel"));
        var ddDpi = gDpi.add("dropdownlist", undefined, ["72", "150", "300", tr("dpiCustom")]);
        ddDpi.selection = settings.dpiChoice;
        var etDpi = gDpi.add("edittext", undefined, settings.dpiCustomText);
        etDpi.characters = 5;
        gDpi.add("statictext", undefined, tr("dpiUnit", MAX_DPI));
        var gBg = pRas.add("group");
        gBg.add("statictext", undefined, tr("bgLabel"));
        var etBg = gBg.add("edittext", undefined, settings.bgHex);
        etBg.characters = 8;
        gBg.add("statictext", undefined, tr("bgHint"));
        var cbAA = pRas.add("checkbox", undefined, tr("antiAlias"));
        cbAA.value = settings.antiAlias;

        var stCount = colR.add("statictext", undefined, "");
        stCount.characters = 40;

        // --- Boutons / Buttons ---
        var gBtn = w.add("group");
        gBtn.alignment = ["right", "bottom"];
        var btAnalyze = gBtn.add("button", undefined, tr("btnAnalyze"));
        var btCancel = gBtn.add("button", undefined, tr("btnCancel"), { name: "cancel" });
        var btOk = gBtn.add("button", undefined, tr("btnExport"), { name: "ok" });

        function readControls() {
            var r;
            for (r = 0; r < radios.length; r++) {
                if (radios[r].value) { settings.scope = scopes[r]; }
            }
            settings.includeSublayers = cbSub.value;
            settings.skipEmpty = cbEmpty.value;
            settings.skipHidden = cbHidden.value;
            settings.skipLocked = cbLocked.value;
            settings.artboardMode = rbAbAll.value ? "all" : "active";
            settings.png = cbPng.value;
            settings.jpg = cbJpg.value;
            settings.svg = cbSvg.value;
            settings.pdf = cbPdf.value;
            settings.pngTransparent = cbTransp.value;
            settings.jpgQuality = numberFrom(etQ.text);
            settings.svgOutline = cbOutline.value;
            settings.svgEmbed = cbEmbed.value;
            settings.pdfPresetIndex = ddPreset.selection ? ddPreset.selection.index : 0;
            settings.dpiChoice = ddDpi.selection ? ddDpi.selection.index : 2;
            settings.dpiCustomText = etDpi.text;
            settings.dpi = currentDpi();
            settings.bgHex = trim(etBg.text).replace(/^#/, "").toUpperCase();
            settings.antiAlias = cbAA.value;
            settings.template = etTpl.text;
            settings.subfolders = cbSubfold.value;
            settings.overwrite = cbOver.value;
            settings.openFolder = cbOpen.value;
        }

        function refresh() {
            readControls();
            var raster = settings.png || settings.jpg;
            cbTransp.enabled = settings.png;
            slQ.enabled = etQ.enabled = settings.jpg;
            cbOutline.enabled = cbEmbed.enabled = settings.svg;
            ddPreset.enabled = settings.pdf;
            stPdfNote.enabled = settings.pdf;
            pRas.enabled = raster;
            etDpi.enabled = raster && settings.dpiChoice === DPI_PRESETS.length;

            var targets = collectTargets();
            var fc = formatCount();
            stCount.text = targets.length + " calque(s) / layer(s) × " + fc + " = " + (targets.length * fc) + " fichier(s) / file(s)";

            if (targets.length > 0) {
                var ext = settings.png ? ".png" : (settings.jpg ? ".jpg" : (settings.svg ? ".svg" : ".pdf"));
                stPreview.text = tr("previewLabel") + buildBaseName(settings.template, makeCtx(targets[0], 0, settings.dpi)) + ext;
            } else {
                stPreview.text = tr("previewLabel") + "—";
            }
            stPreview.helpTip = stPreview.text;
        }

        var refreshers = [cbSub, cbEmpty, cbHidden, cbLocked, rbAbActive, rbAbAll,
            cbPng, cbJpg, cbSvg, cbPdf, cbTransp, cbOutline, cbEmbed, cbAA];
        for (var ci = 0; ci < refreshers.length; ci++) { refreshers[ci].onClick = refresh; }
        ddDpi.onChange = refresh;
        ddPreset.onChange = refresh;
        etTpl.onChanging = refresh;
        etDpi.onChanging = refresh;
        slQ.onChanging = function () { etQ.text = String(Math.round(slQ.value)); };
        etQ.onChange = function () {
            var q = numberFrom(etQ.text);
            if (!isNaN(q) && q >= 0 && q <= 100) { slQ.value = q; }
        };

        var outcome = "cancel";
        ddLang.onChange = function () {
            var newLang = (ddLang.selection && ddLang.selection.index === 0) ? "fr" : "en";
            if (newLang !== lang) {
                readControls();
                lang = newLang;
                outcome = "lang";
                w.close(3);
            }
        };
        btCancel.onClick = function () { outcome = "cancel"; w.close(2); };
        btAnalyze.onClick = function () {
            readControls();
            var msg = validate(false);
            if (msg !== "") { alert(msg, SCRIPT_NAME); return; }
            outcome = "analyze";
            w.close(4);
        };
        btOk.onClick = function () {
            readControls();
            var msg = validate(true);
            if (msg !== "") { alert(msg, SCRIPT_NAME); return; }
            var targets = collectTargets();
            if (targets.length === 0) { alert(tr("errNoLayers"), SCRIPT_NAME); return; }
            outcome = "ok";
            w.close(1);
        };

        setScope(settings.scope);
        showFolder();
        refresh();
        w.show();
        return outcome;
    }

    // =====================================================================
    // Analyse / Analyze (no file written)
    // =====================================================================
    function showAnalyze(targets) {
        var fc = formatCount();
        var planned = targets.length * fc;
        var lines = [];
        var i, t, base, fmts = [], f;
        if (settings.png) { fmts.push("png"); }
        if (settings.jpg) { fmts.push("jpg"); }
        if (settings.svg) { fmts.push("svg"); }
        if (settings.pdf) { fmts.push("pdf"); }

        if (targets.length === 0) {
            alert(tr("analyzeNone"), SCRIPT_NAME + " — " + tr("analyzeTitle"));
            return;
        }

        lines.push(tr("analyzeHeader", targets.length, planned));
        lines.push(tr("copyAdvice"));
        lines.push("");
        for (i = 0; i < targets.length && i < MAX_ANALYZE_LINES; i++) {
            t = targets[i];
            base = buildBaseName(settings.template, makeCtx(t, i, settings.dpi));
            lines.push((i + 1) + ". [" + t.path + "]");
            for (f = 0; f < fmts.length; f++) {
                lines.push("   → " + base + "." + fmts[f]);
            }
        }
        if (targets.length > MAX_ANALYZE_LINES) {
            lines.push(tr("analyzeMore", targets.length - MAX_ANALYZE_LINES));
        }
        if (settings.folder) {
            lines.push("");
            lines.push(settings.folder.fsName);
        }
        alert(lines.join("\n"), SCRIPT_NAME + " — " + tr("analyzeTitle"));
    }

    // =====================================================================
    // Progression / Progress
    // =====================================================================
    function createProgress(total) {
        var p = { win: null, bar: null, label: null };
        try {
            p.win = new Window("palette", SCRIPT_NAME + " — " + tr("progressTitle"));
            p.win.alignChildren = ["fill", "top"];
            p.bar = p.win.add("progressbar", undefined, 0, Math.max(total, 1));
            p.bar.preferredSize = [380, 12];
            p.label = p.win.add("statictext", undefined, "", { truncate: "middle" });
            p.label.preferredSize = [380, 18];
            p.win.show();
        } catch (e) { p.win = null; }
        p.step = function (value, text) {
            if (!p.win) { return; }
            try {
                p.bar.value = value;
                p.label.text = text;
                p.win.update();
            } catch (e2) { /* */ }
        };
        p.close = function () {
            if (p.win) { try { p.win.close(); } catch (e3) { /* */ } }
        };
        return p;
    }

    // =====================================================================
    // Export
    // =====================================================================
    function ensureFolder(f) {
        if (f.exists) { return true; }
        return f.create();
    }

    function uniqueTarget(folder, base, ext, used) {
        var k = 2;
        var f = new File(folder.fsName + "/" + base + "." + ext);
        while (used[String(f.fsName).toLowerCase()] === true ||
               (!settings.overwrite && f.exists) ||
               sameFile(f, docState.file)) {
            f = new File(folder.fsName + "/" + base + "_" + k + "." + ext);
            k++;
        }
        used[String(f.fsName).toLowerCase()] = true;
        return f;
    }

    function formatFolder(root, sub) {
        if (!settings.subfolders) { return root; }
        var f = new Folder(root.fsName + "/" + sub);
        if (!ensureFolder(f)) { throw new Error(tr("errFolderCreate", f.fsName)); }
        return f;
    }

    function clearFolder(folder) {
        var list = folder.getFiles();
        for (var i = 0; i < list.length; i++) {
            if (list[i] instanceof File) { list[i].remove(); }
        }
    }

    function moveFile(src, dest) {
        if (dest.exists) { dest.remove(); }
        if (!src.copy(dest.fsName)) { return false; }
        src.remove();
        return true;
    }

    function exportRaster(file, kind) {
        var scale = settings.dpi / 72 * 100;
        var opts, type;
        if (kind === "png") {
            opts = new ExportOptionsPNG24();
            opts.transparency = settings.pngTransparent;
            opts.matte = !settings.pngTransparent;
            type = ExportType.PNG24;
        } else {
            opts = new ExportOptionsJPEG();
            opts.qualitySetting = Math.round(settings.jpgQuality);
            opts.matte = true;
            type = ExportType.JPEG;
        }
        opts.matteColor = hexToRGB(settings.bgHex);
        opts.antiAliasing = settings.antiAlias;
        opts.artBoardClipping = (settings.artboardMode === "active");
        opts.horizontalScale = scale;
        opts.verticalScale = scale;
        opts.saveAsHTML = false;
        if (file.exists && settings.overwrite) { file.remove(); }
        doc.exportFile(file, type, opts);
    }

    function exportSvg(targetFile, tmpFolder) {
        var opts = new ExportOptionsSVG();
        var produced, src, rest, dest, i;
        opts.embedRasterImages = settings.svgEmbed;
        opts.coordinatePrecision = 3;
        opts.preserveEditability = false;
        opts.includeFileInfo = false;
        if (settings.artboardMode === "active") {
            opts.saveMultipleArtboards = true;
            opts.artboardRange = String(docState.activeIndex + 1);
        } else {
            try {
                opts.saveMultipleArtboards = true;
                opts.artboardRange = "";
            } catch (eR) {
                opts.saveMultipleArtboards = false;
            }
        }
        if (settings.svgOutline) {
            trySet(opts, "fontType", function () { return SVGFontType.OUTLINEFONT; });
        } else {
            trySet(opts, "fontType", function () { return SVGFontType.SVGFONT; });
            trySet(opts, "fontSubsetting", function () { return SVGFontSubsetting.None; });
        }
        trySet(opts, "cssProperties", function () { return SVGCSSPropertyLocation.STYLEELEMENTS; });
        trySet(opts, "documentEncoding", function () { return SVGDocumentEncoding.UTF8; });
        trySet(opts, "DTD", function () { return SVGDTDVersion.SVG1_1; });

        clearFolder(tmpFolder);
        doc.exportFile(new File(tmpFolder.fsName + "/export.svg"), ExportType.SVG, opts);

        produced = tmpFolder.getFiles("*.svg");
        if (!produced || produced.length === 0) { throw new Error(tr("errSvgMissing")); }
        src = produced[0];
        if (!moveFile(src, targetFile)) { throw new Error(tr("errMove")); }

        rest = tmpFolder.getFiles();
        for (i = 0; i < rest.length; i++) {
            if (!(rest[i] instanceof File)) { continue; }
            dest = new File(targetFile.parent.fsName + "/" + rest[i].name);
            if (!dest.exists && /\.svg$/i.test(rest[i].name) === false) { moveFile(rest[i], dest); }
            else { rest[i].remove(); }
        }
    }

    function exportPdf(file) {
        var opts = new PDFSaveOptions();
        if (settings.pdfPresetIndex > 0 && settings.pdfPresetIndex <= pdfPresets.length) {
            opts.pDFPreset = pdfPresets[settings.pdfPresetIndex - 1];
        }
        if (settings.artboardMode === "active") {
            opts.artboardRange = String(docState.activeIndex + 1);
        } else {
            // Tous les plans / All artboards
            try {
                var n = doc.artboards.length;
                opts.artboardRange = n > 0 ? ("1-" + n) : "";
            } catch (e) { opts.artboardRange = ""; }
        }
        opts.preserveEditability = false;
        opts.viewAfterSaving = false;
        if (file.exists && settings.overwrite) { file.remove(); }
        doc.saveAs(file, opts);
    }

    function runExport(targets) {
        var report = { files: [], errors: [], pdfDone: false };
        var used = {};
        var root = settings.folder;
        var formats = [];
        var snap = null;
        var total, done = 0, f, k, t, ctx, target, folder, tmpFolder = null, label;
        var oldLevel = null;
        var flatten = !settings.includeSublayers;
        var restoreErrs, ri;

        if (!ensureFolder(root)) {
            report.errors.push(tr("errFolderCreate", root.fsName));
            return report;
        }
        if (settings.png) { formats.push({ kind: "png", ext: "png", sub: "PNG" }); }
        if (settings.jpg) { formats.push({ kind: "jpg", ext: "jpg", sub: "JPG" }); }
        if (settings.svg) { formats.push({ kind: "svg", ext: "svg", sub: "SVG" }); }
        if (settings.pdf) { formats.push({ kind: "pdf", ext: "pdf", sub: "PDF" }); }

        total = formats.length * targets.length;
        var progress = createProgress(total);

        try { oldLevel = app.userInteractionLevel; app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS; } catch (eL) { oldLevel = null; }

        // Snapshot AVANT toute modification / Snapshot BEFORE any change
        snap = snapshotAllVisibility();

        try {
            for (k = 0; k < targets.length; k++) {
                t = targets[k];
                // Isoler le calque / Isolate the layer
                showOnlyTarget(snap, t, flatten);

                for (f = 0; f < formats.length; f++) {
                    folder = formatFolder(root, formats[f].sub);
                    if (formats[f].kind === "svg" && tmpFolder === null) {
                        tmpFolder = new Folder(root.fsName + "/_tmp_" + SCRIPT_NAME + "_" + (new Date().getTime()));
                        if (!ensureFolder(tmpFolder)) { throw new Error(tr("errFolderCreate", tmpFolder.fsName)); }
                    }
                    ctx = makeCtx(t, k, settings.dpi);
                    target = uniqueTarget(folder, buildBaseName(settings.template, ctx), formats[f].ext, used);
                    label = decodeURI(target.name);
                    progress.step(done, label);
                    try {
                        if (formats[f].kind === "png" || formats[f].kind === "jpg") {
                            exportRaster(target, formats[f].kind);
                        } else if (formats[f].kind === "svg") {
                            exportSvg(target, tmpFolder);
                        } else if (formats[f].kind === "pdf") {
                            exportPdf(target);
                            report.pdfDone = true;
                        }
                        if (target.exists) { report.files.push(target.fsName); }
                        else { report.errors.push(label + " : " + tr("errNotCreated")); }
                    } catch (eX) {
                        report.errors.push(label + " : " + errText(eX));
                    }
                    done++;
                }
            }
            progress.step(total, "");
        } catch (eFatal) {
            report.errors.push(tr("fatal", errText(eFatal)));
        } finally {
            // TOUJOURS restaurer la visibilité / ALWAYS restore visibility
            if (snap) {
                restoreErrs = restoreVisibility(snap);
                for (ri = 0; ri < restoreErrs.length; ri++) {
                    report.errors.push(tr("errRestore", restoreErrs[ri]));
                }
            }
            if (oldLevel !== null) {
                try { app.userInteractionLevel = oldLevel; } catch (eL2) { /* */ }
            }
            if (tmpFolder !== null) {
                try { clearFolder(tmpFolder); tmpFolder.remove(); } catch (eT) { /* */ }
            }
            if (!report.pdfDone) {
                try { doc.artboards.setActiveArtboardIndex(docState.activeIndex); } catch (eAb) { /* */ }
            }
            progress.close();
        }

        // Après PDF saveAs : fermer et rouvrir l'original
        // After PDF saveAs: close and reopen the original
        if (report.pdfDone && docState.file) {
            try {
                doc.close(SaveOptions.DONOTSAVECHANGES);
                var reopened = app.open(docState.file);
                try { reopened.artboards.setActiveArtboardIndex(docState.activeIndex); } catch (eAb2) { /* */ }
            } catch (eO) {
                report.errors.push(tr("reopenFail", errText(eO), docState.file.fsName));
            }
        }
        return report;
    }

    function showSummary(report) {
        var msg = report.files.length > 0 ?
            tr("summaryOk", report.files.length, settings.folder.fsName) :
            tr("summaryNone");
        var n = report.errors.length;
        if (n > 0) {
            msg += "\n\n" + tr("summaryErrors", n);
            for (var i = 0; i < n && i < MAX_ERRORS_SHOWN; i++) { msg += "\n• " + report.errors[i]; }
            if (n > MAX_ERRORS_SHOWN) { msg += "\n" + tr("summaryMore", n - MAX_ERRORS_SHOWN); }
        }
        alert(msg, SCRIPT_NAME + " v" + SCRIPT_VERSION);
    }

    // =====================================================================
    // Programme principal / Main
    // =====================================================================
    var outcome = showDialog();
    while (outcome === "lang" || outcome === "analyze") {
        if (outcome === "analyze") {
            showAnalyze(collectTargets());
        }
        outcome = showDialog();
    }
    if (outcome !== "ok") { return; }

    var targets = collectTargets();
    if (!targets || targets.length === 0) {
        alert(tr("errNoLayers"), SCRIPT_NAME);
        return;
    }

    var report = runExport(targets);
    showSummary(report);
    if (settings.openFolder && report.files.length > 0) {
        try { settings.folder.execute(); } catch (eOpen) { /* */ }
    }

})();
