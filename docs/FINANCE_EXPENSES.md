# Depenses et analyse financiere

- `/admin/depenses` : saisir, modifier ou annuler une depense avec un motif. Acces reserve aux comptes actifs FINANCE, MASTER et CREATOR.
- `/admin/finance` : total des dons directs verifies, paiements Stripe nets de remboursements, depenses comptabilisees et solde du registre. Graphique mensuel sur 3, 6 ou 12 mois, avec series distinctes pour les dons directs, Stripe et les depenses. Chaque mois est consultable au clic ou au clavier et les chiffres sont disponibles en tableau.
- `/admin` affiche aussi l'analyse financiere aux roles FINANCE, MASTER et CREATOR, avec un acces a la saisie des dons pour Master et Creator. Les comptes sans permission finance ne recoivent pas ces donnees.
- Master et Creator peuvent supprimer un don direct avec confirmation et motif ; les montants et graphiques sont recalcules automatiquement. L'action conserve l'audit et ne supprime jamais un paiement Stripe.
- Solde = dons directs verifies + paiements Stripe confirmes - remboursements Stripe - depenses non annulees.
- Les calculs sont en centimes et en EUR. Les autres devises ne sont pas additionnees. Le mode Stripe correspond a la cle serveur configuree ; les paiements de test sont exclus en mode reel.
- Le solde du registre ne correspond pas au solde bancaire ou au solde disponible chez Stripe. Les frais Stripe ne sont deduits que s'ils sont saisis comme depenses. Ne pas enregistrer un remboursement Stripe une seconde fois comme depense.
- La date est celle du paiement deja effectue. Les annulations restent dans l'historique ; toute modification est auditee dans la meme transaction. Un identifiant de requete evite les doubles saisies lors d'une relance du navigateur.
- Les graphiques rattachent un remboursement au mois du don d'origine. Les totaux globaux ne changent pas avec les filtres de l'historique ; les filtres de la page Depenses affichent leur propre sous-total.

## Deploiement

Appliquer `npx prisma migrate deploy` avant de publier le code utilisant `finance_expenses`. Le client Prisma est genere avec `npx prisma generate`. Arreter le serveur de developpement pendant la generation sous Windows si les dossiers generes sont verrouilles.

## Verification

`npm test` couvre les montants, dates, autorisations et calculs. `npx tsx scripts/smoke-finance-expenses.ts` verifie le calcul SQL et les contraintes dans une transaction integralement annulee, sans conserver de donnees de test ni envoyer de notifications.
