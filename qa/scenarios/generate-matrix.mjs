#!/usr/bin/env node
/**
 * Génère la matrice initiale de 200 scénarios QA.
 * Usage: node qa/scenarios/generate-matrix.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
function toYaml(value, indent = 0) {
  const pad = '  '.repeat(indent);
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (/[:#\n]|^[\s-]/.test(value) || value === '') return JSON.stringify(value);
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return value.map((item) => `${pad}- ${toYaml(item, indent + 1).replace(/^\s+/, '')}`).join('\n');
  }
  return Object.entries(value)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        if (v.length === 0) return `${pad}${k}: []`;
        return `${pad}${k}:\n${v.map((item) => `${pad}  - ${toYaml(item, indent + 2).replace(/^\s+/, '')}`).join('\n')}`;
      }
      if (v && typeof v === 'object') return `${pad}${k}:\n${toYaml(v, indent + 1)}`;
      return `${pad}${k}: ${toYaml(v, indent + 1)}`;
    })
    .join('\n');
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const domainsDir = join(__dirname, 'domains');
mkdirSync(domainsDir, { recursive: true });

const PROFILES = [
  'celibataire', 'couple_sans_enfant', 'famille_avec_enfants', 'famille_monoparentale',
  'garde_alternee', 'agriculteur', 'infirmier_nuit', 'artisan', 'etudiant', 'retraite',
  'routier', 'cadre', 'independant', 'teletravail', 'horaires_variables', 'sans_emploi', 'foyer_multigen',
];

function s(id, domain, title, profile, steps, expected, criticality = 'high', refs = [], tags = []) {
  return {
    id, domain, title,
    preconditions: ['Application accessible sur http://localhost:5173'],
    profile, steps, expected, criticality,
    status: 'pending',
    automated_test: null,
    last_run: null,
    constitution_refs: refs,
    tags,
  };
}

const batches = {
  auth: [
    s('QA-AUTH-001', 'auth', 'Inscription avec email valide', 'celibataire',
      ['Ouvrir /signup', 'Remplir email et mot de passe valides', 'Soumettre'],
      'Compte créé, redirection vers onboarding ou home sans erreur', 'critical', ['6', '17']),
    s('QA-AUTH-002', 'auth', 'Inscription email déjà utilisé', 'couple_sans_enfant',
      ['Tenter inscription avec email existant'],
      'Message clair sans fuite d\'information sensible', 'high', ['17']),
    s('QA-AUTH-003', 'auth', 'Connexion identifiants valides', 'famille_avec_enfants',
      ['Ouvrir /login', 'Saisir identifiants valides', 'Soumettre'],
      'Session établie, accès au tableau de bord', 'critical', ['6']),
    s('QA-AUTH-004', 'auth', 'Connexion mot de passe incorrect', 'etudiant',
      ['Saisir email valide et mauvais mot de passe'],
      'Erreur générique, pas de session', 'high', ['17']),
    s('QA-AUTH-005', 'auth', 'Déconnexion depuis menu utilisateur', 'any',
      ['Se connecter', 'Ouvrir menu utilisateur', 'Cliquer déconnexion'],
      'Session terminée, redirection login, données session effacées', 'critical', ['17'], ['regression']),
    s('QA-AUTH-006', 'auth', 'Accès route protégée sans session', 'celibataire',
      ['Visiter /home sans être connecté'],
      'Redirection vers login', 'critical', ['17']),
    s('QA-AUTH-007', 'auth', 'Persistance session après refresh', 'teletravail',
      ['Se connecter', 'Rafraîchir la page'],
      'Utilisateur reste connecté', 'high', ['6']),
    s('QA-AUTH-008', 'auth', 'Expiration session gérée proprement', 'cadre',
      ['Simuler token expiré', 'Naviguer'],
      'Redirection login avec message compréhensible', 'medium', ['17']),
    s('QA-AUTH-009', 'auth', 'Double soumission formulaire login', 'any',
      ['Double-clic sur bouton connexion'],
      'Une seule requête, pas de double session', 'medium'),
    s('QA-AUTH-010', 'auth', 'Mot de passe trop faible refusé', 'celibataire',
      ['Inscription avec mot de passe trivial'],
      'Validation côté client/serveur, message explicite', 'high', ['17']),
    s('QA-AUTH-011', 'auth', 'Aucune donnée fondateur après signup', 'celibataire',
      ['Créer nouveau compte', 'Inspecter profil et foyer'],
      'Aucun prénom, métier ou structure familiale pré-remplie', 'critical', ['6']),
    s('QA-AUTH-012', 'auth', 'Console sans erreur au login', 'any',
      ['Parcours login complet', 'Inspecter console'],
      'Aucune erreur non gérée', 'medium', [], ['console']),
  ],
  onboarding: [
    s('QA-ONB-001', 'onboarding', 'Création foyer sans enfants obligatoires', 'couple_sans_enfant',
      ['Démarrer onboarding', 'Ignorer ou sauter étape enfants'],
      'Accès produit sans bloquer sur childrenCount > 0', 'critical', ['5', '6']),
    s('QA-ONB-002', 'onboarding', 'Célibataire sans conjoint ni enfant', 'celibataire',
      ['Onboarding complet en personne seule'],
      'Foyer valide à un membre, pas de champs conjoint forcés', 'critical', ['5', '6']),
    s('QA-ONB-003', 'onboarding', 'Famille avec 2 enfants', 'famille_avec_enfants',
      ['Ajouter 2 enfants avec prénoms et horaires'],
      'Enfants enregistrés, visibles dans profil foyer', 'high', ['5']),
    s('QA-ONB-004', 'onboarding', 'Métier saisi librement (infirmier nuit)', 'infirmier_nuit',
      ['Saisir métier personnalisé et horaires atypiques'],
      'Métier stocké sans template William/Madeline', 'critical', ['4', '6']),
    s('QA-ONB-005', 'onboarding', 'Agriculteur saison haute', 'agriculteur',
      ['Décrire période récolte et contraintes'],
      'Contraintes saisonnières mémorisées ou planifiables', 'high', ['4', '8']),
    s('QA-ONB-006', 'onboarding', 'Étudiant avec examens', 'etudiant',
      ['Déclarer période examens'],
      'Life event examens reconnu pour adaptation planning', 'high', ['8']),
    s('QA-ONB-007', 'onboarding', 'Retraité sans emploi imposé', 'retraite',
      ['Compléter onboarding sans champ travail obligatoire'],
      'Profil valide sans métier professionnel', 'high', ['4', '6']),
    s('QA-ONB-008', 'onboarding', 'Garde alternée déclarée', 'garde_alternee',
      ['Configurer semaines avec/sans enfants'],
      'Planning tient compte des semaines alternées', 'high', ['5', '8']),
    s('QA-ONB-009', 'onboarding', 'Foyer multigénérationnel', 'foyer_multigen',
      ['Ajouter grand-parent et parent'],
      'Plusieurs adultes avec profils distincts', 'medium', ['5']),
    s('QA-ONB-010', 'onboarding', 'Onboarding progressif sans mega-formulaire', 'any',
      ['Parcourir étapes une par une'],
      'Étapes courtes, possibilité de reprendre plus tard', 'high', ['6']),
    s('QA-ONB-011', 'onboarding', 'Choix niveau autonomie IA', 'any',
      ['Sélectionner niveau 1 à 4'],
      'Préférence enregistrée et respectée en conversation', 'high', ['16']),
    s('QA-ONB-012', 'onboarding', 'Choix ton communication IA', 'any',
      ['Choisir ton formel ou familier'],
      'Réponses IA adaptées au ton choisi', 'medium', ['11']),
    s('QA-ONB-013', 'onboarding', 'Spiritualité optionnelle ignorée', 'celibataire',
      ['Passer étape spiritualité'],
      'Aucune spiritualité imposée ni rappel intrusif', 'critical', ['6', '10']),
    s('QA-ONB-014', 'onboarding', 'Rejoindre foyer existant via invitation', 'couple_sans_enfant',
      ['Utiliser lien/code invitation'],
      'Membre ajouté avec permissions par défaut', 'high', ['5', '17']),
    s('QA-ONB-015', 'onboarding', 'Abandon mid-onboarding et reprise', 'any',
      ['Quitter mid-flow', 'Se reconnecter'],
      'Reprise à la bonne étape sans perte totale', 'high', ['6']),
    s('QA-ONB-016', 'onboarding', 'Ajout animal de compagnie', 'famille_avec_enfants',
      ['Ajouter chien avec promenade quotidienne'],
      'Contrainte animale intégrée au planning si supporté', 'low', ['5']),
    s('QA-ONB-017', 'onboarding', 'Sans emploi — pas de culpabilisation', 'sans_emploi',
      ['Indiquer sans emploi'],
      'Ton bienveillant, pas de push productivité', 'high', ['1', '11']),
    s('QA-ONB-018', 'onboarding', 'Routier avec déplacements', 'routier',
      ['Saisir jours sur route et retours'],
      'Contraintes mobilité reflétées au planning', 'medium', ['4']),
    s('QA-ONB-019', 'onboarding', 'Artisan horaires variables', 'artisan',
      ['Décrire semaines irrégulières'],
      'Pas de planning rigide 9h-17h imposé', 'high', ['4']),
    s('QA-ONB-020', 'onboarding', 'Indépendant télétravail mixte', 'independant',
      ['Télétravail 3j + déplacements 2j'],
      'Disponibilités différenciées par jour', 'medium', ['4']),
    s('QA-ONB-021', 'onboarding', 'Famille monoparentale', 'famille_monoparentale',
      ['Créer foyer parent seul + enfants'],
      'Pas de champ conjoint obligatoire', 'critical', ['5', '6']),
    s('QA-ONB-022', 'onboarding', 'Mobile onboarding 375px', 'any',
      ['Parcourir onboarding sur mobile'],
      'UI utilisable, pas de débordement horizontal', 'high', ['6'], ['mobile']),
  ],
  household: Array.from({ length: 18 }, (_, i) => {
    const titles = [
      'Création foyer vide', 'Invitation conjoint', 'Permissions membre lecture seule',
      'Permissions membre édition planning', 'Séparation données privées par membre',
      'Planning individuel vs commun', 'Ajout enfant avec autonomie', 'Modification rôle membre',
      'Suppression membre avec confirmation', 'Foyer colocation 3 adultes',
      'Pas de partage mémoire privée implicite', 'Export données foyer',
      'Membre sans accès journal privé', 'Conflit deux membres même créneau',
      'Notification proposition relais', 'Refus relais sans culpabilité',
      'Animal comme contrainte planning', 'Historique actions foyer',
    ];
    return s(`QA-HH-${String(i + 1).padStart(3, '0')}`, 'household', titles[i], PROFILES[i % PROFILES.length],
      [`Préparer foyer profil ${PROFILES[i % PROFILES.length]}`, 'Exécuter action household', 'Vérifier état'],
      `Comportement attendu aligné constitution ch.5-6: ${titles[i].toLowerCase()}`,
      i < 5 ? 'critical' : 'high', ['5', '17']);
  }),
  'planning-core': Array.from({ length: 23 }, (_, i) => {
    const titles = [
      'Affichage journée vide', 'Création tâche simple', 'Marquer tâche terminée', 'Reporter tâche (skip)',
      'Planification automatique matin', 'Respect heure coucher', 'Buffer 30min avant sommeil',
      'Protection routine enfants matin', 'Protection routine enfants soir', 'Créneau travail bloqué',
      'Télétravail — pas de trajet imposé', 'Infirmier nuit — repos journée', 'Agriculteur saison basse',
      'Vue semaine cohérente', 'Vue mois sans surcharge visuelle', 'Tâche planifiée avec durée',
      'Micro-étapes sur tâche complexe', 'Allègement si dette sommeil', 'Priorité objectif sport',
      'Priorité objectif repos', 'Planning First avant suggestion activité', 'Créneau libre calculé',
      'Pas de tâche non urgente après bedtime', 'Synchronisation calendrier externe',
      'Mise à jour planning après conversation', 'Affichage charge mentale lisible',
      'Historique modifications planning', 'Deterministic conflict resolution',
    ];
    return s(`QA-PLN-${String(i + 1).padStart(3, '0')}`, 'planning', titles[i], PROFILES[i % PROFILES.length],
      ['Ouvrir planning', 'Appliquer contexte', 'Vérifier résultat'],
      `Planning respecte contraintes et constitution ch.3/9: ${titles[i]}`,
      i < 8 ? 'critical' : 'high', ['3', '9']);
  }),
  'planning-conflicts': Array.from({ length: 14 }, (_, i) => {
    const titles = [
      'Conflit deux tâches même créneau', 'Conflit tâche vs RDV fixe', 'Conflit enfant vs études',
      'Conflit sport vs récupération', 'Conflit couple vs surcharge', 'Proposition déplacement tâche non urgente',
      'Refus déplacement contrainte dure', 'Chevauchement garde alternée', 'Surcharge semaine détectée',
      'Alerte suppression seule soirée libre', 'Double réservation même action', 'Conflit permissions membre',
      'Latence réseau replanification', 'Erreur Supabase replan — message utilisateur',
    ];
    return s(`QA-PLC-${String(i + 1).padStart(3, '0')}`, 'planning-conflicts', titles[i], PROFILES[i % PROFILES.length],
      ['Créer situation conflit', 'Demander résolution', 'Vérifier outcome'],
      `Conflit géré de façon déterministe et explicable: ${titles[i]}`,
      'critical', ['3', '9', '12']);
  }),
  'ia-conversation': Array.from({ length: 19 }, (_, i) => {
    const titles = [
      'Soirée en amoureux — Planning First', 'Fatigue — proposition repos', 'Je suis sec — pas fallback générique',
      'Décale — contexte conversationnel', 'Oui après proposition — exécution', 'Non après proposition — annulation',
      'Phrase courte comprise en contexte', 'Formulation familière comprise', 'Ton adapté au profil',
      'Incertitude exprimée honnêtement', 'Pas de culpabilisation sur report', 'Explication du pourquoi',
      'Désaccord tactful si surcharge', 'Pas de commande isolée sans fil', 'Demande restaurant après planning',
      'Météo après analyse créneau', 'Pas invention horaire restaurant', 'Niveau autonomie 1 — conseil seul',
      'Niveau autonomie 2 — confirmation requise', 'Niveau 3 — action simple auto', 'Pending action fatigue→décale',
      'Réponse proactive non dupliquée', 'Unknown intent — question utile', 'Conversation mult-turn cohérente',
    ];
    return s(`QA-IA-${String(i + 1).padStart(3, '0')}`, 'ia-conversation', titles[i], PROFILES[i % PROFILES.length],
      ['Ouvrir conversation', 'Envoyer message test', 'Vérifier réponse et effets'],
      `IA conversationnelle conforme ch.3/11: ${titles[i]}`,
      i < 6 ? 'critical' : 'high', ['3', '11', '16']);
  }),
  'ia-memory': Array.from({ length: 14 }, (_, i) => {
    const titles = [
      'Apprentissage expression personnelle', 'Confirmation avant fait certain',
      'Correction utilisateur prise en compte', 'Oubli info obsolète', 'Vue mémoire utilisateur',
      'Suppression fait mémorisé', 'Hypothèse non présentée comme fait', 'Niveau confiance visible',
      'Personal language — mission sans duplication', 'Pas hint sur intent unknown',
      'Mémoire métier non figée', 'Deux profils même métier différenciés', 'Import expressions batch',
      'Export mémoire utilisateur',
    ];
    return s(`QA-MEM-${String(i + 1).padStart(3, '0')}`, 'ia-memory', titles[i], PROFILES[i % PROFILES.length],
      ['Interagir pour créer mémoire', 'Vérifier stockage', 'Tester correction/suppression'],
      `Mémoire transparente et progressive: ${titles[i]}`,
      i < 4 ? 'critical' : 'high', ['4', '13']);
  }),
  goals: Array.from({ length: 12 }, (_, i) => {
    const goals = ['sommeil', 'sport', 'études', 'famille', 'couple', 'repos', 'carrière', 'spiritualité', 'santé', 'loisirs', 'finances', 'temps personnel'];
    return s(`QA-GOL-${String(i + 1).padStart(3, '0')}`, 'goals', `Objectif ${goals[i]} — priorisation`, PROFILES[i % PROFILES.length],
      [`Activer objectif ${goals[i]}`, 'Créer conflit planning', 'Vérifier arbitrage'],
      `Objectif ${goals[i]} pris en compte sans sacrifier repos systématiquement`, 'high', ['7', '9']);
  }),
  'life-events': Array.from({ length: 10 }, (_, i) => {
    const events = ['déménagement', 'mariage', 'grossesse', 'naissance', 'séparation', 'examens', 'changement poste', 'maladie', 'vacances', 'deuil'];
    return s(`QA-LEV-${String(i + 1).padStart(3, '0')}`, 'life-events', `Transition: ${events[i]}`, PROFILES[i % PROFILES.length],
      [`Déclarer ${events[i]}`, 'Vérifier adaptation IA/planning'],
      `Comportement adapté pendant ${events[i]}, pas de recommandations inadaptées`, 'high', ['8']);
  }),
  'permissions-privacy': Array.from({ length: 14 }, (_, i) => {
    const titles = [
      'RLS — accès own data only', 'Pas lecture tâches autre membre sans droit',
      'Suppression données — confirmation', 'Consentement explicite partage', 'Minimisation données collectées',
      'Pas tracking caché', 'Historique actions sensibles', 'Token session sécurisé',
      'Erreur 403 message clair', 'Export RGPD-like', 'Suppression compte', 'Séparation journal privé',
      'Pas fuite email autre membre', 'Audit log action planning',
    ];
    return s(`QA-PRV-${String(i + 1).padStart(3, '0')}`, 'permissions-privacy', titles[i], PROFILES[i % PROFILES.length],
      ['Configurer permissions', 'Tenter accès non autorisé', 'Vérifier blocage'],
      `Confidentialité respectée: ${titles[i]}`, i < 4 ? 'critical' : 'high', ['17']);
  }),
  'wellbeing-sport': Array.from({ length: 8 }, (_, i) => {
    const titles = [
      'Séance sport planifiée selon énergie', 'Repos prioritaire si fatigue', 'Spotify repos optionnel',
      'Pas pression sport si surcharge', 'Récupération post nuit', 'Spiritualité optionnelle configurable',
      'Temps couple protégé', 'Temps enfants protégé',
    ];
    return s(`QA-WEL-${String(i + 1).padStart(3, '0')}`, 'wellbeing-sport', titles[i], PROFILES[i % PROFILES.length],
      ['Configurer contexte bien-être', 'Demander suggestion', 'Vérifier protection temps'],
      `Bien-être > productivité: ${titles[i]}`, 'high', ['9', '10']);
  }),
  'ui-responsive': Array.from({ length: 10 }, (_, i) => {
    const vps = ['375x667 mobile', '768x1024 tablette', '1280x720 desktop', '1440x900 large', '320x568 petit mobile'];
    const pages = ['home', 'planning', 'conversation', 'profil', 'onboarding'];
    const vp = vps[i % vps.length];
    const page = pages[i % pages.length];
    return s(`QA-UI-${String(i + 1).padStart(3, '0')}`, 'ui-responsive', `${page} sur ${vp}`, 'any',
      [`Ouvrir ${page}`, `Viewport ${vp}`, 'Vérifier layout et interactions'],
      `Page ${page} utilisable sur ${vp}, menu visible`, i < 3 ? 'high' : 'medium', ['1'], ['mobile', 'responsive']);
  }),
  'data-persistence': Array.from({ length: 12 }, (_, i) => {
    const titles = [
      'Tâche persistée après refresh', 'Profil persisté après refresh', 'Onboarding state persisté',
      'Conversation context persisté session', 'Skip count persisté', 'Objectifs persistés',
      'Offline graceful degradation', 'Reconnexion sync données', 'Pas perte données double submit',
      'Migration schema backward compat', 'Rollback safe on error', 'Local storage pas de secrets',
    ];
    return s(`QA-DAT-${String(i + 1).padStart(3, '0')}`, 'data-persistence', titles[i], PROFILES[i % PROFILES.length],
      ['Créer données', 'Refresh/reconnect', 'Vérifier intégrité'],
      `Données cohérentes: ${titles[i]}`, i < 4 ? 'critical' : 'high', ['13']);
  }),
  'regression-smoke': Array.from({ length: 12 }, (_, i) => {
    const titles = [
      'Smoke — login → home → logout', 'Smoke — création tâche → done', 'Smoke — conversation basique',
      'Smoke — planning s\'affiche', 'Smoke — menu toujours visible', 'Smoke — IA conversation visible',
      'Smoke — calendrier fonctionnel', 'Smoke — pas régression bundle', 'Smoke — build production',
      'Smoke — lint clean', 'Smoke — vitest green', 'Smoke — playwright auth project',
    ];
    return s(`QA-REG-${String(i + 1).padStart(3, '0')}`, 'regression-smoke', titles[i], 'any',
      ['Exécuter parcours smoke', 'Vérifier succès'],
      `Régression absente: ${titles[i]}`, i < 6 ? 'critical' : 'high', ['18'], ['smoke', 'regression']);
  }),
};

let all = [];
for (const [file, scenarios] of Object.entries(batches)) {
  const path = join(domainsDir, `${file}.yaml`);
  writeFileSync(path, toYaml({ domain: file, version: '1.0.0', scenarios }) + '\n', 'utf8');
  all = all.concat(scenarios);
  console.log(`${file}: ${scenarios.length} scénarios`);
}

if (all.length !== 200) {
  console.error(`ERREUR: ${all.length} scénarios au lieu de 200`);
  process.exit(1);
}

const index = {
  version: '1.0.0',
  generated: new Date().toISOString().slice(0, 10),
  total_scenarios: all.length,
  status_summary: { pending: all.length, automated: 0, passing: 0, failing: 0 },
  domains: Object.fromEntries(Object.entries(batches).map(([k, v]) => [k, { file: `domains/${k}.yaml`, count: v.length }])),
  profiles_covered: PROFILES,
  scenario_ids: all.map((x) => x.id),
};

writeFileSync(join(__dirname, 'index.yaml'), toYaml(index) + '\n', 'utf8');
console.log(`\nTotal: ${all.length} scénarios → index.yaml`);
